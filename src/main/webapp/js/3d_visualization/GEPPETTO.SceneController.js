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
				 * @param runTimeTree
				 */
				populateScene : function(runTimeTree) {
					for ( var eindex in runTimeTree) {
						//we load each entity attached as sibling in runtime tree, we send null 
						//as second parameter to make it clear this entity has no parent. 
						GEPPETTO.SceneFactory.loadEntity(runTimeTree[eindex],null);
					}
					GEPPETTO.calculateSceneCenter(GEPPETTO.getVARS().scene);
					GEPPETTO.updateCamera();
				},
				
				/**
				 * Updates the scene
				 */
				updateScene : function(newRuntimeTree) {
					GEPPETTO.getVARS().needsUpdate = true;
					if (GEPPETTO.getVARS().needsUpdate) {
						GEPPETTO.SceneFactory.updateScene(newRuntimeTree);
						GEPPETTO.getVARS().needsUpdate = false;
					}
				},
				
				/**
				 * @param {AspectNode} aspect - the aspect containing the entity to be lit
				 * @param {String} entityName - the name of the entity to be rotated (in the 3d model)
				 * @param {Float}
				 *            intensity - the lighting intensity from 0 (no
				 *            illumination) to 1 (full illumination)
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
				
				unSelectAll : function() {
					for ( var v in GEPPETTO.getVARS().entities) {
						var entity = GEPPETTO.getVARS().entities[v];
						for(var e in entity){
							if(entity[e].selected == true){
								entity.selected = false;
								GEPPETTO.SceneController.unselectAspect(entity[e].eid);
							}
						}
					}
				},
				
				setGhostEffect : function(apply){
					GEPPETTO.SceneController.ghostEffect(GEPPETTO.getVARS().entities,apply);
				},
				
				ghostEffect : function(entities,apply){
					for ( var v in entities) {
						var child = entities[v];
						if(child._metaType == GEPPETTO.Resources.ENTITY_NODE){
							for(var a in child){
								var grandchild = child[a];
								if(grandchild._metaType == GEPPETTO.Resources.ENTITY_NODE){
									GEPPETTO.SceneController.ghostEffect(grandchild,true);
								}
								else if(grandchild._metaType == GEPPETTO.Resources.ASPECT_NODE){
									if(grandchild.selected == false){
										GEPPETTO.SceneController.ghostAspect(apply,grandchild);
									}
								}
							}
						}
						else if (child._metaType == GEPPETTO.Resources.ASPECT_NODE){
							if(child.selected == false){
								GEPPETTO.SceneController.ghostAspect(apply,child);
							}
						}
					}
				},

				ghostAspect : function(apply,child){
					if(apply && (!child.ghosted)){
						child.ghosted = true;
						child.material.color.setHex(GEPPETTO.Resources.COLORS.GHOST);
						child.material.transparent = true;
						child.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
					}
					else{
						child.ghosted = false;
						child.material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
						child.material.transparent = true;
						child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
					}
				},

				selectEntity : function(instancePath) {
					var entity = GEPPETTO.Utility.deepFind(GEPPETTO.getVARS().entities,instancePath);
					var selected = false;

					for(var a in entity){
						var child = entity[a];
						if(child._metaType == GEPPETTO.Resources.ENTITY_NODE){
							GEPPETTO.SceneController.selectEntity(child.eid);
						}
						else if(child._metaType == GEPPETTO.Resources.ASPECT_NODE){
							selected = GEPPETTO.SceneController.selectAspect(child.eid);
						}
					}

					return selected;
				},

				unselectEntity : function(instancePath) {
					var entity = GEPPETTO.Utility.deepFind(GEPPETTO.getVARS().entities,instancePath);

					var selected = false;
					for(var a in entity){
						var child = entity[a];
						if(child._metaType == GEPPETTO.Resources.ENTITY_NODE){
							GEPPETTO.SceneController.unselectEntity(child.eid);
						}
						else if(child._metaType == GEPPETTO.Resources.ASPECT_NODE){
							selected = GEPPETTO.SceneController.unselectAspect(child.eid);
						}
					}

					return selected;
				},

				showEntity : function(instancePath) {
					var visible = false;
					var entity = GEPPETTO.Utility.deepFind(GEPPETTO.getVARS().entities,instancePath);

					for(var a in entity){
						var child = entity[a];
						if(child._metaType == GEPPETTO.Resources.ENTITY_NODE){
							GEPPETTO.SceneController.showEntity(child.eid);
						}
						else if(child._metaType == GEPPETTO.Resources.ASPECT_NODE){
							visible = GEPPETTO.SceneController.showAspect(child.eid);
						}
					}

					return visible;
				},

				hideEntity : function(instancePath) {
					var entity = GEPPETTO.Utility.deepFind(GEPPETTO.getVARS().entities,instancePath);
					var visible = false;

					for(var a in entity){
						var child = entity[a];
						if(typeof(child) ===  "object"){
							if(child._metaType == GEPPETTO.Resources.ENTITY_NODE){
								GEPPETTO.SceneController.hideEntity(child.eid);
							}
							else if(child._metaType == GEPPETTO.Resources.ASPECT_NODE){
								visible = GEPPETTO.SceneController.hideAspect(child.eid);
							}
						}
					}

					return visible;
				},

				zoomToEntity : function(instancePath) {
					var entity = null;
					for ( var e in GEPPETTO.getVARS().entities) {
						if ( e == instancePath) {
							entity = GEPPETTO.getVARS().entities[e];
						}
					}

					if(entity!=null){
						GEPPETTO.calculateSceneCenter(entity);
						GEPPETTO.updateCamera();
					}
				},

				selectAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().aspects) {
						if(v == instancePath){
							if(GEPPETTO.getVARS().aspects[v].selected == false){
								GEPPETTO.getVARS().aspects[v].material.color.setHex(GEPPETTO.Resources.COLORS.SELECTED);
								GEPPETTO.getVARS().aspects[v].selected = true;
								return true;
							}					
						}
					}
					return false;
				},

				unselectAspect : function(instancePath) {
					for ( var key in GEPPETTO.getVARS().aspects) {
						if(key == instancePath){
							if(GEPPETTO.getVARS().aspects[key].selected == true){
								GEPPETTO.getVARS().aspects[key].material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
								GEPPETTO.getVARS().aspects[key].selected = false;
								return true;
							}
						}
					}

					return false;
				},

				showAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().aspects) {
						if (v == instancePath) {
							if (GEPPETTO.getVARS().aspects[v].visible == true) {
								return false;
							} else {
								GEPPETTO.getVARS().aspects[v].visible = true;
								return true;
							}
						}
					}
					;

					return false;
				},

				hideAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().aspects) {
						if (v == instancePath) {
							if (GEPPETTO.getVARS().aspects[v].visible == false) {
								return false;
							} else {
								GEPPETTO.getVARS().aspects[v].visible = false;
								return true;
							}
						}
					}
					;
					return false;
				},

				zoomToAspect : function(instancePath) {
					var aspect;
					for ( var a in GEPPETTO.getVARS().aspects) {
						if ( instancepath == a) {
							aspect = GEPPETTO.getVARS().aspects[a];
						}
					}

					if(aspect!=null){
						GEPPETTO.calculateSceneCenter(aspect);
						GEPPETTO.updateCamera();
					}
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