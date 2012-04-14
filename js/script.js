/* Author: Eoghan O'Keeffe */
// TODO: change name to GLOW?

(function($) {
//	UTIL {
		/* Static wrapper for apply
			Maintains the this value no matter how many times it's passed around
			Useful for callbacks */
		function invoke(object, func, args) {
			func.apply(object, Array.prototype.slice.call(arguments, 2));
		}

		/* Safer than inheriting from new Parent(), as Object.create
			circumvents the constructor, which could cause problems (needing
			a whole load of arguments, having throw clauses, etc) */
		function inherit(Child, Parent) {
			Child.prototype = Object.create(Parent.prototype);
			Child.prototype.constructor = Child;

			return Child;
		}

		/* Simple observable class: subscribe/unsubscribe with id and
			callback function, called on change */
		function Watchable(thing) {
			/* The observable thing - optional */
			this._thing = thing;
			
			/* A collection of callback functions provided by observers
			*	Key is an id representing the object observing this one
			*	Value is the callback function provided */
			this.callbacks = {};
			this.idGen = 0;
		}
		$.extend(Watchable.prototype, {
			update: function() {
				for(var c in this.callbacks) {
					var callback = this.callbacks[c];
					callback.func.apply(null, callback.args.concat(this._thing));
				}

				return this;
			},
			/* Get or set the value
				When the value is updated, all observers are notified,
				unless silent is set to true */
			thing: function(thing, silent) {
				if(thing !== undefined) {
					this._thing = thing;
					
					if(!silent) { this.update(); }
					
					return this;
				}
				else { return this._thing; }
			},
			
			/* Observe this object by providing the chosen callback,
				any arguments, and an id */
			watch: function(func, args) {
				var id = this.idGen++;
				this.callbacks[id] = { func: func,
					args: Array.prototype.slice.call(arguments, 1) };
				return id;
			},
			
			/* Stop observing this object
			*	If an id is provided, only the callback with that id is removed
			*	Otherwise, all callbacks are removed */
			unwatch: function(id) {
				if(id) { delete this.callbacks[id]; }
				else { this.callbacks = {}; }
				return this;
			}
		});

		
		function Vec2D(x, y) { this.x = (x || 0); this.y = (y || 0); }
		$.extend(Vec2D.prototype, {
			/* Accessors */
			
			add: function(other) { return this.copy().doAdd(other); },
			
			angleAbs: function(other) {
				var prodMag = Math.sqrt(this.mag2()*other.mag2());
				if(magProd) { return Math.acos(this.dot(other)/prodMag); }
				else { $.error("Vec2D Error: getting angle with zero vector"); }
			},
			
			angleRel: function(other) {
				return Math.atan2(this.dot(other.perp()), this.dot(other));
			},
			
			copy: function(other) {
				if(other) { this.x = other.x; this.y = other.y; return this; }
				else { return new this.constructor(this.x, this.y); }
			},
			
			dist: function(other) { return Math.sqrt(this.distSq(other)); },
			
			distSq: function(other) {
				var x = other.x-this.x, y = other.y-this.y; return x*x+y*y;
			},
			
			dot: function(other) { return this.x*other.x+this.y*other.y; },
			
			equals: function(other) {
				return (this.x === other.x && this.y === other.y);
			},

			pinToRange: function(min, max) {
				return this.copy().doPinToRange(min, max);
			},
			
			mag: function() { return Math.sqrt(this.magSq()); },
			
			magSq: function() { return this.x*this.x+this.y*this.y; },
			
			mult: function(other) { return this.copy().doMult(other); },
			
			perp: function() { return this.copy().doPerp(); },
			
			scale: function(m) { return this.copy().doScale(m); },
			
			sub: function(other) { return this.copy().doSub(other); },
			
			unit: function() { return this.copy().doUnit(); },
			
			/* Mutators */
			
			doAdd: function(other) { this.x += other.x; this.y += other.y; return this; },

			doPinToRange: function(min, max) {
				if(max < min) { log("Vec2D Warning: max value less than min value"); }
				var magSq = this.magSq(),
					limitSq = Math.pinToRange(min*min, magSq, max*max);
				
				if(magSq && magSq !== limitSq) {
					this.doUnit().doScale(Math.sqrt(limitSq));
				}
				return this;
			},
			
			doMult: function(other) { this.x *= other.x; this.y *= other.y; return this; },
			
			doPerp: function() {
				// Left
				var x = this.x; this.x = -this.y; this.y = x; return this;
			},
			
			doScale: function(m) { this.x *= m; this.y *= m; return this; },
			
			doSub: function(other) { this.x -= other.x; this.y -= other.y; return this; },
			
			doUnit: function() {
				var mag = this.mag();
				if(mag) { this.x /= mag; this.y /= mag; return this; }
				else { $.error("Vec2D Error: normalising zero vector"); }
			},
			
			doZero: function() { this.x = this.y = 0; return this; }
		});


		function AARect(pos, size) {
			this.pos = (pos || new Vec2D());
			this.size = (size || new Vec2D());
		}
		$.extend(AARect.prototype, {
			intersects: function(other) {
				return !(this.pos.x+this.size.x < other.pos.x ||
					this.pos.x > other.pos.x+other.size.x ||
					this.pos.y+this.size.y < other.pos.y ||
					this.pos.y > other.pos.y+other.size.y);
			},
			contains: function(other) {
				return (other.pos.x >= this.pos.x &&
					other.pos.x+other.size.x <= this.pos.x+this.size.x &&
					other.pos.y >= this.pos.y &&
					other.pos.y+other.size.y <= this.pos.y+this.size.y);
			},
			containingCircle: function() {
				return new Circle(new Vec2D(this.pos.x+this.size.x/2,
						this.pos.y+this.size.y/2),
					Math.max(this.size.x/2, this.size.y/2));
			},
			copy: function(other) {
				if(other) {
					this.pos.copy(other.pos);
					this.size.copy(other.size);
					return this;
				}
				else {
					return new this.constructor(this.pos.copy(), this.size.copy());
				}
			},
			trace: function(context) {
				context.rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
				return this;
			}
		});


		function Circle(pos, rad) {
			this.pos = (pos || new Vec2D());
			this.rad = (rad || 0);
			this.radSq = this.rad*this.rad;
		}
		$.extend(Circle.prototype, {
			intersects: function(other) {
				var radSum = this.rad+other.rad;
				return (this.pos.distSq(other.pos) <= radSum*radSum);
			},
			contains: function(other) {
				var radSub = this.rad-other.rad;
				return (radSub >= 0 && this.pos.distSq(other.pos) <= radSub*radSub);
			},
			radius: function(rad) {
				if($.isNumeric(rad)) {
					this.rad = rad;
					this.radSq = this.rad*this.rad;

					return this;
				}
				else { return this.rad; }
			},
			radiusSq: function(radSq) {
				if($.isNumeric(radSq)) {
					this.radSq = radSq;
					this.rad = Math.sqrt(this.radSq);

					return this;
				}
				else { return this.radSq; }
			},
			containingAARect: function() {
				var diam = 2*this.rad;
				return new AARect(
					new Vec2D(this.pos.x-this.rad, this.pos.y-this.rad),
					new Vec2D(diam, diam));
			},
			copy: function(other) {
				if(other) {
					this.pos.copy(other.pos); this.rad = other.rad;
					this.radSq = other.radSq; return this;
				}
				else {
					return new this.constructor(this.pos.copy(), this.rad);
				}
			},
			trace: function(context) {
				context.arc(this.pos.x, this.pos.y, this.rad, 0, 2*Math.PI);
				return this;
			}
		});
		/* Convenience - maps the points of a circle with the given parameters,
			and optionally executes a callback for each vertex */
		Circle.generateVecs = function(num, rad, callback, args) {
			// Note: clockwise winding
			var points = [], v = 0, end = 2*Math.PI, i = end/(num-1);

			for(var p = 0; p < num; v += i, ++p) {
				var pos = new Vec2D(rad*Math.cos(v), rad*Math.sin(v));

				if(callback) { callback.apply(null,
					Array.prototype.slice.call(arguments, 3).concat(pos)); }
				points.push(pos);
			}

			return points;
		};

		
		function Enum() {
			for(var i = 0; i < arguments.length; ++i) { this[arguments[i]] = i; }
		}

		/* Quad Tree implementation based on Mike Chambers' - http://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/ */
		/*
		The MIT License

		Copyright (c) 2011 Mike Chambers

		Permission is hereby granted, free of charge, to any person obtaining a copy
		of this software and associated documentation files (the "Software"), to deal
		in the Software without restriction, including without limitation the rights
		to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the Software is
		furnished to do so, subject to the following conditions:

		The above copyright notice and this permission notice shall be included in
		all copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
		IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
		AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
		LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
		OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
		THE SOFTWARE.
		*/
		/* Operates on items with the structure { x, y } for Nodes
			and { x, y, width, height } for BoundsNodes */
		function QuadTree(boundRect, maxDepth, maxKids, source, converter, pointQuad) {
			this.root = ((pointQuad)?
					new Node(boundRect, 0, maxDepth, maxKids)
				:	new BoundsNode(boundRect, 0, maxDepth, maxKids));
			
			// Array of whatever the tree is populated from - generic, convenience
			this.source = (source || []);

			if(this.source.length) { this.put(source, converter); }
		}
		$.extend(QuadTree.prototype, {
			add: function(source) {
				this.source = this.source.concat(source); return this;
			},
			put: function(item, converter) {
				if(converter) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) {
							this.put(item[i], converter);
						}
					}
					else { this.root.put(converter.call(null, item)); }
				}
				else { this.root.put(item); }
				
				return this;
			},
			get: function(item) { return this.root.get(item).slice(0); },
			clear: function(item) {
				if(item === true) {
					this.source.length = 0;
					item = null;
				}

				this.root.clear(item);
				return this;
			}
			/* TODO: implement a function to return a GLSL string
				representation of the tree

				Get all nodes with kids (pulling an accumulated list of
				borderKids down as you go for boundsNodes), and */
		});


		function Node(boundRect, depth, maxDepth, maxKids) {
			this.boundRect = boundRect;
			this.depth = depth;
			this.maxDepth = maxDepth;
			this.maxKids = maxKids;
			
			this.kids = [];
			this.nodes = [];
		}
		$.extend(Node.prototype, {
			put: function(item) {
				if(item) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.put(item[i]); }
					}
					else if(this.nodes.length) {
						var node = this.nodesFor(item)[0];
						
						if(node) { node.put(item); }
					}
					else if(this.kids.push(item) > this.maxKids &&
						this.depth < this.maxDepth) {
						this.split().put(this.kids);
						this.kids.length = 0;
					}
				}
				
				return this;
			},
			get: function(item) {
				var kids = [];
				
				if(item) {
					if($.isArray(item)) {
						// May duplicate kids
						for(var i = 0; i < item.length; ++i) {
							kids = kids.concat(this.get(item[i]));
						}
					}
					else if(this.nodes.length) {
						var nodes = this.nodesFor(item);

						for(var n = 0; n < nodes.length; ++n) {
							kids = kids.concat(nodes[n].get(item));
						}
					}
					else { kids = kids.concat(this.kids); }
				}
				
				return kids;
			},
			clear: function(item) {
				if(item) {
					// Note: item here refers to the exact object stored in the tree
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.clear(item[i]); }
					}
					else if(this.nodes.length) {
						var node = this.nodesFor(item)[0];

						if(node) {
							if(node.nodes.length) { node.clear(item); }
							else if(node.kids.remove(item)) {
								var nodeKids = 0;

								for(var l = 0; l < this.nodes.length; ++l) {
									var nL = this.nodes[l];

									// Don't merge if node still has subnodes
									if(nL.nodes.length) {
										nodeKids = Infinity;
										break;
									}
									else { nodeKids += nL.kids.length; }
								}

								if(nodeKids <= this.maxKids) { this.merge(); }
							}
							else {
								//log("QuadTree Warning: item to be cleared not found");
							}
						}
					}
					else if(!this.kids.remove(item)) {
						//log("QuadTree Warning: item to be cleared not found");
					}
				}
				else {
					this.kids.length = 0;
					
					for(var n = 0; n < this.nodes.length; ++n) {
						this.nodes[n].clear();
					}
					
					this.nodes.length = 0;
				}
				
				return this;
			},
			nodesFor: function(item) {
				var nodes = [];

				if(item) {
					if(!item.size) { item.size = new Vec2D(); }

					for(var n = 0; n < this.nodes.length; ++n) {
						var node = this.nodes[n];
						if(node.boundRect.contains(item)) {
							nodes.push(node);
							break;
						}
						else if(node.boundRect.intersects(item)) { nodes.push(node); }
					}
				}

				return nodes;
			},/*
			node: function(item) {
				var lR = ((item.pos.x <= this.boundRect.pos.x+this.boundRect.size.x/2)?
						"Left" : "Right"),
					tB = ((item.pos.y <= this.boundRect.pos.y+this.boundRect.size.y/2)?
						"top" : "bottom");

				return this.nodes[Node.corners[tB+lR]];
			},*/
			split: function() {
				var depth = this.depth+1,
					
					halfSize = new Vec2D((this.boundRect.size.x/2) | 0,
						(this.boundRect.size.y/2) | 0),
					
					rightHalf = this.boundRect.pos.x+halfSize.x,
					bottomHalf = this.boundRect.pos.y+halfSize.y;
				
				this.nodes[Node.corners.topLeft] = new this.constructor(
					new AARect(this.boundRect.pos.copy(), halfSize.copy()),
					depth, this.maxDepth, this.maxKids);
				
				this.nodes[Node.corners.topRight] = new this.constructor(
					new AARect(new Vec2D(rightHalf, this.boundRect.pos.y),
						halfSize.copy()), depth, this.maxDepth, this.maxKids);
				
				this.nodes[Node.corners.bottomLeft] = new this.constructor(
					new AARect(new Vec2D(this.boundRect.pos.x, bottomHalf),
						halfSize.copy()), depth, this.maxDepth, this.maxKids);
				
				this.nodes[Node.corners.bottomRight] = new this.constructor(
					new AARect(new Vec2D(rightHalf, bottomHalf), halfSize.copy()),
					depth, this.maxDepth, this.maxKids);
				
				return this;
			},
			merge: function() {
				for(var n = 0; n < this.nodes.length; ++n) {
					var node = this.nodes[n].merge();

					this.kids = this.kids.concat(node.kids);
					node.clear();
				}

				this.nodes.length = 0;

				return this;
			}
		});
		Node.corners = new Enum("topLeft", "topRight",
			"bottomLeft", "bottomRight");
		
		
		function BoundsNode(boundRect, depth, maxDepth, maxKids) {
			Node.apply(this, arguments);
			this.edgeKids = [];
		}
		BoundsNode.corners = Node.corners;
		$.extend(inherit(BoundsNode, Node).prototype, {
			put: function(item) {
				if(item) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.put(item[i]); }
					}
					else if(this.nodes.length) {
						var nodes = this.nodesFor(item);
						
						if(nodes.length > 1) { this.edgeKids.push(item); }
						else if(nodes.length) { nodes[0].put(item); }
					}
					else if(this.kids.push(item) > this.maxKids &&
						this.depth < this.maxDepth) {
						this.split().put(this.kids);
						this.kids.length = 0;
					}
				}
				
				return this;
			},
			get: function(item) {
				var kids = [];
				
				if(item) {
					if($.isArray(item)) {
						// May duplicate kids
						for(var i = 0; i < item.length; ++i) {
							kids = kids.concat(this.get(item[i]));
						}
					}
					else {
						if(this.nodes.length) {
							var nodes = this.nodesFor(item);

							for(var n = 0; n < nodes.length; ++n) {
								kids = kids.concat(nodes[n].get(item));
							}
						}
						else { kids = kids.concat(this.kids); }

						kids = kids.concat(this.edgeKids);
					}
				}
				
				return kids;
			},
			clear: function(item) {
				if(item) {
					// Note: item here refers to the exact object stored in the tree
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.clear(item[i]); }
					}
					else if(this.nodes.length) {
						var nodes = this.nodesFor(item), node = nodes[0];

						if(nodes.length > 1) {
							if(!this.edgeKids.remove(item)) {
								//log("QuadTree Warning: item to be cleared not found");
							}
						}
						else if(node) {
							if(node.nodes.length) { node.clear(item); }
							else if(node.kids.remove(item)) {
								var nodeKids = 0;

								for(var l = 0; l < this.nodes.length; ++l) {
									var nL = this.nodes[l];

									// Don't merge if node still has subnodes
									if(nL.nodes.length) {
										nodeKids = Infinity;
										break;
									}
									else { nodeKids += nL.kids.length; }
								}

								if(nodeKids <= this.maxKids) { this.merge(); }
							}
							else {
								//log("QuadTree Warning: item to be cleared not found");
							}
						}
					}
					else {
						if(!this.kids.remove(item) && !this.edgeKids.remove(item)) {
							//log("QuadTree Warning: item to be cleared not found");
						}
					}
				}
				else {
					this.edgeKids.length = 0;
					
					return Node.prototype.clear.call(this);
				}
				
				return this;
			},
			merge: function() {
				for(var n = 0; n < this.nodes.length; ++n) {
					var node = this.nodes[n].merge();
					
					this.kids = this.kids.concat(node.kids);
					this.edgeKids = this.edgeKids.concat(node.edgeKids);
					node.clear();
				}

				this.nodes.length = 0;

				return this;
			}
		});

		
		// Simple scheduling
		function Schedule(wait, last) {
			this.wait = (wait || 0);
			this.last = (last || 0);
		}
		$.extend(Schedule.prototype, {
			check: function(time) { return (time-this.last >= this.wait); },
			copy: function(other) {
				if(other) {
					this.wait = other.wait;
					this.last = other.last;
					return this;
				}
				else { return new this.constructor(this.wait, this.last); }
			}
		});


		// For touchscreen devices
		function Thumbstick(rad, unit) {
			if(!rad) { $.error("Thumbstick error: cannot have zero radius"); }

			this.boundRad = new Circle(null, rad);
			this.input = null;	// Vec2D

			this.unit = unit;
		}
		$.extend(Thumbstick.prototype, {
			place: function(v) {
				this.boundRad.pos = v.copy();
				this.input = v.copy();
				return this;
			},
			move: function(v) {
				this.input = v.copy();

				var vector = this.vector();
				if(vector.magSq() > this.boundRad.rad*this.boundRad.rad) {
					// Pin to range
					this.input = vector.doUnit().doScale(this.boundRad.rad)
						.doAdd(this.boundRad.pos);	// Makes relative vector absolute
				}

				return this;
			},
			lift: function(v) {
				this.pos = this.center = null;
				return this;
			},
			vector: function() {
				if(!this.boundRad.rad) { $.error("Thumbstick error: cannot have zero radius"); }
				return this.input.sub(this.boundRad.pos)
					.doScale(1/this.boundRad.rad);
			},
			angle: function() {
				if(!this.boundRad.rad) { $.error("Thumbstick error: cannot have zero radius"); }
				return this.input.sub(this.boundRad.pos).doUnit();
			},
			render: function(context) {
				// unit stuff here...
				return this;
			}
		});
