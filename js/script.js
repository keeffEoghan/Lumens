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
		}
		$.extend(Observable.prototype, {
			update: function() {
				for(var c in this.callbacks) {
					var callback = this.callbacks[c];
					callback.func.apply(null,
						callback.args.concat(this._thing));
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
				this.callbacks[id] = {
					func: func,
					args: arguments.slice(2)
				};
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
		
		function Vector2D(x, y) { this.x = (x || 0); this.y = (y || 0); }
		$.extend(Vector2D.prototype, {
			/* Accessors */
			
			add: function(v) { return this.copy().doAdd(v); },
			
			angleAbs: function(v) {
				var prodMag = Math.sqrt(this.mag2()*v.mag2());
				if(magProd) { return Math.acos(this.dot(v)/prodMag); }
				else { $.error("Vector2D Error: getting angle with zero vector"); }
			},
			
			angleRel: function(v) { return Math.atan2(this.dot(v.perp()), this.dot(v)); },
			
			copy: function() { return new Vector2D(this.x, this.y); },
			
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
				else { $.error("Vector2D Error: normalising zero vector"); }
			},
			
			doZero: function() { this.x = this.y = 0; return this; }
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
		function QuadTree(bounds, pointQuad, maxDepth, maxKids, kids) {
			this.root = ((pointQuad)?
					new Node(bounds, 0, maxDepth, maxKids)
				:	new BoundsNode(bounds, 0, maxDepth, maxKids));
			
			this.add(kids);
		}
		$.extend(QuadTree.prototype, {
			add: function(item) {
				if($.isArray(item)) {
					for(var i = 0; i < item.length; i++) { this.root.add(item[i]); }
				}
				else if(item) { this.root.add(item); }
			},
			clear: function() { this.root.clear(); },
			get: function(item) { return this.root.get(item).slice(0); }
		});

		function Node(bounds, depth, maxDepth, maxKids) {
			this.bounds = bounds;
			this.depth = depth;
			this.maxDepth = maxDepth;
			this.maxKids = maxKids;
			
			this.kids = [];
			this.nodes = [];
		}
		$.extend(Node.corners, new Enum("topLeft", "topRight",
			"bottomLeft", "bottomRight"));
		$.extend(Node.prototype, {
			add: function(item) {
				if(this.nodes.length) { this.nodes[this.index(item)].add(item); }
				else if(item) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.add(item[i]); }
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
				if(this.nodes.length) {
					return this.nodes[this.index(item)].get(item);
				}
				else if($.isArray(item)) {
					var kids = [];
					for(var i = 0; i < item.length; ++i) {
						kids.concat(this.get(item[i]));
					}
					return kids;
				}
				else { return this.kids; }
			},
			index: function(item) {
				var left = (item.x <= this.bounds.x+this.bounds.width/2);
				var top = (item.y <= this.bounds.y+this.bounds.height/2);

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
					
					halfWidth = (this.bounds.width/2) | 0,
					halfHeight = (this.bounds.height/2) | 0,
					
					rightHalf = this.bounds.x+halfWidth,
					bottomHalf = this.bounds.y+halfHeight;
				
				this.nodes[Node.corners.topLeft] = new Node({
					x: this.bounds.x, y: this.bounds.y,
					width: halfWidth, height: halfHeight }, depth);
				
				this.nodes[Node.corners.topRight] = new Node({
					x: rightHalf, y: halfHeight,
					width: halfWidth, height: halfHeight }, depth);
				
				this.nodes[Node.corners.bottomLeft] = new Node({
					x: bounds.x, y: bottomHalf,
					width: halfWidth, height: halfHeight }, depth);
				
				this.nodes[Node.corners.bottomRight] = new Node({
					x: rightHalf, y: bottomHalf,
					width: halfWidth, height: halfHeight }, depth);
				
				return this;
			},
			clear: function() {
				this.kids.length = 0;
				
				for(var n = 0; n < this.nodes.length; ++n) { this.nodes[n].clear(); }
				
				this.nodes.length = 0;
				
				return this;
			}
		});
		
		function BoundsNode(bounds, depth, maxDepth, maxKids) {
			Node.call(this, arguments);
			this.borderKids = [];
		}
		$.extend(BoundsNode.corners, Node.corners);
		$.extend(BoundsNode.prototype, Node.prototype, {
			add: function(item) {
				if(this.nodes.length) {
					var node = this.nodes[this.index(item)];
					
					if(item.x >= node.bounds.x &&
						item.x+item.width <= node.bounds.x+node.bounds.width &&
						item.y >= node.bounds.y &&
						item.y+item.height <= node.bounds.y+node.bounds.height) {
						node.add(item);
					}
					else { this.borderKids.push(item); }
				}
				else if(item) {
					if($.isArray(item)) {
						for(var i = 0; i < item.length; ++i) { this.add(item[i]); }
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
				
				if(this.nodes.length) {
					kids.concat(this.nodes[this.index(item)].get(item));
				}
				else if($.isArray(item)) {
					for(var i = 0; i < item.length; ++i) {
						kids.concat(this.get(item[i]));
					}
				}
				else { kids.concat(this.kids); }
				
				kids.concat(this.borderKids);
				
				return kids;
			},
			clear: function() {
				this.borderKids.length = 0;
				
				Node.prototype.clear.call(this);
			}
		});
		
		/* Conversion functions adapted from Michael Jackson's (really) - http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript */
		function Color(options) {
			if($.isNumeric(options.h)) {
				this.fromHSLA(options.h, options.s, options.l, options.a);
			}
			else { this.fromRGBA(options.r, options.g, options.b, options.a); }
		}
		$.extend(Color.prototype, {
			fromHSLA: function(h, s, l, a) {
				if(s === 0) { r = g = b = l; }
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
				return { r: this.r*255, g: this.g*255, b: this.b*255, a: this.a };
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

				return { h: Math.floor(h*360), s: Math.floor(s*100),
					l: Math.floor(l*100), a: this.a };
			}
		});

		// For touchscreen devices
		function Thumbstick(radius, unit) {
			if(!radius) { $.error("Thumbstick error: cannot have zero radius"); }
			this.rad = radius;
			this.unit = unit;
			this.center = null;	// Vector2D
			this.pos = null;	// Vector2D
		}
		$.extend(Thumbstick.prototype, {
			place: function(v) {
				this.center = v.copy(); this.pos = v.copy(); return this;
			},
			move: function(v) {
				this.pos = v;

				var vector = this.vector();
				if(this.unit || vector.magSq() > this.rad*this.rad) {
					// Pin to range
					this.pos = vector.doUnit().doScale(this.rad)
						.doAdd(this.center);	// Makes relative vector absolute
				}

				return this;
			},
			lift: function(v) { this.pos = this.center = null; return this; },
			vector: function() {
				if(!this.rad) { $.error("Thumbstick error: cannot have zero radius"); }
				return this.pos.sub(this.center).doScale(1/this.rad);
			}
		});
	// }
	
	// PHYSICS {
		
		function Shape(options) {
			if(!options) { options = {}; }
			
			this.centerMass = (options.centerMass || new Vector2D());
			
			this.points = (($.isArray(options.points))? options.points : []);
			
			this.bounds = { rad: 0, radSq: 0, center: new Vector2D() };
			this.updateBounds();
			
			this.color = (options.color || new Color());
		}
		$.extend(Shape.prototype, {
			update: function() { return this; },
			resolve: function(dt) { return this.update(); },
			
			updateBounds: function() {
				this.bounds.radSq = 0; this.bounds.center.doZero();
				var l = this.points.length;
				
				if(l) {
					for(var i = 0; i < l; ++i) {
						this.bounds.center.doAdd(this.points[i]);
					}
					this.bounds.center.doScale(1/l);
					
					for(var j = 0; j < l; ++j) {
						var radSq = this.bounds.center.distSq(this.points[i]);
						if(radSq > this.bounds.radSq) { this.bounds.radSq = radSq; }
					}
					
					this.bounds.rad = Math.sqrt(this.bounds.radSq);
				}
				
				return this;
			}
		});
		
		function RigidShape(options) {
			if(!options) { options = {}; }
			
			/* Call super constructor */
			Shape.call(this, options);
			
			/* Reference to the position - never changed here */
			this.angle = (options.angle || new Vector2D());
		}
		$.extend(RigidShape.prototype, Shape.prototype);
		
		/* Interface */
		/*function Influence() {}
		$.extend(Influencer.prototype, {
			generate: function() {
			}
		});*/
		
		function SwarmInfluence(options) {
			this.swarm = options.swarm;
		}
		$.extend(SwarmInfluence.prototype, Influencer.prototype, {
			generate: function(member, rad, weight) {
				var totalSeparation = new Vector2D(), totalCohesion = new Vector2D(),
					totalAlignment = new Vector2D(), swarmForce = new Vector2D(),
					
					diam = 2*rad,
					neighbours = this.swarm.get({ x: member.pos.x-rad,
						y: member.pos.y-rad,
						width: diam, height: diam }),
					
					num = 0;
				
				for(var n = 0; n < neighbours; ++n) {
					var neighbour = neighbours[n];
					
					if(member !== neighbour) {
						var dist = this.pos.dist(neighbour.pos);
						
						if(dist < rad) {
							++num;
							totalSeparation.doAdd(member.pos.sub(neighbour.pos)
								.doUnit().doScale(1/dist));
							totalCohesion.doAdd(neighbour.pos);
							totalAlignment.doAdd(neighbour.vel.unit());
						}
					}
				}
				
				if(num) {
					swarmForce.doAdd(totalSeparation.scale(weight.separation))
						.doAdd(totalCohesion.scale(weight.cohesion))
						.doAdd(totalAlignment.scale(weight.alignment))
						.doScale(1/num);
				}
				
				return swarmForce;
			}
		});
		
		/* See Game Physics Engine Development, by Ian Millington */
		function Particle(options) {
			if(!options) { options = {}; }
			
			this.pos = (options.pos || new Vector2D());
			this.vel = (options.vel || new Vector2D());
			this.acc = (options.acc || new Vector2D());
			this.force = (options.force || new Vector2D());
			
			if(options.mass) { this.setMass(options.mass); }
			else { this.invMass = (($.isNumeric(options.invMass))? options.invMass : 1); }
			
			this.damping = (($.isNumeric(options.damping))? options.damping : 0.99);
			
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
					var resAcc = this.acc.add(
						this.force.scale(this.invMass)).doScale(dt);
					
					this.vel.doAdd(resAcc)
						.doScale(Math.pow(this.damping, dt));
					
					this.pos.doAdd(this.vel.scale(dt));
					
					/* Reset */
					this.force.doZero();
				}
				
				return this;
			}
		});
		
		function RigidBody(options) {
			if(!options) { options = {}; }
			
			/* Inherit from Particle */
			Particle.call(this, options);
			
			this.angle = (options.angle || new Vector2D());
			this.rot = (options.rot || new Vector2D());
			this.angAcc = (options.angAcc || new Vector2D());
			this.torque = (options.torque || new Vector2D());
			
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
			
			setInertiaTensor: function(inertiaTensor) {
				if(inertiaTensor > 0) { this.invInertiaTensor = 1/inertiaTensor; }
				else { $.error("Set Inertia Tensor Error: attempted to divide by 0"); }
			}
		});
	// }
	
	// ENTITIES {
		
		/* Template class
			Update function must override the one of the physical body "Type" */
		function EntityTemplate(Type, options) {
			if(!options) { options = {}; }
			
			this.Type = options.Type;
			this.Type.call(this, options);
			
			this.health = (options.health || 100);
			
			this.state = EntityTemplate.states.spawn;
		}
		$.extend(EntityTemplate.prototype, {
			resolve: function(dt) {
				if(dt) {
					this.Type.prototype.resolve.call(this, dt);
					this.shape.resolve(dt);
				}
				
				return this;
			},
			update: function() { return this; }
		});
		EntityTemplate.states = new Enum("spawn", "normal", "dead");
		
		function Firefly(options) {
			if(!options) { options = {}; }
			
			/* Particle entity template */
			/* TODO: change to RigidBody */
			EntityTemplate.call(this, Particle, options);
			
			/* Set up the shape */
			/* TODO: change to RigidShape */
			options.centerMass = this.pos;
			this.shape = new Shape(options);
		}
		$.extend(Firefly.prototype, Particle.prototype, EntityTemplate.prototype, {
			update: function() { return this; }
		});
		$.extend(Firefly.states, EntityTemplate.states,
			new Enum("wander", "transition"));
		
		function Predator(options) {
			if(!options) { options = {}; }
			
			/* Particle entity template */
			/* TODO: change to RigidBody */
			EntityTemplate.call(this, Particle, options);
			
			/* Set up the shape */
			/* TODO: change to RigidShape */
			options.centerMass = this.pos;
			this.shape = new Shape(options);
			
			this.swarmInfluence = options.swarmInfluence;

			this.neighbourRad = options.neighbourRad;
			this.weight = (options.weight || { separation: 0.25,
				cohesion: 0.25, alignment: 0.25, wander: 0.25 });
			
			this.state = Predator.states.spawn;
		}
		$.extend(Predator.prototype, Particle.prototype, EntityTemplate.prototype, {
			update: function() {
				switch(this.state) {
				case Predator.states.passive: case Predator.states.aggressive:
				case Predator.states.normal:
					this.force += this.swarmInfluence
						.generate(this, this.neighbourRad, this.weight);
				break;
				
				default:
				break;
				}
				
				return this;
			}
		});
		$.extend(Predator.states, EntityTemplate.states,
			new Enum("passive", "aggressive", "feeding", "stunned"));
	// }
	
	// DEBUG {
		
		/* GUI for testing */
		function addGUI() {
			var gui = new DAT.GUI();
			
			gui.close();
		}
	// }
	
	// MAIN {
		function Renderer(canvas) {
			this.shapes = [];
			this.shapeTree = {};

			this.lights = [];
			this.glows = [];

			this.context = canvas.getContext('2d');
			
			this.renderDone = new Watchable();
			//this.running = true;
		}
		$.extend(Renderer.prototype, {
			render: function() {
				/* Clear */
				this.canvas.clearRect(0, 0, canvas.width, canvas.height);

				/* Lit areas */
				var litBodies = [];

				context.globalCompositeOperation = 'source-over';

				for(var l = 0; l < this.lights.length; ++l) {
					var light = this.lights[l],
						diam = 2*light.rad,
						lightItem = {
							x: light.pos.x-light.rad,
							y: light.pos.y-light.rad,
							width: diam, height: diam },
						neighbours = this.shapeTree.get(lightItem);
					
					for(var n = 0; n < neighbours.length; ++n) {
						var neighbour = neighbours[n];

						if(neighbour.bounds.center.distSq(light.pos) <
						Math.pow(light.rad+neighbour.bounds.rad, 2)) {
							litEntities.push(neighbour);
						}
					}

					light.draw(this.context);
				}

				/* Bodies - only drawn in the light */
				context.globalCompositeOperation = 'source-atop';

				for(var lB = 0; lB < litEntities.length; ++lB) {
					litBodies[lB].draw(this.context);
				}

				/* Glowing cores - drawn everywhere */
				context.globalCompositeOperation = 'destination-over';

				for(var g = 0; g < this.glows.length; ++g) {
					this.glows[g].draw(this.context);
				}


				/* Should be managed asynchronously from here,
					as a web worker:
				if(this.running) {
					var renderer = this;
					requestAnimationFrame(function() {
						renderer.render();
					});
				} */

				this.renderDone.update();
			}
		});

		function Controller(lumens) {
			this.lumens = lumens;

			this.events = {
				move: new Watchable(false),	// Vector2D between 0 and 1, or null
				aim: new Watchable(false),	// Unit Vector2D, or null
				attack: new Watchable(false),
				beam: new Watchable(false),
				repel: new Watchable(false),
				range: new Watchable(false),
				pause: new Watchable(false)
			};
		}
		$.extend(Controller.prototype, {
			eventPos: function(e) {
				var $viewport = this.lumens.$viewport, viewport = $viewport[0],
					offset = $viewport.offset();
				
				/* Note: the canvas element's dimensions are not the same as its context's dimensions */
				return new Vector2D(
					(e.pageX-offset.left)/$viewport.width()*viewport.width,
					(e.pageY-offset.top)/$viewport.height()*viewport.height);
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
			
			this.mousePos = null;	// Vector2D or null

			// Bind events
			var $viewport = this.lumens.$viewport;

			/* By default, any input acts on the game
				If other elements are on the page, then they must catch and
				stop propogation of events meant for them
				Pausing the game relinquishes global listening */
			$(document).on(this.handlers);
		}
		$.extend(MKController.prototype, Controller.prototype, {
			handlers: {
				'mousedown.lumens': function(e) { this.events.attack.thing(true); },
				'mouseup.lumens': function(e) { this.events.attack.thing(false); },
				'mousemove.lumens': function(e) {
					this.mousePos = this.eventPos(e);
					this.events.aim.thing(this.mousePos.sub(this.lumens.player.pos)
						.doUnit());
				},
				'keydown.lumens': function(e) {
					switch(e.which) {
					/* TODO: decide whether l, u, r, d moves player and
						mouse/other keys aim (like twin-stick, but need
						option to flip sides for lefties), or if u, d
						move player and mouse/l, r aim (like a car)
					// left, a, j
					case 37: case 65: case 74:
						this.mousePos = null;
						this.events.aim.thing(/* TODO: rotation */);
					break;
					
					// right, d, l
					case 39: case 68: case 76:
					break;
					
					// up, w, i
					case 38: case 87: case 73:
					break;
					
					// down, s, k
					case 40: case 83: case 75:
					break;
					
					// space
					case 32: break;
					
					// x, m
					case 88: case 77: break;
					
					// c, n
					case 67: case 78: break;
					
					// v, b
					case 86: case 66: break;
					
					// p, g, enter
					case 80: case 71: case 13: break;
					
					default: break;
					}
				},
				'keyup.lumens': function(e) {
					switch(e.which) {
					// left, a, j
					case 37: case 65: case 74: break;
					
					// right, d, l
					case 39: case 68: case 76: break;
					
					// up, w, i
					case 38: case 87: case 73: break;
					
					// down, s, k
					case 40: case 83: break;
					
					// space
					case 32: break;
					
					// x, m
					case 88: case 77: break;
					
					// c, n
					case 67: case 78: break;
					
					// v, b
					case 86: case 66: break;
					
					// p, g, enter
					case 80: case 71: case 13: break;
					
					default: break;
					}
				}
			}
		});

		function TouchController(lumens) {
			Controller.call(this, lumens);
			
			this.move = new Thumbstick(50);
			this.aim = new Thumbstick(50, true);

			this.bindings = [];	// { touch, event }

			// Bind events
			this.lumens.$viewport.off('.lumens').on(this.handlers);
		}
		$.extend(TouchController.prototype, Controller.prototype, {
			handlers: {
				'touchstart.lumens': function(event) {
					/* Prevents scrolling */
					event.preventDefault();
					
					/* jQuery normalises (and alters) event properties (http://stackoverflow.com/questions/3183872/does-jquery-preserve-touch-events-properties),
						so we need to work with the original to access the touches arrays */
					var e = event.originalEvent;
					
					for(var t = 0; this.touches.length < 4 &&
					t < e.changedTouches.length; ++t) {
						var touch = e.changedTouches[t],
							touchPos = this.eventPos(touch);

						// Place thumbsticks
						if(!this.move.center) {
							this.move.place(touchPos);
							this.bindings.push({ touch: touch,
								event: this.events.move });
						}
						else if(!this.aim.center) {
							this.aim.place(touchPos);
							this.bindings.push({ touch: touch,
								event: this.events.aim });
						}

						// Activate enhanced modes
						else if(!this.events.range.thing() &&
						!this.events.repel.thing()) {
							var moveDistSq = touchPos.distSq(this.move.center),
								aimDistSq = touchPos.distSq(this.aim.center);
							
							if(moveDistSq < aimDistSq) {
								this.bindings.push({ touch: touch,
									event: this.events.range.thing(true) });
							}
							else {
								this.bindings.push({ touch: touch,
									event: this.events.repel.thing(true) });
							}
						}
						else {
							// 4th finger down - disable existing, enable beam
							var b = this.bindingWithEvent((this.events.range.thing())?
										this.events.range.thing(false)
									:	this.events.repel.thing(false));

							this.bindings.splice(this.bindings.indexOf(b), 1,
								{ touch: touch, event: this.events.beam.thing(true) });
						}
					}
				},
				'touchmove.lumens': function(event) {
					event.preventDefault();
					
					var e = event.originalEvent;
					
					for(var t = 0; t < e.changedTouches.length; ++t) {
						var touch = e.changedTouches[t],
							binding = this.bindingWithTouch(touch);
						
						if(binding) {
							var thumbstick = ((binding.event === this.events.move)?
										this.move
									:	((binding.event === this.events.aim)?
										this.aim
									:	null));
							
							if(thumbstick) {
								thumbstick.move(this.eventPos(touch));
								binding.event.thing(thumbstick.vector());
							}
						}
					}
				},
				'touchend.lumens': function(event) {
					event.preventDefault();
					
					var e = event.originalEvent;
					for(var t = 0; t < e.changedTouches.length; ++t) {
						var touch = e.changedTouches[t],
							binding = this.bindingWithTouch(touch);
						
						if(binding) {
							var thumbstick = ((binding.event === this.events.move)?
										this.move
									:	((binding.event === this.events.aim)?
										this.aim
									:	null));
							
							if(thumbstick) { thumbstick.lift(); }

							binding.event.thing(false);
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

		function Lumens($viewport) {
			this.$viewport = (($viewport.jquery)? $viewport : $($viewport));

			this.renderer = new Renderer();
			//this.collider = new Collider();
			this.controller = Controller.make(this);
			this.persistor = new Persistor();
			this.networker = new Networker();
			
			this.settings = {
				width: 0, height: 0,
				player: { options: {} },
				predators: {
					num: 0,
					options: {}
				}
			};

			this.time = Date.now();
			this.running = true;
			
			this.entities = [];
			this.swarm = [];
			
			this.entityTree = new QuadTree({ x: 0, y: 0,
					width: this.settings.width, height: this.settings.height },
				false, 8, 10);
			this.swarmTree = new QuadTree({ x: 0, y: 0,
					width: this.settings.width, height: this.settings.height },
				false, 8, 10);
			
			this.player = new Firefly(this.settings.player.options);
			
			for(var p = 0; p < this.settings.predators.length; ++p) {
				this.entities.push(new Predator($.extend({},
					this.settings.predators.options, {
							pos: new Vector2D(Math.random()*
									this.settings.width,
								Math.random()*this.settings.height),
							angle: new Vector2D(Math.random(),
								Math.random()).doUnit(),
							swarm: this.swarmTree
						})));
			}
			
			/* If rendering is to be done asynchronously, a render tree
				should be maintained for each render, while updates may
				occur more frequently between these frames
				Finer time steps for updates - Heavy deep copy of quadtree
			this.renderer.renderDone.watch((function() {
				this.renderer.shapes ... this.entities;
				this.renderer.shapeTree ... this.entityTree;
			}).call, this); */
			
			requestAnimationFrame(function() { lumens.step(); });
		}
		$.extend(Lumens.prototype, {
			step: function() {
				var currentTime = Date.now(),
					dt = currentTime-this.time;
				
				this.time = currentTime;

				/* Clear the Quadtrees */
				this.entityTree.clear();
				this.swarmTree.clear();
				
				/* Resolve everything */
				for(var r = 0; r < this.entities.length; ++r) {
					var entity = this.entities[r].resolve(dt),
						bounds = entity.shape.bounds,
						treeItem = {
							object: entity,
							x: bounds.center.x-bounds.rad,
							y: bounds.center.y-bounds.rad,
							width: bounds.center.x+bounds.rad,
							height: bounds.center.y+bounds.rad
						};
					
					/* Populate Quadtrees */
					this.entityTree.add(treeItem);
					
					if(this.swarm.indexOf(entity) !== -1) {
						this.swarmTree.add(treeItem);
					}
				}

				/* Update everything:
					collisions, force accumulation, anything querying
					the Quadtrees */
				for(var u = 0; u < this.entities.length; ++u) {
					this.entities[u].update(dt);
				}
				
				/* Render */
				/* Should be done asynchronously, through web workers:
				// Render called in renderer
				if(this.running) {
					setTimeout(this.step.call, 1000/60, this);
				} */

				this.renderer.render();

				if(this.running) {
					var lumens = this;
					requestAnimationFrame(function() { lumens.step(); });
				}
			}
		});
	// }
})(jQuery);