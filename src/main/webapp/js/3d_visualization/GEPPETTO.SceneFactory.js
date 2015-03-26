/**
 * GEPPETTO Visualisation engine built on top of ThreeJS. Displays a scene as
 * defined on org.geppetto.core. Factory class for creating and updating ThreeJS objects
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
				 * Create ThreeJS objects associated with an entity.
				 * 
				 * @param {EntityNode} entityNode - Entity Node to load 
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
							if (position != null) {
								p = new THREE.Vector3(position.x, position.y,
										position.z);
								mesh.position.set(p.x,p.y,p.z);
								mesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(p.x,p.y,p.z));
								mesh.geometry.verticesNeedUpdate = true;
							}
							GEPPETTO.getVARS().scene.add(mesh);
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

					GEPPETTO.getVARS().scene.updateMatrixWorld(true);
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
						}
					}
				},


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
				
				generate3DObjects : function(aspect) {

					var materials = {
							"mesh": GEPPETTO.SceneFactory.getMeshPhongMaterial(),
							"particle": GEPPETTO.SceneFactory.getParticleMaterial()
					};
					var aspectObjects = [];
					threeDeeObjList = GEPPETTO.SceneFactory.walkVisTreeGen3DObjs(aspect.VisualizationTree.content, materials);

					//only merge if there are more than one object
					if(threeDeeObjList.length > 1){
						var mergedObjs = GEPPETTO.SceneFactory.merge3DObjects(threeDeeObjList, materials);
						//investigate need to obj.dispose for obj in threeDeeObjList
						mergedObjs.aspectInstancePath = aspect.instancePath;
						aspectObjects.push(mergedObjs);
					}else if(threeDeeObjList.length == 1){
						//only one object in list, add it to local array and set 
						//instance path from aspect
						aspectObjects.push(threeDeeObjList[0]);
						aspectObjects[0].aspectInstancePath = aspect.instancePath;
					}

					return aspectObjects;
				},

				walkVisTreeGen3DObjs: function(visTree, materials) {
					var threeDeeObj = null;
					var threeDeeObjList = [];

					if(visTree)
					{
						$.each(visTree, function(key, node) {
							if(node._metaType === 'CompositeNode'){
								var objects  = GEPPETTO.SceneFactory.walkVisTreeGen3DObjs(node, materials);
								for(var i =0; i<objects.length; i++){
									threeDeeObjList.push(objects[i]);
								}
							}
							else{
								threeDeeObj = GEPPETTO.SceneFactory.visualizationTreeNodeTo3DObj(node, materials)
								if(threeDeeObj){
									threeDeeObjList.push(threeDeeObj);
								}
							}
						});
					}
					return threeDeeObjList;
				},


				merge3DObjects: function(objArray, materials){

					//TODO: assuming that all objects have the same type, check!
					objType = objArray[0].type;
					var mergedMeshesPaths = [];
					var ret = null;

					switch (objType){
<<<<<<< HEAD
					case "CylinderNode":
					case "SphereNode":
						var merged = new THREE.Geometry();
						objArray.forEach(function(obj){
							obj.geometry.dynamic = true;
							obj.geometry.verticesNeedUpdate = true;
							obj.updateMatrix();
							merged.merge(obj.geometry, obj.matrix);
							mergedMeshesPaths.push(obj.instancePath);
						});
						//TODO: do we really want to create a _mesh_ for the merged objs?
						var meshWithAll = new THREE.Mesh(merged, materials["mesh"]);
						ret = meshWithAll;
						break;
					case "ParticleNode":
						var particleGeometry = new THREE.Geometry();
						objArray.forEach(function(obj){
							particleGeometry.vertices.push(obj);
							//TODO: do we want to store the path for each one of the nodes into mergedMeshesPaths?
							//      it doesn't seem to be done correctly in the original code
						});
						var merged = new THREE.ParticleSystem(particleGeometry, materials["particle"]);
						merged.sortParticles = true;
						merged.geometry.verticesNeedUpdate = true;
						ret = merged;
						break;
					case "ColladaNode":
					case "OBJNode":
						//TODO: can we have multiple collada / OBJ ? Do we merge them?
						//var merged = new THREE.Geometry();
						//objArray.forEach(function(obj){
						//THREE.GeometryUtils.merge(merged, obj);
						//mergedMeshesPaths.push(obj.instancePath);
						//});
						ret = objArray[0];
						break;
					}
					ret.mergedMeshesPaths = mergedMeshesPaths;

					return ret;

				},


				visualizationTreeNodeTo3DObj: function(node, materials) {
					var threeObject = null;
					switch (node._metaType) {
					case "ParticleNode" : 
						threeObject = GEPPETTO.SceneFactory.createParticle(node);
						break;

					case "CylinderNode":
						threeObject = GEPPETTO.SceneFactory.create3DCylinderFromNode(node, materials["mesh"]);
						break;

					case "SphereNode":
						threeObject = GEPPETTO.SceneFactory.create3DSphereFromNode(node, materials["mesh"]);
						break;

					case "ColladaNode":
						threeObject = GEPPETTO.SceneFactory.loadColladaModelFromNode(node);
						break;

					case "OBJNode":
						threeObject = GEPPETTO.SceneFactory.loadThreeOBJModelFromNode(node);
						break;
					}
					if(threeObject){
						threeObject.visible = true;
						threeObject.type = node._metaType;
						//TODO: this is empty for collada and obj nodes 
						threeObject.instancePath = node.instancePath;
						threeObject.highlighted = false;

						//TODO: shouldn't that be the vistree? why is it also done at the loadEntity level??
						GEPPETTO.getVARS().visualModelMap[node.instancePath] = threeObject;
					}
					return threeObject;
				},


				loadColladaModelFromNode: function(node){
					var loader = new THREE.ColladaLoader();
					loader.options.convertUpAxis = true;
					var xmlParser = new DOMParser();
					var responseXML = xmlParser.parseFromString(node.model.data, "application/xml");
					var scene = null;
					loader.parse(responseXML, function(collada) {
						scene = collada.scene;
					});
					return scene;
				},


				loadThreeOBJModelFromNode: function(node){
					var manager = new THREE.LoadingManager();
					manager.onProgress = function (item, loaded, total) {
						console.log(item, loaded, total);
					};
					var loader = new THREE.OBJLoader(manager);
					return loader.parse(node.model.data);
=======
					case "CylinderNode":
					case "SphereNode":
						var merged = new THREE.Geometry();
						objArray.forEach(function(obj){
							obj.geometry.dynamic = true;
							obj.geometry.verticesNeedUpdate = true;
							obj.updateMatrix();
							merged.merge(obj.geometry, obj.matrix);
							mergedMeshesPaths.push(obj.instancePath);
						});
						//TODO: do we really want to create a _mesh_ for the merged objs?
						var meshWithAll = new THREE.Mesh(merged, materials["mesh"]);
						ret = meshWithAll;
						break;
					case "ParticleNode":
						var particleGeometry = new THREE.Geometry();
						objArray.forEach(function(obj){
							particleGeometry.vertices.push(obj);
							//TODO: do we want to store the path for each one of the nodes into mergedMeshesPaths?
							//      it doesn't seem to be done correctly in the original code
						});
						var merged = new THREE.PointCloud(particleGeometry, materials["particle"]);
						merged.sortParticles = true;
						merged.geometry.verticesNeedUpdate = true;
						ret = merged;
						break;
					case "ColladaNode":
					case "OBJNode":
						//TODO: can we have multiple collada / OBJ ? Do we merge them?
						//var merged = new THREE.Geometry();
						//objArray.forEach(function(obj){
						//THREE.GeometryUtils.merge(merged, obj);
						//mergedMeshesPaths.push(obj.instancePath);
						//});
						ret = objArray[0];
						break;
					}
					ret.mergedMeshesPaths = mergedMeshesPaths;

					return ret;

				},


				visualizationTreeNodeTo3DObj: function(node, materials) {
					var threeObject = null;
					switch (node._metaType) {
					case "ParticleNode" : 
						threeObject = GEPPETTO.SceneFactory.createParticle(node);
						break;

					case "CylinderNode":
						threeObject = GEPPETTO.SceneFactory.create3DCylinderFromNode(node, materials["mesh"]);
						break;

					case "SphereNode":
						threeObject = GEPPETTO.SceneFactory.create3DSphereFromNode(node, materials["mesh"]);
						break;

					case "ColladaNode":
						threeObject = GEPPETTO.SceneFactory.loadColladaModelFromNode(node);
						break;

					case "OBJNode":
						threeObject = GEPPETTO.SceneFactory.loadThreeOBJModelFromNode(node);
						break;
					}
					if(threeObject){
						threeObject.visible = true;
						threeObject.type = node._metaType;
						//TODO: this is empty for collada and obj nodes 
						threeObject.instancePath = node.instancePath;
						threeObject.highlighted = false;

						//TODO: shouldn't that be the vistree? why is it also done at the loadEntity level??
						GEPPETTO.getVARS().visualModelMap[node.instancePath] = threeObject;
					}
					return threeObject;
				},


				loadColladaModelFromNode: function(node){
					var loader = new THREE.ColladaLoader();
					loader.options.convertUpAxis = true;
					var xmlParser = new DOMParser();
					var responseXML = xmlParser.parseFromString(node.model.data, "application/xml");
					var scene = null;
					loader.parse(responseXML, function(collada) {
						scene = collada.scene;
						scene.traverse(function(child){
							if(child instanceof THREE.Mesh){
								child.material =GEPPETTO.SceneFactory.getMeshPhongMaterial();
								child.name = node.instancePath.split(".VisualizationTree")[0];
							}
						});
					});
					return scene;
				},


				loadThreeOBJModelFromNode: function(node){
					var manager = new THREE.LoadingManager();
					manager.onProgress = function (item, loaded, total) {
						console.log(item, loaded, total);
					};
					var loader = new THREE.OBJLoader(manager);
					var scene = loader.parse(node.model.data);
					
					scene.traverse(function(child){
						if(child instanceof THREE.Mesh){
							child.material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
							child.material.opacity=GEPPETTO.Resources.OPACITY.DEFAULT;
						}
					});

					return scene;
>>>>>>> refs/remotes/origin/development
				},


				createParticle : function(node){
					threeObject = new THREE.Vector3(node.position.x,
							node.position.y,
							node.position.z);
					threeObject.visible = true;
					threeObject.instancePath = node.instancePath;
					threeObject.highlighted = false;
					//TODO: does that need to be done?
					GEPPETTO.getVARS().visualModelMap[node.instancePath] = threeObject;

					return threeObject;

				},


				/**
				 * Creates and positions a ThreeJS cylinder object from a Geppetto Cylinder node
				 * 
				 * @param {VisualObjectNode} cylNode - a Geppetto Cylinder Node
				 * @param {ThreeJSMaterial} material - Material to be used for the Mesh
				 * @returns a ThreeJS Cylinder correctly positioned w.r.t the global frame of reference
				 */
				create3DCylinderFromNode : function(cylNode, material) {

					bottomBasePos = new THREE.Vector3(cylNode.position.x,
							cylNode.position.y,
							cylNode.position.z);
					topBasePos = new THREE.Vector3(cylNode.distal.x,
							cylNode.distal.y,
							cylNode.distal.z);

					var axis = new THREE.Vector3();
					axis.subVectors(topBasePos, bottomBasePos);
					var midPoint = new THREE.Vector3();
					midPoint.addVectors(bottomBasePos, topBasePos).multiplyScalar(0.5);

					//convert radius values to float from string
					var bottom = parseFloat(cylNode.radiusBottom);
					var top = parseFloat(cylNode.radiusTop);
					
					var c = new THREE.CylinderGeometry(top,
												bottom,axis.length(), 6, 1, false);
					c.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
					var threeObject = new THREE.Mesh(c, material);

					threeObject.lookAt(axis);
					threeObject.position.fromArray(midPoint.toArray());

					threeObject.geometry.verticesNeedUpdate = true;
					return threeObject;
				},	

				/**
				 * Creates and positions a ThreeJS sphere object
				 * 
				 * @param {VisualObjectNode} sphereNode - a Geppetto Sphere Node
				 * @param {ThreeJSMaterial} material - Material to be used for the Mesh
				 * @returns a ThreeJS sphere correctly positioned w.r.t the global frame of reference
				 */
				create3DSphereFromNode : function(sphereNode, material) {

					var sphere = new THREE.SphereGeometry(sphereNode.radius, 20, 20);
					//sphere.applyMatrix(new THREE.Matrix4().makeScale(-1,1,1));
					threeObject = new THREE.Mesh(sphere, material);
					threeObject.position.set(sphereNode.position.x,
							sphereNode.position.y,
							sphereNode.position.z);

					threeObject.geometry.verticesNeedUpdate = true;
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
				getParticleMaterial : function(){
					var pMaterial = new THREE.PointCloudMaterial({
						size : 5,
						map : THREE.ImageUtils
						.loadTexture("assets/images/particle.png"),
						blending : THREE.AdditiveBlending,
						depthTest : false,
						transparent : true
					});
					pMaterial.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
					pMaterial.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
					return pMaterial;
				}
		};
	}
});
