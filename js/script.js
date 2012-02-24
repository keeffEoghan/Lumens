/* Author: Eoghan O'Keeffe */

(function($) {
//	UTIL {
		/* Static wrapper for apply
			Maintains the this value no matter how many times it's passed around
			Useful for callbacks */
		function invoke(object, func, args) {
			func.apply(object, Array.prototype.slice.call(arguments, 2));
		}

		/* Adapted from John Resig's instanceOf - http://ejohn.org/blog/objectgetprototypeof/ */
		function instance(object, Class) {
			for(var prototype = Object.getPrototypeOf(object); prototype;
				prototype = Object.getPrototypeOf(prototype)) {
				if(prototype === Class.prototype) { return true; }
			}

			return false;
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
			rad: function(rad) {
				if(rad) {
					this.rad = rad;
					this.radSq = this.rad*this.rad;

					return this;
				}
				else { return this.rad; }
			},
			radSq: function(radSq) {
				if(radSq) {
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

		
		/* Conversion functions adapted from Michael Jackson's (really) - http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript */
		function Color(r, g, b, a) {
			this.r = (r || 0);
			this.g = (g || 0);
			this.b = (b || 0);
			this.a = (a || 1);
		}
		$.extend(Color.prototype, {
			fromHSLA: function(h, s, l, a) {
				h /= 359;
				s /= 100;
				l /= 100;

				this.a = a;

				if(s === 0) { this.r = this.g = this.b = l; }
				else {
					var hueToRGB = function(p, q, t) {
						if(t < 0) { ++t; }
						else if(t > 1) { --t; }
						
						return ((t < 1/6)? p+(q-p)*6*t
							:	((t < 1/2)? q
							:	((t < 2/3)? p+(q-p)*(2/3-t)*6
							:	p)));
					};

					var q = ((l < 0.5)? l*(1+s) : l+s-l*s);
					var p = 2*l-q;
					
					this.r = hueToRGB(p, q, h+1/3);
					this.g = hueToRGB(p, q, h);
					this.b = hueToRGB(p, q, h-1/3);
				}
				
				return this;
			},
			fromRGBA: function(r, g, b, a) {
				this.r = r/255; this.g = g/255; this.b = b/255; this.a = a;
				
				return this;
			},
			toRGBA: function() {
				return { r: (this.r*255) | 0, g: (this.g*255) | 0,
					b: (this.b*255) | 0, a: this.a };
			},
			toHSLA: function() {
				var max = Math.max(this.r, this.g, this.b),
					min = Math.min(this.r, this.g, this.b),
					h, s, l = (max+min)/2;

				if(max == min){
					h = s = 0; // achromatic
				}
				else {
					var d = max-min;
					
					s = ((l > 0.5) ? d/(2-max-min) : d/(max+min));
					
					switch(max){
						case this.r:
							h = (this.g-this.b)/d+((this.g < this.b)? 6 : 0);
						break;
						case this.g:
							h = (this.b-this.r)/d+2;
						break;
						case this.b:
							h = (this.r-this.g)/d+4;
						break;
					}
					h /= 6;
				}

				return { h: (h*360) | 0, s: (s*100) | 0, l: (l*100) | 0, a: this.a };
			},
			RGBAString: function() {
				var rgba = this.toRGBA();
				return "rgba("+rgba.r+", "+rgba.g+", "+rgba.b+", "+rgba.a+")";
			},
			HSLAString: function() {
				var hsla = this.toHSLA();
				return "hsla("+hsla.h+", "+hsla.s+", "+hsla.l+", "+hsla.a+")";
			}
		});
		$.extend(Color, {
			fromHSLA: function(h, s, l, a) {
				return (new Color()).fromHSLA(h, s, l, a);
			},
			fromRGBA: function(r, g, b, a) {
				return (new Color()).fromRGBA(r, g, b, a);
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

	//	COLLISIONS {
			// Convenience
			function Collision(self, other, normal, penetration, dt) {
				this.self = self;
				this.other = other;
				this.normal = (normal || new Vec2D());
				this.penetration = (penetration || 0);
				this.dt = (dt || 0);
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

					return this;
				}
			});
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
							var t = Math.pinToRange(-circle.rad,
									vec.dot(line.doScale(1/l)), l+circle.rad),

								closest = a.add(line.scale(t)),
								toCenter = circle.pos.sub(closest),
								lSq = toCenter.magSq();
							
							penSq = circle.radSq-lSq;
						}
						else { penSq = cirlce.radSq-vec.magSq(); }

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
							for(var walls = colliders.walls.get(treeItem), w = 0;
								w < walls.length; ++w) {
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
						// TODO: fine collision detection
						/* TODO: improve to check if shape intersects edges, not
							if some of it lies on the "inside" */
						var collision = null;

						if(other.boundRad.intersects(shape.boundRad)) {
							for(var p = 0; p < other.points.length; ++p) {
								var a = other.points.wrap(p-1).pos,
									b = other.points[p].pos,
									c = Collision.Circle.checkLine(shape.boundRad,
										a, b);

								if(c && (!collision ||
									c.penetration > collision.penetration)) {
									c.self = shape;
									c.other = other;
									collision = c;
								}
							}
						}

						return collision;
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
					// colliders: { QuadTree entities, Lumens lumens, QuadTree walls }
					check: function(entity, colliders, dt, callback, args) {
						var collisions = [], treeItem = entity.treeItem;

						// TODO: fine collision detection (shape)
						if(colliders.entities) {
							for(var nearby = colliders.entities.get(treeItem),
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

						if(lumens !== other && !lumens.boundRect.contains(other)) {
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
				/* Adapted from "How To Implement a Pressure Soft Body
					Model", by Maciej Matyka, using Gauss' theorem to obtain volume,
					and pressure from there - maq@panoramix.ift.uni.wroc.pl */
				/* A bit different to the others, in that it doesn't return a force to
					be applied to each point in turn, but rather applies it across
					all of the points in turn */
				applyPressure: function(points, factor) {
					// Derived used to prevent repeated calculations
					var volume = 0, derived = [];

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
						totalAlignment = new Vec2D(), swarmForce = new Vec2D(),
						
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
						swarmForce.doAdd(totalSeparation.doScale(options.weight.separation))
							.doAdd(totalCohesion.doScale(options.weight.cohesion))
							.doAdd(totalAlignment.doScale(options.weight.alignment))
							.doScale(1/num);
					}
					
					return swarmForce;
				},
				// { Particle point, QuadTree walls, Number radius, Number predict }
				avoidWalls: function(options) {
					var force = new Vec2D(),
						predict = (options.predict || 0),
						focus = new Circle(options.point.vel.scale(predict)
								.doAdd(options.point.pos), options.radius);

					for(var w = 0, nearby = options.walls.get(focus.containingAARect());
						w < nearby.length; ++w) {
						var wall = nearby[w].item;

						if(wall.boundRad.intersects(focus)) {
							for(var p = 0; p < wall.points.length; ++p) {
								var a = wall.points.wrap(p-1).pos,
									b = wall.points[p].pos,
									c = Collision.Circle.checkLine(focus, a, b);

								if(c) {
									force.doAdd(c.normal
										.doScale(c.penetration*c.penetration));
								}
							}
						}
					}

					return force;
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
				}
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


		// Pointlight
		function Light(options) {
			if(!options) { options = {}; }
			
			Circle.call(this, (options.pos || new Vec2D()), (options.rad || 5));
			this.color = (options.color || Color.fromRGBA(255, 255, 255, 1));
		}
		$.extend(inherit(Light, Circle).prototype, {
			render: function(context) {
				if(this.rad) {
					context.save();

					var color = this.color.RGBAString(), falloff = 8,
						gradient = context.createRadialGradient(this.pos.x,
								this.pos.y, this.rad-falloff,
								this.pos.x, this.pos.y, this.rad);
					
					gradient.addColorStop(0, color);
					gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
					context.fillStyle = gradient;
					
					context.beginPath();
					context.arc(this.pos.x, this.pos.y, this.rad, 0, Math.PI*2);
					context.fill();

					context.restore();
				}

				return this;
			}
		});


		function Spotlight(options) {
			if(!options) { options = {}; }
			
			Light.call(this, options);

			this.target = (options.target || new Vec2D());
		}
		$.extend(inherit(Spotlight, Light).prototype, {
			render: function(context) {
				/* TODO: WebGL - render from pos point to circle with
					center target and radius rad */
				return this;
			}
		});


	//	SHAPES {
			// No orientation - just position (bound to particle)
			function Shape(options) {
				if(!options) { options = {}; }
				
				this.owner = (options.owner || new Particle());

				this.points = (($.isArray(options.points))? options.points : []);	// All the points contained in this shape - positions relative to owner.pos
				
				/* Visual information goes in here
					TODO: patterns, images, etc */
				this.color = (options.color || Color.fromRGBA(200, 200, 200, 0.99));

				this.closed = ((options.closed !== undefined)? options.closed : true);
				this.filled = ((options.filled !== undefined)? options.filled : true);
				
				this.boundRad = new Circle();
				this.treeItem = null;
				this.updateBounds();
			}
			$.extend(Shape.prototype, {
				update: function() { return this; },
				resolve: function(dt) {
					/* For positions not relative to owner.pos *//*
					var last = this.owner.trail[0];

					if(last && !this.owner.pos.equals(last)) {
						var move = this.owner.pos.sub(last);

						for(var p = 0; p < this.points.length; ++p) {
							this.points[p].updateTrail(dt).pos.doAdd(move);
						}
					}*/
					
					this.updateBounds();

					return this;
				},
				updateBounds: function() {
					this.boundRad.radSq = this.boundRad.rad = 0;
					this.boundRad.pos.doZero();

					var l = this.points.length;
					
					if(l) {
						for(var i = 0; i < l; ++i) {
							this.boundRad.pos.doAdd(this.globPos(this.points[i].pos));
						}
						this.boundRad.pos.doScale(1/l);
						
						for(var j = 0; j < l; ++j) {
							var radSq = this.boundRad.pos
								.distSq(this.globPos(this.points[j].pos));
							
							if(radSq > this.boundRad.radSq) {
								this.boundRad.radSq = radSq;
							}
						}
						
						this.boundRad.rad = Math.sqrt(this.boundRad.radSq);
					}

					this.treeItem = this.boundRad.containingAARect();
					this.treeItem.item = this;
					
					return this;
				},
				render: function(context) {
					var color = this.color.RGBAString(),
						pos = this.globPos(this.points[0].pos),
						l = ((this.closed)?
							this.points.length+1 : this.points.length);

					context.save();
					context.strokeStyle = context.fillStyle = color;
					context.beginPath();
					context.moveTo(pos.x, pos.y);

					for(var p = 1; p < l; ++p) {
						pos = this.globPos(this.points.wrap(p).pos);
						context.lineTo(pos.x, pos.y);
					}

					context[((this.filled)? 'fill' : 'stroke')]();
					context.restore();

					return this;
				},
				relPos: function(globPos) { return globPos.sub(this.owner.pos); },
				globPos: function(relPos) { return this.owner.pos.add(relPos); }
			});

			
			function SoftShape(options) {
				if(!options) { options = {}; }

				/* Call super constructor */
				Shape.call(this, options);

				/* [{ Particle pointFrom, Vec2D posFrom, Particle pointTo, Vec2D posTo, Number factor, Number restLength }] */
				this.edges = (($.isArray(options.edges))? options.edges : []);	// The edge of the shape - may be repeated
				this.ties = (($.isArray(options.ties))? options.ties : []);	// Other ties, such as to cenetMass - may be repeated, usually one-to-one between each point and owner

				this.pressureFactor = (options.pressureFactor || 0.005);
			}
			$.extend(inherit(SoftShape, Shape).prototype, {
				update: function() {
					for(var e = 0; e < this.edges.length; ++e) {
						var edge = this.edges[e];
						edge.pointFrom.force.doAdd(Force.spring(edge));
					}

					for(var t = 0; t < this.ties.length; ++t) {
						var tie = this.ties[t];
						tie.pointFrom.force.doAdd(Force.spring(tie));
					}

					Force.applyPressure(this.points, this.pressureFactor);

					return this;
				},
				resolve: function(dt) {
					/*for(var p = 0; p < this.points.length; ++p) {
						this.points[p].resolve(dt);
					}*/
					// Offset from relative center
					var last = this.owner.trail[0],
						resolve;

					if(last && !this.owner.pos.equals(last)) {
						var moveRel = this.owner.pos.sub(last);

						resolve = function(point) {
							point.pos.doSub(moveRel);
							point.resolve(dt);
						};
					}
					else { resolve = function(point) { point.resolve(dt); }; }

					for(var p = 0; p < this.points.length; ++p) {
						resolve(this.points[p]);
					}
					
					this.updateBounds();

					return this;
				},
				render: function(context) {
					/* Probable problem with the way this is done - quadratic curve
						may go beyond the bounding radius */
					if(this.points.length >= 2) {
						var color = this.color.RGBAString(),
							falloff = 0.99,
							pos = this.globPos(this.points[0].pos),
							last = null, ctrlP = null,
							l = ((this.closed)?
								this.points.length+1 : this.points.length);

						context.save();
						context.strokeStyle = context.fillStyle = color;
						context.beginPath();
						context.moveTo(pos.x, pos.y);

						for(var p = 1; p < l; ++p) {
							last = pos;
							pos = this.globPos(this.points.wrap(p).pos);
							ctrlP = last.add(pos.sub(last).doScale(falloff));
							context.quadraticCurveTo(ctrlP.x, ctrlP.y,
								pos.x, pos.y);
						}

						context[((this.filled)? 'fill' : 'stroke')]();
						context.restore();
					}

					return this;
				},
				setupSurface: function(points, edgeSpringFactor, tieSpringFactor) {
					var relCenter = new Vec2D();

					this.edges.length = this.ties.length = 0;
					this.points = points.slice(0);

					for(var p = 0; p < points.length; ++p) {
						var point = points[p];

						this.ties.push({ pointFrom: point, posFrom: point.pos,
							posTo: relCenter, factor: edgeSpringFactor,
							restLength: point.pos.mag() });
						
						for(var loop = 0, offset = -1; loop < 2;
							++loop, offset *= -1) {
							var other = points.wrap(p+offset);
							
							this.edges.push({ pointFrom: point, posFrom: point.pos,
								pointTo: other, posTo: other.pos,
								factor: tieSpringFactor,
								restLength: point.pos.dist(other.pos) });
						}
					}

					return this.updateBounds();
				}
			});
			

			// Orientation and position (bound to body)
			function BodyShape(options) {
				if(!options) { options = {}; }
				
				/* Call super constructor
					Note: this expects a body as owner, not a particle */
				Shape.call(this, options);
			}
			$.extend(inherit(BodyShape, Shape).prototype);
			

			function SoftBodyShape(options) {
				if(!options) { options = {}; }
				
				BodyShape.call(this, options);
			}
			$.extend(inherit(SoftBodyShape, BodyShape).prototype);
	//	}
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
			update: function() {
				this.shape.update();

				return this;
			},
			resolve: function(dt) {
				if(dt) {
					this.Type.prototype.resolve.call(this, dt);
					this.shape.resolve(dt);
					this.updateTreeItem();
				}
				
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
			
			/* Set up the shape */
			/* TODO: change to BodyShape */
			var points = [], num = 10, mass = settings.mass/num;
			Circle.generateVecs(10, 15, invoke, this, function(pos) {
				points.push(new Particle({ pos: pos, mass: mass }));
			});

			/*this.shape = (new SoftShape({ owner: this,
					color: Color.fromRGBA(200, 200, 200, 0.7) })
				.setupSurface(points, 0.0001, 0.001));*/

			this.shape = new Shape({ owner: this, points: points,
					color: Color.fromRGBA(200, 200, 200, 0.7) });
			
			settings.light.pos = this.pos;
			this.light = new Light(settings.light);
			
			this.inputForce = null;

			this.updateTreeItem();
		}
		$.extend(inherit(Firefly, Entity.inherit(Particle)).prototype, {
			resolve: function(dt) {
				if(dt) {
					if(this.inputForce) { this.force.doAdd(this.inputForce); }
					Entity.prototype.resolve.call(this, dt);
				}

				return this;
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
			var settings = $.extend(true, {}, Predator.settings, options);
			
			/* Particle entity template */
			/* TODO: change to Body */
			Entity.call(this, Particle, settings);
			
			/* Set up the shape */
			/* TODO: change to BodyShape */
			var points = [], num = 8, mass = settings.mass/num;
			Circle.generateVecs(num, 7, invoke, this, function(pos) {
				points.push(new Particle({ pos: pos, mass: mass }));
			});

			this.shape = (new Shape({ owner: this, points: points,
					color: Color.fromRGBA(250, 200, 200, 0.7) }));
				//.setupSurface(points, 0.008);

			this.wanderForce = settings.wanderForce;
			
			settings.swarmForce.member = settings.avoidForce.point = this;
			this.swarmForce = settings.swarmForce;
			this.avoidForce = settings.avoidForce;
			
			this.state = Predator.states.spawn;

			this.updateTreeItem();
		}
		$.extend(inherit(Predator, Entity.inherit(Particle)).prototype, {
			update: function() {
				switch(this.state) {
				case Predator.states.passive: case Predator.states.aggressive:
				case Predator.states.normal:
					if(this.vel.magSq()) {
						this.wanderForce.vel.copy(this.vel.unit()
							.doScale(this.wanderForce.minSpeed));
					}
					else {
						var angle = Math.random()*2*Math.PI;
						this.wanderForce.vel.copy(new Vec2D(Math.cos(angle),
							Math.sin(angle))).doScale(this.wanderForce.minSpeed);
					}

					var swarmWeight = this.swarmForce.weight,
						swarmWeights = swarmWeight.separation+swarmWeight.cohesion+
							swarmWeight.alignment,
						wanderWeight = this.wanderForce.weight,
						avoidWeight = this.avoidForce.weight,
						sumWeights = swarmWeights+wanderWeight+avoidWeight,

						swarm = Force.swarm(this.swarmForce),
						wander = Force.wander(this.wanderForce)
							.doScale(wanderWeight),
						avoid = Force.avoidWalls($.extend({}, this.avoidForce,
							{ radius: this.shape.boundRad.rad+this.avoidForce.radius }));
					
					this.force.doAdd(swarm.doPinToRange(0,
							swarmWeights/sumWeights*this.maxForce))
						.doAdd(wander.doPinToRange(0,
							wanderWeight/sumWeights*this.maxForce))
						.doAdd(avoid.doPinToRange(0,
							avoidWeight/sumWeights*this.maxForce));
				break;
				
				default:
				break;
				}
				
				return Entity.prototype.update.call(this);
			}
		});
		$.extend(Predator, {
			states: $.extend({}, Entity.states,
				new Enum("passive", "aggressive", "feeding", "stunned")),
			settings: {
				mass: 6,
				swarmForce: {
					swarm: null, nearbyRad: 90, predict: 0.6,
					weight: { separation: 0.501,
						cohesion: 0.021, alignment: 0.414 }
				},
				wanderForce: { vel: new Vec2D(), range: 0.6,
					minSpeed: 0.8, weight: 1.501 },
				avoidForce: { point: null, walls: null, radius: 70,
					predict: 0.8, weight: 0.5 },
				maxForce: 0.006
			}
		});
//	}

//	ENVIRONMENT {
		function Wall(points, color) {
			Shape.call(this, { points: (points || []),
				color: (color || new Color(0, 0.5, 1, 0.1)) });
		}
		inherit(Wall, Shape);
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

			// TODO: replace with a Vec3D position (change z to zoom in/out)
			this.zoomFactor = (settings.zoomFactor || 1);

			this.walls = new QuadTree(this.boundRect.copy(), 5, 4,
					settings.walls, function(wall) { return wall.treeItem; });

			this.shapes = new QuadTree(this.boundRect.copy(), 5, 8);
			
			this.$canvas = $(settings.canvas);
			this.canvas = this.$canvas[0];
			this.context = this.canvas.getContext('2d');

			settings.springForce.pointFrom = this;
			this.springForce = settings.springForce;

			this.restitution = (settings.restitution || 0.75);
			
			this.lumens = (settings.lumens || null);
			// TODO: change all to trees
			this.lights = (settings.lights || []);
			this.glows = (settings.glows || []);

			this.debug = $.extend(true, {
				bounds: false,
				trails: false,
				health: false,
				states: false,
				tree: false,
				normals: false
			}, settings.debug);

			this.debugColor = (settings.debugColor || new Color(0, 1, 0.3, 0.7));

			this.renderDone = new Watchable();
			//this.running = true;

			/* In a render cycle, first update is called to clear and resize
				the canvas, then the render-lists are populated, followed by a
				call to render, which calls clear at the end */

			this.resize().reposition();
		}
		$.extend(inherit(Viewport, Particle).prototype, {
			resolve: function(dt) {
				if(dt) {
					Particle.prototype.resolve.call(this, dt);
					this.resize();
					this.reposition();
				}

				return this;
			},
			resize: function() {
				/* Fit everything to the screen in question,
					maintaining aspect ratio */
				var width = this.$canvas.width(), height = this.$canvas.height(),
					aspect = width/height, zoom = 1/this.zoomFactor;

				this.boundRect.size.copy(((aspect >= 1)?
						new Vec2D(this.minRect.size.x*aspect, this.minRect.size.y)
					:	new Vec2D(this.minRect.size.x, this.minRect.size.y/aspect))
					.doScale(zoom));

				return this;
			},
			reposition: function() {
				var margin = this.boundRect.size.sub(this.minRect.size).doScale(0.5);	// Could be made a member to prevent repeated calculations, but it doesn't really belong there

				this.minRect.pos.copy(this.pos.sub(this.minRect.size.scale(0.5)));
				this.boundRect.pos.copy(this.minRect.pos.sub(margin));

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

				this.springForce.factor *= this.zoomFactor;

				this.force.doAdd(Force.dampedSpring(this.springForce));
				this.springForce.posTo = to;
				this.springForce.factor = factor;

				return this;
			},
			setup: function() {
				this.canvas.width = this.boundRect.size.x*this.zoomFactor;
				this.canvas.height = this.boundRect.size.y*this.zoomFactor;
				
				/* Position of minRect is centered in the canvas - have to think
					about this, the reverse of the direction you'd expect */
				this.context.scale(this.zoomFactor, this.zoomFactor);
				this.context.translate(-this.boundRect.pos.x, -this.boundRect.pos.y);

				// TODO: all trees
				this.lights.length = this.glows.length = 0;
				this.walls.clear();
				this.shapes.clear(true);

				this.walls.constructor(this.boundRect.copy(),
					this.walls.root.maxDepth, this.walls.root.maxKids,
					this.walls.source, function(wall) { return wall.treeItem; });
				this.shapes.constructor(this.boundRect.copy(),
					this.shapes.root.maxDepth, this.shapes.root.maxKids);

				return this;
			},
			add: function(entity) {
				if($.isArray(entity)) {
					for(var e = 0; e < entity.length; ++e) { this.add(entity[e]); }
				}
				else {
					var shapeTreeItem = entity.shape.treeItem;

					if(this.boundRect.intersects(shapeTreeItem)) {
						this.shapes.add(entity.shape).put(shapeTreeItem);
					}
					// TODO: change all to trees
					if(entity.glow && this.boundRect
						.intersects(entity.glow.containingAARect())) {
						this.glows.push(entity.glow);
					}
					if(entity.light && this.boundRect
						.intersects(entity.light.containingAARect())) {
						this.lights.push(entity.light);
					}
				}

				return this;
			},
			render: function() {
				this.context.save();

				/* Lit areas */
				var litBodies = [];

				this.context.globalCompositeOperation = 'source-over';

				for(var l = 0; l < this.lights.length; ++l) {
					var light = this.lights[l],
						lit = ((this.shapes)?
							this.shapes.get(light.containingAARect()) : null);
					
					if(lit) {
						for(var lT = 0; lT < lit.length; ++lT) {
							var litBody = lit[lT].item;

							if(litBody.boundRad.intersects(light)) {
								litBodies.push(litBody);
							}
						}
					}

					light.render(this.context);
				}

				/* Bodies - only drawn in the light */
				this.context.globalCompositeOperation = 'source-atop';

				for(var lB = 0; lB < litBodies.length; ++lB) {
					litBodies[lB].render(this.context);
				}

				// TODO: all trees
				/* Glowing cores - drawn everywhere */
				this.context.globalCompositeOperation = 'destination-over';

				for(var g = 0; g < this.glows.length; ++g) {
					this.glows[g].render(this.context);
				}

				this.context.globalCompositeOperation = 'source-over';
				var visibleWalls = this.walls.get(this.boundRect);
				for(var w = 0; w < visibleWalls.length; ++w) {
					visibleWalls[w].item.render(this.context);
				}

				if(this.lumens) {
					this.context.globalCompositeOperation = 'destination-atop';
					this.lumens.render(this.context);
				}

				this.renderDebug();

				this.context.restore();

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
			renderDebug: function() {
				this.context.save();
				this.context.globalCompositeOperation = 'source-over';
				this.context.strokeStyle = this.debugColor.RGBAString();

				var renderFuncs = [];

				if(this.debug.bounds) { renderFuncs.push(this.renderBoundRad); }
				if(this.debug.trails) { renderFuncs.push(this.renderTrail); }

				for(var f = 0; f < renderFuncs.length; ++f) {
					for(var s = 0; s < this.shapes.source.length; ++s) {
						renderFuncs[f].call(this, this.shapes.source[s]);
					}
				}

				if(this.debug.tree) { this.renderShapeTree(); }
				if(this.debug.normals) { this.renderNormals(); }

				this.context.restore();
			},
			renderBoundRad: function(shape) {
				this.context.save();
				this.context.beginPath();
				shape.boundRad.trace(this.context);
				this.context.stroke();
				this.context.restore();

				return this;
			},
			renderTrail: function(shape) {
				var entity = shape.owner;

				this.context.save();
				//this.context.lineWidth = shape.boundRad.rad*2;
				this.context.lineCap = this.context.lineJoin = "round";
				this.context.beginPath();
				this.context.moveTo(entity.pos.x, entity.pos.y);

				for(var t = 0; t < entity.trail.length; ++t) {
					var pos = entity.trail[t];
					this.context.lineTo(pos.x, pos.y);
				}

				this.context.stroke();
				this.context.restore();

				return this;
			},
			renderShapeTree: function() {
				(function(node) {
					if(node.nodes.length) {
						for(var n = 0; n < node.nodes.length; ++n) {
							arguments.callee.call(this, node.nodes[n]);
						}
					}
					else {
						this.context.save();
						node.boundRect.trace(this.context);
						this.context.stroke();
						this.context.restore();
					}
				}).call(this, this.shapes.root);

				return this;
			},
			renderNormals: function() {
				this.context.save();
				this.context.beginPath();

				for(var w = 0; w < this.walls.source.length; ++w) {
					var wall = this.walls.source[w];

					for(var p = 0; p < wall.points.length; ++p) {
						var a = wall.points.wrap(p-1).pos,
							b = wall.points[p].pos,
							edge = b.sub(a),
							l = edge.mag();

						if(l) {
							var half = edge.scale(0.5),
								center = a.add(half),
								normal = edge.perp().doScale(15/l);

							this.context.moveTo(center.x, center.y);
							this.context.lineTo(center.x+normal.x, center.y+normal.y);
						}
					}
				}

				this.context.stroke();
				this.context.restore();

				return this;
			}

			/* When limiting this to within the edges of the environment, there
				may be cases when one of the environment's dimensions extends
				beyond that of the viewport - throw in something just to
				show you thought of it... */
		});
		Viewport.settings = {
			size: new Vec2D(720, 720), mass: 200,
			springForce: { pointFrom: null, posTo: null,
				factor: 0.004, restLength: 0, damping: 0.7 }
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
		}
		$.extend(Controller.prototype, {
			eventPos: function(e) {
				var $canvas = this.lumens.viewport.$canvas,
					canvas = this.lumens.viewport.canvas,
					offset = $canvas.offset();
				
				/* Note: the canvas element's dimensions are not the same as its context's dimensions */
				return new Vec2D(
					(e.pageX-offset.left)/$canvas.width()*canvas.width,
					(e.pageY-offset.top)/$canvas.height()*canvas.height);
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
				up: { input: new Vec2D(0, -1), down: false },
				down: { input: new Vec2D(0, 1), down: false }
			};

			this.move = new Vec2D();	// Sum of all move key inputs

			// Bind events
			/* By default, any input acts on the game
				If other elements are on the page, then they must catch and
				stop propogation of events meant for them
				Pausing the game relinquishes global listening */
			$(document).off('.lumens').on(this.handlers, { ctrl: this });
		}
		$.extend(inherit(MKController, Controller).prototype, {
			handlers: {
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

					ctrl.lumens.viewport.zoomFactor *= wheel;
				},
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
					
					default: break;
					}

					return !caught;
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
			this.lumens.viewport.$canvas.off('.lumens')
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

					ctrl.lumens.viewport.zoomFactor *= event.scale;*/
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
					walls.push(new Wall(Network.loadWall(JSON[w])));
				}

				return walls;
			},
			loadWall: function(JSON) {
				var points = [];

				for(var p = 0; p < JSON.points.length; ++p) {
					points.push(new Particle({ pos: new Vec2D().copy(JSON.points[p]) }));
				}

				return points;
			}
		};
//	}

//	MAIN {
		/* Manages the application, and represents the environment
			(for convenience) */
		function Lumens(options) {
			var settings = $.extend(true, {}, Lumens.settings, options);

			this.boundRect = new AARect(null, settings.size);
			this.color = (settings.color || new Color());
			this.toroid = (settings.toroid || false);

			this.walls = new QuadTree(this.boundRect.copy(), 5, 8, settings.walls,
				function(wall) { return wall.treeItem; });
			// TODO: remove entities - wasted second quadtree, no point
			this.entities = new QuadTree(this.boundRect.copy(), 5, 8, settings.entities,
				function(entity) { return entity.treeItem; });
			this.swarm = new QuadTree(this.boundRect.copy(), 5, 8, settings.swarm,
				function(predator) { return predator.treeItem; });
			
			this.player = new Firefly({ pos: this.boundRect.size.scale(0.5) });
			this.entities.add(this.player);
			
			for(var p = 0; p < settings.predators.num; ++p) {
				this.addPredator();
			}

			this.viewport = new Viewport($.extend({
				springForce: { posTo: this.player.pos }, walls: this.walls.source,
				lumens: this, pos: this.player.pos.copy() }, settings.viewport));

			this.controller = Controller.make(this);

			this.controller.events.move.watch(invoke, this.player, this.player.move);
			this.controller.events.aim.watch(invoke, this.player, this.player.aim);
			this.controller.events.attack.watch(invoke, this.player, this.player.attack);
			this.controller.events.beam.watch(invoke, this.player, this.player.beam);
			this.controller.events.repel.watch(invoke, this.player, this.player.repel);
			this.controller.events.range.watch(invoke, this.player, this.player.range);

			this.controller.events.pause.watch(invoke, this, this.pause);
			
			/* If rendering is to be done asynchronously, a render tree
				should be maintained for each render, while updates may
				occur more frequently between these frames
				Finer time steps for updates - Heavy deep copy of quadtree
			this.viewport.renderDone.watch((function() {
				this.viewport.shape ... this.entities;
			}).call, this); */
			
			this.frameUpdate = (settings.frameUpdate || 1000);
			this.frames = this.frameRate = 0;
			this.time = Date.now();
			this.state = Lumens.states.running;

			var lumens = this;

			setTimeout(function() {
				lumens.frameRate = lumens.frames/(lumens.frameUpdate/1000);
				lumens.frames = 0;
				setTimeout(arguments.callee, lumens.frameUpdate);
			}, this.frameUpdate);

			requestAnimationFrame(function() { lumens.step(); });
		}
		$.extend(Lumens.prototype, {
			step: function() {
				var lumens = this,
					currentTime = Date.now(), dt = currentTime-this.time;
				
				this.time = currentTime;

				this.viewport.resolve(dt);
				Collision.Viewport.checkLumens(this.viewport, this);
				this.viewport.update();

				if(this.state === Lumens.states.running) {
					/* Clear the Quadtrees */
					this.entities.clear();
					this.swarm.clear();
					
					/* Resolve everything and populate Quadtrees */
					for(var r = 0; r < this.entities.source.length; ++r) {
						var rE = this.entities.source[r].resolve(dt),
							rTI = rE.treeItem;

						this.entities.put(rTI);
						
						if(instance(rE, Predator)) { this.swarm.put(rTI); }
					}

					/* Update everything:
						collision resolution, force accumulation,
						anything querying the Quadtrees */
					for(var u = 0; u < this.entities.source.length; ++u) {
						var uE = this.entities.source[u],
							uTI = uE.treeItem,
							predator = instance(uE, Predator);
						
						if(Collision.Entity.check(uE, { entities: this.entities,
								walls: this.walls, lumens: this }, dt)
							.length) {
							this.entities.clear(uTI);
							if(predator) { this.swarm.clear(uTI); }

							// Get the new tree item
							uTI = uE.treeItem;
							this.entities.put(uTI);
							if(predator) { this.swarm.put(uTI); }
						}

						uE.update(dt);
					}
				}

				/* Render */
				/* Should be done asynchronously, through web workers:
				// Render called in viewport
				if(this.running) {
					setTimeout(this.step.call, 1000/60, this);
				} */

				this.viewport.setup().add(this.entities.source).render();

				this.frames++;

				requestAnimationFrame(function() { lumens.step(); });

				return this;
			},
			render: function(context) {
				context.save();
				context.fillStyle = this.color.RGBAString();
				context.fillRect(0, 0, this.boundRect.size.x, this.boundRect.size.y);
				context.restore();
			},
			pause: function(paused) {
				if(this.state != Lumens.states.fin) {
					this.state = Lumens.states[((paused)? 'paused' : 'running')];
				}

				return this;
			},
			addPredator: function() {
				var angle = Math.random()*2*Math.PI,
					predator = new Predator({
							swarmForce: { swarm: this.swarm },
							avoidForce: { walls: this.walls },
							pos: new Vec2D(Math.random()*this.boundRect.size.x,
								Math.random()*this.boundRect.size.y),
							angle: new Vec2D(Math.cos(angle),
									Math.sin(angle))
						});
				
				this.entities.add(predator);
				this.swarm.add(predator);

				return this;
			},
			removePredator: function(predator) {
				this.swarm.source.splice(this.swarm.source.indexOf(predator), 1);
				this.entities.source.splice(this.entities.source.indexOf(predator), 1);
				// Trees get cleared anyway...

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
				predators: { num: 300 }
			},
			states: new Enum('running', 'paused', 'fin')
		});
//	}
				
	
//	DEBUG {
		/* GUI for testing */
		function addGUI(lumens) {
			var load = {
					"preset": "Lumens",
					"closed": false,
					"remembered": {
						"Lumens": {
							"0": {
								"maxForce": 0.03,
								"damping": 0.995
							},
							"1": {
								"rad": 100
							},
							"2": {
								"color": {
									"r": 200,
									"g": 200,
									"b": 200,
									"a": 0.7
								}
							},
							"3": {
								"color": {
									"r": 255,
									"g": 255,
									"b": 255,
									"a": 1
								}
							},
							"4": {
								"num": 300
							},
							"5": {
								"maxForce": 0.005
							},
							"6": {
								"predict": 0.6,
								"nearbyRad": 101.10000000000001
							},
							"7": {
								"separation": 0.501,
								"cohesion": 0.021,
								"alignment": 0.414
							},
							"8": {
								"wander": 1.494,
								"minSpeed": 0.8
							},
							"9": {
								"invMass": 0.005
							},
							"10": {
								"bounds": true,
								"trails": true,
								"health": false,
								"states": false,
								"tree": true
							},
							"11": {
								"damping": 0.7,
								"factor": 0.004
							},
							"12": {
								"toroid": false
							},
							"13": {
								"x": 3000,
								"y": 2000
							}
						}
					},
					"folders": {
						"Player": {
							"preset": "Default",
							"closed": true,
							"folders": {
								"Light": {
									"preset": "Default",
									"closed": true,
									"folders": {}
								}
							}
						},
						"Predators": {
							"preset": "Default",
							"closed": false,
							"folders": {
								"AI": {
									"preset": "Default",
									"closed": false,
									"folders": {}
								}
							}
						},
						"Viewport": {
							"preset": "Default",
							"closed": true,
							"folders": {}
						},
						"Environment": {
							"preset": "Default",
							"closed": true,
							"folders": {}
						}
					}
				},
				gui = new dat.GUI({ load: load, preset: 'Lumens' });

			gui.add(lumens, "frameRate", 0, 0).listen();

			var playerFolder = gui.addFolder("Player"),
				predatorFolder = gui.addFolder("Predators"),
				viewportFolder = gui.addFolder("Viewport"),
				environmentFolder = gui.addFolder("Environment"),

				/* Note that the alpha can't be 1 to work with dat.GUI */
				player = { color: lumens.player.shape.color.toRGBA() },
				light = { color: lumens.player.light.color.toRGBA() };

			gui.remember(lumens.player);
			gui.remember(lumens.player.light);
			gui.remember(player);
			gui.remember(light);
			
			playerFolder.addColor(player, "color").onChange(function(c) {
				lumens.player.shape.color.fromRGBA(c.r, c.g, c.b, c.a);
			});
			playerFolder.add(lumens.player, 'maxForce', 0.01, 1.01).step(0.01).listen();
			playerFolder.add(lumens.player, 'damping', 0.001, 1.000).step(0.001).listen();

			var lightFolder = playerFolder.addFolder("Light");

			lightFolder.add(lumens.player.light, "rad", 0, 1000).listen();
			lightFolder.addColor(light, "color").onChange(function(c) {
				lumens.player.light.color.fromRGBA(c.r, c.g, c.b, c.a);
			});

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

			function setWeight(weight, influence) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarmForce.weight[influence] = weight;
				}
			}

			gui.remember(Predator.settings);
			gui.remember(Predator.settings.swarmForce);
			gui.remember(Predator.settings.swarmForce.weight);

			AIFolder.add(Predator.settings.swarmForce.weight, "separation",
			0, 1).step(0.001).listen().onChange(function(weight) {
				setWeight(weight, "separation");
			});
			AIFolder.add(Predator.settings.swarmForce.weight, "cohesion",
			0, 0.1).step(0.001).listen().onChange(function(weight) {
				setWeight(weight, "cohesion");
			});
			AIFolder.add(Predator.settings.swarmForce.weight, "alignment",
			0, 1).step(0.001).listen().onChange(function(weight) {
				setWeight(weight, "alignment");
			});

			AIFolder.add(Predator.settings.swarmForce, "predict",
			0, 5).step(0.001).listen().onChange(function(predict) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarmForce.predict = predict;
				}
			});

			var wander = Predator.settings.wanderForce,
				wanderSettings = { wander: wander.weight, minSpeed: wander.minSpeed };
			
			gui.remember(wanderSettings);

			AIFolder.add(wanderSettings, "wander", 0, 10).step(0.001)
			.onChange(function(weight) {
				wander.weight = weight;

				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].wanderForce.weight = weight;
				}
			});
			AIFolder.add(wanderSettings, "minSpeed", 0, 10).step(0.001)
			.onChange(function(speed) {
				wander.minSpeed = speed;

				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].wanderForce.minSpeed = speed;
				}
			});

			var avoid = Predator.settings.avoidForce,
				avoidSettings = { avoid: avoid.weight, avoidRadius: avoid.radius };
			
			gui.remember(avoidSettings);

			AIFolder.add(avoidSettings, "avoid", 0, 10).step(0.001)
			.onChange(function(weight) {
				avoid.weight = weight;

				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].avoidForce.weight = weight;
				}
			});
			AIFolder.add(avoidSettings, "avoidRadius", 0, 100).step(0.001)
			.onChange(function(radius) {
				avoid.radius = radius;

				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].avoidForce.radius = radius;
				}
			});
			
			AIFolder.add(Predator.settings.swarmForce, "nearbyRad", 0, 1000)
			.step(0.05).listen().onChange(function(rad) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].swarmForce.nearbyRad = rad;
				}
			});
			
			AIFolder.add(Predator.settings, "maxForce", 0, 1)
			.step(0.005).listen().onChange(function(maxForce) {
				for(var p = 0; p < lumens.swarm.source.length; ++p) {
					lumens.swarm.source[p].maxForce = maxForce;
				}
			});

			gui.remember(lumens.viewport);
			gui.remember(lumens.viewport.debug);
			gui.remember(lumens.viewport.springForce);

			for(var s in lumens.viewport.debug) {
				viewportFolder.add(lumens.viewport.debug, s);
			}

			viewportFolder.add(lumens.viewport.springForce, "damping", 0, 1);
			viewportFolder.add(lumens.viewport.springForce, "factor", 0, 1);
			viewportFolder.add(lumens.viewport, "invMass", 0.01, 1);


			gui.remember(lumens);
			gui.remember(lumens.boundRect.size);

			environmentFolder.add(lumens.boundRect.size, "x").listen();
			environmentFolder.add(lumens.boundRect.size, "y").listen();
			environmentFolder.add(lumens, "toroid").listen();

			//gui.close();

			return gui;
		}
//	}

	$(function() {
		$.getJSON("js/test_environment.json", function(JSON) {
			var lumens = new Lumens({
				size: new Vec2D(3000, 2000),
				walls: Network.loadWalls(JSON),
				viewport: { canvas: '#lumens',
					settings: { trails: true, bounds: true } }
			});

			addGUI(lumens);
		});
	});
})(jQuery);