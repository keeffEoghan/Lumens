/* Author: Eoghan O'Keeffe */

(function($) {
	// UTIL {
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
					callback.func.apply(null,
						[this._thing].concat(callback.args));
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
			
			add: function(v) { return this.copy().doAdd(v); },
			
			angleAbs: function(v) {
				var prodMag = Math.sqrt(this.mag2()*v.mag2());
				if(magProd) { return Math.acos(this.dot(v)/prodMag); }
				else { $.error("Vec2D Error: getting angle with zero vector"); }
			},
			
			angleRel: function(v) { return Math.atan2(this.dot(v.perp()), this.dot(v)); },
			
			copy: function() { return new this.constructor(this.x, this.y); },
			
			dist: function(v) { return Math.sqrt(this.distSq(v)); },
			
			distSq: function(v) { var x = v.x-this.x, y = v.y-this.y; return x*x+y*y; },
			
			dot: function(v) { return this.x*v.x+this.y*v.y; },
			
			equals: function(v) { return (this.x === v.x && this.y === v.y); },
			
			mag: function() { return Math.sqrt(this.magSq()); },
			
			magSq: function() { return this.x*this.x+this.y*this.y; },
			
			mult: function(v) { return this.copy().doMult(v); },
			
			perp: function() { return this.copy().doPerp(); },
			
			scale: function(m) { return this.copy().doScale(m); },
			
			sub: function(v) { return this.copy().doSub(v); },
			
			unit: function() { return this.copy().doUnit(); },
			
			/* Mutators */
			
			doAdd: function(v) { this.x += v.x; this.y += v.y; return this; },
			
			doMult: function(v) { this.x *= v.x; this.y *= v.y; return this; },
			
			doPerp: function() { var x = this.x; this.x = -this.y; this.y = x; return this; },
			
			doScale: function(m) { this.x *= m; this.y *= m; return this; },
			
			doSub: function(v) { this.x -= v.x; this.y -= v.y; return this; },
			
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
					Math.max(this.size.x, this.size.y));
			},
			copy: function() {
				return new this.constructor(this.pos.copy(), this.size.copy());
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
				return new AARect(new Vec2D(this.pos.x-this.rad,
						this.pos.y-this.rad),
					new Vec2D(this.pos.x+this.rad,
						this.pos.y+this.rad));
			},
			copy: function() {
				return new this.constructor(this.pos.copy(), this.rad);
			}
		});
		
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
		function QuadTree(boundRect, maxDepth, maxKids, kids, pointQuad) {
			this.root = ((pointQuad)?
					new Node(boundRect, 0, maxDepth, maxKids)
				:	new BoundsNode(boundRect, 0, maxDepth, maxKids));
			
			this.add(kids);
		}
		$.extend(QuadTree.prototype, {
			add: function(item) { this.root.add(item); },
			clear: function() { return this.root.clear(); },
			get: function(item) { return this.root.get(item).slice(0); }
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
			add: function(item) {
				if(item) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.add(item[i]); }
					}
					else if(this.nodes.length) { this.nodes[this.index(item)].add(item); }
					else {
						this.kids.push(item);

						if(this.depth < this.maxDepth &&
							this.kids.length > this.maxKids) {
							this.split().add(this.kids);

							this.kids.length = 0;
						}
					}
				}
				
				return this;
			},
			get: function(item) {
				if($.isArray(item)) {
					var kids = [];
					for(var i = 0; i < item.length; ++i) {
						kids = kids.concat(this.get(item[i]));
					}
					return kids;
				}
				else {
					return ((this.nodes.length)?
						this.nodes[this.index(item)].get(item) : this.kids);
				}
			},
			index: function(item) {
				var left = (item.x <= this.boundRect.pos.x+this.boundRect.size.x/2);
				var top = (item.y <= this.boundRect.pos.y+this.boundRect.size.y/2);

				return ((left)?
						((top)?
							Node.corners.topLeft
						:	Node.corners.bottomLeft)
					:	((top)?
							Node.corners.topRight
						:	Node.corners.bottomRight));
			},
			split: function() {
				var depth = this.depth+1,
					
					halfSize = new Vec2D((this.boundRect.size.x/2) | 0,
						(this.boundRect.size.y/2) | 0),
					
					rightHalf = this.boundRect.pos.x+halfSize.x,
					bottomHalf = this.boundRect.pos.y+halfSize.y;
				
				this.nodes[Node.corners.topLeft] = new this.constructor(
					new AARect(this.boundRect.pos.copy(), halfSize.copy()),
					depth, this.maxDepth);
				
				this.nodes[Node.corners.topRight] = new this.constructor(
					new AARect(new Vec2D(rightHalf, this.boundRect.pos.y),
						halfSize.copy()), depth, this.maxDepth);
				
				this.nodes[Node.corners.bottomLeft] = new this.constructor(
					new AARect(new Vec2D(this.boundRect.pos.x, bottomHalf),
						halfSize.copy()), depth, this.maxDepth);
				
				this.nodes[Node.corners.bottomRight] = new this.constructor(
					new AARect(new Vec2D(rightHalf, bottomHalf), halfSize.copy()),
					depth, this.maxDepth);
				
				return this;
			},
			clear: function() {
				this.kids.length = 0;
				
				for(var n = 0; n < this.nodes.length; ++n) { this.nodes[n].clear(); }
				
				this.nodes.length = 0;
				
				return this;
			}
		});
		Node.corners = new Enum("topLeft", "topRight",
			"bottomLeft", "bottomRight");
		
		function BoundsNode(boundRect, depth, maxDepth, maxKids) {
			Node.apply(this, arguments);
			this.borderKids = [];
		}
		BoundsNode.corners = Node.corners;
		$.extend(BoundsNode.prototype, Node.prototype, {
			add: function(item) {
				if(item) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.add(item[i]); }
					}
					else if(this.nodes.length) {
						var node = this.nodes[this.index(item)];
						
						if(node.boundRect.contains(item)) { node.add(item); }
						else { this.borderKids.push(item); }
					}
					else {
						this.kids.push(item);
						
						if(this.depth < this.maxDepth &&
							this.kids.length > this.maxKids) {
							this.split().add(this.kids);
							this.kids.length = 0;
						}
					}
				}
				
				return this;
			},
			get: function(item) {
				var kids = [];
				
				if($.isArray(item)) {
					for(var i = 0; i < item.length; ++i) {
						kids = kids.concat(this.get(item[i]));
					}
				}
				else {
					kids = kids.concat(((this.nodes.length)?
							this.nodes[this.index(item)].get(item) : this.kids),
						this.borderKids);
				}
				
				return kids;
			},
			clear: function() {
				this.borderKids.length = 0;
				
				return Node.prototype.clear.call(this);
			}
		});
		
		/* Conversion functions adapted from Michael Jackson's (really) - http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript */
		function Color() {
			this.r = 0;
			this.g = 0;
			this.b = 0;
			this.a = 0;
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
		function Thumbstick(radius, unit) {
			if(!radius) { $.error("Thumbstick error: cannot have zero radius"); }
			this.rad = radius;
			this.unit = unit;
			this.center = null;	// Vec2D
			this.pos = null;	// Vec2D
		}
		$.extend(Thumbstick.prototype, {
			place: function(v) {
				this.center = v.copy();
				this.pos = v.copy();
				return this;
			},
			move: function(v) {
				this.pos = v;

				var vector = this.vector();
				if(vector.magSq() > this.rad*this.rad) {
					// Pin to range
					this.pos = vector.doUnit().doScale(this.rad)
						.doAdd(this.center);	// Makes relative vector absolute
				}

				return this;
			},
			lift: function(v) {
				this.pos = this.center = null;
				return this;
			},
			vector: function() {
				if(!this.rad) { $.error("Thumbstick error: cannot have zero radius"); }
				return this.pos.sub(this.center).doScale(1/this.rad);
			},
			angle: function() {
				if(!this.rad) { $.error("Thumbstick error: cannot have zero radius"); }
				return this.pos.sub(this.center).doUnit();
			},
			render: function(context) {
				return this;
			}
		});
	// }
	
	// PHYSICS {
		// Pointlight
		function Light(options) {
			if(!options) { options = {}; }
			
			Circle.call(this, options.pos, (options.rad || 5));
			this.color = (options.color || Color.fromRGBA(255, 255, 255, 1));
		}
		$.extend(Light.prototype, Circle.prototype, {
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

		
		function Shape(options) {
			if(!options) { options = {}; }
			
			this.centerMass = (options.centerMass || new Vec2D());
			
			this.points = (($.isArray(options.points))? options.points : []);
			// TODO: springs between points
			
			/* Visual information goes in here
				TODO: patterns, images, etc */
			this.color = (options.color || Color.fromRGBA(200, 200, 200, 0.99));

			this.closed = ((options.closed !== undefined)? options.closed : true);
			this.filled = ((options.filled !== undefined)? options.filled : true);
			
			this.boundRad = new Circle();
			this.updateBounds();
		}
		$.extend(Shape.prototype, {
			update: function() {
				return this;
			},
			resolve: function(dt) {
				for(var p = 0; p < this.points; ++p) {
					this.points[p].resolve(dt);
				}

				return this;
			},
			
			updateBounds: function() {
				this.boundRad.radSq = this.boundRad.rad = 0;
				this.boundRad.pos.doZero();

				var l = this.points.length;
				
				if(l) {
					for(var i = 0; i < l; ++i) {
						this.boundRad.pos.doAdd(this.points[i]);
					}
					this.boundRad.pos.doScale(1/l);
					
					for(var j = 0; j < l; ++j) {
						var radSq = this.boundRad.pos.distSq(this.points[j]);
						if(radSq > this.boundRad.radSq) { this.boundRad.radSq = radSq; }
					}
					
					this.boundRad.rad = Math.sqrt(this.boundRad.radSq);
				}
				
				return this;
			},
			render: function(context) {
				/* Probable problem with the way this is done - quadratic curve
					may go beyond the bounding radius */
				if(this.points.length >= 2) {
					var color = this.color.RGBAString(),
						falloff = 0.7,
						point = this.points[0], last = null, ctrlP = null;

					context.save();
					$.extend(context, { strokeStyle: color, fillStyle: color });
					context.beginPath();
					context.moveTo(point.x, point.y);

					for(var p = 1; p < this.points.length; ++p) {
						last = point;
						point = this.points[p];
						ctrlP = point.add(point.sub(last).doScale(falloff));
						context.quadraticCurveTo(ctrlP.x, ctrlP.y, point.x, point.y);
					}

					if(this.closed) {
						last = this.points[this.points.length-1];
						point = this.points[0];
						ctrlP = point.add(point.sub(last).doScale(falloff));
						context.quadraticCurveTo(ctrlP.x, ctrlP.y, point.x, point.y);
					}

					context[((this.filled)? 'fill' : 'stroke')]();
					context.restore();
				}

				return this;
			}
		});
		

		function RigidShape(options) {
			if(!options) { options = {}; }
			
			/* Call super constructor */
			Shape.call(this, options);
			
			/* Reference to the position - never changed here */
			this.angle = (options.angle || new Vec2D());
		}
		$.extend(RigidShape.prototype, Shape.prototype);

		
		/* Interface */
		/*function Influence(...) {...}
		Influence.prototype.generate = function(...) {...}*/


		function SpringInfluence() {}
		SpringInfluence.prototype.generate = function() {
		};

		
		// Circle-led wander idea from Mat Buckland's Programming Game AI by Example
		function WanderInfluence() {}
		WanderInfluence.prototype.generate = function(range, minVel) {
			/* Range is proportional to the distance either side of the current
				heading within which the entity may wander (radius of wander circle)
				minVel is the minimum velocity vector which wandering may produce
				(distance wander circle is ahead of the entity) */
			var angle = Math.random()*2*Math.PI;
			return minVel.add(new Vec2D(range*Math.cos(angle),
				range*Math.sin(angle)));
		};

		
		function SwarmInfluence(swarm) {
			this.swarm = swarm;		// QuadTree
		}
		SwarmInfluence.prototype.generate = function(member, rad, weight) {
			var totalSeparation = new Vec2D(), totalCohesion = new Vec2D(),
				totalAlignment = new Vec2D(), swarmForce = new Vec2D(),
				
				neighbours = this.swarm.get(
					(new Circle(member.pos.copy(), rad)).containingAARect()),
				
				num = 0;
			
			for(var n = 0; n < neighbours.length; ++n) {
				var neighbour = neighbours[n].item;
				
				if(member !== neighbour) {
					var dist = member.pos.dist(neighbour.pos);

					if(dist && dist < rad) {
						++num;

						totalSeparation.doAdd(member.pos.sub(neighbour.pos)
							.doUnit().doScale(1/dist));
						
						totalCohesion.doAdd(neighbour.pos);
						
						var alignment = (neighbour.angle ||
							((neighbour.vel)? neighbour.vel.unit() : null));
						
						if(alignment) { totalAlignment.doAdd(alignment); }
					}
				}
			}
			
			if(num) {
				swarmForce.doAdd(totalSeparation.doScale(weight.separation))
					.doAdd(totalCohesion.doScale(weight.cohesion))
					.doAdd(totalAlignment.doScale(weight.alignment))
					.doScale(1/num);
			}
			
			return swarmForce;
		};

		
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
			
			/* Previous positions - use phosphenes instead later */
			this.trail = [];
			this.trailTime = (($.isNumeric(options.trailTime))?
				options.trailTime : 1);
		}
		$.extend(Particle.prototype, {
			resolve: function(dt) {
				if(dt) {
					/* Add the current position to the trail */
					this.trail.unshift({ pos: this.pos.copy(),
						time: this.trailTime });
					
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
				if(mass) {
					this.invMass = ((mass > 0)? 1/mass : Number.MIN_VALUE);
					return this;
				}
				else {
					return ((this.invMass > 0)? 1/this.invMass
						:	Number.POSITIVE_INFINITY);
				}
			}
		});
		

		function RigidBody(options) {
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
		$.extend(RigidBody.prototype, Particle.prototype, {
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
					this.invInertiaTensor = ((inertiaTensor > 0)?
						1/inertiaTensor : Number.MIN_VALUE);
					return this;
				}
				else {
					return ((this.invInertiaTensor > 0)?
						1/this.invInertiaTensor : Number.POSITIVE_INFINITY);
				}
			}
		});
	// }
	
	// ENTITIES {
		/* Template class
			Update function must override the one of the physical body "Type" */
		function Entity(Type, options) {
			if(!options) { options = {}; }
			
			this.Type = Type;
			this.Type.call(this, options);
			
			this.health = (options.health || 100);
			
			this.state = Entity.states.spawn;
		}
		$.extend(Entity.prototype, {
			resolve: function(dt) {
				if(dt) {
					this.Type.prototype.resolve.call(this, dt);
					this.shape.resolve(dt);
				}
				
				return this;
			},
			update: function() { return this; }
		});
		Entity.states = new Enum("spawn", "normal", "dead");
		

		function Firefly(options) {
			if(!options) { options = {}; }

			this.maxForce = (options.maxForce || 0.03);
			this.maxTorque = (options.maxTorque || 1.0);
			
			/* Particle entity template */
			/* TODO: change to RigidBody */
			Entity.call(this, Particle, options);
			
			/* Set up the shape */
			/* TODO: change to RigidShape */
			var points = [], num = 10, rad = 20, v = 0, end = 2, i = end/(num-1);

			for(var p = 0; p < num; v += i, ++p) {
				points.push(this.pos.add(new Vec2D(rad*Math.cos(Math.PI*v),
													rad*Math.sin(Math.PI*v))));
			}

			this.shape = new Shape({ centerMass: this.pos, points: points,
				color: Color.fromRGBA(200, 200, 200, 0.7) });
			
			this.light = new Light({ rad: 50, pos: this.pos,
				color: Color.fromRGBA(255, 255, 255, 0.75) });
			
			this.inputForce = null;
		}
		$.extend(Firefly.prototype, Particle.prototype, Entity.prototype, {
			resolve: function(dt) {
				if(this.inputForce) { this.force.doAdd(this.inputForce); }
				return Entity.prototype.resolve.call(this, dt);
			},
			update: function() { return this; },
			move: function(force, firefly) {
				firefly = (firefly || this);
				firefly.inputForce = ((force)? force.scale(firefly.maxForce) : null);
				return firefly;
			},
			aim: function(angle, firefly) {
				firefly = (firefly || this);
				//firefly.torque.doAdd(angle*firefly.maxTorque);
				return firefly;
			},
			attack: function(active, firefly) {
				firefly = (firefly || this);
				return firefly;
			},
			beam: function(active, firefly) {
				firefly = (firefly || this);
				return firefly;
			},
			repel: function(active, firefly) {
				firefly = (firefly || this);
				return firefly;
			},
			range: function(active, firefly) {
				firefly = (firefly || this);
				return firefly;
			}
		});
		Firefly.states = $.extend({}, Entity.states,
			new Enum("wander", "transition"));
		

		function Predator(options) {
			if(!options) { options = {}; }
			
			/* Particle entity template */
			/* TODO: change to RigidBody */
			Entity.call(this, Particle, options);

			this.wanderInfluence = (options.wanderInfluence || new WanderInfluence());
			
			this.swarmInfluence = options.swarmInfluence;

			this.neighbourRad = options.neighbourRad;
			this.weight = (options.weight || { separation: 0.25,
				cohesion: 0.25, alignment: 0.25, wander: 0.25 });
			
			this.wander = (options.wander || { range: 10, minSpeed: 20 });
			
			/* Set up the shape */
			/* TODO: change to RigidShape */
			var points = [], num = 10, rad = 10, v = 0, end = 2, i = end/(num-1);

			for(var p = 0; p < num; v += i, ++p) {
				points.push(this.pos.add(new Vec2D(rad*Math.cos(Math.PI*v),
													rad*Math.sin(Math.PI*v))));
			}

			this.shape = new Shape({ centerMass: this.pos, points: points });
			
			this.state = Predator.states.spawn;
		}
		$.extend(Predator.prototype, Particle.prototype, Entity.prototype, {
			update: function() {
				switch(this.state) {
				case Predator.states.passive: case Predator.states.aggressive:
				case Predator.states.normal:
					this.force.doAdd(this.swarmInfluence
						.generate(this, this.neighbourRad, this.weight))
					.doAdd(this.wanderInfluence.generate(this.wander.range,
							((this.vel.magSq())?
									this.vel.unit()
								:	(function() {
										var angle = Math.random()*2*Math.PI;
										return new Vec2D(Math.cos(angle),
											Math.sin(angle));
									})()).doScale(this.wander.minSpeed))
							.doScale(this.weight.wander));
				break;
				
				default:
				break;
				}
				
				return this;
			}
		});
		Predator.states = $.extend({}, Entity.states,
			new Enum("passive", "aggressive", "feeding", "stunned"));
	// }
	
	// DEBUG {
		
		/* GUI for testing */
		function addGUI(lumens) {
			var gui = new dat.GUI(),
				playerFolder = gui.addFolder("Player"),
				predatorFolder = gui.addFolder("Predators"),

				/* Note that the alpha can't be 1 to work with dat.GUI */
				player = { color: lumens.player.shape.color.toRGBA() },
				light = { color: lumens.player.light.color.toRGBA() };
			
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

			var predSett = lumens.settings.predators;

			predatorFolder.add(predSett, "num", 0, 2000).listen()
			.onChange(function(num) {
				predSett.num = num |= 0;

				while(num < lumens.swarm.length) {
					var i = Math.random()*(lumens.swarm.length-1);
					lumens.removePredator(lumens.swarm[i]);
				}
				while(num > lumens.swarm.length) { lumens.addPredator(); }
			});

			var swarmFolder = predatorFolder.addFolder("Swarm");

			function setWeight(weight, influence) {
				predSett.options.weight[influence] = weight;

				for(var p = 0; p < lumens.swarm.length; ++p) {
					lumens.swarm[p].weight[influence] = weight;
				}
			}

			swarmFolder.add(predSett.options.weight, "separation", 0, 100)
			.step(0.05).listen().onChange(function(weight) {
				setWeight(weight, "separation");
			});
			swarmFolder.add(predSett.options.weight, "cohesion", 0, 100)
			.step(0.05).listen().onChange(function(weight) {
				setWeight(weight, "cohesion");
			});
			swarmFolder.add(predSett.options.weight, "alignment", 0, 100)
			.step(0.05).listen().onChange(function(weight) {
				setWeight(weight, "alignment");
			});

			//gui.close();

			return gui;
		}
	// }

	// COMPONENTS {
		function Viewport(options) {
			if(!options) { options = {}; }

			Particle.call(this, options);
			
			this.$canvas = $(options.canvas);
			this.canvas = this.$canvas[0];
			this.context = this.canvas.getContext('2d');

			/* The minimum size - defines the resolution and
				behaviour upon resizes and reorientations
				Ensures that a square of this size is always visible,
				with everything scaled to fit */
			this.size = options.size;

			this.boundRect = new AARect();

			this.shapeTree = null;	// QuadTree, only concerned with the shapes

			// Setup size and shapeTree
			this.setup();
			
			this.shapes = (options.shapes || []);
			this.lights = (options.lights || []);
			this.glows = (options.glows || []);

			this.renderDone = new Watchable();
			//this.running = true;

			/* In a render cycle, first setup is called to clear and resize
				the canvas, then the render-lists are populated, followed by a
				call to render, which calls clear at the end */
		}
		$.extend(Viewport.prototype, Particle.prototype, {
			render: function() {
				this.context.save();

				/* Lit areas */
				var litBodies = [];

				this.context.globalCompositeOperation = 'source-over';

				for(var l = 0; l < this.lights.length; ++l) {
					var light = this.lights[l],
						neighbours = ((this.shapeTree)?
							this.shapeTree.get((new Circle(light.pos.copy(),
								light.rad)).containingAARect()) : null);
					
					for(var n = 0; n < neighbours.length; ++n) {
						var neighbour = neighbours[n].item;

						if(neighbour.boundRad.intersects(light)) {
							litBodies.push(neighbour);
						}
					}

					light.render(this.context);
				}

				/* Bodies - only drawn in the light */
				this.context.globalCompositeOperation = 'source-atop';

				for(var lB = 0; lB < litBodies.length; ++lB) {
					litBodies[lB].render(this.context);
				}

				/* Glowing cores - drawn everywhere */
				this.context.globalCompositeOperation = 'destination-over';

				for(var g = 0; g < this.glows.length; ++g) {
					this.glows[g].render(this.context);
				}

				this.context.restore();
				this.clear();

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
			setup: function() {
				/* Fit everything to the screen in question,
					maintaining aspect ratio */
				var width = this.$canvas.width(), height = this.$canvas.height(),
					aspect = width/height;
				
				if(aspect >= 1) {
					this.canvas.height = this.size;
					this.canvas.width = this.size*aspect;
				}
				else {
					this.canvas.width = this.size;
					this.canvas.height = this.size/aspect;
				}

				var margin = new Vec2D((this.canvas.width-this.size)/2,
					(this.canvas.height-this.size)/2);
				
				this.boundRect.pos = this.pos.sub(margin);
				this.boundRect.size.constructor(
					this.canvas.width, this.canvas.height);

				// Position of "size" square is centered in the canvas
				var translate = this.pos.add(margin);
				this.context.translate(translate.x, translate.y);

				this.shapeTree = new QuadTree(this.boundRect.copy(), 8, 10);

				return this;
			},
			clear: function() {
				this.shapes.length = this.lights.length = this.glows.length = 0;
				if(this.shapeTree) { this.shapeTree.clear(); }
				
				return this;
			}

			/* When limiting this to within the edges of the environment, there
				may be cases when one of the environment's dimensions extends
				beyond that of the viewport - throw in an animation of a hamster on a
				wheel running the game, just to show you thought of it... */
		});

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
		$.extend(MKController.prototype, Controller.prototype, {
			handlers: {
				'mousedown.lumens': function(e) { e.data.ctrl.events.attack.thing(true); },
				'mouseup.lumens': function(e) { e.data.ctrl.events.attack.thing(false); },
				'mousemove.lumens': function(e) {
					var ctrl = e.data.ctrl;
					ctrl.mousePos = ctrl.eventPos(e);
					ctrl.events.aim.thing(ctrl.mousePos.sub(ctrl.lumens.player.pos)
						.doUnit());
				},
				'keydown.lumens': function(e) {
					var ctrl = e.data.ctrl;

					switch(e.which) {
					/* TODO: decide whether l, u, r, d moves player and
						mouse/other keys aim (like twin-stick, but need
						option to flip sides for lefties), or if u, d
						move player and mouse/l, r aim (like a car) */
					// left, a, j
					case 37: case 65: case 74: ctrl.startMove(ctrl.moveKey.left);
					break;
					
					// right, d, l
					case 39: case 68: case 76: ctrl.startMove(ctrl.moveKey.right);
					break;
					
					// up, w, i
					case 38: case 87: case 73: ctrl.startMove(ctrl.moveKey.up);
					break;
					
					// down, s, k
					case 40: case 83: case 75: ctrl.startMove(ctrl.moveKey.down);
					break;
					
					// space
					case 32: ctrl.events.attack.thing(true); break;
					
					// x, m
					case 88: case 77: ctrl.events.beam.thing(true); break;
					
					// c, n
					case 67: case 78: ctrl.events.repel.thing(true); break;
					
					// v, b
					case 86: case 66: ctrl.events.range.thing(true); break;
					
					// p, g, enter
					case 80: case 71: case 13:
						ctrl.events.pause.thing(!ctrl.events.pause.thing());
					break;
					
					default: break;
					}
				},
				'keyup.lumens': function(e) {
					var ctrl = e.data.ctrl;

					switch(e.which) {
					// left, a, j
					case 37: case 65: case 74: ctrl.endMove(ctrl.moveKey.left);
					break;
					
					// right, d, l
					case 39: case 68: case 76: ctrl.endMove(ctrl.moveKey.right);
					break;
					
					// up, w, i
					case 38: case 87: case 73: ctrl.endMove(ctrl.moveKey.up);
					break;
					
					// down, s, k
					case 40: case 83: case 75: ctrl.endMove(ctrl.moveKey.down);
					break;
					
					// space
					case 32: ctrl.events.attack.thing(false); break;
					
					// x, m
					case 88: case 77: ctrl.events.beam.thing(false); break;
					
					// c, n
					case 67: case 78: ctrl.events.repel.thing(false); break;
					
					// v, b
					case 86: case 66: ctrl.events.range.thing(false); break;
					
					default: break;
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
			this.lumens.viewport.$canvas.off('.lumens')
				.on(this.handlers, { ctrl: this });
		}
		$.extend(TouchController.prototype, Controller.prototype, {
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
						else if(!ctrl.move.center) {
							ctrl.move.place(touchPos);
							ctrl.bindings.push({ touch: touch,
								event: ctrl.events.move });
						}
						else if(!ctrl.aim.center) {
							ctrl.aim.place(touchPos);
							ctrl.bindings.push({ touch: touch,
								event: ctrl.events.aim });
						}

						// Activate enhanced modes
						else if(!ctrl.events.range.thing() &&
						!ctrl.events.repel.thing()) {
							var moveDistSq = touchPos.distSq(ctrl.move.center),
								aimDistSq = touchPos.distSq(ctrl.aim.center);
							
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
								ctrl.aim.rad*ctrl.aim.rad) {
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
	// }

	// MAIN {
		/* Manages the application, and represents the environment
			(for convenience) */
		function Lumens(options) {
			if(!options) { options = {}; }

			this.settings = $.extend(true, {
				size: new Vec2D(Lumens.minSize, Lumens.minSize),
				viewport: { mass: 20, size: Lumens.minSize },
				player: { mass: 10 },
				// for testing - don't want to set it this way permanently
				predators: {
					num: 10,
					options: {
						neighbourRad: 60,
						weight: { separation: 0.25, cohesion: 0.25,
							alignment: 0.25, wander: 0.25 },
						wanderInfluence: new WanderInfluence()
					}
				}
			}, options);

			this.size = this.settings.size;
			
			this.entities = [];
			this.swarm = [];
			
			this.entityTree = new QuadTree(new AARect(null, this.size.copy()), 8, 10);
			this.swarmTree = new QuadTree(new AARect(null, this.size.copy()), 8, 10);

			this.settings.predators.options.swarmInfluence =
				new SwarmInfluence(this.swarmTree);
			
			for(var p = 0; p < this.settings.predators.num; ++p) {
				this.addPredator();
			}
			
			this.player = new Firefly(this.settings.player);
			this.entities.push(this.player);
				
			// TODO: one-way spring viewport->player
			this.viewport = new Viewport(this.settings.viewport);
			this.controller = Controller.make(this);
			//this.collider = new Collider();
			//this.persistor = new Persistor();
			//this.networker = new Networker();

			this.controller.events.move.watch(this.player.move, this.player);
			this.controller.events.aim.watch(this.player.aim, this.player);
			this.controller.events.attack.watch(this.player.attack, this.player);
			this.controller.events.beam.watch(this.player.beam, this.player);
			this.controller.events.repel.watch(this.player.repel, this.player);
			this.controller.events.range.watch(this.player.range, this.player);

			this.controller.events.pause.watch(this.pause, this);
			
			/* If rendering is to be done asynchronously, a render tree
				should be maintained for each render, while updates may
				occur more frequently between these frames
				Finer time steps for updates - Heavy deep copy of quadtree
			this.viewport.renderDone.watch((function() {
				this.viewport.shapes ... this.entities;
				this.viewport.shapeTree ... this.entityTree;
			}).call, this); */
			
			this.time = Date.now();
			this.state = Lumens.states.running;

			var lumens = this;
			requestAnimationFrame(function() { lumens.step(); });
		}
		$.extend(Lumens.prototype, {
			step: function() {
				var currentTime = Date.now(),
					dt = currentTime-this.time;
				
				this.time = currentTime;

				if(this.state === Lumens.states.running) {
					/* Clear the Quadtrees */
					this.entityTree.clear();
					this.swarmTree.clear();
					
					/* Resolve everything */
					for(var r = 0; r < this.entities.length; ++r) {
						var entity = this.entities[r].resolve(dt),
							treeItem = entity.shape.boundRad.containingAARect();
						
						treeItem.item = entity;
						
						/* Populate Quadtrees */
						this.entityTree.add(treeItem);
						
						if(this.swarm.indexOf(entity) !== -1) {
							this.swarmTree.add(treeItem);
						}
					}

					/* Update everything:
						collision resolution, force accumulation,
						anything querying the Quadtrees */
					for(var u = 0; u < this.entities.length; ++u) {
						this.entities[u].update(dt);
					}
					
					/* Render */
					/* Should be done asynchronously, through web workers:
					// Render called in viewport
					if(this.running) {
						setTimeout(this.step.call, 1000/60, this);
					} */
				}

				this.render();

				var lumens = this;
				requestAnimationFrame(function() { lumens.step(); });

				return this;
			},
			render: function() {
				/* Clear and resize */
				this.viewport.setup();

				for(var r = 0; r < this.entities.length; ++r) {
					var entity = this.entities[r],
						treeItem = entity.shape.boundRad.containingAARect();

					treeItem.item = entity.shape;

					if(this.viewport.shapeTree.root.boundRect
						.contains(treeItem)) {
						this.viewport.shapes.push(entity.shape);
						this.viewport.shapeTree.add(treeItem);
					}

					if(entity.light) { this.viewport.lights.push(entity.light); }
					if(entity.glow) { this.viewport.glows.push(entity.glow); }
				}

				this.viewport.render();
			},
			pause: function(paused, lumens) {
				lumens = (lumens || this);

				if(lumens.state != Lumens.states.fin) {
					lumens.state = Lumens.states[((paused)? 'paused' : 'running')];
				}

				return lumens;
			},
			addPredator: function() {
				var predator = new Predator($.extend({},
					this.settings.predators.options, {
							pos: new Vec2D(Math.random()*this.size.x,
								Math.random()*this.size.y),
							angle: new Vec2D(Math.random(),
								Math.random()).doUnit()
						}));
				
				this.entities.push(predator);
				this.swarm.push(predator);

				return this;
			},
			removePredator: function(predator) {
				this.swarm.splice(this.swarm.indexOf(predator), 1);
				this.entities.splice(this.entities.indexOf(predator), 1);
				// Trees get cleared anyway...

				return this;
			},
			generate: function() {
				this.constructor($.extend(true, this.settings, {
					size: new Vec2D(Lumens.minSize+
							Lumens.minSize*Math.random()*Lumens.sizeFactor,
						Lumens.minSize+
							Lumens.minSize*Math.random()*Lumens.sizeFactor)
				}));
				
				return this;
			}
		});
		$.extend(Lumens, {
			/*instance: function() {
				return((!Lumens.singleton)? Lumens.singleton : new Lumens());
			},
			singleton: null,*/
			minSize: 720,
			sizeFactor: 3,
			states: new Enum('running', 'paused', 'fin')
		});
	// }

	$(function() {
		var lumens = new Lumens({ viewport: { canvas: '#lumens' } });

		addGUI(lumens);
	});
})(jQuery);