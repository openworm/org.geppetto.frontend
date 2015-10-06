/**
 * Controls events coming to the 3D side of things; selecting, showing, hiding,
 * ghosting, lighting of entities. Command to populate and update scene are also
 * here, and then dispatch to factory.
 * 
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {
		var $ = require('jquery'), _ = require('underscore'), Backbone = require('backbone');

		require('d3');
		require('three');
		require('vendor/ColladaLoader');
		require('vendor/OBJLoader');
		require('GEPPETTO.Resources')(GEPPETTO);

		GEPPETTO.SceneController = {
				
			/**
			 * Populate the scene with given runtimetree object.
			 * 
			 * @param runTimeTree -
			 *            Object with scene to populate
			 */
			populateScene : function(runTimeTree) 
			{
				for ( var eindex in runTimeTree) 
				{
					GEPPETTO.SceneFactory.loadEntity(runTimeTree[eindex]);
				}
				
				GEPPETTO.getVARS().scene.updateMatrixWorld(true);
			},
			
			/**
			 * This method calculates the complexity of the scene based on the number of cylinders 
			 * Note that this method doesn't currently take into account complexity coming from particles or Collada/OBJ meshes 
			 * 
			 * @param node -
			 *            runtime tree node to compute complexity for
			 */
			computeComplexity : function(node)
			{
				$.each(node, function(key, child) {
				
					if(child.hasOwnProperty("_metaType") && child._metaType === 'AspectNode')
					{
						GEPPETTO.SceneController.computeComplexity(child);
					}
					else if(child.hasOwnProperty("_metaType") && child._metaType === 'AspectSubTreeNode' && child.id==="VisualizationTree")
					{
						GEPPETTO.SceneController.computeComplexity(child);
					}
					else if(child.hasOwnProperty("_metaType") && child._metaType === 'CylinderNode')
					{
						GEPPETTO.SceneController.complexity++;
					}
					else if(child.hasOwnProperty("_metaType") && child._metaType === 'SphereNode')
					{
						GEPPETTO.SceneController.complexity++;
					}
					else if(child.hasOwnProperty("_metaType") && child._metaType === 'EntityNode')
					{
						GEPPETTO.SceneController.computeComplexity(child);
					}
				});
			},

			/**
			 * Updates the scene call, tells factory to do it's job updating
			 * meshes
			 * 
			 * @param {Object}
			 *            newRuntimeTree - New server update.
			 */
			updateScene : function(newRuntimeTree)
			{
				GEPPETTO.SceneFactory.updateScene(newRuntimeTree);
				GEPPETTO.getVARS().needsUpdate = false;
			},

			/**
			 * Applies visual transformation to given aspect.
			 */
			applyVisualTransformation : function(visualAspect, transformation) 
			{
				// NOTE: visualAspect currently disregarded as the
				// transformation applies to the entire scene
				GEPPETTO.getVARS().renderer.setCurrentMatrix(transformation);
			},

			/**
			 * Light up the entity
			 * 
			 * @param {String}
			 *            aspectPath - the aspect path of the entity to be lit
			 * @param {String}
			 *            entityName - the name of the entity to be lit (in the
			 *            3d model)
			 * @param {Float}
			 *            intensity - the lighting intensity from 0 (no
			 *            illumination) to 1 (full illumination)
			 */
			lightUpEntity : function(instancePath, intensity) 
			{
				if (intensity <= 0) {
					intensity = 1e-6;
				}
				if (intensity > 1) {
					intensity = 1;
				}
				var threeObject = GEPPETTO.getVARS().meshes[instancePath];
				if (threeObject != null) 
				{
					if (threeObject instanceof THREE.Line)
					{
						threeObject.material.color = new THREE.Color(d3.scale.linear().domain([ 0, 1 ]).range([ "#199e8", "red" ])(intensity))
					}
					else
					{
						threeObject.material.emissive = new THREE.Color(d3.scale.linear().domain([ 0, 1 ]).range([ "#199e8", "red" ])(intensity))
					}
				}
			},

			/**
			 * Set ghost effect, bridge between other classes and ghost effect
			 * call
			 * 
			 * @param {boolean}
			 *            apply - Turn on or off the ghost effect
			 */
			setGhostEffect : function(apply) 
			{
				GEPPETTO.SceneController.ghostEffect(GEPPETTO.getVARS().meshes, apply);
				GEPPETTO.SceneController.ghostEffect(GEPPETTO.getVARS().splitMeshes, apply);
			},

			/**
			 * Apply ghost effect to all meshes that are not selected
			 * 
			 * @param {Array}
			 *            meshes - Array of meshes to apply ghost effect to .
			 * @param {boolean}
			 *            apply - Ghost effect on or off
			 */
			ghostEffect : function(meshes, apply) 
			{
				for ( var v in meshes) 
				{
					var child = meshes[v];
					if (child.visible) 
					{
						if (apply && (!child.ghosted) && (!child.selected)) 
						{
							if (child instanceof THREE.Object3D) 
							{
								child.ghosted = true;
								child.traverse(function(object) 
								{
									if (object instanceof THREE.Mesh || object instanceof THREE.Line) 
									{
										if(object.visible)
										{
											object.ghosted = true;
											object.material.transparent = true;
											object.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
										}
									}
								});
							} 
							else 
							{
								child.ghosted = true;
								child.material.transparent = true;
								child.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
							}
						} 
						else if ((!apply) && (child.ghosted)) 
						{
							if (child instanceof THREE.Object3D) 
							{
								child.ghosted=false;
								child.traverse(function(object) 
								{
									if (object instanceof THREE.Mesh || object instanceof THREE.Line) 
									{
										if(object.visible)
										{
											object.ghosted = false;
											object.material.opacity = object.material.defaultOpacity;
										}
									}
								});
							} 
							else 
							{
								child.ghosted = false;
								child.material.opacity = child.material.defaultOpacity;
							}
						}
					}
					child.output = false;
					child.input = false;
				}
			},

			/**
			 * Selects an aspect given the path of it. Color changes to yellow,
			 * and opacity become 100%.
			 * 
			 * @param {String}
			 *            instancePath - Path of aspect of mesh to select
			 */
			selectAspect : function(instancePath) 
			{
				var mesh = GEPPETTO.getVARS().meshes[instancePath];
				if (mesh != null || undefined) 
				{
					if (!mesh.visible) 
					{
						GEPPETTO.SceneController.merge(instancePath);
					}
					if (mesh.selected == false) 
					{
						if (mesh instanceof THREE.Object3D) 
						{
							mesh.traverse(function(child) 
							{
								if (child instanceof THREE.Mesh || child instanceof THREE.Line) 
								{
									GEPPETTO.SceneController.setThreeColor(child.material.color,GEPPETTO.Resources.COLORS.SELECTED);
									child.material.opacity = Math.max(0.5,child.material.defaultOpacity);
								}
							});
							mesh.selected = true;
							mesh.ghosted = false;
						} 
						else 
						{
							GEPPETTO.SceneController.setThreeColor(mesh.material.color,GEPPETTO.Resources.COLORS.SELECTED);
							mesh.material.opacity = Math.max(0.5,mesh.material.defaultOpacity);
							mesh.selected = true;
							mesh.ghosted = false;
						}
						return true;
					}
				}
				return false;
			},

			/**
			 * Deselect aspect, or mesh as far as tree js is concerned.
			 * 
			 * @param {String}
			 *            instancePath - Path of the mesh/aspect to select
			 */
			deselectAspect : function(instancePath) 
			{
				// match instancePath to mesh store in variables properties
				var mesh = GEPPETTO.getVARS().meshes[instancePath];
				if(mesh!=undefined)
				{
					if (!mesh.visible) 
					{
						GEPPETTO.SceneController.merge(instancePath);
					}
					// make sure that path was selected in the first place
					if (mesh.selected == true) 
					{
						if (mesh instanceof THREE.Object3D) 
						{
							mesh.traverse(function(child) 
							{
								if (child instanceof THREE.Mesh || child instanceof THREE.Line) 
								{
									GEPPETTO.SceneController.setThreeColor(child.material.color,child.material.defaultColor);
									child.material.opacity = child.material.defaultOpacity;
								}
							});
							mesh.selected = false;
							mesh.ghosted = false;
						}
					} 
					else 
					{
						mesh.material.color.set(mesh.material.defaultColor);
						mesh.material.opacity = mesh.material.defaultOpacity;
						mesh.selected = false;
						mesh.ghosted = false;
					}
					return true;
				}
				return false;
			},

			/**
			 * Show aspect, make it visible.
			 * 
			 * @param {String}
			 *            instancePath - Instance path of aspect to make visible
			 */
			showAspect : function(instancePath) {
				// if already visible, return false for unsuccessful
				// operation
				if (GEPPETTO.getVARS().meshes[instancePath].visible == true) 
				{
					return false;
				}
				// make mesh visible
				else 
				{
					GEPPETTO.getVARS().meshes[instancePath].visible = true;
					return true;
				}
			},

			/**
			 * Change the color of a given aspect
			 * 
			 * @param {String}
			 *            instancePath - Instance path of aspect to change
			 *            color
			 */
			setColor : function(instancePath, color) 
			{
				var mesh = GEPPETTO.getVARS().meshes[instancePath];
				if(mesh!=undefined)
				{
					mesh.traverse(function(object) {
						if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
							GEPPETTO.SceneController.setThreeColor(object.material.color,color);
							object.material.defaultColor=color;
						}
					});
					return true;
				}
				return false;
			},
			
		
			setThreeColor:function(threeColor,color){
				if(color.indexOf("rgb")==-1)
				{
					threeColor.setHex(color);

				}
				else
				{
					threeColor.set(color);
				}
			},

			
			/**
			 * Change the default opacity for a given aspect. The opacity set with this command API will be persisted across different workflows, e.g. selection.
			 * 
			 * @param {String}
			 *            instancePath - Instance path of aspect to change
			 *            opacity for
			 */
			setOpacity : function(instancePath, opacity) 
			{
				var mesh = GEPPETTO.getVARS().meshes[instancePath];
				if(mesh!=undefined)
				{
					mesh.defaultOpacity=opacity;
					if (opacity == 1)
					{
						mesh.traverse(function(object) {
							if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
								object.material.transparent = false;
								object.material.opacity = 1;
								object.material.defaultOpacity=1;
							}
						});
					} else 
					{
						mesh.traverse(function(object) {
							if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
								object.material.transparent = true;
								object.material.opacity = opacity;
								object.material.defaultOpacity=opacity;
							}
						});
					}
					
					return true;
				}
				return false;
			},
			
			/**
			 * Change opacity of a given aspect
			 * 
			 * @param {String}
			 *            instancePath - Instance path of aspect to change
			 *            opacity for
			 * @param {String}
			 *            type - Instance path of aspect to change
			 *            opacity for
			 * @param {String}
			 *            thickness - Instance path of aspect to change
			 *            opacity for
			 */
			setGeometryType : function(aspect, type, thickness) {
				var lines=false;
				if(type==="lines")
				{
					lines=true;
				}
				else if(type==="tubes")
				{
					lines=false
				}
				else if(type==="cylinders")
				{
					lines=false
				}
				else
				{
					return false;
				}
				GEPPETTO.SceneFactory.init3DObject(GEPPETTO.SceneFactory.generate3DObjects(aspect, lines, thickness),aspect.getInstancePath());

				return true;
			},

			/**
			 * Hide aspect
			 * 
			 * @param {String}
			 *            instancePath - Path of the aspect to make invisible
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
			 * Zoom to a mesh given the instance path of the aspect to which it belongs
			 */
			zoomToMesh : function(path) {
				GEPPETTO.getVARS().controls.reset();

				var aabbMin = null;
				var aabbMax = null;

				var mesh = GEPPETTO.getVARS().meshes[path];
				mesh.geometry.computeBoundingBox();

				aabbMin = mesh.geometry.boundingBox.min;
				aabbMax = mesh.geometry.boundingBox.max;

				var bb = mesh.geometry.boundingBox;
				bb.translate(mesh.localToWorld(new THREE.Vector3()));

				// Compute world AABB center
				GEPPETTO.getVARS().sceneCenter = bb.center();

				GEPPETTO.updateCamera(aabbMax, aabbMin);
			},

			/**
			 * Takes a path and zoom to all meshes in the scene that descend from it
			 * focus camera.
			 */
			zoomToMeshes : function(path) 
			{
				GEPPETTO.getVARS().controls.reset();

				var aabbMin = null;
				var aabbMax = null;

				for ( var meshInstancePath in GEPPETTO.getVARS().meshes) 
				{
					var child = GEPPETTO.getVARS().meshes[meshInstancePath];
					if (meshInstancePath.startsWith(path)) 
					{
						if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.PointCloud) 
						{
								child.geometry.computeBoundingBox();
	
								var bb = child.geometry.boundingBox;
								bb.translate(child.localToWorld(new THREE.Vector3()));
	
								// If min and max vectors are null, first values become default min and max
								if (aabbMin == null && aabbMax == null) 
								{
									aabbMin = bb.min;
									aabbMax = bb.max;
								}
	
								// Compare other meshes, particles BB's to find min and max
								else {
									aabbMin.x = Math.min(aabbMin.x, bb.min.x);
									aabbMin.y = Math.min(aabbMin.y, bb.min.y);
									aabbMin.z = Math.min(aabbMin.z, bb.min.z);
									aabbMax.x = Math.max(aabbMax.x, bb.max.x);
									aabbMax.y = Math.max(aabbMax.y, bb.max.y);
									aabbMax.z = Math.max(aabbMax.z, bb.max.z);
								}
							
						}
						else if(child instanceof THREE.Object3D)
						{
							child.traverse(function(object) 
							{
								if (object instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.PointCloud)
								{
									object.geometry.computeBoundingBox();
									
									var bb = object.geometry.boundingBox;
									bb.translate(object.localToWorld(new THREE.Vector3()));
		
									// If min and max vectors are null, first values become default min and max
									if (aabbMin == null && aabbMax == null) {
										aabbMin = bb.min;
										aabbMax = bb.max;
									}
		
									// Compare other meshes, particles BB's to find min and max
									else {
										aabbMin.x = Math.min(aabbMin.x, bb.min.x);
										aabbMin.y = Math.min(aabbMin.y, bb.min.y);
										aabbMin.z = Math.min(aabbMin.z, bb.min.z);
										aabbMax.x = Math.max(aabbMax.x, bb.max.x);
										aabbMax.y = Math.max(aabbMax.y, bb.max.y);
										aabbMax.z = Math.max(aabbMax.z, bb.max.z);
									}
								}
							});
						}
					}
				}

				// Compute world AABB center
				GEPPETTO.getVARS().sceneCenter.x = (aabbMax.x + aabbMin.x) * 0.5;
				GEPPETTO.getVARS().sceneCenter.y = (aabbMax.y + aabbMin.y) * 0.5;
				GEPPETTO.getVARS().sceneCenter.z = (aabbMax.z + aabbMin.z) * 0.5;

				GEPPETTO.updateCamera(aabbMax, aabbMin)
			},

			/**
			 * Change color for meshes that are connected to other meshes. Color
			 * depends on whether that mesh (aspect) is an output, input or both
			 * connection.
			 * 
			 * @param {Array}
			 *            paths - Array containing the paths of meshes (aspects)
			 *            that are the connections.
			 * @param {String}
			 *            type - Type of connection, input or output
			 */
			showConnections : function(paths, type) {
				for ( var e in paths) {
					var mesh = GEPPETTO.getVARS().meshes[paths[e]];
				
					// determine whether connection is input or output
					if (type == GEPPETTO.Resources.INPUT_CONNECTION) {
						// figure out if connection is both, input and output
						if (mesh.output) {
							GEPPETTO.SceneController.setThreeColor(mesh.material.color,GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
						} else {
							GEPPETTO.SceneController.setThreeColor(mesh.material.color,GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED);
						}
						mesh.input = true;
					} else if (type == GEPPETTO.Resources.OUTPUT_CONNECTION) {
						// figure out if connection is both, input and output
						if (mesh.input) {
							GEPPETTO.SceneController.setThreeColor(mesh.material.color,GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
						} else {
							GEPPETTO.SceneController.setThreeColor(mesh.material.color,GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED);
						}
						mesh.output = true;
					}				

				}
		
			},

			/**
			 * Hide connections. Undoes changes done by show connections, in
			 * which the connections were shown and ghost effects apply after
			 * selection.
			 * 
			 * @param {Array}
			 *            paths - Array of aspects that have the connections
			 */
			hideConnections : function(paths) {
				for ( var e in paths) {
					var mesh = GEPPETTO.getVARS().meshes[paths[e]];

					// if mesh is not selected, give it ghost or default color
					// and opacity
					if (!mesh.selected) {
						// if there are nodes still selected, give it a ghost
						// effect. If not nodes are
						// selected, give the meshes old default color
						if (G.getSelection().length > 0) {
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
							mesh.ghosted = true;
						} else {
							GEPPETTO.SceneController.setThreeColor(mesh.material.color,mesh.material.defaultColor);
							mesh.material.transparent = true;
							mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
						}
					}
					// if mesh is selected, make it look like so
					else {
						GEPPETTO.SceneController.setThreeColor(mesh.material.color,GEPPETTO.Resources.COLORS.SELECTED);
						mesh.material.transparent = true;
						mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
					}

					mesh.input = false;
					mesh.output = false;
				}
			},

			showConnectionLines : function(path, lines) {
				var segments = Object.keys(lines).length;

				var mesh = GEPPETTO.getVARS().meshes[path];
				var origin = mesh.position.clone();

				for ( var aspectPath in lines) 
				{

					var type = lines[aspectPath];
					var destinationMesh = GEPPETTO.getVARS().meshes[aspectPath];
					var destination = destinationMesh.position.clone();

					var geometry = new THREE.Geometry();

					geometry.vertices.push(origin, destination);
					geometry.verticesNeedUpdate = true;
					geometry.dynamic = true;

					var c;

					if (type == GEPPETTO.Resources.INPUT_CONNECTION) 
					{
						// figure out if connection is both, input and output
						if (mesh.output) 
						{
							c = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
						} else 
						{
							c = GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED;
						}
					} else if (type == GEPPETTO.Resources.OUTPUT_CONNECTION) 
					{
						// figure out if connection is both, input and output
						if (mesh.input) 
						{
							c = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
						} else 
						{
							c = GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED;
						}
					}

					var material = new THREE.LineBasicMaterial({
						opacity : 1,
						linewidth : 2
					});
					material.color.setHex(c);

					var line = new THREE.Line(geometry, material);
					line.updateMatrixWorld(true);

					GEPPETTO.getVARS().scene.add(line);
					GEPPETTO.getVARS().connectionLines[path+"to"+aspectPath] = line;
				}
			},

			hideConnectionLines : function() {
				var lines = GEPPETTO.getVARS().connectionLines;
				for (line in lines) 
				{
					GEPPETTO.getVARS().scene.remove(lines[line]);
				}
			},

			splitHighlightedMesh : function(targetObjects, aspects) {
				var groups = {};
				for (a in aspects) {
					// create object to hold geometries used for merging objects
					// in groups
					var geometryGroups = {};

					var mergedMesh = GEPPETTO.getVARS().meshes[a];

					/*
					 * reset the aspect instance path group mesh, this is used
					 * to group /*visual objects that don't belong to any of the
					 * groups passed as parameter
					 */
					GEPPETTO.getVARS().splitMeshes[a] = null;
					geometryGroups[a] = new THREE.Geometry();
					var highlightedMesh = a + ".highlighted";
					GEPPETTO.getVARS().splitMeshes[highlightedMesh] = null;
					geometryGroups[highlightedMesh] = new THREE.Geometry();

					// get map of all meshes that merged mesh was merging
					var map = mergedMesh.mergedMeshesPaths;

					// loop through individual meshes, add them to group, set
					// new material to them
					for (v in map) {
						var m = GEPPETTO.getVARS().visualModelMap[map[v]];
						if (m.instancePath in targetObjects) {
							// merged mesh into corresponding geometry
							var geometry = geometryGroups[highlightedMesh];
							geometry.merge(m.geometry, m.matrix);
						} else {
							// merged mesh into corresponding geometry
							var geometry = geometryGroups[a];
							geometry.merge(m.geometry, m.matrix);
						}
					}

					groups[a] = {};
					groups[a].color = mergedMesh.material.color;
					groups[highlightedMesh] = {};
					var newGroups = {};
					newGroups[a] = {};
					newGroups[highlightedMesh] = {};
					GEPPETTO.SceneController.createGroupMeshes(a,
							geometryGroups, newGroups);
				}
				return groups;
			},

			/**
			 * Highlight part of a mesh
			 * 
			 * @param {String}
			 *            path - Path of mesh to highlight
			 * @param {boolean}
			 *            mode - Highlight or unhighlight
			 */
			highlight : function(targetObjects, aspects, mode) {
				var splitHighlightedGroups = GEPPETTO.SceneController
						.splitHighlightedMesh(targetObjects, aspects);

				for (groupName in splitHighlightedGroups) {
					// get group mesh
					var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];

					if (!(groupName in aspects)) {
						if (mode) 
						{
							GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, GEPPETTO.Resources.COLORS.HIGHLIGHTED);
							groupMesh.highlighted = true;
						} 
						else 
						{
							GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, groupMesh.material.defaultColor);
							groupMesh.highlighted = false;
						}
					} 
					else 
					{
						GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, splitHighlightedGroups[groupName].color.getHex());
					}
				}
			},

			/**
			 * Split merged mesh into individual meshes
			 * 
			 * @param {String}
			 *            aspectInstancePath - Path of aspect, corresponds to
			 *            original merged mesh
			 * @param {AspectSubTreeNode}
			 *            visualizationTree - Aspect Visualization Tree with
			 *            groups info for visual objects
			 * @param {object}
			 *            groups - The groups that we need to split mesh into
			 */
			splitGroups : function(aspectInstancePath, visualizationTree, groups) {
				// retrieve the merged mesh
				var mergedMesh = GEPPETTO.getVARS().meshes[aspectInstancePath];
				// create object to hold geometries used for merging objects in
				// groups
				var geometryGroups = {};

				/*
				 * reset the aspect instance path group mesh, this is used to
				 * group visual objects that don't belong to any of the groups
				 * passed as parameter
				 */
				GEPPETTO.getVARS().splitMeshes[aspectInstancePath] = null;
				geometryGroups[aspectInstancePath] = new THREE.Geometry();
				// create map of geometry groups for groups
				for ( var g in groups) {
					var groupName = aspectInstancePath + "." + g;
					var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];

					var geometry = {};
					// if there's no group mesh already for this group, we
					// create a geometry
					// for it, this will used to merge visual objects
					if (groupMesh == null || groupMesh == undefined) {
						geometry = new THREE.Geometry();
						geometry.groupMerge = true;
					}
					// group mesh already exist, set flag to merge false
					else {
						geometry = groupMesh.geometry;
						geometry.groupMerge = false;
					}
					// store merge flag value, and new geometry if populate flag
					// set to true
					geometryGroups[groupName] = geometry;
				}

				// get map of all meshes that merged mesh was merging
				var map = mergedMesh.mergedMeshesPaths;

				// flag for keep track what visual objects were added to group
				// meshes already
				var added = false;
				// loop through individual meshes, add them to group, set new
				// material to them
				for ( var v in map) {
					var m = GEPPETTO.getVARS().visualModelMap[map[v]];
					// get object from visualizationtree by using the object's
					// instance path as search key
					var object = GEPPETTO.get3DObjectInVisualizationTree(visualizationTree, map[v]);
					// get group elements list for object
					var objectsGroups = object.groups;
					for (g in objectsGroups) 
					{
						if (objectsGroups[g] in groups) 
						{
							// name of group, mix of aspect path and group name
							var groupName = aspectInstancePath + "." + objectsGroups[g];
							// retrieve corresponding geometry for this group
							var geometry = geometryGroups[groupName];
							// only merge if flag is set to true
							if (geometry.groupMerge) {
								// merged mesh into corresponding geometry
								geometry.merge(m.geometry, m.matrix);
							}
							// true means don't add to mesh with non-groups
							// visual objects
							added = true;
						}
					}

					// if visual object didn't belong to group, add it to mesh
					// with remainder of them
					if (!added) {
						var geometry = geometryGroups[aspectInstancePath];
						geometry.merge(m.geometry, m.matrix);
					}
					// reset flag for next visual object
					added = false;
				}

				groups[aspectInstancePath] = {};
				groups[aspectInstancePath].color = GEPPETTO.Resources.COLORS.SPLIT;
				GEPPETTO.SceneController.createGroupMeshes(aspectInstancePath, geometryGroups, groups);
			},

			/**
			 * Create group meshes for given groups, retrieves from map if
			 * already present
			 */
			createGroupMeshes : function(aspectInstancePath, geometryGroups,
					groups) {
				var mergedMesh = GEPPETTO.getVARS().meshes[aspectInstancePath];
				for (g in groups) {
					var groupName = g;
					if (groupName.indexOf(aspectInstancePath) <= -1) {
						groupName = aspectInstancePath + "." + g;
					}

					var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];

					if (groupMesh == null || groupMesh == undefined) {
						var geometryGroup = geometryGroups[groupName];
						var material = GEPPETTO.SceneFactory.getMeshPhongMaterial();

						groupMesh = new THREE.Mesh(geometryGroup, material);
						groupMesh.name = aspectInstancePath;
						groupMesh.geometry.dynamic = false;
						groupMesh.position.copy(mergedMesh.position);
						groupMesh.visible = false;
						GEPPETTO.getVARS().splitMeshes[groupName] = groupMesh;
					}
					// if split mesh is not visible, add it to scene
					if (!groupMesh.visible) {
						// switch visible flag to false for merged mesh and
						// remove from scene
						mergedMesh.visible = false;
						GEPPETTO.getVARS().scene.remove(mergedMesh);
						// add split mesh to scenne and set flag to visible
						groupMesh.visible = true;
						GEPPETTO.getVARS().scene.add(groupMesh);
					}
				}
			},

			/**
			 * Merge mesh that was split before
			 * 
			 * @param {String}
			 *            aspectPath - Path to aspect that points to mesh
			 */
			merge : function(aspectPath) {
				// get mesh from map
				var mergedMesh = GEPPETTO.getVARS().meshes[aspectPath];

				// if merged mesh is not visible, turn it on and turn split one
				// off
				if (!mergedMesh.visible) {
					for (path in GEPPETTO.getVARS().splitMeshes) {
						// retrieve split mesh that is on the scene
						var splitMesh = GEPPETTO.getVARS().splitMeshes[path];
						if (aspectPath == splitMesh.name) {
							splitMesh.visible = false;
							// remove split mesh from scene
							GEPPETTO.getVARS().scene.remove(splitMesh);
						}
					}
					// add merged mesh to scene and set flag to true
					mergedMesh.visible = true;
					GEPPETTO.getVARS().scene.add(mergedMesh);
				}
			},

			/**
			 * Shows a visual group
			 */
			showVisualGroups : function(visualizationTree, visualGroups, mode) {
				// aspect path of visualization tree parent
				var aspectPath = visualizationTree.getParent()
						.getInstancePath();

				GEPPETTO.SceneController.merge(aspectPath);
				if (mode) 
				{
					GEPPETTO.SceneController.splitGroups(aspectPath,
							visualizationTree, visualGroups);
					for (g in visualGroups) {
						// retrieve visual group object
						var visualGroup = visualGroups[g];

						// get full group name to access group mesh
						var groupName = g;
						if (groupName.indexOf(aspectPath) <= -1) {
							groupName = aspectPath + "." + g;
						}

						// get group mesh
						var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];

						if (mode) 
						{
							GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, visualGroup.color);
						} else 
						{
							GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, GEPPETTO.Resources.COLORS.SPLIT);
						}
					}
				}
			},

			/**
			 * Animate simulation
			 */
			animate : function() {
				GEPPETTO.getVARS().debugUpdate = GEPPETTO.getVARS().needsUpdate; 
				// so that we log only the cycles when we are updating the scene

				GEPPETTO.getVARS().controls.update();

				requestAnimationFrame(GEPPETTO.SceneController.animate);
				GEPPETTO.render();
				if (GEPPETTO.getVARS().stats) {
					GEPPETTO.getVARS().stats.update();
				}
				if (GEPPETTO.getVARS().debugUpdate) {
					GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_END);
				}
			},
		}
	}
});