//	}
	
//	PHYSICS {
		/* See Game Physics Engine Development, by Ian Millington */
		function Particle(options) {
			if(!options) { options = {}; }
			
			this.pos = (options.pos || new Vec2D());
			this.vel = (options.vel || new Vec2D());
			this.acc = (options.acc || new Vec2D());
			this.force = (options.force || new Vec2D());
			
			if(options.mass) { this.mass(options.mass); }
			else { this.invMass = (($.isNumeric(options.invMass))?
						options.invMass : 1); }
			
			this.damping = (($.isNumeric(options.damping))?
				options.damping : 0.995);
			
			/* Previous few positions */
			this.trail = [];
			this.trailLimit = (($.isNumeric(options.trailLimit))?
				options.trailLimit : 5);
		}
		$.extend(Particle.prototype, {
			resolve: function(dt) {
				if(dt) {
					this.updateTrail();
					
					/* Integrate */
					var resAcc = this.acc.add(this.force.scale(this.invMass))
						.doScale(dt);
					
					this.vel.doAdd(resAcc).doScale(Math.pow(this.damping, dt));
					
					this.pos.doAdd(this.vel.scale(dt));
					
					/* Reset */
					this.force.doZero();
				}
				
				return this;
			},
			mass: function(mass) {
				if(mass !== undefined) {
					this.invMass = 1/mass;
					return this;
				}
				else { return 1/this.invMass; }
			},
			updateTrail: function() {
				if(this.trail.unshift(this.pos.copy()) > this.trailLimit) {
					this.trail.splice(this.trailLimit);
				}

				return this;
			}
		});
		

		function Body(options) {
			if(!options) { options = {}; }
			
			/* Inherit from Particle */
			Particle.call(this, options);
			
			this.angle = (options.angle || new Vec2D());
			this.rot = (options.rot || new Vec2D());
			this.angAcc = (options.angAcc || new Vec2D());
			this.torque = (options.torque || new Vec2D());
			
			if(options.inertiaTensor) { this.setInertiaTensor(options.inertiaTensor); }
			else {
				this.invInertiaTensor = (($.isNumeric(options.invInertiaTensor))?
					options.invInertiaTensor : 1);
			}
			
			this.angularDamping = (($.isNumeric(options.angularDamping))?
				options.angularDamping : 0.99);
			
			/*var sin = Math.sin(angle), cos = Math.cos(angle);
			angleMatrix = new Matrix2D(cos, -sin,
						sin, cos);*/
			
			//this.transform = new Matrix2D();
			
			this.updateDerived();
		}
		$.extend(inherit(Body, Particle).prototype, {
			resolve: function(dt) {
				if(dt) {
					/* Integrate for rotations */
					var resAngAcc = this.angAcc.add(this.invInertiaTensor
							.mult(this.torque)).doScale(dt);
					
					this.rot.doAdd(resAngAcc)
						.doScale(Math.pow(this.damping, dt));
					
					this.angle.doAdd(this.rot.scale(dt));
					
					/* Reset */
					this.torque.doZero();
					
					this.updateDerived();
					
					/* Call super resolve */
					Particle.prototype.resolve.call(this, dt);
				}
				
				return this;
			},
			
			updateDerived: function() {  },
			
			applyForceAtLocalPoint: function(force, point) {
				
			},
			
			applyForceAtPoint: function(force, point) {
				
			},
			
			inertiaTensor: function(inertiaTensor) {
				if(inertiaTensor) {
					this.invInertiaTensor = 1/inertiaTensor;
					return this;
				}
				else {
					return 1/this.invInertiaTensor;
				}
			}
		});
//	}

/* TODO: provide simpler geometry for testing against collisions?
	Or use normal maps to increase detail on what's actually
	simple geometry? */
//	COLLISIONS {
		// Convenience
		function Collision(self, other, normal, penetration, dt) {
			this.self = self;
			this.other = other;
			this.normal = (normal || new Vec2D());
			this.penetration = (penetration || 0);
			this.dt = (dt || 0);

			this.vector = null;
			this.updateVector();
		}
		$.extend(Collision.prototype, {
			copy: function(other) {
				if(other) {
					return new this.constructor(this.self, this.other,
							this.normal, this.penetration, this.dt);
				}
				else {
					this.constructor.call(this, other.self, other.other,
						other.normal, other.penetration, other.dt);

					return this;
				}
			},
			swap: function() { return this.copy().doSwap(); },
			doSwap: function() {
				var other = this.self;

				this.self = this.other;
				this.other = other;
				this.normal.doScale(-1);
				this.updateVector();

				return this;
			},
			updateVector: function() {
				this.vector = this.normal.scale(this.penetration);
				return this;
			}
		});
		/* TODO: add a boolean flag for broad/narrow collision
			detection to each check - only broad will be used outside
			the visible/frequently updated area */
		$.extend(Collision, {
			Circle: {
				checkLine: function(circle, a, b) {
					var collision = null;

					/* If the angle between the vectors of
						(1) the edge's normal and (2) the vector from the
						circle's center 'c' to a point 'a' on the edge is
						perpendicular, then 'c' is on the edge (for infinite edge)
							(c-a).n < 0 if p is outside the edge
							(c-a).n = 0 if p is on the edge
							(c-a).n > 0 if p is inside the edge
						
						Adjusting for the circle's radius gives:
							penetration = (c-a).n+rad */
					/*
					var edge = b.sub(a),
						l = edge.mag();

					if(l) {
						var vec = a.add(edge.scale(0.5))
								.sub(circle.pos);

						if(vec.mag()-circle.rad <= l/2) {
							var normal = edge.doScale(1/l).perp(),
								penetration = vec.dot(normal)+circle.rad;

							if(0 < penetration &&
								penetration < 2*circle.rad) {
								collision = new Collision(circle, [a, b],
									normal, penetration);
							}
						}
					}*/

					/* The closest point 'p' on the edge to the circle's
						center 'c' - given by the start 'a' of the edge plus
						the dot projection 't' of 'c' onto the edge - indicates
						a collision if its distance to the circle's center is
						less than the circle's radius (for an infinite edge).
						The range may be limited to the segment by limiting 't' */
					var line = b.sub(a), vec = circle.pos.sub(a),
						l = line.mag(), penSq = 0;

					if(l) {
						var t = vec.dot(line.doScale(1/l));

						if(-circle.rad <= t && t <= l+circle.rad) {
							var closest = a.add(line.scale(t)),
								toCenter = circle.pos.sub(closest),
								lSq = toCenter.magSq();
						
							penSq = circle.radSq-lSq;
						}
						else { penSq = 0; }
					}
					else { penSq = circle.radSq-vec.magSq(); }

					if(penSq > 0) {
						collision = new Collision(circle, [a, b],
							line.doPerp(), Math.sqrt(penSq));
					}

					return collision;
				}
			},
			Shape: {
				// colliders: { QuadTree shapes, Lumens lumens, QuadTree walls }
				check: function(shape, colliders, dt, callback, args) {
					var collisions = [], treeItem = shape.treeItem;

					// TODO: fine collision detection
					if(colliders.shapes) {
						for(var nearby = colliders.shapes.get(treeItem),
							n = 0; n < nearby.length; ++n) {
							var shapeCollision = this.checkShape(shape,
									nearby[n].item);

							if(shapeCollision) {
								shapeCollision.dt = dt;
								collisions.push(shapeCollision);
								this.resolveShape(shapeCollision);

								if(callback) {
									callback.apply(null,
										Array.prototype.slice.call(arguments, 4)
											.concat(shapeCollision));
								}
							}
						}
					}

					if(colliders.lumens) {
						var envCollision = Collision.Lumens
								.checkRect(colliders.lumens, treeItem);

						if(envCollision) {
							envCollision.dt = dt;
							envCollision.doSwap().self = shape;
							collisions.push(envCollision);
							this.resolveLumens(envCollision);

							if(callback) {
								callback.apply(null,
									Array.prototype.slice.call(arguments, 4)
										.concat(envCollision));
							}
						}
					}

					if(colliders.walls) {
						var walls = colliders.walls.get(treeItem);

						for(var w = 0; w < walls.length; ++w) {
							var wallCollision = this.checkWall(shape,
									walls[w].item);

							if(wallCollision) {
								wallCollision.dt = dt;
								collisions.push(wallCollision);
								this.resolveWall(wallCollision);

								if(callback) {
									callback.apply(null,
										Array.prototype.slice.call(arguments, 4)
											.concat(wallCollision));
								}
							}
						}
					}

					return collisions;
				},
				checkShape: function(shape, other) {
					var collision = null;

					if(shape !== other &&
						shape.boundRad.intersects(other.boundRad)) {
						//  TODO: narrow collision detection
						var normal = shape.owner.pos.sub(other.owner.pos),
							norMag = normal.mag(),
							penetration =
								(shape.boundRad.rad+other.boundRad.rad)-norMag;

						if(!norMag) {
							//log("Shape Collision Warning: shapes have the same center", shape, other);
						}
						else if(penetration > 0) {
							collision = new Collision(shape, other,
									normal.doScale(1/norMag), penetration);
						}
					}

					return collision;
				},
				checkWall: function(shape, other) {
					// TODO: optimisations and fine collision detection
					var collision = new Collision(shape, other);

					if(other.boundRad.intersects(shape.boundRad)) {
						var verts = other.three.geometry.vertices;
						
						for(var v = 0; v < verts.length; ++v) {
							var a = other.globPos(verts.wrap(v-1).position),
								b = other.globPos(verts[v].position),
								c = Collision.Circle.checkLine(shape.boundRad,
										a, b);

							if(c) {
								// TODO: fine collision detection here
								var vec = collision.vector.add(c.vector);

								collision.penetration = vec.mag();
								collision.normal =
									vec.doScale(1/collision.penetration);
							}
						}
					}

					return ((collision.penetration > 0)? collision : null);
				},
				resolveLumens: function(collision) {
					collision.self.updateBounds();

					return this;
				},
				resolveShape: function(collision) {
					collision.self.updateBounds();
					collision.other.updateBounds();

					return this;
				},
				resolveWall: function(collision) {
					collision.self.updateBounds();

					return this;
				}
			},
			Entity: {
				// colliders: { QuadTree swarm, Firefly player, Lumens lumens, QuadTree walls }
				check: function(entity, colliders, dt, callback, args) {
					var collisions = [], treeItem = entity.treeItem;

					// TODO: fine collision detection (shape)
					if(colliders.swarm) {
						for(var nearby = colliders.swarm.get(treeItem),
							n = 0; n < nearby.length; ++n) {
							var entityCollision = this.checkEntity(entity,
									nearby[n].item);
							
							if(entityCollision) {
								entityCollision.dt = dt;
								collisions.push(entityCollision);
								this.resolveEntity(entityCollision);

								if(callback) {
									callback.apply(null,
										Array.prototype.slice.call(arguments, 4)
											.concat(entityCollision));
								}
							}
						}
					}

					if(colliders.player) {
						var playerCollision = this.checkEntity(entity,
								colliders.player);
						
						if(playerCollision) {
							playerCollision.dt = dt;
							collisions.push(playerCollision);
							this.resolveEntity(playerCollision);

							if(callback) {
								callback.apply(null,
									Array.prototype.slice.call(arguments, 4)
										.concat(playerCollision));
							}
						}
					}

					if(colliders.lumens) {
						var envCollision = Collision.Lumens
								.checkRect(colliders.lumens, treeItem);

						if(envCollision) {
							envCollision.dt = dt;
							envCollision.doSwap().self = entity;
							collisions.push(envCollision);
							this.resolveLumens(envCollision);

							if(callback) {
								callback.apply(null,
									Array.prototype.slice.call(arguments, 4)
										.concat(envCollision));
							}
						}
					}

					if(colliders.walls) {
						for(var walls = colliders.walls.get(treeItem), w = 0;
							w < walls.length; ++w) {
							var wallCollision = this.checkWall(entity,
									walls[w].item);

							if(wallCollision) {
								wallCollision.dt = dt;
								collisions.push(wallCollision);
								this.resolveWall(wallCollision);

								if(callback) {
									callback.apply(null,
										Array.prototype.slice.call(arguments, 4)
											.concat(wallCollision));
								}
							}
						}
					}

					return collisions;
				},
				checkEntity: function(entity, other) {
					var collision = Collision.Shape.checkShape(entity.shape,
							other.shape);

					if(collision) {
						collision.self = entity;
						collision.other = other;
					}

					return collision;
				},
				checkWall: function(entity, other) {
					var collision = Collision.Shape.checkWall(entity.shape,
							other);

					if(collision) { collision.self = entity; }

					return collision;
				},
				resolveLumens: function(collision) {
					var self = collision.self;

					if(collision.other.toroid) {
						var s = collision.other.boundRect.size;

						if(self.pos.x < 0) { self.pos.x = self.pos.x%s.x+s.x; }
						else if(self.pos.x > s.x) { self.pos.x = self.pos.x%s.x-s.x; }
						
						if(self.pos.y < 0) { self.pos.y = self.pos.y%s.y+s.y; }
						else if(self.pos.y > s.y) { self.pos.y = self.pos.y%s.y-s.y; }
					}
					else {
						self.vel.doAdd(Impulse.collision({
							dt: collision.dt, normal: collision.normal,
							restitution: self.restitution, point1: self
						}));
						self.pos.doAdd(Move.penetration({
							normal: collision.normal,
							penetration: collision.penetration, point1: self
						}));
					}

					var shapeCollision = $.extend({}, collision,
						{ self: self.shape });

					Collision.Shape.resolveLumens(shapeCollision);

					return this;
				},
				resolveEntity: function(collision) {
					var self = collision.self, other = collision.other,
						impulses = Impulse.collision({
							dt: collision.dt, normal: collision.normal,
							restitution: self.restitution,
							point1: self, point2: other
						}),
						moves = Move.penetration({
							normal: collision.normal,
							penetration: collision.penetration,
							point1: self, point2: other
						});

					self.vel.doAdd(impulses[0]);
					self.pos.doAdd(moves[0]);

					other.vel.doAdd(impulses[1]);
					other.pos.doAdd(moves[1]);

					var shapeCollision = $.extend({}, collision,
						{ self: self.shape, other: other.shape });

					Collision.Shape.resolveShape(shapeCollision);

					self.updateTreeItem();
					other.updateTreeItem();

					return this;
				},
				resolveWall: function(collision) {
					var self = collision.self;

					self.vel.doAdd(Impulse.collision({
						dt: collision.dt, normal: collision.normal,
						restitution: self.restitution, point1: self
					}));
					self.pos.doAdd(Move.penetration({
						normal: collision.normal,
						penetration: collision.penetration, point1: self
					}));

					var shapeCollision = $.extend({}, collision,
						{ self: self.shape });

					Collision.Shape.resolveWall(shapeCollision);

					return this;
				}
			},
			Viewport: {
				checkLumens: function(viewport, lumens, dt, callback, args) {
					var collision = Collision.Lumens.checkRect(lumens,
							viewport.boundRect);

					if(collision) {
						collision.dt = dt;
						collision.doSwap().self = viewport;
						this.resolveLumens(collision);

						if(callback) {
							callback.apply(null,
								Array.prototype.slice.call(arguments, 3)
									.concat(collision));
						}
					}

					return collision;
				},
				resolveLumens: function(collision) {
					collision.self.pos.doAdd(Move.penetration({
						normal: collision.normal,
						penetration: collision.penetration,
						point1: collision.self
					}));
					collision.self.reposition();

					return this;
				}
			},
			Lumens: {
				checkRect: function(lumens, other) {
					var collision = null;

					if(!lumens.boundRect.contains(other)) {
						var s = lumens.boundRect.size,

							/* In the case that the rect is larger than lumens
								boundRect, it should be centered */
							margin = new Vec2D(Math.max((other.size.x-s.x)/2, 0),
								Math.max((other.size.y-s.y)/2, 0)),
							
							normal = new Vec2D(Math.min(other.pos.x, -margin.x)+
									Math.max((other.pos.x+other.size.x)-s.x, margin.x),
								Math.min(other.pos.y, -margin.y)+
									Math.max((other.pos.y+other.size.y)-s.y, margin.y)),

							penetration = normal.mag();

						if(penetration) {
							collision = new Collision(lumens, other,
								normal.doScale(1/penetration), penetration);
						}
					}

					return collision;
				}
			}
		});
