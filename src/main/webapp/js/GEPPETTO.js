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

define(function(require)
{

	var $ = require('jquery'), _ = require('underscore');

	require('vendor/Detector');
	require('three');
	require('vendor/THREEx.KeyboardState');

	/**
	 * Local variables
	 */
	var VARS;
	/**
	 * Initialize the engine
	 */
	var GEPPETTO =
	{
		init : function(containerp)
		{
			if (!Detector.webgl)
			{
				Detector.addGetWebGLMessage();
				return false;
			} else
			{
				VARS = GEPPETTO.Init.initialize(containerp);
				return true;
			}
		},

		/**
		 * Updates the scene
		 */
		updateScene : function()
		{
			if (VARS.needsUpdate)
			{
				var entities = VARS.jsonscene;

				for ( var eindex in entities)
				{

					var entity = entities[eindex];
					for ( var a in entity.aspects)
					{
						var aspect = entity.aspects[a];
						for ( var vm in aspect.visualModel)
						{
							var visualModel = aspect.visualModel[vm];
							var geometries = visualModel.objects;

							for ( var gindex in geometries)
							{
								GEPPETTO.updateGeometry(geometries[gindex]);
							}

							var entityGeometry = VARS.visualModelMap[visualModel.id];
							if (entityGeometry)
							{
								// if an entity is represented by a particle
								// system we need to
								// mark it as dirty for it to be updated
								if (entityGeometry instanceof THREE.ParticleSystem)
								{
									entityGeometry.geometry.verticesNeedUpdate = true;
								}
							}
						}
					}
				}
				VARS.needsUpdate = false;
			}
		},

		/**
		 * Updates a THREE geometry from the json one
		 * 
		 * @param g
		 *            the update json geometry
		 */
		updateGeometry : function(g)
		{
			var threeObject = VARS.visualModelMap[g.id];
			if (threeObject)
			{
				if (threeObject instanceof THREE.Vector3)
				{
					threeObject.x = g.position.x;
					threeObject.y = g.position.y;
					threeObject.z = g.position.z;
				} else
				{
					// update the position
					threeObject.position.set(g.position.x, g.position.y, g.position.z);
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
		getCylinder : function(bottomBasePos, topBasePos, radiusTop, radiusBottom, material)
		{
			var cylinderAxis = new THREE.Vector3();
			cylinderAxis.subVectors(topBasePos, bottomBasePos);

			var cylHeight = cylinderAxis.length();

			var midPoint = new THREE.Vector3();
			midPoint.addVectors(bottomBasePos, topBasePos);
			midPoint.multiplyScalar(0.5);

			var c = new THREE.CylinderGeometry(radiusTop, radiusBottom, cylHeight, 6, 1, false);

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
		lightUpEntity : function(jsonEntity, intensity)
		{
			if (intensity < 0)
			{
				intensity = 0;
			}
			if (intensity > 1)
			{
				intensity = 1;
			}

			var getRGB = function(hexString)
			{
				return{
					r : parseInt(hexString.substr(2, 2), 16),
					g : parseInt(hexString.substr(4, 2), 16),
					b : parseInt(hexString.substr(6, 2), 16)
				};
			};
			var scaleColor = function(color)
			{
				return (Math.floor(color + ((255 - color) * intensity))).toString(16);
			};
			var threeObject = GEPPETTO.getThreeObjectFromEntityId(jsonEntity);
			var originalColor = getRGB(threeObject.material.originalColor);
			threeObject.material.color.setHex('0x' + scaleColor(originalColor.r) + scaleColor(originalColor.g) + scaleColor(originalColor.b));
		},

		/**
		 * @param jsonscene
		 */
		populateScene : function(jsonscene)
		{
			this.jsonscene = jsonscene;
			for ( var eindex in jsonscene)
			{
				var jsonEntity = jsonscene[eindex];
				var aspects = jsonEntity.aspects;
				for ( var a in aspects)
				{
					var aspect = aspects[a];
					VARS.scene.add(GEPPETTO.getThreeObjectFromVisualModel(aspect.visualModel, aspect.instancePath, true));
				}
			}

			GEPPETTO.calculateSceneCenter();
			GEPPETTO.updateCamera();
		},

		/**
		 * @param visualModel
		 * @param merge
		 *            if true all the visual models will be merged into one,
		 *            otherwise an array of Three objects will be returned
		 */
		getThreeObjectFromVisualModel : function(visualModels, aspectInstancePath, merge)
		{
			var getMeshPhongMaterial = function()
			{
				var material = new THREE.MeshPhongMaterial(
				{
					opacity : 1,
					ambient : 0x777777,
					shininess : 2,
					shading : THREE.SmoothShading
				});

				material.originalColor = '0x' + (0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
				material.color.setHex(material.originalColor);
				return material;
			};

			var combined = new THREE.Geometry();
			var material = getMeshPhongMaterial();
			if(!merge)
			{
				entityObjects=[];
			}
			for ( var vm in visualModels)
			{
				visualModel = visualModels[vm];

				var vobjects = visualModel.objects;
				if (vobjects != null && vobjects.length)
				{
					if (vobjects[0].type == "Particle")
					{
						// assumes there are no particles mixed with
						// other kind of
						// geometry hence if the first one is a particle
						// then they all are
						// create the particle variables
						var pMaterial = new THREE.ParticleBasicMaterial(
						{
							size : 5,
							map : THREE.ImageUtils.loadTexture("images/particle.png"),
							blending : THREE.AdditiveBlending,
							depthTest : false,
							transparent : true
						});
						pMaterial.color = new THREE.Color(0xffffff);
						THREE.ColorConverter.setHSV(pMaterial.color, Math.random(), 1.0, 1.0);
						pMaterial.originalColor = pMaterial.color.getHexString();

						var geometry = new THREE.Geometry();
						for ( var voIndex in vobjects)
						{
							var threeObject = GEPPETTO.getThreeObjectFromJSONGeometry(vobjects[voIndex], pMaterial);
							geometry.vertices.push(threeObject);
						}
						entityObject = new THREE.ParticleSystem(geometry, pMaterial);
						entityObject.eid = aspectInstancePath;
						// also update the particle system to sort the particles which enables the behaviour we want
						entityObject.sortParticles = true;
						VARS.visualModelMap[visualModel.id] = entityObject;
						//FIXME Matteo: the case in which multiple visual models are sent for a particle scene is 
						//not handles as it's not handled potentially merging them
						return entityObject;
					} else
					{
						if (!merge)
						{
							// if we are not merging combine is local and only
							// the visual objects within
							// the same visual model will be combined
							combined = new THREE.Geometry();
						}
						for ( var voIndex in vobjects)
						{
							var threeObject = GEPPETTO.getThreeObjectFromJSONGeometry(vobjects[voIndex], material);
							THREE.GeometryUtils.merge(combined, threeObject);
							threeObject.geometry.dispose();
						}
						if (!merge)
						{
							entityObject = new THREE.Mesh(combined, material);
							// entityObject.eindex = eindex;
							entityObject.eid = visualModel.id;
							entityObject.geometry.dynamic = false;
							entityObjects.push(entityObject);
						}
					}
				}
			}
			//FIXME Matteo: this applies only to sphere/cylinders geometries, fix me as it's quite ugly 
			if(merge)
			{
				entityObject = new THREE.Mesh(combined, material);
				// entityObject.eindex = eindex;
				entityObject.eid = aspectInstancePath;
				entityObject.geometry.dynamic = false;
				return entityObject;	
			}
			else
			{
				return entityObjects;
			}
			
		},

		/**
		 * Compute the center of the scene.
		 */
		calculateSceneCenter : function()
		{
			var aabbMin = null;
			var aabbMax = null;

			VARS.scene.traverse(function(child)
			{
				if (child instanceof THREE.Mesh || child instanceof THREE.ParticleSystem)
				{
					child.geometry.computeBoundingBox();

					// If min and max vectors are null, first values become
					// default min and max
					if (aabbMin == null && aabbMax == null)
					{
						aabbMin = child.geometry.boundingBox.min;
						aabbMax = child.geometry.boundingBox.max;
					}

					// Compare other meshes, particles BB's to find min and max
					else
					{
						aabbMin.x = Math.min(aabbMin.x, child.geometry.boundingBox.min.x);
						aabbMin.y = Math.min(aabbMin.y, child.geometry.boundingBox.min.y);
						aabbMin.z = Math.min(aabbMin.z, child.geometry.boundingBox.min.z);
						aabbMax.x = Math.max(aabbMax.x, child.geometry.boundingBox.max.x);
						aabbMax.y = Math.max(aabbMax.y, child.geometry.boundingBox.max.y);
						aabbMax.z = Math.max(aabbMax.z, child.geometry.boundingBox.max.z);
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
			var offset = radius / Math.tan(Math.PI / 180.0 * VARS.camera.fov * 0.25);

			var camDir = new THREE.Vector3(0, 0, 1.0);
			camDir.multiplyScalar(offset);

			// Store camera position
			VARS.cameraPosition = new THREE.Vector3();
			VARS.cameraPosition.addVectors(VARS.sceneCenter, camDir);
		},

		/**
		 * Update camera with new position and place to lookat
		 */
		updateCamera : function()
		{
			// Update camera
			VARS.camera.rotationAutoUpdate = false;
			VARS.camera.position.set(VARS.cameraPosition.x, VARS.cameraPosition.y, VARS.cameraPosition.z);
			VARS.camera.lookAt(VARS.sceneCenter);
			VARS.camera.up = new THREE.Vector3(0, 1, 0);
			VARS.camera.rotationAutoUpdate = true;
			VARS.controls.target = VARS.sceneCenter;
		},

		/**
		 * @returns {Boolean}
		 */
		isScenePopulated : function()
		{
			return !(_.isEmpty(VARS.visualModelMap));
		},

		isCanvasCreated : function()
		{
			return VARS.canvasCreated;
		},

		/**
		 * Creates a geometry according to its type
		 * 
		 * @param g
		 * @param material
		 * @returns {Mesh} a three mesh representing the geometry
		 */
		getThreeObjectFromJSONGeometry : function(g, material)
		{
			var threeObject = null;
			switch (g.type)
			{
			case "Particle":
				threeObject = new THREE.Vector3();
				threeObject.x = g.position.x;
				threeObject.y = g.position.y;
				threeObject.z = g.position.z;

				break;
			case "Cylinder":
				var lookAtV = new THREE.Vector3(g.distal.x, g.distal.y, g.distal.z);
				var positionV = new THREE.Vector3(g.position.x, g.position.y, g.position.z);
				threeObject = GEPPETTO.getCylinder(positionV, lookAtV, g.radiusTop, g.radiusBottom, material);
				break;
			case "Sphere":
				threeObject = new THREE.Mesh(new THREE.SphereGeometry(g.radius, 20, 20), material);
				threeObject.position.set(g.position.x, g.position.y, g.position.z);
				break;
			}
			// add the geometry to a map indexed by the geometry id so we can
			// find it
			// for updating purposes
			VARS.visualModelMap[g.id] = threeObject;
			return threeObject;
		},

		/**
		 * Sets up the HUD display with the scene stat's fps.
		 */
		setupStats : function()
		{
			// Stats
			if ($("#stats").length == 0)
			{
				if (VARS != null)
				{
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

		showStats : function()
		{
			if ($("#stats").length == 0)
			{
				GEPPETTO.setupStats();
			} else
			{
				$("#stats").show();
			}
		},

		hideStats : function()
		{
			$("#stats").hide();
		},

		/**
		 * Create a GUI element based on the available metadata
		 */
		setupGUI : function()
		{
			var data = !(_.isEmpty(VARS.metadata));

			// GUI
			if (!VARS.gui && data)
			{
				VARS.gui = new dat.GUI(
				{
					width : 400
				});
				GEPPETTO.addGUIControls(VARS.gui, VARS.metadata);
			}
			for (f in VARS.gui.__folders)
			{
				// opens only the root folders
				VARS.gui.__folders[f].open();
			}

		},

		/**
		 * @param gui
		 * @param metadatap
		 */
		addGUIControls : function(parent, current_metadata)
		{
			if (current_metadata.hasOwnProperty("ID"))
			{
				parent.add(current_metadata, "ID").listen();
			}
			for ( var m in current_metadata)
			{
				if (m != "ID")
				{
					if (typeof current_metadata[m] == "object")
					{
						var folder = parent.addFolder(m);
						// recursive call to populate the GUI with sub-metadata
						GEPPETTO.addGUIControls(folder, current_metadata[m]);
					} else
					{
						parent.add(current_metadata, m).listen();
					}
				}
			}
		},

		/**
		 * Adds debug axis to the scene
		 */
		setupAxis : function()
		{
			// To use enter the axis length
			VARS.scene.add(new THREE.AxisHelper(200));
		},

		/**
		 * Renders objects in the scene
		 */
		render : function()
		{
			VARS.renderer.render(VARS.scene, VARS.camera);
		},

		/**
		 * 
		 * @returns {Array} a list of objects intersected by the current mouse
		 *          coordinates
		 */
		getIntersectedObjects : function()
		{
			// create a Ray with origin at the mouse position and direction into
			// the
			// scene (camera direction)
			var vector = new THREE.Vector3(VARS.mouse.x, VARS.mouse.y, 1);
			VARS.projector.unprojectVector(vector, VARS.camera);

			var raycaster = new THREE.Raycaster(VARS.camera.position, vector.sub(VARS.camera.position).normalize());

			var visibleChildren = [];
			VARS.scene.traverse(function(child)
			{
				if (child.visible)
				{
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
		isKeyPressed : function(key)
		{
			return VARS.keyboard.pressed(key);
		},

		/**
		 * @returns {Number} A new id
		 */
		getNewId : function()
		{
			return VARS.idCounter++;
		},

		/**
		 * @param entityIndex
		 *            the id of the entity for which we want to display metadata
		 */
		showMetadataForEntity : function(entityIndex)
		{
			if (VARS.gui)
			{
				VARS.gui.domElement.parentNode.removeChild(VARS.gui.domElement);
				VARS.gui = null;
			}

			VARS.metadata = VARS.jsonscene[entityIndex].metadata;
			VARS.metadata.ID = VARS.jsonscene[entityIndex].id;

			GEPPETTO.setupGUI();

		},

		/**
		 * @param newJSONScene
		 *            the id of the entity for which we want to display metadata
		 */
		updateJSONScene : function(newJSONScene)
		{
			VARS.jsonscene = newJSONScene;
			VARS.needsUpdate = true;
			GEPPETTO.updateScene();
			if (VARS.customUpdate != null)
			{
				GEPPETTO.customUpdate();
			}
		},

		/**
		 * Animate simulation
		 */
		animate : function()
		{
			VARS.debugUpdate = VARS.needsUpdate; // so that we log only the
			// cycles when we are
			// updating the scene
			if (GEPPETTO.Simulation.getSimulationStatus() == 2 && VARS.debugUpdate)
			{
				GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_STARTING);
			}
			VARS.controls.update();
			requestAnimationFrame(GEPPETTO.animate);
			if (VARS.rotationMode)
			{
				var timer = new Date().getTime() * 0.0005;
				VARS.camera.position.x = Math.floor(Math.cos(timer) * 200);
				VARS.camera.position.z = Math.floor(Math.sin(timer) * 200);
			}
			GEPPETTO.render();
			if (VARS.stats)
			{
				VARS.stats.update();
			}
			if (GEPPETTO.Simulation.getSimulationStatus() == 2 && VARS.debugUpdate)
			{
				GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_END);
			}
		},

		/**
		 * @param aroundObject
		 *            the object around which the rotation will happen
		 */
		enterRotationMode : function(aroundObject)
		{
			VARS.rotationMode = true;
			if (aroundObject)
			{
				VARS.camera.lookAt(aroundObject);
			}
		},

		/**
		 * Exit rotation mode
		 */
		exitRotationMode : function()
		{
			VARS.rotationMode = false;
		},

		/**
		 * @param entityId
		 *            the entity id
		 */
		getThreeObjectFromEntityId : function(entityId)
		{
			var threeObject = null;
			VARS.scene.traverse(function(child)
			{
				if (child.hasOwnProperty("eid") && child.eid == entityId)
				{
					threeObject = child;
				}
			});
			return threeObject;
		},

		/**
		 * @param entityId
		 *            the entity id
		 */
		getThreeReferencedObjectsFrom : function(entityId)
		{
			var entity = GEPPETTO.getJSONEntityFromId(entityId);
			var referencedIDs = [];
			var threeObjects = [];
			for ( var r in entity.references)
			{
				referencedIDs.push(entity.references[r].entityId);
			}

			VARS.scene.traverse(function(child)
			{
				if (child.hasOwnProperty("eid"))
				{
					if (_.contains(referencedIDs, child.eid))
					{
						threeObjects.push(child);
						var index = referencedIDs.indexOf(child.eid);
						referencedIDs.splice(index, 1);
					}
				}
			});

			return threeObjects;
		},

		/**
		 * @param entityId
		 *            the entity id
		 */
		getJSONEntityFromId : function(entityId)
		{
			for (e in VARS.jsonscene)
			{
				if (VARS.jsonscene[e].id === entityId)
				{
					return VARS.jsonscene[e];
				}
			}
			return null;
		},

		/**
		 * @param msg
		 */
		log : function(msg)
		{
			if (VARS.debug)
			{
				var d = new Date();
				var curr_hour = d.getHours();
				var curr_min = d.getMinutes();
				var curr_sec = d.getSeconds();
				var curr_msec = d.getMilliseconds();

				console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec + ' - ' + msg, "");

			}
		},

		/**
		 * @param category
		 * @param action
		 * @param opt_label
		 * @param opt_value
		 * @param opt_noninteraction
		 */
		trackActivity : function(category, action, opt_label, opt_value, opt_noninteraction)
		{
			if (typeof _gaq != 'undefined')
			{
				_gaq.push([ '_trackEvent', category, action, opt_label, opt_value, opt_noninteraction ]);
			}
		}
	};

	require('SandboxConsole')(GEPPETTO);
	require('GEPPETTO.Resources')(GEPPETTO);
	require('GEPPETTO.Init')(GEPPETTO);
	require('GEPPETTO.Vanilla')(GEPPETTO);
	require('GEPPETTO.FE')(GEPPETTO);
	require('GEPPETTO.ScriptRunner')(GEPPETTO);
	require('GEPPETTO.SimulationContentEditor')(GEPPETTO);
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
	require('GEPPETTO.Tutorial')(GEPPETTO);
	require("widgets/includeWidget")(GEPPETTO);

	return GEPPETTO;

});
