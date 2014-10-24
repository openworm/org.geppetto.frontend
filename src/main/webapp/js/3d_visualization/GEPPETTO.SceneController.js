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
						GEPPETTO.SceneFactory.loadEntity(runTimeTree[eindex]);
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
				
				setGhostEffect : function(apply){
					GEPPETTO.SceneController.ghostEffect(GEPPETTO.getVARS().meshes,apply);
				},
				
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

				unselectAspect : function(instancePath) {
					for ( var key in GEPPETTO.getVARS().meshes) {
						if(key == instancePath){
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

				showAspect : function(instancePath) {
					for ( var v in GEPPETTO.getVARS().meshes) {
						if (v == instancePath) {
							if (GEPPETTO.getVARS().meshes[v].visible == true) {
								return false;
							} else {
								GEPPETTO.getVARS().meshes[v].visible = true;
								return true;
							}
						}
					}
					return false;
				},

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

				zoomToAspect : function(instancePath) {
					var aspect;
					for ( var a in GEPPETTO.getVARS().meshes) {
						if ( instancepath == a) {
							aspect = GEPPETTO.getVARS().meshes[a];
						}
					}

					if(aspect!=null){
						GEPPETTO.calculateSceneCenter(aspect);
						GEPPETTO.updateCamera();
					}
				},
				
				showConnections : function(paths,type){
					for(var e in paths){
						var mesh = GEPPETTO.getVARS().meshes[paths[e]];
						
						if(type==GEPPETTO.Resources.INPUT_CONNECTION){
							if(mesh.output){
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
							}else{
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED);
							}
							mesh.input = true;
						}else if(type == GEPPETTO.Resources.OUTPUT_CONNECTION){
							if(mesh.input){
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
							}else{
								mesh.material.color.setHex(GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED);
							}
							mesh.output = true;
						}
						
						if(!mesh.selected){
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
							mesh.ghosted = true;
						}
					}
				},
				
				hideConnections : function(paths){
					for(var e in paths){
						var mesh = GEPPETTO.getVARS().meshes[paths[e]];
						
						if(!mesh.selected){
							mesh.material.color.setHex(GEPPETTO.Resources.COLORS.GHOST);
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
							mesh.ghosted = true;
						}
						else{
							mesh.material.color.setHex(GEPPETTO.Resources.COLORS.SELECTED);
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
						}
					}
				},
				
				showConnectionLines : function(entities){
					
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