//	}

//	INFLUENCES {
		var Force = {
			/* See Game Physics Engine Development, by Ian Millington */
			// { Vec2D posFrom, Vec2D posTo, Number factor (springiness), Number restLength (spring target) }
			spring: function(options) {
				var force = options.posTo.sub(options.posFrom),
					length = force.mag();
				
				return ((length)? force.doScale(options.factor*
						Math.abs(length-options.restLength)/length)
					:	force);
			},
			// { Particle pointFrom, Vec2D posTo, Number factor (springiness), Number restLength (spring target), Number damping }
			dampedSpring: function(options) {
				var from = options.pointFrom.pos, oldFrom = options.posFrom;

				options.posFrom = from;

				var spring = this.spring(options), damp;

				if(from.equals(options.posTo)) {
					damp = options.pointFrom.vel.scale(-options.damping);
				}
				else {
					damp = from.sub(options.posTo).doUnit();
					damp.doScale(-options.damping*Math.max(0,
						options.pointFrom.vel.dot(damp)));
				}

				delete options.posFrom;
				options.posFrom = oldFrom;

				return damp.doAdd(spring);
			},
			// Circle-led wander idea from Mat Buckland's Programming Game AI by Example
			// { Number range, Vec2D vel }
			wander: function(options) {
				/* range is proportional to the distance either side of the current
					heading within which the entity may wander (radius of wander circle)
					vel is the minimum velocity vector which wandering may produce
					(distance wander circle is ahead of the entity) */
				var angle = Math.random()*2*Math.PI;
				return options.vel.add(new Vec2D(options.range*Math.cos(angle),
					options.range*Math.sin(angle)));
			},
			/* Adapted from Craig Reynolds' famous Boids - http://www.red3d.com/cwr/boids/
				and Harry Brundage's implementation, among others - http://harry.me/2011/02/17/neat-algorithms---flocking */
			// { QuadTree swarm, Particle member, Number nearbyRad, { Number separation, Number alignment, Number cohesion } weight, Number predict (o) }
			swarm: function(options) {
				var totalSeparation = new Vec2D(), totalCohesion = new Vec2D(),
					totalAlignment = new Vec2D(), swarm = new Vec2D(),
					
					predict = (options.predict || 0),
					focus = options.member.vel.scale(predict)
						.doAdd(options.member.pos),
					nearby = options.swarm.get((new Circle(focus,
							options.nearbyRad)).containingAARect()),
					
					num = 0;
				
				for(var n = 0; n < nearby.length; ++n) {
					var near = nearby[n].item;
					
					if(options.member !== near) {
						var nearbyFocus = near.vel.scale(predict)
								.doAdd(near.pos),
							vec = focus.sub(nearbyFocus),
							dist = vec.mag();

						if(dist < options.nearbyRad) {
							++num;

							var distFactor = options.nearbyRad/dist;
							totalSeparation.doAdd(vec.doUnit()
								.doScale(distFactor*distFactor));
							
							totalCohesion.doAdd(nearbyFocus).doSub(focus);
							
							var alignment = (near.angle ||
								((near.vel.magSq())?
									near.vel.unit() : null));
							
							if(alignment) { totalAlignment.doAdd(alignment); }
						}
					}
				}
				
				if(num) {
					swarm.doAdd(totalSeparation.doScale(options.weight.separation))
						.doAdd(totalCohesion.doScale(options.weight.cohesion))
						.doAdd(totalAlignment.doScale(options.weight.alignment))
						.doScale(1/num);
				}
				
				return swarm;
			},
			// { Particle point, QuadTree walls, Lumens lumens, Number radius, Number predict }
			avoidWalls: function(options) {
				var force = new Vec2D(),
					predict = (options.predict || 0),
					focus = new Circle(options.point.vel.scale(predict)
							.doAdd(options.point.pos), options.radius),
					nearby = options.walls.get(focus.containingAARect());

				for(var w = 0; w < nearby.length; ++w) {
					var wall = nearby[w].item;

					if(wall.boundRad.intersects(focus)) {
						var verts = wall.three.geometry.vertices;
						
						for(var v = 0; v < verts.length; ++v) {
							var a = wall.globPos(verts.wrap(v-1).position),
								b = wall.globPos(verts[v].position),
								c = Collision.Circle.checkLine(focus,
										a, b);

							if(c) {
								// Inverse square force
								force.doAdd(c.vector.scale(c.penetration));
							}
						}
					}
				}

				if(options.lumens) {
					var lc = Collision.Lumens.checkRect(options.lumens,
									focus.containingAARect());

					if(lc) {
						lc.doSwap();

						// Inverse square force
						force.doAdd(lc.vector.scale(lc.penetration));
					}
				}

				return force;
			},
			/* Adapted from "How To Implement a Pressure Soft Body
				Model", by Maciej Matyka, using Gauss' theorem to obtain volume,
				and pressure from there - maq@panoramix.ift.uni.wroc.pl */
			/* A bit different to the others, in that it doesn't return a force to
				be applied to each point in turn, but rather applies it across
				all of the points in turn */
			applyPressure: function(points, factor) {
				// Derived used to prevent repeated calculations
				var volume = 0, derived = [];

				// TODO: change to use THREE.geometry's existing normals
				for(var p = 0; p < points.length; ++p) {
					var from = points.wrap(p-1), to = points[p],
						vec = to.pos.sub(from.pos),
						mag = vec.mag();

					if(mag) {
						var normal = vec.perp().doScale(1/mag);
						
						volume += 0.5*Math.abs(vec.x)*mag*Math.abs(normal.x);
						derived.push({ from: from, to: to, mag: mag, normal: normal});
					}
				}

				var invVolume = 1/volume;
				for(var d = 0; d < derived.length; ++d) {
					var data = derived[d],
						pressure = invVolume*factor*data.mag;
					
					data.from.force.doAdd(data.normal.scale(pressure));
					data.to.force.doAdd(data.normal.scale(pressure));
				}
			}
		};


		Impulse = {
			/* See Game Physics Engine Development, by Ian Millington */
			/* { Number dt, Vec2D normal, Number restitution, Particle point1, Particle point2 o } */
			collision: function(options) {
				var impulse = new Vec2D();

				if(options.restitution) {
					var relVel = options.point1.vel.copy();

					if(options.point2) { relVel.doSub(options.point2.vel); }

					var sepVel = relVel.dot(options.normal);

					if(sepVel <= 0) {
						var closeVel = -sepVel*options.restitution,
							relAcc = options.point1.acc.copy();

						if(options.point2) { relAcc.doSub(options.point2.acc); }

						var accSepVel = relAcc.dot(options.normal)*options.dt;

						if(accSepVel < 0) {
							closeVel = Math.max(closeVel+accSepVel*
								options.restitution, 0);
						}

						var deltaVel = closeVel-sepVel,
							totalInvMass = options.point1.invMass;

						if(options.point2) {
							totalInvMass += options.point2.invMass;
						}

						if(totalInvMass > 0) {
							impulse = options.normal.scale(deltaVel/totalInvMass);

							var point1Impulse =
								impulse.scale(options.point1.invMass);

							return ((options.point2)?
									[point1Impulse,
										impulse.scale(-options.point2.invMass)]
								:	point1Impulse);
						}
					}
				}

				return ((options.point2)? [impulse, impulse] : impulse);
			}/*,
			friction: function(options) {*/
				/* Friction acts against the component of the
					velocity 'v' parallel to the surface.
					The component parallel to the surface's normal 'n' is (n.v)n
					The component parallel to the surface is perpendicular to
					this, v-(n.v)n
					So we have friction = -f(v-(n.v)n),
					where f is a coefficient of friction*/
			//}
		};


		Move = {
			/* { Vec2D normal, Number penetration, Particle point1, Particle point2 o } */
			penetration: function(options) {
				var move = new Vec2D();

				if(options.penetration > 0) {
					var totalInvMass = options.point1.invMass;

					if(options.point2) { totalInvMass += options.point2.invMass; }

					if(totalInvMass > 0) {
						move = options.normal.scale(options.penetration/totalInvMass);

						var point1Move = move.scale(options.point1.invMass);

						return ((options.point2)?
								[point1Move, move.scale(-options.point2.invMass)]
							:	point1Move);
					}
				}

				return ((options.point2)? [move, move] : move);
			}
		};
//	}

//	SHAPES {
		// Wraps THREE.Mesh

		// No orientation - just position (bound to particle)
		function Shape(options) {
			if(!options) { options = {}; }
			
			this.owner = (options.owner || new Particle());

			this.three = options.three;	//  THREE.Mesh

			this.properties = {
				geometry: {},
				material: {}
			};

			this.boundRad = new Circle();
			this.treeItem = null;
			this.resolve();
		}
		$.extend(Shape.prototype, {
			update: function() { return this; },
			resolve: function(dt) {
				this.three.position.x = this.owner.pos.x;
				this.three.position.y = this.owner.pos.y;

				this.updateBounds();

				return this;
			},
			updateBounds: function() {
				/* Potentially Smaller radius *//*
				this.boundRad.radius(0);
				this.boundRad.pos.doZero();

				var verts = this.three.geometry.vertices, l = verts.length;
				
				if(l) {
					for(var i = 0; i < l; ++i) {
						this.boundRad.pos.doAdd(this.globPos(verts[i].pos));
					}
					this.boundRad.pos.doScale(1/l);
					
					for(var j = 0; j < l; ++j) {
						var radSq = this.boundRad.pos
							.distSq(this.globPos(verts[j].pos));
						
						if(radSq > this.boundRad.radSq) {
							this.boundRad.radSq = radSq;
						}
					}
					
					this.boundRad.rad = Math.sqrt(this.boundRad.radSq);
				}

				this.treeItem = this.boundRad.containingAARect();
				this.treeItem.item = this;
				*/
				this.three.geometry.computeBoundingSphere();
				this.three.boundRadius = this.three.geometry
					.boundingSphere.radius;

				this.boundRad.pos = this.owner.pos;
				this.boundRad.radius(this.three.boundRadius);

				/* TODO: change to three.geometry.boundingBox? More
					computation here, but closer fit to shape */
				this.treeItem = this.boundRad.containingAARect();
				this.treeItem.item = this;
				
				return this;
			},
			relPos: function(globPos) { return globPos.sub(this.owner.pos); },
			globPos: function(relPos) { return this.owner.pos.add(relPos); },
			relPosition: function(globPosition) {
				return new THREE.Vector3().sub(globPosition, this.three.position);
			},
			globPosition: function(relPosition) {
				return new THREE.Vector3().add(relPosition, this.three.position);
			}
		});
