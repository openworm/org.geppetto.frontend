/**
 * GEPPETTO Visualisation engine built on top of THREE.js. Displays a scene as
 * defined on org.geppetto.core. Factory class for creating and updating THREE Js objects
 * 
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery'), 
		_ = require('underscore'), 
		Backbone = require('backbone');

		require('three');
		require('vendor/ColladaLoader');
		require('vendor/OBJLoader');
		require('GEPPETTO.Resources')(GEPPETTO);

		GEPPETTO.SceneFactory = {
				
				/**
				 * Load entity in 3D 
				 * 
				 * @param {EntityNode} entityNode - Entity Node to load 
				 * @param {EntityNode} parentNode - Parent of entity to load
				 * @param Param - Material to apply to entity
				 */
				loadEntity : function(entityNode) {
					//extract aspects, entities and position from entityNode
					var aspects = entityNode.getAspects();
					var children = entityNode.getEntities();
					var position = entityNode.position;
					
					for ( var a in aspects) {
						var aspect = aspects[a];
						var meshes = GEPPETTO.SceneFactory.generate3DObjects(aspect);
						for ( var m in meshes) {
							var mesh = meshes[m];
							mesh.name = aspect.instancePath;
							GEPPETTO.getVARS().scene.add(mesh);
							if (position != null) {
								mesh.position.set(position.x, position.y,
										position.z);
							}
							//keep track of aspects created by storing them in VARS property object
							//under meshes
							GEPPETTO.getVARS().meshes[mesh.aspectInstancePath] = mesh;
							GEPPETTO.getVARS().meshes[mesh.aspectInstancePath].visible = true;
							GEPPETTO.getVARS().meshes[mesh.aspectInstancePath].ghosted = false;
							GEPPETTO.getVARS().meshes[mesh.aspectInstancePath].selected = false;
							GEPPETTO.getVARS().meshes[mesh.aspectInstancePath].input = false;
							GEPPETTO.getVARS().meshes[mesh.aspectInstancePath].output = false;
						}
					}
					//load children entities
					for ( var c =0 ; c< children.length; c++) {
						GEPPETTO.SceneFactory.loadEntity(children[c]);
					}
				},

				/**
				 * Updates the scene
				 * @param {Object} newRuntimeTree - New update received to update the 3D scene
				 */
				updateScene : function(newRuntimeTree) {
					var entities = newRuntimeTree;
					//traverse entities in updated tree
					for ( var eindex in entities) {
						var entity = entities[eindex];
						//traverse apects of new updated entity
						for ( var a in entity.getAspects()) {
							var aspect = entity.getAspects()[a];
							var visualTree = aspect.VisualizationTree;
							for ( var vm in visualTree.content) {
								var node = visualTree.content[vm];

								if (node != null&& typeof node === "object") {

									var metaType = node._metaType;
									if(metaType == "CompositeNode"){
										for ( var gindex in node) {
											var vo = node[gindex];
											var voType = vo._metaType;
											if (voType == "ParticleNode" || voType == "SphereNode"
												|| voType == "CylinderNode"){
												GEPPETTO.SceneFactory.updateGeometry(vo);
											}
										}
									}
									else{
										if (metaType == "ParticleNode"|| metaType == "SphereNode" || 
												metaType == "CylinderNode") {
											GEPPETTO.SceneFactory.updateGeometry(node);								
										}
									}
								}
							}

							var entityGeometry = GEPPETTO.getVARS().visualModelMap[aspect.instancePath];
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
				},

				/**
				 * Updates a THREE geometry from the json one
				 * 
				 * @param {String} g - the updated json geometry
				 */
				updateGeometry : function(g) {
					var threeObject = GEPPETTO.getVARS().visualModelMap[g.instancePath];
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

					//convert radius values to float from string
					var bottom = parseFloat(radiusBottom);
					var top = parseFloat(radiusTop);
					
					var c = new THREE.CylinderGeometry(top, bottom,
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

				getMeshPhongMaterial : function() {
					var material = new THREE.MeshPhongMaterial({
						opacity : 1,
						ambient : 0x777777,
						shininess : 2,
						shading : THREE.SmoothShading
					});

					material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
					return material;
				},
				
				/**
				 * Generates 3D objects taking JSON as parameter
				 * @param {JSON} aspect - JSON object with aspect info inside 
				 * @param {boolean} merge - Merge created geometries or not
				 */
				generate3DObjects : function(aspect) {
					var combined = new THREE.Geometry();
					var material = GEPPETTO.SceneFactory.getMeshPhongMaterial();
					var aspectObjects = [];
					var mergedMeshesPaths = new Array();
					var visualizationTree = aspect.VisualizationTree.content;
					for ( var vm in visualizationTree) {
						node = visualizationTree[vm];
						if (node != null && typeof node === "object") {
							var metaType = node._metaType;
							//look for group of nodes
							if (metaType == "CompositeNode") {
								var firstVO = node[Object.keys(node)[0]];
								var firstVOmetaType = firstVO._metaType;

								if (firstVOmetaType == "ParticleNode") {
									var threeObject = GEPPETTO.SceneFactory.createParticleSystem(node);
									mergedMeshesPaths.push(threeObject.instancePath);
									aspectObjects.push(threeObject);

								} else if (firstVOmetaType == "ColladaNode") {
									var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(node[vg]);
									mergedMeshesPaths.push(threeObject.instancePath);
									aspectObjects.push(threeObject);
								}
								else if (firstVOmetaType == "OBJNode")
								{
									var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(node[vg]);
									mergedMeshesPaths.push(threeObject.instancePath);
									aspectObjects.push(threeObject);
								}
								else if (firstVOmetaType == "CylinderNode" || firstVOmetaType == "SphereNode")
								{									
									for ( var key in node) {
										var vg = node[key];
										if (typeof vg === "object") {
											var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(vg,material);
											mergedMeshesPaths.push(threeObject.instancePath);
											THREE.GeometryUtils.merge(combined,threeObject);
											threeObject.geometry.dispose();
										}
									}
								}
							} else {
								if (metaType == "ParticleNode") {
									var threeObject = GEPPETTO.SceneFactory.createParticleSystem(visualizationTree);
									mergedMeshesPaths.push(threeObject.instancePath);
									aspectObjects.push(threeObject);

								}else if (metaType == "ColladaNode") {
									var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(node);
									mergedMeshesPaths.push(threeObject.instancePath);
									aspectObjects.push(threeObject);
								} 
								else if (metaType == "OBJNode")
								{
									var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(node);
									mergedMeshesPaths.push(threeObject.instancePath);
									aspectObjects.push(threeObject);
								}
								else if (metaType == "CylinderNode"|| metaType == "SphereNode")
								{
									if (typeof node === "object") {
										var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(node,material);
										mergedMeshesPaths.push(threeObject.instancePath);
										THREE.GeometryUtils.merge(combined, threeObject);
										threeObject.geometry.dispose();
									}
								}
							}
						}
					}

					threeObject = new THREE.Mesh(combined, material);
					threeObject.aspectInstancePath = aspect.instancePath;
					threeObject.geometry.dynamic = false;
					threeObject.mergedMeshesPaths = mergedMeshesPaths;
					aspectObjects.push(threeObject);
					
					return aspectObjects;
				},

				/**
				 * Create particle system with bunch of particles
				 */
				createParticleSystem : function(node){
					var particleGeometry = new THREE.Geometry();
					// assumes there are no particles mixed with other kind of
					// geometry hence if the first one is a particle
					// then they all are create the particle variables
					var pMaterial = new THREE.ParticleBasicMaterial({
						size : 5,
						map : THREE.ImageUtils
						.loadTexture("assets/images/particle.png"),
						blending : THREE.AdditiveBlending,
						depthTest : false,
						transparent : true
					});
					pMaterial.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
					pMaterial.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
					for ( var vg in node) {
						if (node[vg]._metaType == "ParticleNode") {
							var threeObject = GEPPETTO.SceneFactory.jsonGeometryTo3D(node[vg], pMaterial);
							particleGeometry.vertices.push(threeObject);
						}
					}

					var entityObject = new THREE.ParticleSystem(
							particleGeometry, pMaterial);
					// also update the particle system to sort the
					// particles which enables the behaviour we want
					entityObject.sortParticles = true;
					GEPPETTO.getVARS().visualModelMap[node.instancePath]=entityObject;

					return entityObject;
				},

				/**
				 * Creates a geometry according to its type
				 * 
				 * @param g
				 * @param material
				 * @returns {Mesh} a three mesh representing the geometry
				 */
				jsonGeometryTo3D : function(g, material) {
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
						threeObject = GEPPETTO.SceneFactory.getCylinder(positionV, lookAtV,
								g.radiusTop, g.radiusBottom, material);
						break;
					case "SphereNode":
						threeObject = new THREE.Mesh(new THREE.SphereGeometry(g.radius,
								20, 20), material);
						var x = parseFloat(g.position.x);
						var y = parseFloat(g.position.y);
						var z = parseFloat(g.position.z);
						threeObject.position = new THREE.Vector3(x,y,z);
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
					// find it for updating purposes
					threeObject.instancePath = g.instancePath;
					threeObject.highlighted = false;
					GEPPETTO.getVARS().visualModelMap[g.instancePath]=threeObject;
					return threeObject;
				},
		};
	}
});
