/*******************************************************************************
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * GEPPETTO Visualisation engine built on top of THREE.js. Displays a scene as
 * defined on org.geppetto.core
 * 
 * @author matteo@openworm.org (Matteo Cantarelli)
 */

define(function(require) {

	var $ = require('jquery'), 
		_ = require('underscore'), 
		Backbone = require('backbone');

	require('vendor/Detector');
	require('three');
	require('vendor/THREEx.KeyboardState');
	require('vendor/ColladaLoader');
	require('vendor/OBJLoader');

	/**
	 * Local variables
	 */
	var VARS;

	/**
	 * Initialize the engine
	 */
	var GEPPETTO = {
		init : function(containerp) {
			if (!Detector.webgl) {
				Detector.addGetWebGLMessage();
				return false;
			} else {
				VARS = GEPPETTO.Init.initialize(containerp);
				return true;
			}
		},

		/**
		 * Updates the scene
		 */
		updateScene : function(newRuntimeTree) {
			VARS.needsUpdate = true;
			if (VARS.needsUpdate) {
				var entities = newRuntimeTree;

				for ( var eindex in entities) {

					var entity = entities[eindex];
					for ( var a in entity.aspects) {
						var aspect = entity.aspects[a];
						var visualTree = aspect.VisualizationTree;
						for ( var vm in visualTree) {
							var node = visualTree[vm];

							if (node != null
									&& typeof node === "object") {
								
								var metaType = node._metaType;

								if(metaType == "CompositeNode"){
									for ( var gindex in node) {
										var vo = node[gindex];
										var voType = vo._metaType;
										if (voType == "ParticleNode"
												|| metaType == "SphereNode"
												|| metaType == "CylinderNode"
												|| metaType == "ColladaNode") {
											GEPPETTO.updateGeometry(aspect.instancePath,vo);
										}
									}
									
								}
								else{
									if (metaType == "ParticleNode"|| metaType == "SphereNode" || 
										metaType == "CylinderNode"|| metaType == "ColladaNode") {
										
										GEPPETTO.updateGeometry(aspect.instancePath,node);								
									}
								}
							}
						}
						
						var entityGeometry = VARS.visualModelMap[aspect.instancePath];
						if (entityGeometry) {
							// if an entity is represented by a particle
							// system we need to
							// mark it as dirty for it to be updated
							if (entityGeometry instanceof THREE.ParticleSystem) {
								entityGeometry.geometry.verticesNeedUpdate = true;
							}
						}
					}
				}
				VARS.needsUpdate = false;
			}
			
			if (VARS.customUpdate != null) {
				GEPPETTO.customUpdate();
			}
		},

		/**
		 * Updates a THREE geometry from the json one
		 * 
		 * @param g
		 *            the update json geometry
		 */
		updateGeometry : function(instancepath, g) {
			var threeObject = VARS.visualModelMap[instancepath+"."+g.id];
			if (threeObject) {
				if (threeObject instanceof THREE.Vector3) {
					threeObject.x = g.position.x;
					threeObject.y = g.position.y;
					threeObject.z = g.position.z;
				} else {
					// update the position
					threeObject.position.set(g.position.x, g.position.y,
							g.position.z);
				}
			}
		},

		/**
		 * Creates a cylinder
		 * 
		 * @param bottomBasePos
		 * @param topBasePos
		 * @param radiusTop
		 * @param radiusBottom
		 * @param material
		 * @returns a Cylinder translated and rotated in the scene according to
		 *          the cartesian coordinated that describe it
		 */
		getCylinder : function(bottomBasePos, topBasePos, radiusTop,
				radiusBottom, material) {
			var cylinderAxis = new THREE.Vector3();
			cylinderAxis.subVectors(topBasePos, bottomBasePos);

			var cylHeight = cylinderAxis.length();

			var midPoint = new THREE.Vector3();
			midPoint.addVectors(bottomBasePos, topBasePos);
			midPoint.multiplyScalar(0.5);

			var c = new THREE.CylinderGeometry(radiusTop, radiusBottom,
					cylHeight, 6, 1, false);

			c.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));

			var threeObject = new THREE.Mesh(c, material);

			threeObject.lookAt(cylinderAxis);
			var distance = midPoint.length();

			midPoint.transformDirection(threeObject.matrix);
			midPoint.multiplyScalar(distance);

			threeObject.position.add(midPoint);
			return threeObject;
		},

		/**
		 * @param jsonEntity
		 *            the id of the entity to light up
		 * @param intensity
		 *            the lighting intensity from 0 (no illumination) to 1 (full
		 *            illumination)
		 */
		lightUpEntity : function(jsonEntity, intensity) {
			if (intensity < 0) {
				intensity = 0;
			}
			if (intensity > 1) {
				intensity = 1;
			}

			var getRGB = function(hexString) {
				return {
					r : parseInt(hexString.substr(2, 2), 16),
					g : parseInt(hexString.substr(4, 2), 16),
					b : parseInt(hexString.substr(6, 2), 16)
				};
			};
			var scaleColor = function(color) {
				return (Math.floor(color + ((255 - color) * intensity)))
						.toString(16);
			};
			var threeObject = GEPPETTO.getThreeObjectFromEntityId(jsonEntity);
			if (threeObject != null) {
				var originalColor = getRGB(threeObject.material.originalColor);
				threeObject.material.color.setHex('0x'
						+ scaleColor(originalColor.r)
						+ scaleColor(originalColor.g)
						+ scaleColor(originalColor.b));
			}
		},

		/**
		 * @param runTimeTree
		 */
		populateScene : function(runTimeTree) {
			for ( var eindex in runTimeTree) {
				GEPPETTO.loadEntity(runTimeTree[eindex]);
			}

			GEPPETTO.calculateSceneCenter(VARS.scene);
			GEPPETTO.updateCamera();
		},

		/**
		 * @param entityNode 
		 */
		loadEntity : function(entityNode, materialParam) {
			var material = materialParam;// ==undefined?GEPPETTO.getMeshPhongMaterial():materialParam;
			var aspects = entityNode.aspects;
			var children = entityNode.children;
			var position = entityNode.position;
			VARS.entities[entityNode.instancePath] = {};
			for ( var a in aspects) {
				var aspect = aspects[a];
				var meshes = GEPPETTO.getThreeObjectFromVisualizationTree(
						aspect, true, material);
				for ( var m in meshes) {
					var mesh = meshes[m];
					mesh.name = aspect.instancePath;
					VARS.scene.add(mesh);
					if (position != null) {
						mesh.position = new THREE.Vector3(position.x,
								position.y, position.z);
					}
					VARS.aspects[mesh.eid] = mesh;
					VARS.aspects[mesh.eid].visible = true;
					VARS.aspects[mesh.eid].selected = false;
					VARS.entities[entityNode.instancePath].selected = false;
					VARS.entities[entityNode.instancePath][mesh.eid] = VARS.aspects[mesh.eid];
					VARS.entities[entityNode.instancePath][mesh.eid].selected = false;
				}
			}
			for ( var c in children) {
				GEPPETTO.loadEntity(children[c], material);
			}

		},

		getMeshPhongMaterial : function() {
			var material = new THREE.MeshPhongMaterial({
				opacity : 1,
				ambient : 0x777777,
				shininess : 2,
				shading : THREE.SmoothShading
			});

			material.originalColor = '0x'
					+ (0x1000000 + (Math.random()) * 0xffffff).toString(16)
							.substr(1, 6);
			material.color.setHex(material.originalColor);
			return material;
		},
		/**
		 * @param visualModel
		 * @param merge
		 *            if true all the visual models will be merged into one,
		 *            otherwise an array of Three objects will be returned
		 */
		getThreeObjectFromVisualizationTree : function(aspect, merge, materialParam) {
			var combined = new THREE.Geometry();
			var material = materialParam == undefined ? GEPPETTO
					.getMeshPhongMaterial() : materialParam;
			var entityObjects = [];
			var visualizationTree = aspect.VisualizationTree;
			for ( var vm in visualizationTree) {
				node = visualizationTree[vm];
				if (node != null && typeof node === "object") {
					var metaType = node._metaType;
					//look for group of nodes
					if (metaType == "CompositeNode") {
						var firstVO = node[Object.keys(node)[0]];
						var firstVOmetaType = firstVO._metaType;

						if (firstVOmetaType == "ParticleNode") {
							merge = false;				

							var entityObject = GEPPETTO.createParticleSystem(aspect.instancePath, node);
							entityObjects.push(entityObject);

						} else if (firstVOmetaType == "ColladaNode") {
							entityObjects.push(GEPPETTO
									.getThreeObjectFromJSONGeometry(aspect.instancePath,node[vg]));
						}
						else if (firstVOmetaType == "OBJNode")
						{
							entityObjects.push(GEPPETTO.getThreeObjectFromJSONGeometry(aspect.instancePath,node[vg]));
						}
						else if (firstVOmetaType == "CylinderNode"
								|| firstVOmetaType == "SphereNode")

						{
							if (!merge) {
								// if we are not merging combine is local and
								// only
								// the visual objects within
								// the same visual model will be combined
								combined = new THREE.Geometry();
							}

							for ( var key in node) {
								var vg = node[key];

								if (typeof vg === "object") {
									var threeObject = GEPPETTO
											.getThreeObjectFromJSONGeometry(aspect.instancePath,vg,
													material);
									THREE.GeometryUtils.merge(combined,
											threeObject);
									threeObject.geometry.dispose();
								}
							}

							if (!merge) {
								entityObject = new THREE.Mesh(combined,
										material);
								// entityObject.eindex = eindex;
								entityObject.eid = aspect.instancePath;
								entityObject.geometry.dynamic = false;
								entityObjects.push(entityObject);
							}
						}
					} else {
						if (metaType == "ParticleNode") {
							var entityObject = GEPPETTO.createParticleSystem(aspect.instancePath, visualizationTree);
							entityObjects.push(entityObject);

						}else if (metaType == "ColladaNode") {
							entityObjects.push(GEPPETTO
									.getThreeObjectFromJSONGeometry(aspect.instancePath,node));
						} 
						else if (metaType == "OBJNode")
						{
							entityObjects.push(GEPPETTO.getThreeObjectFromJSONGeometry(aspect.instancePath,node));
						}
						else if (metaType == "CylinderNode"
								|| metaType == "SphereNode")

						{
							if (!merge) {
								combined = new THREE.Geometry();
							}

							if (typeof node === "object") {
								var threeObject = GEPPETTO
										.getThreeObjectFromJSONGeometry(aspect.instancePath,node,
												material);
								THREE.GeometryUtils
										.merge(combined, threeObject);
								threeObject.geometry.dispose();
							}

							if (!merge) {
								entityObject = new THREE.Mesh(combined,
										material);
								// entityObject.eindex = eindex;
								entityObject.eid = aspect.instancePath;
								entityObject.geometry.dynamic = false;
								entityObjects.push(entityObject);
							}
						}
					}
				}
			}
			// FIXME Matteo: this applies only to sphere/cylinders geometries,
			// fix me as it's quite ugly
			if (merge) {
				entityObject = new THREE.Mesh(combined, material);
				// entityObject.eindex = eindex;
				entityObject.eid = aspect.instancePath;
				entityObject.geometry.dynamic = false;
				entityObjects.push(entityObject);
			}
			return entityObjects;
		},
		
		createParticleSystem : function(instancePath, node){
			var particleGeometry = new THREE.Geometry();
			// assumes there are no particles mixed with
			// other kind of
			// geometry hence if the first one is a particle
			// then they all are
			// create the particle variables
			var pMaterial = new THREE.ParticleBasicMaterial({
				size : 5,
				map : THREE.ImageUtils
						.loadTexture("images/particle.png"),
				blending : THREE.AdditiveBlending,
				depthTest : false,
				transparent : true
			});
			pMaterial.color = new THREE.Color(0xffffff);
			THREE.ColorConverter.setHSV(pMaterial.color, Math
					.random(), 1.0, 1.0);
			pMaterial.originalColor = pMaterial.color
					.getHexString();
			for ( var vg in node) {
				if (node[vg]._metaType == "ParticleNode") {
					var threeObject = GEPPETTO
							.getThreeObjectFromJSONGeometry(
									instancePath,node[vg], pMaterial);
					particleGeometry.vertices.push(threeObject);
				}
			}

			var entityObject = new THREE.ParticleSystem(
					particleGeometry, pMaterial);
			entityObject.eid = instancePath;
			// also update the particle system to sort the
			// particles which enables the behaviour we want
			entityObject.sortParticles = true;
			VARS.visualModelMap[instancePath] = entityObject;

			return entityObject;
		},

		/**
		 * Compute the center of the scene.
		 */
		calculateSceneCenter : function(scene) {
			var aabbMin = null;
			var aabbMax = null;

			scene.traverse(function(child) {
				if (child instanceof THREE.Mesh
						|| child instanceof THREE.ParticleSystem) {
					child.geometry.computeBoundingBox();

					// If min and max vectors are null, first values become
					// default min and max
					if (aabbMin == null && aabbMax == null) {
						aabbMin = child.geometry.boundingBox.min;
						aabbMax = child.geometry.boundingBox.max;
					}

					// Compare other meshes, particles BB's to find min and max
					else {
						aabbMin.x = Math.min(aabbMin.x,
								child.geometry.boundingBox.min.x);
						aabbMin.y = Math.min(aabbMin.y,
								child.geometry.boundingBox.min.y);
						aabbMin.z = Math.min(aabbMin.z,
								child.geometry.boundingBox.min.z);
						aabbMax.x = Math.max(aabbMax.x,
								child.geometry.boundingBox.max.x);
						aabbMax.y = Math.max(aabbMax.y,
								child.geometry.boundingBox.max.y);
						aabbMax.z = Math.max(aabbMax.z,
								child.geometry.boundingBox.max.z);
					}
				}
			});

			// Compute world AABB center
			VARS.sceneCenter.x = (aabbMax.x + aabbMin.x) * 0.5;
			VARS.sceneCenter.y = (aabbMax.y + aabbMin.y) * 0.5;
			VARS.sceneCenter.z = (aabbMax.z + aabbMin.z) * 0.5;

			// Compute world AABB "radius"
			var diag = new THREE.Vector3();
			diag = diag.subVectors(aabbMax, aabbMin);
			var radius = diag.length() * 0.5;

			// Compute offset needed to move the camera back that much needed to
			// center AABB
			var offset = radius
					/ Math.tan(Math.PI / 180.0 * VARS.camera.fov * 0.25);

			var camDir = new THREE.Vector3(0, 0, 1.0);
			camDir.multiplyScalar(offset);

			// Store camera position
			VARS.cameraPosition = new THREE.Vector3();
			VARS.cameraPosition.addVectors(VARS.sceneCenter, camDir);
		},

		/**
		 * Update camera with new position and place to lookat
		 */
		updateCamera : function() {
			// Update camera
			VARS.camera.rotationAutoUpdate = false;
			VARS.camera.position.set(VARS.cameraPosition.x,
					VARS.cameraPosition.y, VARS.cameraPosition.z);
			VARS.camera.lookAt(VARS.sceneCenter);
			VARS.camera.up = new THREE.Vector3(0, 1, 0);
			VARS.camera.rotationAutoUpdate = true;
			VARS.controls.target = VARS.sceneCenter;
		},

		/**
		 * @returns {Boolean}
		 */
		isScenePopulated : function() {
			return !(_.isEmpty(VARS.visualModelMap));
		},

		isCanvasCreated : function() {
			return VARS.canvasCreated;
		},

		/**
		 * Creates a geometry according to its type
		 * 
		 * @param g
		 * @param material
		 * @returns {Mesh} a three mesh representing the geometry
		 */
		getThreeObjectFromJSONGeometry : function(instancepath,g, material) {
			var threeObject = null;
			switch (g._metaType) {
			case "ParticleNode":
				threeObject = new THREE.Vector3();
				threeObject.x = g.position.x;
				threeObject.y = g.position.y;
				threeObject.z = g.position.z;

				break;
			case "CylinderNode":
				var lookAtV = new THREE.Vector3(g.distal.x, g.distal.y,
						g.distal.z);
				var positionV = new THREE.Vector3(g.position.x, g.position.y,
						g.position.z);
				threeObject = GEPPETTO.getCylinder(positionV, lookAtV,
						g.radiusTop, g.radiusBottom, material);
				break;
			case "SphereNode":
				threeObject = new THREE.Mesh(new THREE.SphereGeometry(g.radius,
						20, 20), material);
				threeObject.position.set(g.position.x, g.position.y,
						g.position.z);
				break;
			case "ColladaNode":
				var loader = new THREE.ColladaLoader();
				loader.options.convertUpAxis = true;
				var xmlParser = new DOMParser();
				var responseXML = xmlParser.parseFromString(g.model.data,
						"application/xml");
				loader.parse(responseXML, function(collada) {

					threeObject = collada.scene;

				});
				break;
			case "OBJNode":
				var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {

					console.log( item, loaded, total );

				};
				var loader = new THREE.OBJLoader( manager );
				threeObject=loader.parse(g.model.data);
				break;
			}
			threeObject.visible = true;
			// add the geometry to a map indexed by the geometry id so we can
			// find it
			// for updating purposes
			VARS.visualModelMap[instancepath + "." + g.id] = threeObject;
			return threeObject;
		},

		/**
		 * Sets up the HUD display with the scene stat's fps.
		 */
		setupStats : function() {
			// Stats
			if ($("#stats").length == 0) {
				if (VARS != null) {
					VARS.stats = new Stats();
					VARS.stats.domElement.style.float = 'right';
					VARS.stats.domElement.style.position = 'absolute';
					VARS.stats.domElement.style.bottom = '0px';
					VARS.stats.domElement.style.right = '0px';
					VARS.stats.domElement.style.zIndex = 100;
					$('#footerHeader').append(VARS.stats.domElement);
				}
			}
		},

		showStats : function() {
			if ($("#stats").length == 0) {
				GEPPETTO.setupStats();
			} else {
				$("#stats").show();
			}
		},

		hideStats : function() {
			$("#stats").hide();
		},

		/**
		 * Create a GUI element based on the available metadata
		 */
		setupGUI : function() {
			var data = !(_.isEmpty(VARS.metadata));

			// GUI
			if (!VARS.gui && data) {
				VARS.gui = new dat.GUI({
					width : 400
				});
				GEPPETTO.addGUIControls(VARS.gui, VARS.metadata);
			}
			for (f in VARS.gui.__folders) {
				// opens only the root folders
				VARS.gui.__folders[f].open();
			}

		},

		/**
		 * @param gui
		 * @param metadatap
		 */
		addGUIControls : function(parent, current_metadata) {
			if (current_metadata.hasOwnProperty("ID")) {
				parent.add(current_metadata, "ID").listen();
			}
			for ( var m in current_metadata) {
				if (m != "ID") {
					if (typeof current_metadata[m] == "object") {
						var folder = parent.addFolder(m);
						// recursive call to populate the GUI with sub-metadata
						GEPPETTO.addGUIControls(folder, current_metadata[m]);
					} else {
						parent.add(current_metadata, m).listen();
					}
				}
			}
		},

		/**
		 * Adds debug axis to the scene
		 */
		setupAxis : function() {
			// To use enter the axis length
			VARS.scene.add(new THREE.AxisHelper(200));
		},

		/**
		 * Renders objects in the scene
		 */
		render : function() {
			VARS.renderer.render(VARS.scene, VARS.camera);
		},

		/**
		 * 
		 * @returns {Array} a list of objects intersected by the current mouse
		 *          coordinates
		 */
		getIntersectedObjects : function() {
			// create a Ray with origin at the mouse position and direction into
			// the
			// scene (camera direction)
			var vector = new THREE.Vector3(VARS.mouse.x, VARS.mouse.y, 1);
			VARS.projector.unprojectVector(vector, VARS.camera);

			var raycaster = new THREE.Raycaster(VARS.camera.position, vector
					.sub(VARS.camera.position).normalize());

			var visibleChildren = [];
			VARS.scene.traverse(function(child) {
				if (child.visible) {
					visibleChildren.push(child);
				}
			});

			// returns an array containing all objects in the scene with which
			// the ray
			// intersects
			return raycaster.intersectObjects(visibleChildren);
		},

		/**
		 * @param key
		 *            the pressed key
		 * @returns {boolean} true if the key is pressed
		 */
		isKeyPressed : function(key) {
			return VARS.keyboard.pressed(key);
		},

		/**
		 * @returns {Number} A new id
		 */
		getNewId : function() {
			return VARS.idCounter++;
		},

		/**
		 * @param entityIndex
		 *            the id of the entity for which we want to display metadata
		 */
		showMetadataForEntity : function(entityIndex) {
			if (VARS.gui) {
				VARS.gui.domElement.parentNode.removeChild(VARS.gui.domElement);
				VARS.gui = null;
			}

			VARS.metadata = VARS.runtimetree[entityIndex].metadata;
			VARS.metadata.ID = VARS.runtimetree[entityIndex].id;

			GEPPETTO.setupGUI();

		},

		/**
		 * Animate simulation
		 */
		animate : function() {
			VARS.debugUpdate = VARS.needsUpdate; // so that we log only the
			// cycles when we are
			// updating the scene
			if (GEPPETTO.Simulation.getSimulationStatus() == 2
					&& VARS.debugUpdate) {
				GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_STARTING);
			}
			VARS.controls.update();
			requestAnimationFrame(GEPPETTO.animate);
			if (VARS.rotationMode) {
				var timer = new Date().getTime() * 0.0005;
				VARS.camera.position.x = Math.floor(Math.cos(timer) * 200);
				VARS.camera.position.z = Math.floor(Math.sin(timer) * 200);
			}
			GEPPETTO.render();
			if (VARS.stats) {
				VARS.stats.update();
			}
			if (GEPPETTO.Simulation.getSimulationStatus() == 2
					&& VARS.debugUpdate) {
				GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_END);
			}
		},

		/**
		 * @param aroundObject
		 *            the object around which the rotation will happen
		 */
		enterRotationMode : function(aroundObject) {
			VARS.rotationMode = true;
			if (aroundObject) {
				VARS.camera.lookAt(aroundObject);
			}
		},

		/**
		 * Exit rotation mode
		 */
		exitRotationMode : function() {
			VARS.rotationMode = false;
		},

		/**
		 * @param entityId
		 *            the entity id
		 */
		getThreeObjectFromEntityId : function(entityId) {
			var threeObject = null;
			VARS.scene.traverse(function(child) {
				if (child.hasOwnProperty("eid") && child.eid == entityId) {
					threeObject = child;
				}
			});
			return threeObject;
		},

		unSelectAll : function() {
			for ( var v in VARS.entities) {
				var entity = VARS.entities[v];
				for(var e in entity){
					if(entity[e].selected == true){
						entity.selected = false;
						GEPPETTO.unselectAspect(entity[e].eid);
					}
				}
			}
		},
		
		selectEntity : function(instancePath) {
			for ( var v in VARS.entities) {
				if(v == instancePath){
					var entity = VARS.entities[v];
					if(entity.selected == false){
						entity.selected = true;
						for(var a in entity){
							GEPPETTO.selectAspect(entity[a].eid);
						}

						return true;
					}
				}
			}
			return false;
		},
		
		unselectEntity : function(instancePath) {
			for ( var v in VARS.entities) {
				if(v == instancePath){
					var entity = VARS.entities[v];
					if(entity.selected == true){
						entity.selected = false;
						for(var a in entity){
							GEPPETTO.unselectAspect(entity[a].eid);
						}

						return true;
					}
				}
			}
			return false;
		},

		showEntity : function(instancePath) {
			for ( var v in VARS.entities) {
				if (v == instancePath) {
					var entity = VARS.entities[v];
					for(var a in entity){
						GEPPETTO.showAspect(entity[a].eid);
					}
				}
			}
			;

			return false;
		},
		
		hideEntity : function(instancePath) {
			for ( var v in VARS.entities) {
				if (v == instancePath) {
					var entity = VARS.entities[v];
					for(var a in entity){
						GEPPETTO.hideAspect(entity[a].eid);
					}
				}
			}
			;
			return false;
		},

		zoomToEntity : function(instancePath) {
			var entity = null;
			for ( var e in VARS.entities) {
				if ( e == instancePath) {
					entity = VARS.entities[e];
				}
			}
			
			if(entity!=null){
				GEPPETTO.calculateSceneCenter(entity);
				GEPPETTO.updateCamera();
			}
		},
		
		selectAspect : function(instancePath) {
			for ( var v in VARS.aspects) {
				if(v == instancePath){
					if(VARS.aspects[v].selected == false){
						VARS.aspects[v].material.color.setHex(0xFFFF33);
						VARS.aspects[v].selected = true;
					}
					
					return true;
				}
			}
			return false;
		},
		
		unselectAspect : function(instancePath) {
			for ( var key in VARS.aspects) {
				if(key == instancePath){
					if(VARS.aspects[key].selected == true){
						VARS.aspects[key].material.color.setHex(Math.random() * 0xffffff);
						VARS.aspects[key].selected = false;
					}
					return true;
				}
			}

			return false;
		},

		showAspect : function(instancePath) {
			for ( var v in VARS.aspects) {
				if (v == instancePath) {
					if (VARS.aspects[v].visible == true) {
						return false;
					} else {
						VARS.aspects[v].visible = true;
						return true;
					}
				}
			}
			;

			return false;
		},
		
		hideAspect : function(instancePath) {
			for ( var v in VARS.aspects) {
				if (v == instancePath) {
					if (VARS.aspects[v].visible == false) {
						return false;
					} else {
						VARS.aspects[v].visible = false;
						return true;
					}
				}
			}
			;
			return false;
		},

		zoomToAspect : function(instancePath) {
			var aspect;
			for ( var a in VARS.aspects) {
				if ( instancepath == a) {
					aspect = VARS.aspects[a];
				}
			}
			
			if(aspect!=null){
				GEPPETTO.calculateSceneCenter(aspect);
				GEPPETTO.updateCamera();
			}
		},

		resetCamera : function() {
			GEPPETTO.calculateSceneCenter(VARS.scene);
			GEPPETTO.updateCamera();
		},

		/**
		 * @param x
		 * @param y
		 */
		incrementCameraPan : function(x, y) {
			VARS.controls.incrementPanEnd(x, y);
		},

		/**
		 * @param x
		 * @param y
		 * @param z
		 */
		incrementCameraRotate : function(x, y, z) {
			VARS.controls.incrementRotationEnd(x, y, z);
		},

		/**
		 * @param z
		 */
		incrementCameraZoom : function(z) {
			VARS.controls.incrementZoomEnd(z);
		},

		/**
		 * @param msg
		 */
		log : function(msg) {
			if (VARS.debug) {
				var d = new Date();
				var curr_hour = d.getHours();
				var curr_min = d.getMinutes();
				var curr_sec = d.getSeconds();
				var curr_msec = d.getMilliseconds();

				console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":"
						+ curr_msec + ' - ' + msg, "");

			}
		},

		/**
		 * @param category
		 * @param action
		 * @param opt_label
		 * @param opt_value
		 * @param opt_noninteraction
		 */
		trackActivity : function(category, action, opt_label, opt_value,
				opt_noninteraction) {
			if (typeof _gaq != 'undefined') {
				_gaq.push([ '_trackEvent', category, action, opt_label,
						opt_value, opt_noninteraction ]);
			}
		}
	};

    _.extend(GEPPETTO, Backbone.Events);

	require('SandboxConsole')(GEPPETTO);
	require('GEPPETTO.Resources')(GEPPETTO);
	require('GEPPETTO.Init')(GEPPETTO);
	require('GEPPETTO.Vanilla')(GEPPETTO);
	require('GEPPETTO.FE')(GEPPETTO);
	require('GEPPETTO.ScriptRunner')(GEPPETTO);
	//require('GEPPETTO.SimulationContentEditor')(GEPPETTO);
	require('GEPPETTO.JSEditor')(GEPPETTO);
	require('GEPPETTO.Console')(GEPPETTO);
	require('GEPPETTO.Utility')(GEPPETTO);
	require('GEPPETTO.Share')(GEPPETTO);
	require('websocket-handlers/GEPPETTO.MessageSocket')(GEPPETTO);
	require('websocket-handlers/GEPPETTO.GlobalHandler')(GEPPETTO);
	require('websocket-handlers/GEPPETTO.SimulationHandler')(GEPPETTO);
	require('geppetto-objects/Simulation')(GEPPETTO);
	require('geppetto-objects/G')(GEPPETTO);
	require('GEPPETTO.Main')(GEPPETTO);
	//require('GEPPETTO.Tutorial')(GEPPETTO);
	require("widgets/includeWidget")(GEPPETTO);
	require('nodes/RuntimeTreeFactory')(GEPPETTO);


	return GEPPETTO;

});