//	}

//	LIGHT {
		/* http://zach.in.tu-clausthal.de/teaching/cg_literatur/glsl_tutorial/ */
		function SpotLight(options) {
			if(!options) { options = {}; }

			THREE.PointLight.call(this, options.hex,
				options.intensity, options.distance);

			if(options.position) { this.position = options.position; }

			this.direction = (options.direction || new THREE.Vector3());
			this.angle = (options.angle || 0);

			this.falloff = (options.falloff || 0.0);	// Exponent determining falloff towards edges of spot

			this.pos = new Vec2D(this.position.x, this.position.y);
			this.dir = new Vec2D(this.direction.x, this.direction.y);

			this.boundRad = new Circle();
			this.treeItem = null;
			this.update();
		}
		$.extend(inherit(SpotLight, THREE.PointLight).prototype, {
			update: function() {
				/* var dist = new Vec2D().copy(this.direction.clone()
								.multiplyScalar(this.distance/2)).mag()+
							this.sinAngle*this.distance; */
				/* Just treat it as a point light - naive, but simpler
					than accounting for the spot cone cutoff */
				this.boundRad.radius(this.distance/2);
				this.boundRad.pos.copy(this.dir.scale(this.boundRad.rad)
					.doAdd(this.pos));

				this.treeItem = this.boundRad.containingAARect();
				this.treeItem.item = this;

				return this;
			},
			updatePos: function() {
				this.pos.copy(this.position);
				this.dir.copy(this.direction);

				return this;
			},
			updatePosition: function() {
				this.position.x = this.pos.x;
				this.position.y = this.pos.y;
				this.direction.x = this.dir.x;
				this.direction.y = this.dir.y;

				return this;
			}
		});


		function RayTracer(options) {
			if(!options) { options = {}; }

			/* Require OES_texture_float? *//*
			if(!gl.getExtension("OES_texture_float")) {
				throw("Requires OES_texture_float extension");
			}
			*/

			this.scene = options.scene;
			this.meshTree = options.meshTree;
			this.maxHits = options.maxHits;

			this.maxRays = this.numQuadTreeNodes =
				this.numMeshes = this.numTriangles = 0;

			this.uniforms = THREE.UniformsUtils.merge([
				THREE.UniformsLib["fog"],
				{
					ambientLightColor: { type: 'fv', value: [] },
					pointLightColor: { type: 'fv', value: [] },
					pointLightPosition: { type: 'fv', value: [] },
					pointLightDistance: { type: 'fv1', value: [] },

					spotLightDirection: { type: 'fv', value: [] },
					spotLightCosAngle: { type: 'fv1', value: [] },
					spotLightFalloff: { type: 'fv1', value: [] },

					/* N*(2*RGB+1*RGBA) - [xmin, ymin, zmin][xmax, ymax, zmax]
						[subNodesIndex, numSubNodes, meshesIndex, numMeshes] */
					quadTree: { type: 't', value: 0,
						texture: new THREE.DataTexture([], 0, 0,
							THREE.RGBAFormat, THREE.FloatType,
							undefined, undefined, undefined,
							THREE.NearestFilter, THREE.NearestFilter) },
					/*quadTree: { type: 't', value: 0,
						texture: new THREE.DataTexture([], 0, 0,
							THREE.RGBAFormat, THREE.IntType,
							undefined, undefined, undefined,
							THREE.NearestFilter, THREE.NearestFilter) },*/

					/* M*(13*RGBA - [x, y, z, radius]

							[c0r0, c0r1, c0r2, c0r3][c1r0, c1r1, c1r2, c1r3][c2r0, c2r1, c2r2, c2r3][c3r0, c3r1, c3r2, c3r3]
							[c0r0, c0r1, c0r2, c0r3][c1r0, c1r1, c1r2, c1r3][c2r0, c2r1, c2r2, c2r3][c3r0, c3r1, c3r2, c3r3]

							[trianglesIndex, numTriangles, reflect, iOR][rdiff, gdiff, bdiff, textureID]
							[ramb, gamb, bamb, opacity][rspec, gspec, bspec, shine] */
					meshes: { type: 't', value: 1,
						texture: new THREE.DataTexture([], 0, 0,
							THREE.RGBAFormat, THREE.FloatType,
							undefined, undefined, undefined,
							THREE.NearestFilter, THREE.NearestFilter) },
					/*meshes: { type: 't', value: 1,
						texture: new THREE.DataTexture([], 0, 0,
							THREE.RGBAFormat, THREE.IntType,
							undefined, undefined, undefined,
							THREE.NearestFilter, THREE.NearestFilter) },*/

					/* T*(3*RGB+3*RGBA) - [xp0, yp0, zp0][xp1, yp1, zp1][xp2, yp2, zp2]
						[xnp0, ynp0, znp0, xnf][xnp1, ynp1, znp1, ynf][xnp2, ynp2, znp2, znf] */
					triangles: { type: 't', value: 2,
						texture: new THREE.DataTexture([], 0, 0,
							THREE.RGBAFormat, THREE.FloatType,
							undefined, undefined, undefined,
							THREE.NearestFilter, THREE.NearestFilter) },
					/*triangles: { type: 't', value: 2,
						texture: new THREE.DataTexture([], 0, 0,
							THREE.RGBAFormat, THREE.IntType,
							undefined, undefined, undefined,
							THREE.NearestFilter, THREE.NearestFilter) },*/

					infinity: { type: 'f', value: 10000 }
				}]);

			this.fragment = '';

			this.material = new THREE.ShaderMaterial({
				fragmentShader: this.fragment,
				vertexShader: this.vertex,
				uniforms: this.uniforms,
				lights: true,
				fog: true
			});

			this.update().setup();
		}
		$.extend(RayTracer.prototype, {
			setup: function() {
				this.maxRays = 1;

				for(var b = 0; b < this.maxHits;
					this.maxRays += (2+scene.__lights.length)*
						Math.pow(2, b++)) {}
				
				// toExponential ensures a float representation
				this.fragment =
					'#define MAX_HITS '+this.maxHits+'\n\
					#define MAX_HITS_F '+this.maxHits+'.0\n\
					#define MAX_RAYS '+this.maxRays+'\n\
					#define MAX_RAYS_F '+this.maxRays+'.0\n\
					#define NUM_QUAD_TREE_NODES '+this.numQuadTreeNodes+'\n\
					#define NUM_QUAD_TREE_NODES_F '+this.numQuadTreeNodes+'.0\n\
					#define NUM_MESHES '+this.numMeshes+'\n\
					#define NUM_MESHES_F '+this.numMeshes+'.0\n\
					#define NUM_TRIANGLES '+this.numTriangles+'\n\
					#define NUM_TRIANGLES_F '+this.numTriangles+'.0\n\n'+

					this.fragmentHeader+'\n'+this.structs+'\n'+this.util+
					'\n'+this.readData+'\n'+this.intersections+'\n'+
					this.whittedRayTracer+'\n'+this.fragmentMain;

				// Dirty material(?)
				//this.refresh();

				return this;
			},
			update: function() { return this.updateDataTextures().updateLights(); },
			updateDataTextures: function() {
				var quadTreeTexture = this.uniforms.quadTree.texture,
					meshesTexture = this.uniforms.meshes.texture,
					trianglesTexture = this.uniforms.triangles.texture,

					// Quadtree tier
					nodesData = quadTreeTexture.image.data, meshIndex = 0,
					// Mesh tier
					meshesData = meshesTexture.image.data, triangleIndex = 0,
					// Primitive tier
					trianglesData = trianglesTexture.image.data,

					node = this.meshTree.root, nodes = [node];

				nodesData.length = meshesData.length =
					trianglesData.length = 0;

				// Quadtree tier
				for(var n = 0; n < nodes.length; node = nodes[++n]) {
					var kids = node.kids.concat(node.borderKids),
						minZ = Infinity, maxZ = -Infinity;

					// Mesh tier
					for(var k = 0; k < kids.length; ++k) {
						var shape = kids[k].shape,
							mesh = shape.three,
							geometry = mesh.geometry,
							vertices = geometry.vertices,
							faces = geometry.faces;

						// Primitive tier
						for(var f = 0; f < faces.length; ++f) {
							/* Assumes all faces are faces3 (ensure
								exporting only triangles, or see
								THREE.GeometryUtils.triangulateQuads)
								and that all faces share the same material */
							var face = faces[f],
								a = vertices[face.a].position,
								b = vertices[face.b].position,
								c = vertices[face.c].position,

								vertexNormals = face.vertexNormals,
								an = vertexNormals[0],
								bn = vertexNormals[1],
								cn = vertexNormals[2],
								fn = face.normal;

							trianglesData.push(a.x, a.y, a.z, 0,
								b.x, b.y, b.z, 0,
								c.x, c.y, c.z, 0,
								an.x, an.y, an.z, fn.x,
								bn.x, bn.y, bn.z, fn.y,
								cn.x, cn.y, cn.z, fn.z);

							for(var v = 0; v < vertices.length; ++v) {
								var z = vertices[v].position.z;

								if(z < minZ) { minZ = z; }
								if(z > maxZ) { maxZ = z; }
							}
						}

						var bR = shape.boundRad,
							ctr = bR.position,

							flatObjectMatrix = mesh.object.matrixWorld
								.flattenToArray(),

							flatNormalMatrix = THREE.Matrix4
								.makeInvert3x3(mesh.object.matrixWorld)
								.transposeIntoArray(),

							props = shape.properties,

							gProps = props.geometry,

							mProps = props.material,
							diff = mProps.diffuse,
							amb = mProps.ambient,
							spec = mProps.specular;

						meshesData = meshesData.concat(ctr.x, ctr.y, ctr.z, bR.rad,
							flatObjectMatrix,
							flatNormalMatrix,
							triangleIndex, faces.length, gProps.reflect, gProps.iOR,
							diff.r, diff.g, diff.b, 0,
							amb.r, amb.g, amb.b, mProps.opacity,
							spec.r, spec.g, spec.b, mProps.shine);

						triangleIndex += faces.length;
					}

					var min = node.bounds.min, max = node.bounds.max;

					/* TODO: min and max z */
					nodesData.push(min.x, min.y, minZ, 0,
						max.x, max.y, maxZ, 0,
						nodes.length, node.nodes.length, meshIndex, kids.length);

					meshIndex += kids.length;
					nodes = nodes.concat(node.nodes);
				}

				quadTreeTexture.image.width =
					this.numQuadTreeNodes = nodes.length;
				quadTreeTexture.image.height = 3;

				meshesTexture.image.width = 
					this.numMeshes = meshIndex+1;
				meshesTexture.image.height = 13;

				trianglesTexture.image.width =
					this.numTriangles = triangleIndex+1;
				trianglesTexture.image.height = 6;

				quadTreeTexture.needsUpdate =
					meshesTexture.needsUpdate =
						trianglesTexture.needsUpdate = true;

				return this;
			},
			updateLights: function() {
				/* Note: updating the number and types of lights can't be done without
					rebuilding the shader program - set material.needsUpdate to true
					(can't find this in the source though - delete material.program instead?)
					https://github.com/mrdoob/three.js/wiki/Updates

					An alternative may be to set it up a budgeted number of lights with
					dummy information (0 intensity)

					Then again, this could be out of date entirey... */

				for(var l = 0, vecOffset = 0, lights = this.scene.__lights, ll = lights.length;
					l < ll; ++l, vecOffset = l*3) {
					var light = lights[l];

					if(light instanceof SpotLight) {
						this.uniforms.spotLightDirection[vecOffset] = light.direction.x;
						this.uniforms.spotLightDirection[vecOffset+1] = light.direction.x;
						this.uniforms.spotLightDirection[vecOffset+2] = light.direction.x;

						this.uniforms.spotLightCosAngle[l] = cos(light.angle);
						this.uniforms.spotLightFalloff[l] = light.falloff;
					}
					else {
						this.uniforms.spotLightDirection[vecOffset] =
							this.uniforms.spotLightDirection[vecOffset+1] =
								this.uniforms.spotLightDirection[vecOffset+2] = 0;

						this.uniforms.spotLightCosAngle[l] =
							this.uniforms.spotLightFalloff[l] = -1.0;
					}
				}

				return this;
			},
			setHits: function(hits) {
				this.hits = hits;
				return this.setup();
			},
			refresh: function() {
				this.material.needsUpdate = true;
				//delete this.material.program;

				return this;
			},

			/* Supplied by THREE:
				uniform mat4 objectMatrix;
				uniform mat4 modelViewMatrix;
				uniform mat4 projectionMatrix;
				uniform mat4 viewMatrix;
				uniform mat3 normalMatrix;
				uniform vec3 cameraPosition;

				attribute vec3 position;
				attribute vec3 normal;
				attribute vec2 uv;
				attribute vec2 uv2;

				as well as color, morph targets, and skinning
				https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L5273

				Set material.shading to THREE.SmoothShading to get
				per-vertex normals:
				https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L774 */
			vertex:
				// For passing interpolated position to fragment
				'varying vec4 pos;\n\
				\n\
				void main() {\n\
					pos = (objectMatrix*vec4(position, 1.0));\n\
					gl_Position = projectionMatrix*modelViewMatrix*\n\
							vec4(position, 1.0);\n\
				}',

			/* Supplied by THREE:
				uniform mat4 viewMatrix;
				uniform vec3 cameraPosition;

				as well as precision
				https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L5362

				Set material.lights to true to use lights and include the
				corresponding variables:
				https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLShaders.js#L419,
				https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLShaders.js#L458 */
			fragmentHeader:
				THREE.ShaderChunk["fog_pars_fragment"]+'\n'+
				/* TODO: use these for eye ray? */
				/*"uniform vec3 diffuse;"+
				"uniform float opacity;"+

				"uniform vec3 ambient;"+
				"uniform vec3 specular;"+
				"uniform float shininess;"+*/

				'#define PAD 0.25\n\
				\n\
				#define NODE_STEP '+(1.0/3.0).toExponential()+'\n\
				#define NODE_PAD '+(0.25/3.0).toExponential()+'\n\
				\n\
				#define MESH_DATA_STEP '+(1.0/13.0).toExponential()+'\n\
				#define MESH_DATA_PAD '+(0.25/13.0).toExponential()+'\n\
				#define BOUNDING_SPHERE_OFFSET 0.0\n\
				#define OBJECT_MATRIX_OFFSET '+(1.0/13.0).toExponential()+'\n\
				#define NORMAL_MATRIX_OFFSET '+(5.0/13.0).toExponential()+'\n\
				#define GEOMETRY_OFFSET '+(9.0/13.0).toExponential()+'\n\
				#define MATERIAL_OFFSET '+(10.0/13.0).toExponential()+'\n\
				\n\
				#define TRI_POINT_STEP '+(1.0/6.0).toExponential()+'\n\
				#define TRI_POINT_PAD '+(0.25/6.0).toExponential()+'\n\
				\n\
				#define MEDIUM_IOR 1.0\n\
				#define EPSILON 0.01\n\
				\n\
				uniform vec3 ambientLightColor;\n\
				\n\
				#if MAX_POINT_LIGHTS > 0\n\
					uniform vec3 pointLightColor[MAX_POINT_LIGHTS];\n\
					uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];\n\
					uniform float pointLightDistance[MAX_POINT_LIGHTS];\n\
					\n\
					uniform vec3 spotLightDirection[MAX_POINT_LIGHTS];\n\
					uniform float spotLightCosAngle[MAX_POINT_LIGHTS];\n\
					uniform float spotLightFalloff[MAX_POINT_LIGHTS];\n\
				#endif\n\
				\n\
				/* Global scene data stored in textures */\n\
				uniform sampler2D quadTree;\n\
				uniform sampler2D meshes;\n\
				uniform sampler2D triangles;\n\
				\n\
				uniform float infinity;\n\
				\n\
				varying vec4 pos;',
				
			structs:
				'struct Ray {\n\
					vec3 origin;\n\
					vec3 dir;\n\
					\n\
					int hit;	/* Records the number of times this ray has bounced in the scene */\n\
					\n\
					vec3 light;	/* The light being transmitted (color, energy) */\n\
					float iOR;	/* The index of refraction of the medium the ray is currently travelling through */\n\
					int tLight;	/* The distance to the target light - set for shadow rays, -1.0 otherwise */\n\
				};\n\
				\n\
				struct AABBox {\n\
					vec3 min;\n\
					vec3 max;\n\
				};\n\
				\n\
				struct Node {\n\
					AABBox bounds;\n\
					float subNodesIndex;\n\
					float numSubNodes;\n\
					float meshesIndex;\n\
					float numMeshes;\n\
				};\n\
				\n\
				struct Sphere {\n\
					vec3 pos;\n\
					float rad;\n\
				};\n\
				\n\
				struct Triangle {\n\
					vec3 points[3];\n\
					vec3 normals[3];\n\
					vec3 faceNormal;\n\
				};\n\
				\n\
				struct Geometry {	/* A bit messy, but it fits the data packing/fetching better */\n\
					float trianglesIndex;\n\
					float numTriangles;\n\
					\n\
					float reflect;\n\
					float iOR;\n\
				};\n\
				\n\
				struct Properties {\n\
					vec3 diffuse;	/* If textureID is valid, multiply texel by diffuse, if not, just use diffuse */\n\
					int textureID;\n\
					\n\
					vec3 ambient;\n\
					float opacity;\n\
					\n\
					vec3 specular;\n\
					float shine;\n\
				};',

			util:
				'float sum(vec3 v) { return v.x+v.y+v.z; }\n\
				\n\
				bool inRange(float t) { return (EPSILON <= t && t < infinity); }\n\
				\n\
				Ray transform(Ray ray, mat4 matrix) {\n\
					return Ray(matrix*vec4(ray.origin, 1.0),\n\
						matrix*vec4(ray.origin, 0.0),\n\
						ray.hit, ray.light, ray.iOR, ray.tLight);\n\
				}',

			/* Functions for reading in data from the respective textures
				and returning a useable object */
			readData:
				'Node getNode(float index) {\n\
					float i = (index+PAD)/NUM_QUAD_TREE_NODES_F,\n\
						j = NODE_PAD;\n\
					\n\
					vec4 pointers = texture2D(quadTree,\n\
						vec2(i, j+2.0*NODE_STEP));\n\
					\n\
					return Node(AABBox(texture2D(quadTree, vec2(i, j)).xyz,\n\
							texture2D(quadTree, vec2(i, j += NODE_STEP)).xyz),\n\
						pointers.x, pointers.y, pointers.z, pointers.w));\n\
				}\n\
				\n\
				Sphere getBoundingSphere(float index) {\n\
					vec4 data = texture2D(meshes,\n\
							vec2((index+PAD)/NUM_MESHES_F,\n\
								BOUNDING_SPHERE_OFFSET+MESH_DATA_PAD));\n\
					\n\
					return Sphere(data.xyz, data.w);\n\
				}\n\
				\n\
				mat4 getMatrix(float index, float offset) {\n\
					float i = (index+PAD)/NUM_MESHES_F,\n\
						j = offset+MESH_DATA_PAD;\n\
					\n\
					// Note: OpenGL matrices are column-major - weird, be careful\n\
					return mat4(texture2D(meshes, vec2(i, j)),\n\
						texture2D(meshes, vec2(i, j += MESH_DATA_STEP)),\n\
						texture2D(meshes, vec2(i, j += MESH_DATA_STEP)),\n\
						texture2D(meshes, vec2(i, j += MESH_DATA_STEP)));\n\
				}\n\
				\n\
				/* Multiply the ray (in world space) by the inverse of the\n\
					transformation matrix when testing for intersections,\n\
					to reduce the number of multiplications - if there\'s a\n\
					hit, move the point back into world space by multiplying\n\
					it by the transformation matrix */\n\
				mat4 getObjectMatrix(float index) {\n\
					return getMatrix(index, OBJECT_MATRIX_OFFSET);\n\
				}\n\
				\n\
				/* Normals must be handled as well, and must be\n\
					multiplied by a normal matrix - the transpose of the\n\
					inverse of the transformation matrix, with w = 0 (to\n\
					remove translation) - so, do we send down normal matrices\n\
					for each object too? - http://www.unknownroad.com/rtfm/graphics/rt_normals.html */\n\
				mat4 getNormalMatrix(float index) {\n\
					return getMatrix(index, NORMAL_MATRIX_OFFSET);\n\
				}\n\
				\n\
				Geometry getGeometry(float index) {\n\
					float i = (index+PAD)/NUM_MESHES_F,\n\
						j = GEOMETRY_OFFSET+MESH_DATA_PAD;\n\
					\n\
					vec4 data = texture2D(properties, vec2(i, j));\n\
					\n\
					return Geometry(data.r, data.g, data.b, data.a);\n\
				}\n\
				\n\
				Material getMaterial(float index) {\n\
					float i = (index+PAD)/NUM_MESHES_F,\n\
						j = MATERIAL_OFFSET+MESH_DATA_PAD;\n\
					\n\
					vec4 data[3];\n\
					\n\
					data[0] = texture2D(properties, vec2(i, j));\n\
					data[1] = texture2D(properties, vec2(i, j += MESH_DATA_STEP));\n\
					data[2] = texture2D(properties, vec2(i, j += MESH_DATA_STEP));\n\
					\n\
					return Material(data[0].rgb, data[0].a,\n\
						data[1].rgb, data[1].a, data[2].rgb, data[2].a);\n\
				}\n\
				\n\
				Triangle getTriangle(float index) {\n\
					float i = (index+PAD)/NUM_TRIANGLES_F,\n\
						j = TRI_POINT_PAD;\n\
					Triangle t;\n\
					\n\
					t.points[0] = texture2D(triangles, vec2(i, j)).xyz;\n\
					t.points[1] = texture2D(triangles,\n\
							vec2(i, j += TRI_POINT_STEP)).xyz;\n\
					t.points[2] = texture2D(triangles,\n\
							vec2(i, j += TRI_POINT_STEP)).xyz;\n\
					\n\
					/* Note that the normal is transformed by a different\n\
						normal matrix - this is in eye space in THREE, so\n\
						how do we get it down in world space?\n\
						vec3 nWorld = mat3(objectMatrix[0].xyz, objectMatrix[1].xyz, objectMatrix[2].xyz)*normal;\n\
						Does this hold up when scaling is involved though?\n\
						http://www.lighthouse3d.com/tutorials/glsl-tutorial/the-normal-matrix/ */\n\
					vec4 n[3];\n\
					\n\
					n[0] = texture2D(triangles, i,\n\
							vec2(i, j += TRI_POINT_STEP));\n\
					n[1] = texture2D(triangles, i,\n\
							vec2(i, j += TRI_POINT_STEP));\n\
					n[2] = texture2D(triangles, i,\n\
							vec2(i, j += TRI_POINT_STEP));\n\
					\n\
					t.normals[0] = n[0].xyz;\n\
					t.normals[1] = n[1].xyz;\n\
					t.normals[2] = n[2].xyz;\n\
					\n\
					t.faceNormal = vec3(n[0].w, n[1].w, n[2].w);	/* Passing the face normal this way saves space */\n\
					\n\
					return t;\n\
				}',

			/* The returned float (t) denotes the distance along
				the ray at which the intersection occurs, where valid values
				for t are in the range [epsilon, infinity], exclusively */
			intersections:
				'/* Kajiya et al\n\
					http://code.google.com/p/rtrt-on-gpu/source/browse/trunk/Source/GLSL+Tutorial/Implicit+Surfaces/Fragment.glsl?r=305#147\n\
					http://www.gamedev.net/topic/495636-raybox-collision-intersection-point/ */\n\
				float intersection(Ray ray, AABBox box) {\n\
					float t = -1.0;\n\
					\n\
					/* Cater for the special case where the ray originates\n\
						inside the box - this must be handled explicitly */\n\
					if(all(greaterThan(ray.origin, box.min)) &&\n\
						all(lessThan(ray.origin, box.max))) { t = 0.0; }\n\
					else {\n\
						vec3 tmin = (box.min-ray.origin)/ray.dir;\n\
						vec3 tmax = (box.max-ray.origin)/ray.dir;\n\
						\n\
						vec3 rmax = max(tmax, tmin);\n\
						vec3 rmin = min(tmax, tmin);\n\
						\n\
						end = min(rmax.x, min(rmax.y, rmax.z));\n\
						start = max(max(rmin.x, 0.0), max(rmin.y, rmin.z));\n\
						\n\
						if(end > start) { t = start; }\n\
						//return final > start;\n\
					}\n\
					\n\
					return t;\n\
				}\n\
				\n\
				/* See "Intersecting a Sphere" at http://www.cs.unc.edu/~rademach/xroads-RT/RTarticle.html */\n\
				float intersection(Ray ray, Sphere sphere) {\n\
					vec3 oc = sphere.pos-ray.origin;\n\
					float v = dot(oc, ray.dir);\n\
					float dSq = s.rad*s.rad-(dot(oc, oc)-v*v);\n\
					\n\
					return ((dSq >= 0.0)? v-sqrt(dSq) : -1.0);\n\
				}\n\
				\n\
				/* Ray-plane test */\n\
				float intersection(Ray ray, vec3 point, vec3 normal) {\n\
					float d = dot(ray.dir, normal);\n\
					\n\
					// Less than or equal to zero if parrallel or behind ray\n\
					return ((abs(d) >= EPSILON)?\n\
						dot(normal, (point-ray.origin))/d : -1.0);\n\
				}\n\
				\n\
				/* Barycentric coordinate test - http://www.blackpawn.com/texts/pointinpoly/default.html */\n\
				float intersection(Ray ray, Triangle triangle) {\n\
					/* TODO: transform ray, transform hit point back */\n\
					\n\
					float t = intersection(ray, triangle.points[0],\n\
						triangle.faceNormal);\n\
					\n\
					// Check if parrallel to or behind ray\n\
					if(inRange(t)) {\n\
						vec3 point = ray.origin+ray.dir*t;\n\
						\n\
						// Compute vectors\n\
						vec3 v0 = triangle.points[2]-triangle.points[0];\n\
						vec3 v1 = triangle.points[1]-triangle.points[0];\n\
						vec3 v2 = point-triangle.points[0];\n\
						\n\
						// Compute dot products\n\
						float dot00 = dot(v0, v0);\n\
						float dot01 = dot(v0, v1);\n\
						float dot02 = dot(v0, v2);\n\
						float dot11 = dot(v1, v1);\n\
						float dot12 = dot(v1, v2);\n\
						\n\
						// Compute barycentric coordinates\n\
						float invDenom = 1/(dot00*dot11-dot01*dot01);\n\
						float u = (dot11*dot02-dot01*dot12)*invDenom;\n\
						float v = (dot00*dot12-dot01*dot02)*invDenom;\n\
						\n\
						// Check if point is in triangle\n\
						if(u < 0.0 || v < 0.0 || u+v >= 1.0) { t = -1.0; }\n\
					}\n\
					\n\
					return t;\n\
				}\n\
				\n\
				float intersection(Ray ray, out float meshID, out Triangle triangle) {\n\
					float closest = infinity;\n\
					\n\
					/* For the sake of optimisation, loops are extremely\n\
						primitive in GLSL - only constant values may be used\n\
						for the LCV, the test must be very simple, and everything\n\
						seems to need to be figured out at compile time, not\n\
						run time - hence, set up a budget of the maximum possible\n\
						number of loops, and break early if not all are needed */\n\
					float nodes[NUM_QUAD_TREE_NODES];\n\
					nodes[0] = 0.0;\n\
					int nLast = 0;\n\
					\n\
					/* Traverse quadTree */\n\
					for(int n = 0; n < NUM_QUAD_TREE_NODES; ++n) {\n\
						if(n <= nLast) {\n\
							Node node = getNode(nodes[n]);\n\
							\n\
							if(node.numSubNodes > 0.0 || node.numMeshes > 0.0) {	/* Check if empty before checking intersection */\n\
								if(inRange(intersection(ray, node.bounds))) {\n\
									if(node.numSubNodes > 0.0) {\n\
										for(float i = 0.0; i < 4.0; ++i) {\n\
											nodes[++nLast] = node.subNodesIndex+i;\n\
										}\n\
									}\n\
									\n\
									if(node.numMeshes > 0.0) {	/* Check at every level to avoid rechecking borderKids by passing them down to each child node */\n\
										float mID;\n\
										Triangle tri;\n\
										float mT = intersection(ray, node.meshesIndex,\n\
												node.numMeshes, mID, tri);\n\
										\n\
										if(mT < closest) {\n\
											closest = mT;\n\
											triangle = tri;\n\
											meshID = mID;\n\
										}\n\
									}\n\
								}\n\
							}\n\
						}\n\
						else { break; }\n\
					}\n\
					\n\
					return closest;\n\
				}\n\
				\n\
				float intersection(Ray ray, float meshesIndex, float numMeshes,\n\
					out float meshID, out Triangle triangle) {\n\
					float closest = infinity;\n\
					float mID = meshesIndex;\n\
					\n\
					for(float m = 0.0; m < NUM_MESHES_F; ++m) {\n\
						if(m >= numMeshes) { break; }	/* Check for end of list */\n\
						else if(inRange(intersection(ray, getBoundingSphere(mID)))) {	/* Check mesh bounding radii */\n\
							/* Check mesh triangles */\n\
							Geometry geometry = getGeometry(mID);\n\
							float tn = geometry.trianglesIndex;\n\
							\n\
							for(float t = 0.0; t < NUM_TRIANGLES_F; ++t) {\n\
								if(t < geometry.numTriangles) {	/* Check for end of list */\n\
									Triangle tri = getTriangle(tn);\n\
									float tT = intersection(ray, tri);\n\
									\n\
									if(EPSILON <= tT && tT < closest) {\n\
										closest = tT;\n\
										triangle = tri;\n\
										meshID = mID;\n\
									}\n\
									\n\
									++tn;\n\
								}\n\
								else { break; }\n\
							}\n\
							\n\
							++mID;\n\
						}\n\
					}\n\
					\n\
					return closest;\n\
				}',

			/* Given an initial ray, traces rays around the
				scene up to the maximum number allowed
				(maintaining recursive heirarchical order),
				and returns the accumulated color of the fragment */
			whittedRayTracer:
				'vec3 traceRays(Ray eyeRay) {\n\
					vec3 accColor;\n\
					\n\
					Ray rays[MAX_RAYS];\n\
					\n\
					/* TODO: figure out if the eye ray needs to be traced,\n\
						or if nothing is between the fragment and the\n\
						camera, since it is being drawn */\n\
					rays[0] = eyeRay;\n\
					\n\
					/* rLast - for reducing the number of loops\n\
						When spawning rays, add them to rays after this\n\
						and increase it by the number of added rays\n\
						If r exceeds this, break (no more valid rays to be\n\
						traced) */\n\
					int rLast = 0;\n\
					\n\
					for(int r = 0; r < MAX_RAYS; ++r) {\n\
						if(r <= rLast) {\n\
							Ray ray = rays[r];\n\
							float meshID;\n\
							Triangle triangle;\n\
							float t = intersection(ray, meshID, triangle);\n\
							\n\
							/* Calculate color from closest intersection */\n\
							if(EPSILON <= ray.tLight &&	/* Shadow ray */\n\
								(ray.tLight <= t || t < EPSILON)) {	/* Light closer or no hit */\n\
								/* Final color accumulation - direct light */\n\
								accColor += ray.light;\n\
							}\n\
							else if(inRange(t) && ray.hit < MAX_HITS) {\n\
								/* Cast shadow, reflection, and\n\
									refraction rays, if the energy is\n\
									over the threshold */\n\
								int hit = ray.hit+1;\n\
								vec3 hitPoint = ray.origin+ray.dir*t;\n\
								/* TODO: get smooth normal - dots \'n\' mixes */\n\
								vec3 hitNormal = triangle.faceNormal;\n\
								Geometry geo = getGeometry(meshID);\n\
								Material mat = getMaterial(meshID);\n\
								\n\
								/* Set iOR according to whether leaving or\n\
									entering material */\n\
								if(dot(ray.dir, hitNormal) >= 0.0) {\n\
									geo.iOR = MEDIUM_IOR;\n\
								}\n\
								\n\
								// Shadow\n\
								vec3 shLight = mat.opacity*ray.light*\n\
										(mat.ambient+mat.diffuse+\n\
										mat.specular);\n\
								\n\
								if(sum(shLight) > 0.0) {\n\
									/* Get the hitPoint color */\n\
									/* Branching is slow - only do it there\'s a\n\
										significant chunk of code inside */\n\
									vec3 ambient = ambientLightColor*mat.ambient;\n\
									\n\
									#if MAX_POINT_LIGHTS > 0\n\
										for(int l = 0; l < MAX_POINT_LIGHTS; ++l) {\n\
											vec3 lightColor = pointLightColor[l];\n\
											\n\
											if(sum(lightColor) > 0.0) {\n\
												vec3 toLight = pointLightPosition[l]-hitPoint;\n\
												float dist = length(toLight);\n\
												\n\
												toLight /= dist;\n\
												\n\
												vec3 fromLight = -toLight;\n\
												\n\
												/* If falloff distance, determine attenuation\n\
													http://imdoingitwrong.wordpress.com/2011/02/10/improved-light-attenuation/ */\n\
												float attenuation = 1.0,\n\
													lightRange = pointLightDistance[l];\n\
												\n\
												if(lightRange > 0.0) {\n\
													float distFactor = dist/\n\
															(1-pow(dist/lightRange, 2.0));\n\
													\n\
													attenuation = 1.0/pow(distFactor+1.0, 2.0);\n\
												}\n\
												\n\
												float lightCosAngle = spotLightCosAngle[l];\n\
												\n\
												/* If spot light, determine if within spot light cone */\n\
												if(attenuation > 0.0 &&\n\
													-1.0 < lightCosAngle && lightCosAngle < 1.0) {	/* In the range [0-180], exclusive - should it be [0, 1]->[90, 0]? (see attenuation with spot falloff) */\n\
													float cosAngle = dot(fromLight,\n\
														spotLightDirection[l]);\n\
													\n\
													attenuation *= ((lightCosAngle <= cosAngle)?\n\
														/* Which will result in proper attenuation?\n\
															http://zach.in.tu-clausthal.de/teaching/cg_literatur/glsl_tutorial/\n\
															http://dl.dropbox.com/u/2022279/OpenGL%20ES%202.0%20Programming%20Guide.pdf */\n\
														pow(cosAngle, spotLightFalloff[l]) : 0.0);\n\
														//pow((cosAngle+1.0)*0.5, spotLightFalloff[l]) : 0.0);\n\
												}\n\
												\n\
												if(attenuation > 0.0) {	/* Don\'t bother calculating color or casting if outside of light range */\n\
													/* Compute the phong shading at the hitPoint\n\
														Ambient is only accumulated once, so do\n\
														that outside this loop */\n\
													vec3 rayColor;\n\
													\n\
													vec3 diffuse = mat.diffuse*lightColor*\n\
															max(dot(hitNormal, toLight), 0.0);\n\
													\n\
													/* TODO: texturing *//*\n\
													if(mat.textureID >= 0) {\n\
														vec4 texel = texture2D(textures[mat.textureID],\n\
															getTextureCoord(meshID, hitPoint));\n\
														\n\
														diffuse *= texel.rgb*texel.a;\n\
													}*/\n\
													\n\
													rayColor += diffuse;\n\
													\n\
													if(sum(mat.specular) > 0.0) {\n\
														float reflection = reflect(toLight, hitNormal);\n\
														float highlight = max(dot(reflection, ray.dir), 0.0);\n\
														vec3 specular = mat.specular*lightColor*\n\
																pow(highlight, mat.shine);\n\
														\n\
														rayColor += specular;\n\
													}\n\
													\n\
													rayColor *= mat.opacity;\n\
													\n\
													if(sum(rayColor) > 0.0) {	/* Don\'t bother casting if it\'s just black anyway  */\n\
														/* TODO: take jittered samples for soft shadows? */\n\
														rays[++rLast] = Ray(hitPoint,\n\
															toLight, hit,\n\
															shLight*rayColor*attenuation,\n\
															geo.iOR, dist);\n\
													}\n\
												}\n\
											}\n\
										}\n\
									#endif\n\
									\n\
									accColor += shLight*ambient*mat.opacity;\n\
								}\n\
								\n\
								// Reflection\n\
								vec3 rflLight = geo.reflect*mat.opacity*ray.light;\n\
								if(sum(rflLight) > 0.0) {\n\
									rays[++rLast] = Ray(hitPoint,\n\
										reflect(ray.dir, hitNormal), hit\n\
										rflLight, geo.iOR, -1.0);\n\
								}\n\
								\n\
								// Refraction\n\
								vec3 rfrLight = (1.0-mat.opacity)*ray.light;\n\
								if(sum(rfrLight) > 0.0) {\n\
									rays[++rLast] = Ray(hitPoint,\n\
										refract(ray.dir, hitNormal,\n\
											ray.iOR/geo.iOR),\n\
										hit, rfrLight, geo.iOR, -1.0);\n\
								}\n\
							}\n\
						}\n\
						else { break; }\n\
					}\n\
					\n\
					return accColor;\n\
				}',

			fragmentMain:
				'void main() {\n\
					gl_FragColor = vec4(traceRays(Ray(cameraPosition,\n\
							normalize(pos.xyz-cameraPosition),\n\
							0, 1.0, MEDIUM_IOR, -1.0)), 1.0);'+

					THREE.ShaderChunk["fog_fragment"]+
					/* TODO: alter traceRays to write the meshID of the
						first intersection into a variable, which can then
						be assigned to the alpha part of the fragment color
						This could then be read back on the CPU
						Finally, the FBO texture could be rendered out to
						the screen with all alpha set to 1.0 in a post pass */
				'}'
		});
