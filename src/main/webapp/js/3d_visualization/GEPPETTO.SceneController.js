/**
 * Controls events coming to the 3D side of things; selecting, showing, hiding, ghosting, lighting of entities. 
 * Command to populate and update scene are also here, and then dispatch to factory.
 * 
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

		GEPPETTO.SceneController = {
				
				/**
				 * Populate the scene with given runtimetree object.
				 * 
				 * @param runTimeTree - Object with scene to populate
				 */
				populateScene : function(runTimeTree) {
					for ( var eindex in runTimeTree) {
						//we load each entity attached as sibling in runtime tree, we send null 
						//as second parameter to make it clear this entity has no parent. 
						GEPPETTO.SceneFactory.loadEntity(runTimeTree[eindex]);
					}
					GEPPETTO.calculateSceneCenter(GEPPETTO.getVARS().scene);
					GEPPETTO.updateCamera();
				},
				
				/**
				 * Updates the scene call, tells factory to do it's job updating meshes
				 * 
				 * @param {Object} newRuntimeTree - New server update.
				 */
				updateScene : function(newRuntimeTree) {
					GEPPETTO.getVARS().needsUpdate = true;
					if (GEPPETTO.getVARS().needsUpdate) {
						GEPPETTO.SceneFactory.updateScene(newRuntimeTree);
						GEPPETTO.getVARS().needsUpdate = false;
					}
				},
				
				/**
				 * Light up the entity 
				 * 
				 * @param {AspectNode} aspect - the aspect containing the entity to be lit
				 * @param {String} entityName - the name of the entity to be rotated (in the 3d model)
				 * @param {Float} intensity - the lighting intensity from 0 
				 *                            (no illumination) to 1 (full illumination)
				 */
				lightUpEntity : function(aspect, entityName, intensity) {
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
					var threeObject = GEPPETTO.getNamedThreeObjectFromInstancePath(aspect.getInstancePath(), entityName);
					if (threeObject != null) {
						var originalColor = getRGB(threeObject.material.originalColor);
						threeObject.material.color.setHex('0x'
								+ scaleColor(originalColor.r)
								+ scaleColor(originalColor.g)
								+ scaleColor(originalColor.b));
					}
				},
				
				/**
				 * Set ghost effect, bridge between other classes and ghost effect call
				 * @param {boolean} apply - Turn on or off the ghost effect
				 */
				setGhostEffect : function(apply){
					GEPPETTO.SceneController.ghostEffect(GEPPETTO.getVARS().meshes,apply);
				},
				
				/**
				 * Apply ghost effect to all meshes that are not selected
				 * @param {Array} meshes - Array of meshes to apply ghost effect to . 
				 * @param {boolean} apply - Ghost effect on or off
				 */
				ghostEffect : function(meshes,apply){
					for ( var v in meshes) {
						var child = meshes[v];
						if(apply && (!child.ghosted) && (!child.selected)){
							child.ghosted = true;
							child.material.color.setHex(GEPPETTO.Resources.COLORS.GHOST);
							child.material.transparent = true;
							child.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
						}
						else if((!apply) && (child.ghosted)){
							child.ghosted = false;
							child.material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
							child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
						}
					}
				},

				/**
				 * Selects an aspect given the path of it. Color changes to yellow, and opacity become 100%.
				 * @param {String} instancePath - Path of aspect of mesh to select
				 */
				selectAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().meshes) {
						if(v == instancePath){
							if(GEPPETTO.getVARS().meshes[v].selected == false){
								GEPPETTO.getVARS().meshes[v].material.color.setHex(GEPPETTO.Resources.COLORS.SELECTED);
								GEPPETTO.getVARS().meshes[v].material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
								GEPPETTO.getVARS().meshes[v].selected = true;
								GEPPETTO.getVARS().meshes[v].ghosted = false;
								return true;
							}					
						}
					}
					return false;
				},

				/**
				 * Unselect aspect, or mesh as far as tree js is concerned.
				 * @param {String} instancePath - Path of the mesh/aspect to select
				 */
				unselectAspect : function(instancePath) {
					//match instancePath to mesh store in variables properties
					for ( var key in GEPPETTO.getVARS().meshes) {
						if(key == instancePath){
							//make sure that path was selected in the first place
							if(GEPPETTO.getVARS().meshes[key].selected == true){
								GEPPETTO.getVARS().meshes[key].material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
								GEPPETTO.getVARS().meshes[key].selected = false;
								GEPPETTO.getVARS().meshes[key].ghosted = false;
					
								return true;
							}
						}
					}
					return false;
				},
				
				/**
				 * Unselects all the selected entities
				 */
				unSelectAll : function(){
					var selection = Simulation.getSelection();
					if(selection.length > 0){
						for(var key in selection){
							var entity = selection[key];
							entity.unselect();
						}
					}
				},

				/**
				 * Show aspect, make it visible.
				 * @param {String} instancePath - Instance path of aspect to make visible
				 */
				showAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().meshes) {
						if (v == instancePath) {
							//if already visible, return false for unsuccessful operation
							if (GEPPETTO.getVARS().meshes[v].visible == true) {
								return false;
							} 
							//make mesh visible
							else {
								GEPPETTO.getVARS().meshes[v].visible = true;
								return true;
							}
						}
					}
					return false;
				},

				/**
				 * Hide aspect
				 * @param {String} instancePath - Path of the aspect to make invisible
				 */
				hideAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().meshes) {
						if (v == instancePath) {
							if (GEPPETTO.getVARS().meshes[v].visible == false) {
								return false;
							} else {
								GEPPETTO.getVARS().meshes[v].visible = false;
								return true;
							}
						}
					}
					;
					return false;
				},

				/**
				 * Takes few paths, 3D point locations, and computes center of it to focus camera.
				 */
				zoom : function(paths) {
					var aabbMin = null;
					var aabbMax = null;
					
					for(var p in paths){
						var mesh = GEPPETTO.getVARS().meshes[paths[p]];
						
						mesh.geometry.computeBoundingBox();

						// If min and max vectors are null, first values become
						// default min and max
						if (aabbMin == null && aabbMax == null) {
							aabbMin = mesh.geometry.boundingBox.min;
							aabbMax = mesh.geometry.boundingBox.max;
						}

						// Compare other meshes, particles BB's to find min and max
						else {
							aabbMin.x = Math.min(aabbMin.x,
									mesh.geometry.boundingBox.min.x);
							aabbMin.y = Math.min(aabbMin.y,
									mesh.geometry.boundingBox.min.y);
							aabbMin.z = Math.min(aabbMin.z,
									mesh.geometry.boundingBox.min.z);
							aabbMax.x = Math.max(aabbMax.x,
									mesh.geometry.boundingBox.max.x);
							aabbMax.y = Math.max(aabbMax.y,
									mesh.geometry.boundingBox.max.y);
							aabbMax.z = Math.max(aabbMax.z,
									mesh.geometry.boundingBox.max.z);
						}
					}
					// Compute world AABB center
					GEPPETTO.getVARS().sceneCenter.x = (aabbMax.x + aabbMin.x) * 0.5;
					GEPPETTO.getVARS().sceneCenter.y = (aabbMax.y + aabbMin.y) * 0.5;
					GEPPETTO.getVARS().sceneCenter.z = (aabbMax.z + aabbMin.z) * 0.5;

					// Compute world AABB "radius"
					var diag = new THREE.Vector3();
					diag = diag.subVectors(aabbMax, aabbMin);
					var radius = diag.length() * 0.5;

					// Compute offset needed to move the camera back that much needed to
					// center AABB
					var offset = radius
					/ Math.tan(Math.PI / 180.0 * GEPPETTO.getVARS().camera.fov * 0.25);

					var camDir = new THREE.Vector3(0, 0, 1.0);
					camDir.multiplyScalar(offset);

					// Store camera position
					GEPPETTO.getVARS().cameraPosition = new THREE.Vector3();
					GEPPETTO.getVARS().cameraPosition.addVectors(GEPPETTO.getVARS().sceneCenter, camDir);
					GEPPETTO.updateCamera();
				},

				/**
				 * Change color for meshes that are connected to other meshes. Color
				 * depends on whether that mesh (aspect) is an output, input or both connection.
				 * 
				 * @param {Array} paths - Array containing the paths of meshes (aspects) that are 
				 *                the connections.
				 * @param {String} type - Type of connection, input or output
				 */
				showConnections : function(paths,type){
					for(var e in paths){
						var mesh = GEPPETTO.getVARS().meshes[paths[e]];
						
						//determine whether connection is input or output
						if(type==GEPPETTO.Resources.INPUT_CONNECTION){
							//figure out if connection is both, input and output
							if(mesh.output){
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
							}else{
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED);
							}
							mesh.input = true;
						}else if(type == GEPPETTO.Resources.OUTPUT_CONNECTION){
							//figure out if connection is both, input and output
							if(mesh.input){
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
							}else{
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED);
							}
							mesh.output = true;
						}
						
						//if mesh is not selected, give it a ghost effect
						if(!mesh.selected){
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
							mesh.ghosted = true;
						}
					}
				},
				
				/**
				 * Hide connections. Undoes changes done by show connections, in which 
				 * the connections were shown and ghost effects apply after selection.
				 * 
				 * @param {Array} paths - Array of aspects that have the connections
				 */
				hideConnections : function(paths){
					for(var e in paths){
						var mesh = GEPPETTO.getVARS().meshes[paths[e]];
						
						//if mesh is not selected, give it ghost or default color and opacity
						if(!mesh.selected){
							//if there are nodes still selected, give it a ghost effect. If not nodes are
							//selected, give the meshes old default color
							if(Simulation.getSelection().length>0){
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.GHOST);
								mesh.material.transparent = true;
								mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
								mesh.ghosted = true;
							}else{
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
								mesh.material.transparent = true;
								mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
							}
						}
						//if mesh is selected, make it look like so
						else{
							mesh.material.color.setHex(GEPPETTO.Resources.COLORS.SELECTED);
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
						}
					}
				},
				
				showConnectionLines : function(from,to){
					
				},
				
				hideConnectionLines : function(from, to){
					
				},
				
				/**
				 * Highlight part of a mesh
				 * 
				 * @param {String} path - Path of mesh to highlight
				 * @param {boolean} mode - Highlight or unhighlight
				 */
				highlight : function(aspectPath, objectPath, mode){
					var splitMesh = GEPPETTO.getVARS().splitMeshes[aspectPath];
					
					splitMesh.traverse(function (child) {
					    if (child instanceof THREE.Mesh) {
					    	if(child.instancePath == objectPath){
					    		if(mode){
					    			GEPPETTO.SceneController.colorMesh(child,GEPPETTO.Resources.COLORS.HIGHLIGHTED);
					    		}else{
					    			GEPPETTO.SceneController.colorMesh(child,GEPPETTO.Resources.COLORS.DEFAULT);
					    		}
					    	}
					    }
					});					
				},
				
				colorMesh : function(mesh, colorHex){
					mesh.material.color.setHex(colorHex);
				},
				
				/**
				 * Split merged mesh into individual meshes
				 * 
				 * @param {String} aspectPath - Path of aspect, corresponds to mesh
				 */
				split : function(aspectPath){
					//get mesh from map
					var mesh = GEPPETTO.getVARS().meshes[aspectPath];
					//make sure it wasn't split already by checking flag
					if(!mesh.split){
						//remove from scene
						GEPPETTO.getVARS().scene.remove(mesh);
						mesh.geometry.dispose();

						//get map of all meshes that merged mesh was merging
						var map = mesh.mergedMeshesPaths;

						//group to hold new individual meshes
						var group = new THREE.Object3D();
						//loop through individual meshes, add them to group, set new material to them
						for(var v in map){
							var m = GEPPETTO.getVARS().visualModelMap[map[v]];
							m.visible = true;
							//new material and color, this to override shared merged mesh material
							m.material = GEPPETTO.SceneFactory.getMeshPhongMaterial();
							m.material.color.setHex(GEPPETTO.Resources.COLORS.SPLIT);
							group.add(m);							
						}
						//give position or merge mesh to new group
						group.position = mesh.position;
						//add to scene
						GEPPETTO.getVARS().scene.add(group);
						//keep track that split mesh exist for easy access
						GEPPETTO.getVARS().splitMeshes[aspectPath] = group;
						mesh.split = true;
					}
				},
				
				/**
				 * Merge mesh that was split before
				 * 
				 * @param {String} aspectPath - Path to aspect that points to mesh
				 */
				merge : function(aspectPath){
					//get mesh from map 
					var mesh = GEPPETTO.getVARS().meshes[aspectPath];

					//make sure it's split before doing merging
					if(mesh.split){
						//get all paths of meshes, need to re-apply merged material
						//to override previous one used during splitting 
						var map = mesh.mergedMeshesPaths;
						for(var v in map){
							//get mesh from visual map
							var m = GEPPETTO.getVARS().visualModelMap[map[v]];
							m.visible = false;
							//apply same material to mesh as parent (merged mesh)
							m.material = mesh.material;						
						}
						//retrieve split mesh that is on the scene
						var splitMesh = GEPPETTO.getVARS().splitMeshes[aspectPath];
						//remove split mesh from scene
						GEPPETTO.getVARS().scene.remove(splitMesh);	
					}					
					mesh.split = false;
					GEPPETTO.getVARS().scene.add(mesh);
				},
				
				/**
				 * Shows a visual group
				 */
				showVisualGroups : function(visualizationTree,group, color, mode){
					var aspectPath = visualizationTree.getParent().getInstancePath();
					var mesh = GEPPETTO.getVARS().meshes[aspectPath];
					var paths = mesh.mergedMeshesPaths;
					for(var id in paths){
						//get 3d object from visualizationtree by using the object's instance path as search key 
						var object = GEPPETTO.SceneController.get3DObjectInAspect(visualizationTree,paths[id]);
						//get group elements list for 3d object
						var groups = object.groups;
						var modified = false;
						for(g in groups){
							//match group to be shown to ones in object 3d
							if(groups[g] == group){
								var object3D = GEPPETTO.getVARS().visualModelMap[paths[id]];
								//color 3d object with color passed in
								if(mode){
									GEPPETTO.SceneController.colorMesh(object3D,color);
									modified = true;
								}else{
									GEPPETTO.SceneController.colorMesh(object3D,GEPPETTO.Resources.COLORS.SPLIT);
									modified = true;
								}
							}
						}
						
						if(!modified){
							var object3D = GEPPETTO.getVARS().visualModelMap[paths[id]];
							GEPPETTO.SceneController.colorMesh(object3D,GEPPETTO.Resources.COLORS.SPLIT);
						}
					}				
				},
				
				/**
				 * Gets 3D object from Visualization tree by feeding it the instance 
				 * path of the 3D object as search key.
				 */
				get3DObjectInAspect : function(visualizationTree, objectPath){
					var objectPathFormat = objectPath.replace(visualizationTree.getInstancePath()+".","");
					var object = GEPPETTO.Utility.deepFind(visualizationTree.content, objectPathFormat);
					
					return object;
				},
				
				/**
				 * Animate simulation
				 */
				animate : function() {
					GEPPETTO.getVARS().debugUpdate = GEPPETTO.getVARS().needsUpdate; // so that we log only the
					// cycles when we are
					// updating the scene
					if (GEPPETTO.Simulation.getSimulationStatus() == 2
							&& GEPPETTO.getVARS().debugUpdate) {
						GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_STARTING);
					}
					GEPPETTO.getVARS().controls.update();
					requestAnimationFrame(GEPPETTO.SceneController.animate);
					if (GEPPETTO.getVARS().rotationMode) {
						var timer = new Date().getTime() * 0.0005;
						GEPPETTO.getVARS().camera.position.x = Math.floor(Math.cos(timer) * 200);
						GEPPETTO.getVARS().camera.position.z = Math.floor(Math.sin(timer) * 200);
					}
					GEPPETTO.render();
					if (GEPPETTO.getVARS().stats) {
						GEPPETTO.getVARS().stats.update();
					}
					if (GEPPETTO.Simulation.getSimulationStatus() == 2
							&& GEPPETTO.getVARS().debugUpdate) {
						GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_END);
					}
				},
		}
	}
});