//	}
	
//	ENTITIES {
		/* Template class */
		function Entity(Type, options) {
			if(!options) { options = {}; }
			
			this.Type = Type;
			this.Type.call(this, options);
			
			this.health = (options.health || 100);
			
			this.state = Entity.states.spawn;

			this.shape = (options.shape || null);

			this.maxForce = (options.maxForce || 0.03);
			this.maxTorque = (options.maxTorque || 1.0);

			this.restitution = (options.restitution || 0.4);

			this.treeItem = null;
		}
		$.extend(Entity.prototype, {
			resolve: function(dt) {
				if(dt) {
					this.Type.prototype.resolve.call(this, dt);
					this.shape.resolve(dt);
					this.updateTreeItem();
				}
				
				return this;
			},
			update: function() {
				this.shape.update();

				return this;
			},
			updateTreeItem: function() {
				this.treeItem = this.shape.treeItem.copy();
				this.treeItem.item = this;

				return this;
			}
		});
		$.extend(Entity, {
			inherit: function(Type, deep) {
				function EntityTemplate() {}

				inherit(EntityTemplate, Entity);
				
				var typeInheritance = [EntityTemplate.prototype,
					Type.prototype, Entity.prototype];

				if(deep) { typeInheritance.unshift(deep); }

				$.extend.apply($, typeInheritance);

				return EntityTemplate;
			},
			states: new Enum("spawn", "normal", "dead")
		});
		

		function Firefly(options) {
			settings = $.extend(true, {}, Firefly.settings, options);
			
			/* Particle entity template */
			/* TODO: change to Body */
			Entity.call(this, Particle, settings);

			/* TODO: change to SoftShape (and ensure geometry.dynamic
				is set to true before passing to mesh) */
			this.shape = new Shape({ owner: this,
				three: new THREE.Mesh(new THREE.SphereGeometry(15, 7, 7),
					new THREE.MeshLambertMaterial({ color: 0xffffff,
						wireframe: true })) });
			
			settings.light.pos = this.pos;
			//this.light = new SpotLight(settings.light);
			
			this.inputForce = null;

			this.updateTreeItem();
		}
		$.extend(inherit(Firefly, Entity.inherit(Particle)).prototype, {
			update: function() {
				if(this.inputForce) { this.force.doAdd(this.inputForce); }
				
				return Entity.prototype.update.call(this);
			},
			move: function(force) {
				this.inputForce = ((force)? force.scale(this.maxForce) : null);
				return this;
			},
			aim: function(angle) {
				//this.torque.doAdd(angle*this.maxTorque);
				return this;
			},
			attack: function(active) {
				return this;
			},
			beam: function(active) {
				return this;
			},
			repel: function(active) {
				return this;
			},
			range: function(active) {
				return this;
			}
		});
		$.extend(Firefly, {
			states: $.extend({}, Entity.states, new Enum("wander", "transition")),
			settings: { mass: 10, light: { rad: 100 } }
		});
		

		function Predator(options) {
			// Ensure these are shallow copied
			var swarm = safeGet(options, "swarm.swarm");
			if(swarm) { delete options.swarm.swarm; }

			var settings = $.extend(true, {}, Predator.settings, options);

			settings.swarm.swarm = options.swarm.swarm = swarm;
			
			/* Particle entity template */
			/* TODO: change to Body */
			Entity.call(this, Particle, settings);

			this.shape = new Shape({ owner: this,
				three: new THREE.Mesh(new THREE.SphereGeometry(8, 5, 5),
					new THREE.MeshLambertMaterial({ color: 0xffffff,
						wireframe: true })) });

			this.swarm = settings.swarm;
			this.wander = settings.wander;
			this.avoid = settings.avoid;
			this.swarm.member = this.avoid.point = this;

			for(var influences = [this.swarm, this.wander, this.avoid],
				i = 0; i < influences.length; ++i) {
				var influence = influences[i];

				influence.schedule = new Schedule().copy(influence.schedule);
				influence.force = new Vec2D().copy(influence.force);
			}
			
			this.state = Predator.states.spawn;

			this.updateTreeItem();
		}
		$.extend(inherit(Predator, Entity.inherit(Particle)).prototype, {
			update: function() {
				var swarmWeight = this.swarm.weight,
					swarmWeights = swarmWeight.separation+swarmWeight.cohesion+
						swarmWeight.alignment,
					wanderWeight = this.wander.weight,
					avoidWeight = this.avoid.weight,

					sumWeights = swarmWeights+wanderWeight+avoidWeight,

					time = Date.now();

				if(this.swarm.schedule.check(time)) {
					this.swarm.force = Force.swarm(this.swarm);
					this.swarm.schedule.last = time;
				}
				if(this.wander.schedule.check(time)) {
					if(this.vel.magSq()) {
						this.wander.vel.copy(this.vel.unit()
							.doScale(this.wander.minSpeed));
					}
					else {
						var angle = Math.random()*2*Math.PI;
						this.wander.vel.copy(new Vec2D(Math.cos(angle),
							Math.sin(angle))).doScale(this.wander.minSpeed);
					}

					this.wander.force = Force.wander(this.wander)
							.doScale(wanderWeight);

					this.wander.schedule.last = time;
				}
				if(this.avoid.schedule.check(time)) {
					this.avoid.force = Force.avoidWalls(
						$.extend({}, this.avoid, {
							radius: this.shape.boundRad.rad+this.avoid.radius,
							lumens: ((this.avoid.lumens.toroid)? null
								:	this.avoid.lumens)
						}));

					this.avoid.schedule.last = time;
				}

				this.force.doAdd(this.swarm.force.doPinToRange(0,
						swarmWeights/sumWeights*this.maxForce))
					.doAdd(this.wander.force.doPinToRange(0,
						wanderWeight/sumWeights*this.maxForce))
					.doAdd(this.avoid.force.doPinToRange(0,
						avoidWeight/sumWeights*this.maxForce));

				return Entity.prototype.update.call(this);
			}
		});
		$.extend(Predator, {
			states: $.extend({}, Entity.states,
				new Enum("passive", "aggressive", "feeding", "stunned")),
			settings: {
				mass: 6,
				swarm: {
					swarm: null, nearbyRad: 90, predict: 0.6,
					weight: { separation: 0.601,
						cohesion: 0.021, alignment: 0.454 },
					force: new Vec2D(), schedule: { wait: 1000/10 }
				},
				wander: { vel: new Vec2D(), range: 0.6, minSpeed: 0.8,
					weight: 1.501, force: new Vec2D(),
					schedule: { wait: 1000/30 } },
				avoid: { point: null, walls: null, lumens: null,
					radius: 70, predict: 0.8, weight: 0.75, force: new Vec2D(),
					schedule: { wait: 1000/50 } },
				maxForce: 0.006
			}
		});
//	}

//	VIEWPORT {
		function Viewport(options) {
			var settings = $.extend(true, {}, Viewport.settings, options);

			Particle.call(this, settings);

			/* The minimum bounds - defines the resolution and
				behaviour upon resizes and reorientations, and
				ensures that an area of this size is always visible,
				with everything scaled to fit */
			this.minRect = new AARect(this.pos.copy(), settings.size);

			/* The actual bounds - collisions done against the dimensions of
				this when the respective lumens dimension is larger */
			this.boundRect = new AARect();

			this.springForce = settings.springForce;
			this.zoomSpringForce = settings.zoomSpringForce;
			this.zoomSpringForce.restLength = settings.camera.position.z;
			this.springForce.pointFrom =
				this.zoomSpringForce.pointFrom = this;

			this.restitution = (settings.restitution || 0.75);
			
			this.debug = $.extend(true, {
				bounds: false,
				trails: false,
				health: false,
				states: false,
				tree: false,
				normals: false
			}, settings.debug);

			this.renderDone = new Watchable();
			//this.running = true;
			
			this.$container = $(settings.container);

			this.renderer = new THREE.WebGLRenderer({ /*clearAlpha: 1,
				precision: "highp", */ antialias: true, maxLights: Infinity });
			this.scene = new THREE.Scene();
			this.scene.fog = new THREE.FogExp2(0xffffff);
			this.camera = new THREE.PerspectiveCamera(60, 1, 1, 4000);
			this.camera.position.z = settings.camera.position.z;
			this.scene.add(this.camera);

			this.resize().reposition();

			this.$container.append(this.renderer.domElement);
		}
		$.extend(inherit(Viewport, Particle).prototype, {
			resolve: function(dt) {
				if(dt) {
					Particle.prototype.resolve.call(this, dt);
					this.reposition();
				}

				return this;
			},
			resize: function() {
				/* Fit everything to the screen in question,
					maintaining aspect ratio */
				var width = this.$container.width(), height = this.$container.height(),
					aspect = width/height,
					rad = Math.radians(this.camera.fov/2),
					camSees = this.camera.position.z*Math.sin(rad)/
						Math.sin(rad+Math.PI/2)*2;

				// TODO: make this align with boundRect properly again
				this.camera.aspect = aspect;
				this.camera.updateProjectionMatrix();

				this.boundRect.size.copy((aspect >= 1)?
						new Vec2D(this.minRect.size.x*aspect, this.minRect.size.y)
					:	new Vec2D(this.minRect.size.x, this.minRect.size.y/aspect))
				.doScale(camSees/this.boundRect.size.y);

				/* DEBUG *//*
				if(this.plane) { this.scene.remove(this.plane); }

				this.plane = new THREE.Mesh(
					new THREE.PlaneGeometry(this.boundRect.size.x,
						this.boundRect.size.y),
					new THREE.MeshBasicMaterial({ color: 0xff0000,
						wireframe: true }));

				this.plane.position.x = this.boundRect.pos.x+this.boundRect.size.x/2;
				this.plane.position.y = this.boundRect.pos.y+this.boundRect.size.y/2;
				this.scene.add(this.plane);*/

				this.renderer.setSize(width, height);
				
				return this;
			},
			reposition: function() {
				var margin = this.boundRect.size.sub(this.minRect.size).doScale(0.5);	// Could be made a member to prevent repeated calculations, but it doesn't really belong there

				this.minRect.pos.copy(this.pos.sub(this.minRect.size.scale(0.5)));
				this.boundRect.pos.copy(this.minRect.pos.sub(margin));

				this.camera.position.x = this.pos.x;
				this.camera.position.y = this.pos.y;

				/* DEBUG *//*
				this.plane.position.x = this.boundRect.pos.x+this.boundRect.size.x/2;
				this.plane.position.y = this.boundRect.pos.y+this.boundRect.size.y/2;*/

				return this;
			},
			update: function() {
				var size = this.boundRect.size,
					to = this.springForce.posTo,
					factor = this.springForce.factor;
				
				if(this.lumens) {
					var envSize = this.lumens.boundRect.size,
						center = envSize.scale(0.5);

					this.springForce.posTo =
						new Vec2D(((size.x >= envSize.x)? center.x : to.x),
							((size.y >= envSize.y)? center.y : to.y));
				}

				this.springForce.factor /= this.camera.position.z;

				this.force.doAdd(Force.dampedSpring(this.springForce));
				this.springForce.posTo = to;
				this.springForce.factor = factor;

				/* TODO: wrap THREE.camera to achieve newtonian physics
					when springing back to camera's default z position */

				return this;
			},
			render: function() {
				this.renderer.clear();
				this.renderer.render(this.scene, this.camera);

				/* Should be managed asynchronously from here,
					as a web worker:
				if(this.running) {
					var viewport = this;
					requestAnimationFrame(function() {
						viewport.render();
					});
				} */

				this.renderDone.update();

				return this;
			},
			addEntity: function(entity) {
				if($.isArray(entity)) {
					for(var e = 0; e < entity.length; ++e) { this.add(entity[e]); }
				}
				else {
					this.scene.add(entity.shape.three);

					if(entity.light) { this.scene.add(entity.light.three); }
				}

				return this;
			},
			removeEntity: function(entity) {
				if($.isArray(entity)) {
					for(var e = 0; e < entity.length; ++e) { this.remove(entity[e]); }
				}
				else {
					this.scene.remove(entity.shape.three);
					this.renderer.deallocateObject(entity.shape.three);

					if(entity.light) {
						this.scene.remove(entity.light.three);
						this.renderer.deallocateObject(entity.light.three);
					}
				}

				return this;
			}

			/* When limiting this to within the edges of the environment, there
				may be cases when one of the environment's dimensions extends
				beyond that of the viewport - throw in something just to
				show you thought of it... */
		});
		Viewport.settings = {
			size: new Vec2D(720, 720), mass: 120,
			springForce: { pointFrom: null, posTo: null,
				factor: 0.9, restLength: 0, damping: 0.8 },
			zoomSpringForce: { pointFrom: null, posTo: null,
				factor: 0.9, restLength: 0, damping: 0.8 },
			camera: { position: { z: 1000 } }
		};
//	}
	
//	CONTROLLERS {
		function Controller(lumens) {
			this.lumens = lumens;

			this.events = {
				move: new Watchable(false),	// Vec2D between 0 and 1, or null
				aim: new Watchable(false),	// Unit Vec2D, or null
				attack: new Watchable(false),
				beam: new Watchable(false),
				repel: new Watchable(false),
				range: new Watchable(false),
				pause: new Watchable(false)
			};

			var viewport = this.lumens.viewport;
			$(self).on('resize', function(e) { viewport.resize.call(viewport, e); });
		}
		$.extend(Controller.prototype, {
			eventPos: function(e) {
				var $container = this.lumens.viewport.$container,
					offset = $container.offset();
				
				// NDC coordinates
				return new Vec2D(((e.pageX-offset.left)/$container.width())*2-1,
						-((e.pageY-offset.top)/$container.height())*2+1);
			}
		});
		// Factory method
		Controller.make = function(lumens) {
			return ((Modernizr.touch)?
				new TouchController(lumens) : new MKController(lumens));
		};

		// Mouse/keyboard
		function MKController(lumens) {
			Controller.call(this, lumens);
			
			this.mousePos = null;	// Vec2D or null - remember to draw a cursor here

			this.moveKey = {
				left: { input: new Vec2D(-1, 0), down: false },
				right: { input: new Vec2D(1, 0), down: false },
				up: { input: new Vec2D(0, 1), down: false },
				down: { input: new Vec2D(0, -1), down: false }
			};

			this.move = new Vec2D();	// Sum of all move key inputs

			// Bind events
			/* By default, any input acts on the game
				If other elements are on the page, then they must catch and
				stop propogation of events meant for them
				Pausing the game relinquishes global listening */
			$(document).off('.lumens').on(this.handlers.keyboard, { ctrl: this });
			this.lumens.viewport.$container.off('.lumens')
				.on(this.handlers.mouse, { ctrl: this });
		}
		$.extend(inherit(MKController, Controller).prototype, {
			handlers: {
				mouse: {
					'mousedown.lumens': function(e) { e.data.ctrl.events.attack.thing(true); },
					'mouseup.lumens': function(e) { e.data.ctrl.events.attack.thing(false); },
					'mousemove.lumens': function(e) {
						var ctrl = e.data.ctrl;
						ctrl.mousePos = ctrl.eventPos(e);
						ctrl.events.aim.thing(ctrl.mousePos.sub(ctrl.lumens.player.pos)
							.doUnit());
					},
					'mousewheel.transform DOMMouseScroll.transform': function(event) {
						/* Normalise the wheeldata - http://www.switchonthecode.com/tutorials/javascript-tutorial-the-scroll-wheel */
						var ctrl = event.data.ctrl,
							e = event.originalEvent,
							wheel = 1+(($.isNumeric(e.wheelDelta))?
								e.wheelDelta : -e.detail*40)*0.0006;

						ctrl.lumens.viewport.camera.position.z /= wheel;
						ctrl.lumens.viewport.resize();
					}
				},
				keyboard: {
					'keydown.lumens': function(e) {
						var ctrl = e.data.ctrl, caught = false;

						switch(e.which) {
						// left, a, j
						case 37: case 65/*: case 74*/:
							ctrl.startMove(ctrl.moveKey.left);
							caught = true;
						break;
						
						// right, d, l
						case 39: case 68/*: case 76*/:
							ctrl.startMove(ctrl.moveKey.right);
							caught = true;
						break;
						
						// up, w, i
						case 38: case 87/*: case 73*/:
							ctrl.startMove(ctrl.moveKey.up);
							caught = true;
						break;
						
						// down, s, k
						case 40: case 83/*: case 75*/:
							ctrl.startMove(ctrl.moveKey.down);
							caught = true;
						break;
						
						// space
						case 32:
							ctrl.events.attack.thing(true);
							caught = true;
						break;
						
						// x, m
						case 88: case 77:
							ctrl.events.beam.thing(true);
							caught = true;
						break;
						
						// c, n
						case 67: case 78:
							ctrl.events.repel.thing(true);
							caught = true;
						break;
						
						// v, b
						case 86: case 66:
							ctrl.events.range.thing(true);
							caught = true;
						break;
						
						default: break;
						}

						return !caught;
					},
					'keyup.lumens': function(e) {
						var ctrl = e.data.ctrl, caught = false;

						switch(e.which) {
						// left, a, j
						case 37: case 65/*: case 74*/:
							ctrl.endMove(ctrl.moveKey.left);
							caught = true;
						break;
						
						// right, d, l
						case 39: case 68/*: case 76*/:
							ctrl.endMove(ctrl.moveKey.right);
							caught = true;
						break;
						
						// up, w, i
						case 38: case 87/*: case 73*/:
							ctrl.endMove(ctrl.moveKey.up);
							caught = true;
						break;
						
						// down, s, k
						case 40: case 83/*: case 75*/:
							ctrl.endMove(ctrl.moveKey.down);
							caught = true;
						break;
						
						// space
						case 32:
							ctrl.events.attack.thing(false);
							caught = true;
						break;
						
						// x, m
						case 88: case 77:
							ctrl.events.beam.thing(false);
							caught = true;
						break;
						
						// c, n
						case 67: case 78:
							ctrl.events.repel.thing(false);
							caught = true;
						break;
						
						// v, b
						case 86: case 66:
							ctrl.events.range.thing(false);
							caught = true;
						break;
						
						// p, enter
						case 80: case 13:
							ctrl.events.pause.thing(!ctrl.events.pause.thing());
							caught = true;
						break;
						
						default: break;
						}

						return !caught;
					}
				}
			},
			startMove: function(key) {
				if(key.down) { return false; }
				else {
					this.events.move.thing((this.move.doAdd(key.input).magSq())?
							this.move.unit() : null);

					key.down = true;

					return true;
				}
			},
			endMove: function(key) {
				if(key.down) {
					this.events.move.thing((this.move.doSub(key.input).magSq())?
							this.move.unit() : null);

					key.down = false;

					return true;
				}
				else { return false; }
			}
		});

		function TouchController(lumens) {
			Controller.call(this, lumens);
			
			this.move = new Thumbstick(50);
			this.aim = new Thumbstick(50, true);

			this.bindings = [];	// { touch, event }

			// Bind events
			this.lumens.viewport.$container.off('.lumens')
				.on(this.handlers, { ctrl: this });
		}
		$.extend(inherit(TouchController, Controller).prototype, {
			handlers: {
				'touchstart.lumens': function(event) {
					/* Prevents scrolling */
					event.preventDefault();
					
					/* jQuery normalises (and alters) event properties (http://stackoverflow.com/questions/3183872/does-jquery-preserve-touch-events-properties),
						so we need to work with the original to access the touches arrays */
					var e = event.originalEvent, ctrl = event.data.ctrl;
					
					for(var t = 0; t < e.changedTouches.length; ++t) {
						var touch = e.changedTouches[t],
							touchPos = ctrl.eventPos(touch);

						if(touchPos.distSq(ctrl.lumens.player.pos) <
						ctrl.lumens.player.shape.boundRad.radSq) {
							ctrl.events.pause.thing(!ctrl.events.pause.thing());
						}

						// Place thumbsticks
						else if(!ctrl.move.input) {
							ctrl.move.place(touchPos);
							ctrl.bindings.push({ touch: touch,
								event: ctrl.events.move });
						}
						else if(!ctrl.aim.input) {
							ctrl.aim.place(touchPos);
							ctrl.bindings.push({ touch: touch,
								event: ctrl.events.aim });
						}

						// Activate enhanced modes
						else if(!ctrl.events.range.thing() &&
						!ctrl.events.repel.thing()) {
							var moveDistSq = touchPos.distSq(ctrl.move.boundRad.pos),
								aimDistSq = touchPos.distSq(ctrl.aim.boundRad.pos);
							
							if(moveDistSq < aimDistSq) {
								ctrl.bindings.push({ touch: touch,
									event: ctrl.events.range.thing(true) });
							}
							else {
								ctrl.bindings.push({ touch: touch,
									event: ctrl.events.repel.thing(true) });
							}
						}
						else if(!ctrl.events.beam.thing()) {
							// 4th finger down - disable existing, enable beam
							var b = ctrl.bindingWithEvent((ctrl.events.range.thing())?
										ctrl.events.range : ctrl.events.repel);

							ctrl.bindings.splice(ctrl.bindings.indexOf(b.thing(false)), 1,
								{ touch: touch, event: ctrl.events.beam.thing(true) });
						}
					}
				},
				'touchmove.lumens': function(event) {
					event.preventDefault();
					
					var e = event.originalEvent, ctrl = event.data.ctrl;
					
					for(var t = 0; t < e.changedTouches.length; ++t) {
						var touch = e.changedTouches[t],
							binding = ctrl.bindingWithTouch(touch);
						
						if(binding) {
							if(binding.event === ctrl.events.move) {
								ctrl.events.move.thing(
									ctrl.move.move(ctrl.eventPos(touch)).vector());
							}
							else if(binding.event === ctrl.events.aim) {
								ctrl.events.aim.thing(
									ctrl.aim.move(ctrl.eventPos(touch)).angle());
								
								// Only fire when at edge of thumbstick radius
								if(ctrl.aim.vector().magSq() ===
								ctrl.aim.boundRad.rad*ctrl.aim.boundRad.rad) {
									ctrl.events.attack.thing(true);
								}
							}
						}
					}
				},
				'touchend.lumens': function(event) {
					event.preventDefault();
					
					var e = event.originalEvent, ctrl = event.data.ctrl;

					for(var t = 0; t < e.changedTouches.length; ++t) {
						var touch = e.changedTouches[t],
							binding = ctrl.bindingWithTouch(touch);
						
						if(binding) {
							if(binding.event === ctrl.events.move) {
								ctrl.move.lift();
								ctrl.events.move.thing(false);
								ctrl.bindings.splice(ctrl.bindings.indexOf(binding), 1);
							}
							else if(binding.event === ctrl.events.aim) {
								ctrl.aim.lift();
								ctrl.events.aim.thing(false);
								ctrl.events.attack.thing(false);
								ctrl.bindings.splice(ctrl.bindings.indexOf(binding), 1);
							}
						}
					}
				},
				'gesturechange': function(event) {
					/* TODO: find a way to perform zoom gestures without confusing
						them for normal movement - at edge of the screen? */
					/*var ctrl = event.data.ctrl,
						e = event.originalEvent;

					ctrl.lumens.viewport.camera.position.z *= event.scale;*/
				}
			},
			bindingWithTouch: function(touch) {
				for(var b = 0; b < this.bindings.length; ++b) {
					var binding = this.bindings[b];
					if(binding.touch.identifier == touch.identifier) {
						return binding;
					}
				}
			},
			bindingWithEvent: function(event) {
				for(var b = 0; b < this.bindings.length; ++b) {
					var binding = this.bindings[b], e = this.events[event];
					if(binding.event == e) { return binding; }
				}
			}
		});
//	}

//	NETWORK {
		Network = {
			loadWalls: function(JSON) {
				var walls = [];

				for(var w = 0; w < JSON.length; ++w) {
					walls.push(Network.loadWall(JSON[w]));
				}

				/* TODO: call THREE.GeometryUtils.merge() to improve
					rendering performance for the static walls - need
					to change collision code to deal with "one" wall */

				return walls;
			},
			loadWall: function(JSON) {
				var geometry = new THREE.Geometry();

				for(var p = -1; p < JSON.points.length; ++p) {
					var point = JSON.points.wrap(p);

					// TODO: finish this...
					geometry.vertices.push(new THREE.Vertex(
						new THREE.Vector3(point.x, point.y, 0)));
				}

				var line = new THREE.Line(geometry,
						new THREE.LineBasicMaterial({ color: 0xffffff,
							opacity: 1, linewidth: 3 })),
					shape = new Shape({
							three: line,
							owner: new Particle({ pos: new Vec2D().copy(JSON.position) })
						});

				line.matrixAutoUpdate = false;
				line.updateMatrix();

				return shape;
			}
		};
//	}

//	MAIN {
		/* Manages the application, and represents the environment
			(for convenience) */
		function Lumens(options) {
			var settings = $.extend(true, {}, Lumens.settings, options);

			this.boundRect = new AARect(null, settings.size);
			this.toroid = (settings.toroid || false);

			this.walls = new QuadTree(this.boundRect.copy(), 5, 8, settings.walls,
				function(wall) { return wall.treeItem; });
			this.swarm = new QuadTree(this.boundRect.copy(), 5, 8, settings.swarm,
				function(predator) { return predator.treeItem; });
			
			this.player = new Firefly({ pos: this.boundRect.size.scale(0.5) });

			this.viewport = new Viewport($.extend({
				springForce: { posTo: this.player.pos },
				lumens: this, pos: this.player.pos.copy() }, settings.viewport));
			

			this.plane = new THREE.Mesh(
				new THREE.PlaneGeometry(this.boundRect.size.x,
					this.boundRect.size.y),
				new THREE.MeshBasicMaterial({ color: 0x000000,
					wireframe: true }));

			this.plane.position.x = this.boundRect.size.x/2;
			this.plane.position.y = this.boundRect.size.y/2;
			this.viewport.scene.add(this.plane);

			for(var w = 0; w < this.walls.source.length; ++w) {
				this.viewport.scene.add(this.walls.source[w].three);
			}

			this.viewport.addEntity(this.player);
			
			for(var p = 0; p < settings.predators.num; ++p) {
				this.addPredator();
			}

			this.controller = Controller.make(this);

			this.controller.events.move.watch(invoke, this.player, this.player.move);
			this.controller.events.aim.watch(invoke, this.player, this.player.aim);
			this.controller.events.attack.watch(invoke, this.player, this.player.attack);
			this.controller.events.beam.watch(invoke, this.player, this.player.beam);
			this.controller.events.repel.watch(invoke, this.player, this.player.repel);
			this.controller.events.range.watch(invoke, this.player, this.player.range);

			this.controller.events.pause.watch(invoke, this, this.pause);
			
			/* If rendering is to be done asynchronously
			this.viewport.renderDone.watch((function() {  }).call, this); */

			this.time = Date.now();
			this.state = Lumens.states.running;

			var lumens = this;

			requestAnimationFrame(function() { lumens.step(); });
		}
		$.extend(Lumens.prototype, {
			step: function() {
				/* TODO: alternating schedule for entity updates/resolutions
					depending on whether or not they're within a given area
					(viewport visible area maybe) */
				var lumens = this,
					currentTime = Date.now(), dt = currentTime-this.time;
				
				this.time = currentTime;

				this.viewport.resolve(dt);
				Collision.Viewport.checkLumens(this.viewport, this);
				this.viewport.update();

				if(this.state === Lumens.states.running) {
					/* Clear the Quadtrees */
					this.swarm.clear();
					
					/* Resolve everything and populate Quadtrees */
					for(var r = 0; r < this.swarm.source.length; ++r) {
						this.swarm.put(this.swarm.source[r]
							.resolve(dt).treeItem);
					}

					this.player.resolve(dt);

					/* Update everything:
						collision resolution, force accumulation,
						anything querying the Quadtrees */
					for(var u = 0; u < this.swarm.source.length; ++u) {
						var uE = this.swarm.source[u], uTI = uE.treeItem;
						
						if(Collision.Entity.check(uE, { swarm: this.swarm,
								player: this.player, walls: this.walls,
								lumens: this }, dt).length) {
							// Get the new tree item
							this.swarm.clear(uTI).put(uE.treeItem);
						}

						uE.update(dt);
					}
					
					Collision.Entity.check(this.player, { swarm: this.swarm,
						walls: this.walls, lumens: this }, dt);

					this.player.update(dt);
				}

				/* Render */
				/* Should be done asynchronously, through web workers:
				// Render called in viewport
				if(this.running) {
					setTimeout(this.step.call, 1000/60, this);
				} */

				this.viewport.render();

				requestAnimationFrame(function() { lumens.step(); });

				return this;
			},
			pause: function(paused) {
				if(this.state != Lumens.states.fin) {
					this.state = Lumens.states[((paused)? 'paused' : 'running')];
				}

				return this;
			},
			addPredator: function() {
				var angle = Math.random()*2*Math.PI,
					settings = Predator.settings,
					predator = new Predator({
							swarm: { swarm: this.swarm,
								schedule: { last: Math.random()*
									settings.swarm.schedule.wait } },
							wander: { schedule: { last: Math.random()*
									settings.wander.schedule.wait } },
							avoid: { walls: this.walls, lumens: this,
								schedule: { last: Math.random()*
									settings.avoid.schedule.wait } },
							pos: new Vec2D(Math.random()*this.boundRect.size.x,
								Math.random()*this.boundRect.size.y),
							angle: new Vec2D(Math.cos(angle),
									Math.sin(angle))
						});
				
				this.swarm.add(predator);

				this.viewport.addEntity(predator);

				return this;
			},
			removePredator: function(predator) {
				this.swarm.source.splice(this.swarm.source.indexOf(predator), 1);
				// Trees get cleared anyway...

				this.viewport.removeEntity(predator);

				return this;
			},
			generate: function() {
				this.constructor($.extend(true, {
					size: new Vec2D(Lumens.settings.size.x+Lumens.settings.size.x*
							Math.random()*Lumens.settings.sizeRange.x,
						Lumens.settings.size.y+Lumens.settings.size.y*
							Math.random()*Lumens.settings.sizeRange.y)
				}));
				
				return this;
			}
		});
		$.extend(Lumens, {
			/*instance: function() {
				return((!Lumens.singleton)? Lumens.singleton : new Lumens());
			},
			singleton: null,*/
			settings: {
				size: new Vec2D(720, 720), sizeRange: new Vec2D(3, 3),
				predators: { num: 0 }
			},
			states: new Enum('running', 'paused', 'fin')
		});
//	}
	
//	DEBUG {
		self.generateTestEnvironment = function(num, rad, random) {
			var str = "";
			Circle.generateVecs(num, rad, function(v) {
				str = '{ "x": '+(v.x+Math.random()*random)+
						', "y": '+(v.y+Math.random()*random)+' },\n'+str;
			});
			return str;
		};

		/* GUI for testing */
		function addGUI(lumens) {
			var load = {},
				gui = new dat.GUI({ load: load, preset: 'Lumens' });

			self.lumens = lumens;

			var stats = new Stats(), statsBox = stats.getDomElement();

			$.extend(statsBox.style, { position: 'absolute',
				left: '0px', top: '0px' });

			$("#main").after(statsBox);

			setTimeout(function(t) { stats.update(); setTimeout(arguments.callee, t); },
				1000/60);

			var predatorFolder = gui.addFolder("Predators"),
				viewportFolder = gui.addFolder("Viewport"),
				environmentFolder = gui.addFolder("Environment");

			var predSett = { num: lumens.swarm.source.length };

			gui.remember(predSett);

			predatorFolder.add(predSett, "num", 0, 2000).listen()
			.onChange(function(num) {
				predSett.num = num |= 0;

				while(num < lumens.swarm.source.length) {
					var i = (Math.random()*(lumens.swarm.source.length-1)) | 0;
					lumens.removePredator(lumens.swarm.source[i]);
				}
				while(num > lumens.swarm.source.length) { lumens.addPredator(); }
			});

			var AIFolder = predatorFolder.addFolder("AI");
			
			AIFolder.add(Predator.settings, "maxForce", 0, 1)
			.step(0.005).listen().onChange(function(maxForce) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].maxForce = maxForce;
				}
			});

			var swarmFolder = AIFolder.addFolder("swarm"),
				wanderFolder = AIFolder.addFolder("wander"),
				avoidFolder = AIFolder.addFolder("avoid");

			function setWeight(weight, influence) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarm.weight[influence] = weight;
				}
			}

			gui.remember(Predator.settings);
			gui.remember(Predator.settings.swarm);
			gui.remember(Predator.settings.swarm.weight);

			swarmFolder.add(Predator.settings.swarm.weight, "separation",
			0, 1).step(0.001).listen().onChange(function(weight) {
				setWeight(weight, "separation");
			});
			swarmFolder.add(Predator.settings.swarm.weight, "cohesion",
			0, 0.1).step(0.001).listen().onChange(function(weight) {
				setWeight(weight, "cohesion");
			});
			swarmFolder.add(Predator.settings.swarm.weight, "alignment",
			0, 1).step(0.001).listen().onChange(function(weight) {
				setWeight(weight, "alignment");
			});

			swarmFolder.add(Predator.settings.swarm, "predict",
			0, 5).step(0.001).listen().onChange(function(predict) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarm.predict = predict;
				}
			});
			swarmFolder.add(Predator.settings.swarm, "nearbyRad", 0, 1000)
			.step(0.05).listen().onChange(function(rad) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarm.nearbyRad = rad;
				}
			});
			swarmFolder.add(Predator.settings.swarm.schedule, "wait", 0, 1000)
			.step(0.05).listen().onChange(function(w) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarm.schedule.wait = w;
				}
			});

			gui.remember(Predator.settings.wander);

			wanderFolder.add(Predator.settings.wander, "weight", 0, 10).step(0.001)
			.onChange(function(weight) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].wander.weight = weight;
				}
			});
			wanderFolder.add(Predator.settings.wander, "minSpeed", 0, 10).step(0.001)
			.onChange(function(speed) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].wander.minSpeed = speed;
				}
			});
			wanderFolder.add(Predator.settings.wander.schedule, "wait", 0, 1000)
			.step(0.05).listen().onChange(function(w) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].wander.schedule.wait = w;
				}
			});
			
			gui.remember(Predator.settings.avoid);

			avoidFolder.add(Predator.settings.avoid, "weight", 0, 10).step(0.001)
			.onChange(function(weight) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].avoid.weight = weight;
				}
			});
			avoidFolder.add(Predator.settings.avoid, "radius", 0, 100).step(0.001)
			.onChange(function(radius) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].avoid.radius = radius;
				}
			});
			avoidFolder.add(Predator.settings.avoid.schedule, "wait", 0, 1000)
			.step(0.05).listen().onChange(function(w) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].avoid.schedule.wait = w;
				}
			});

			gui.remember(lumens.viewport);
			gui.remember(lumens.viewport.debug);
			gui.remember(lumens.viewport.springForce);

			viewportFolder.add(lumens.viewport.springForce, "damping", 0, 1).listen();
			viewportFolder.add(lumens.viewport.springForce, "factor", 0, 1).listen();
			viewportFolder.add(lumens.viewport, "invMass", 0.01, 1).listen();

			gui.remember(lumens);
			gui.remember(lumens.boundRect.size);

			environmentFolder.add(lumens.boundRect.size, "x").listen()
			.onChange(function(w) {
				lumens.viewport.scene.remove(lumens.plane);

				lumens.plane = new THREE.Mesh(
					new THREE.PlaneGeometry(w, lumens.boundRect.size.y),
					new THREE.MeshBasicMaterial({ color: 0x000000,
						wireframe: true }));

				lumens.plane.position.x = lumens.boundRect.size.x/2;
				lumens.plane.position.y = lumens.boundRect.size.y/2;
				lumens.viewport.scene.add(lumens.plane);
			});
			environmentFolder.add(lumens.boundRect.size, "y").listen()
			.onChange(function(h) {
				lumens.viewport.scene.remove(lumens.plane);

				lumens.plane = new THREE.Mesh(
					new THREE.PlaneGeometry(lumens.boundRect.size.x, h),
					new THREE.MeshBasicMaterial({ color: 0x000000,
						wireframe: true }));

				lumens.plane.position.x = lumens.boundRect.size.x/2;
				lumens.plane.position.y = lumens.boundRect.size.y/2;
				lumens.viewport.scene.add(lumens.plane);
			});
			environmentFolder.add(lumens, "toroid").listen();

			//gui.close();

			return gui;
		}
//	}

	$(function() {
		$.getJSON("js/test_environment_small.json", function(JSON) {
			var lumens = new Lumens({
				size: new Vec2D(3000, 2000),
				walls: Network.loadWalls(JSON),
				viewport: { container: '#main',
					settings: { trails: true, bounds: true } }
			});

			addGUI(lumens);
		});
	});
})(jQuery);