/**
 * Controls events coming to the 3D side of things; selecting, showing, hiding, ghosting, lighting of entities. Command to populate and update scene are also here, and then dispatch to factory.
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {
        var $ = require('jquery'), _ = require('underscore'), Backbone = require('backbone');

        require('d3');
        require('three');
        require('vendor/ColladaLoader');
        require('vendor/OBJLoader');
        require('GEPPETTO.Resources')(GEPPETTO);

        GEPPETTO.SceneController =
        {

            linesThreshold: 2000,
            aboveLinesThreshold: false,
            wireframe: false,

            /**
             * Populate the scene with given instances
             *
             * @param instances -
             *            skeleton with instances and visual entities
             */
            buildScene: function (instances) {
                GEPPETTO.SceneController.traverseInstances(instances);
                GEPPETTO.getVARS().scene.updateMatrixWorld(true);
            },


            /**
             * Add new visual instances to the scene
             * @param instances
             */
            updateSceneWithNewInstances: function (instances) {
            	var updateCamera=false;
            	if(Object.keys(GEPPETTO.getVARS().meshes).length === 0){
            		updateCamera=true;
            	}
                for (var g = 0; g < instances.length; g++) {
                    // add instance to scene
                    GEPPETTO.SceneController.checkVisualInstance(instances[g]);
                }
                if(updateCamera){
                	G.resetCamera();
                }
            },

            /**
             * Traverse the instances building a visual object when needed
             *
             * @param instances -
             *            skeleton with instances and visual entities
             */
            traverseInstances: function (instances) {
                for (var j = 0; j < instances.length; j++) {
                    GEPPETTO.SceneController.checkVisualInstance(instances[j]);
                }
            },

            /**
             * Check if we need to create a visual object for a given instance and keeps iterating
             *
             * @param instances -
             *            skeleton with instances and visual entities
             */
            checkVisualInstance: function (instance) {
                if (instance.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                    //since the visualcapability propagates up through the parents we can avoid visiting things that don't have it
                    if ((instance.getType().getMetaType() != GEPPETTO.Resources.ARRAY_TYPE_NODE) && instance.getVisualType()) {
                        GEPPETTO.SceneFactory.buildVisualInstance(instance);
                    }
                    // this block keeps traversing the instances
                    if (instance.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
                        GEPPETTO.SceneController.traverseInstances(instance.getChildren());
                    } else if (instance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                        GEPPETTO.SceneController.traverseInstances(instance);
                    }
                }
            },


            /**
             * Applies visual transformation to given aspect.
             */
            applyVisualTransformation: function (visualAspect, transformation) {
                // NOTE: visualAspect currently disregarded as the
                // transformation applies to the entire scene
                GEPPETTO.getVARS().renderer.setCurrentMatrix(transformation);
            },

            /**
             * Light up the entity
             *
             * @param {Instance}
             *            instance - the instance to be lit
             * @param {Float}
             *            intensity - the lighting intensity from 0 (no illumination) to 1 (full illumination)
             */
            lightUpEntity: function (instance, intensity) {
                if (intensity <= 0) {
                    intensity = 1e-6;
                }
                if (intensity > 1) {
                    intensity = 1;
                }
                var threeObject;
                if (instance in GEPPETTO.getVARS().meshes) {
                    threeObject = GEPPETTO.getVARS().meshes[instance];
                }
                else {
                    threeObject = GEPPETTO.getVARS().splitMeshes[instance];
                }
                var baseColor = threeObject.material.defaultColor;
                if (threeObject instanceof THREE.Line) {
                    threeObject.material.color = new THREE.Color(d3.scale.linear().domain([0, 1]).range([baseColor, "red"])(intensity));
                } else {
                    threeObject.material.emissive = new THREE.Color(d3.scale.linear().domain([0, 1]).range([baseColor, "red"])(intensity));
                }

            },

            /**
             * Set ghost effect, bridge between other classes and ghost effect call
             *
             * @param {boolean}
             *            apply - Turn on or off the ghost effect
             */
            setGhostEffect: function (apply) {
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
            ghostEffect: function (meshes, apply) {
                for (var v in meshes) {
                    var mesh = meshes[v];
                    if (mesh != null && mesh.visible) {
                        if (apply && (!mesh.ghosted) && (!mesh.selected)) {
                            if (mesh instanceof THREE.Object3D) {
                                mesh.ghosted = true;
                                mesh.traverse(function (object) {
                                    if (object.hasOwnProperty("material")) {
                                        if (object.visible) {
                                            object.ghosted = true;
                                            object.material.transparent = true;
                                            object.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
                                        }
                                    }
                                });
                            } else {
                                mesh.ghosted = true;
                                mesh.material.transparent = true;
                                mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
                            }
                        } else if ((!apply) && (mesh.ghosted)) {
                            if (mesh instanceof THREE.Object3D) {
                                mesh.ghosted = false;
                                mesh.traverse(function (object) {
                                    if (object.hasOwnProperty("material")) {
                                        if (object.visible) {
                                            object.ghosted = false;
                                            object.material.opacity = object.material.defaultOpacity;
                                            if (object.material.opacity == 1) {
                                                object.material.transparent = false;
                                            }
                                        }
                                    }
                                });
                            } else {
                                mesh.ghosted = false;
                                mesh.material.opacity = mesh.material.defaultOpacity;
                                if (mesh.material.opacity == 1) {
                                    mesh.material.transparent = false;
                                }
                            }
                        }
                    }

                }
            },

            select: function (instances) {
                for (var i = 0; i < instances.length; i++) {
                    instances[i].select();
                }

            },

            deselect: function (instances) {
                for (var i = 0; i < instances.length; i++) {
                    instances[i].deselect();
                }
            },

            /**
             * Selects an aspect given the path of it. Color changes to yellow, and opacity become 100%.
             *
             * @param {String}
             *            instancePath - Path of aspect of mesh to select
             */
            selectInstance: function (instancePath) {
                var meshes = this.getRealMeshesForInstancePath(instancePath);
                if (meshes.length > 0) {
                    for (var meshesIndex in meshes) {
                        var mesh = meshes[meshesIndex];

                        if (!mesh.visible) {
                            GEPPETTO.SceneController.merge(instancePath);
                        }
                        if (mesh.selected == false) {
                            if (mesh instanceof THREE.Object3D) {
                                mesh.traverse(function (child) {
                                    if (child.hasOwnProperty("material")) {
                                        GEPPETTO.SceneController.setThreeColor(child.material.color, GEPPETTO.Resources.COLORS.SELECTED);
                                        child.material.opacity = Math.max(0.5, child.material.defaultOpacity);
                                    }
                                });
                                mesh.selected = true;
                                mesh.ghosted = false;
                            } else {
                                GEPPETTO.SceneController.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.SELECTED);
                                mesh.material.opacity = Math.max(0.5, mesh.material.defaultOpacity);
                                mesh.selected = true;
                                mesh.ghosted = false;
                            }

                        }
                    }
                    return true;
                }
                return false;
            },

            /**
             * Get Meshes associated to an instance
             *
             * @param {String}
             *            instancePath - Path of the instance
             */
            getRealMeshesForInstancePath: function (instancePath) {
                var meshes = [];
                if (instancePath in GEPPETTO.getVARS().splitMeshes) {
                    for (var keySplitMeshes in GEPPETTO.getVARS().splitMeshes) {
                        if (keySplitMeshes.startsWith(instancePath)) {
                            if (GEPPETTO.getVARS().splitMeshes[instancePath] && GEPPETTO.getVARS().splitMeshes[instancePath].visible) {
                                meshes.push(GEPPETTO.getVARS().splitMeshes[keySplitMeshes]);
                            }
                        }

                    }
                }
                else {
                    if (instancePath in GEPPETTO.getVARS().meshes) {
                        meshes.push(GEPPETTO.getVARS().meshes[instancePath]);
                    }
                }
                return meshes;
            },

            /**
             * Deselect aspect, or mesh as far as tree js is concerned.
             *
             * @param {String}
             *            instancePath - Path of the mesh/aspect to select
             */
            deselectInstance: function (instancePath) {
                var meshes = this.getRealMeshesForInstancePath(instancePath);
                if (meshes.length > 0) {
                    for (var meshesIndex in meshes) {
                        var mesh = meshes[meshesIndex];
                        // match instancePath to mesh store in variables properties
                        if (!mesh.visible) {
                            GEPPETTO.SceneController.merge(instancePath);
                        }
                        // make sure that path was selected in the first place
                        if (mesh.selected == true) {
                            if (mesh instanceof THREE.Object3D) {
                                mesh.traverse(function (child) {
                                    if (child.hasOwnProperty("material")) {
                                        GEPPETTO.SceneController.setThreeColor(child.material.color, child.material.defaultColor);
                                        child.material.opacity = child.material.defaultOpacity;
                                    }
                                });
                                mesh.selected = false;
                            }
                        } else {
                            mesh.material.color.set(mesh.material.defaultColor);
                            mesh.material.opacity = mesh.material.defaultOpacity;
                            mesh.selected = false;
                        }
                    }
                    return true;
                }
                return false;
            },

            /**
             *
             * @param instances
             */
            show: function (instances) {
                for (var i = 0; i < instances.length; i++) {
                    instances[i].show();
                }
            },

            /**
             *
             * @param instances
             */
            hide: function (instances) {
                for (var i = 0; i < instances.length; i++) {
                    instances[i].hide();
                }
            },

            /**
             * Resets the scene controller
             */
            reset: function () {
                GEPPETTO.SceneController.complexity = 0;
                GEPPETTO.SceneController.aboveLinesThreshold = false;
            },

            /**
             * Sets whether to use wireframe for the materials of the meshes
             */
            setWireframe: function (wireframe) {
                GEPPETTO.SceneController.wireframe = wireframe;
                GEPPETTO.getVARS().scene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material.wireframe = GEPPETTO.SceneController.wireframe;
                    }
                });
            },

            /**
             * Show aspect, make it visible.
             *
             * @param {String}
             *            instancePath - Instance path of aspect to make visible
             */
            showInstance: function (instancePath) {
                var meshes = this.getRealMeshesForInstancePath(instancePath);
                if (meshes.length > 0) {
                    for (var i = 0; i < meshes.length; i++) {
                        var mesh = meshes[i];
                        if (mesh) {
                            mesh.traverse(function (object) {
                                object.visible = true;
                            });
                        }
                    }
                }
            },

            /**
             * Hide instance
             *
             * @param {String}
             *            instancePath - Path of the aspect to make invisible
             */
            hideInstance: function (instancePath) {
                for (var v in GEPPETTO.getVARS().meshes) {
                    if (v == instancePath) {
                        if (GEPPETTO.getVARS().meshes[v].visible == false) {
                            return false;
                        } else {
                            GEPPETTO.getVARS().meshes[v].visible = false;
                            return true;
                        }
                    }
                }
                return false;
            },

            /**
             * Change the color of a given aspect
             *
             * @param {String}
             *            instancePath - Instance path of aspect to change color
             */
            setColor: function (instancePath, color) {
                var meshes = this.getRealMeshesForInstancePath(instancePath);
                if (meshes.length > 0) {
                    for (var i = 0; i < meshes.length; i++) {
                        var mesh = meshes[i];
                        if (mesh) {
                            mesh.traverse(function (object) {
                                if (object.hasOwnProperty("material")) {
                                    GEPPETTO.SceneController.setThreeColor(object.material.color, color);
                                    object.material.defaultColor = color;
                                }
                            });
                        }
                        return true;
                    }
                }
                return false;
            },

            /**
             *
             * @param threeColor
             * @param color
             */
            setThreeColor: function (threeColor, color) {
                if (color.indexOf && color.indexOf("rgb") == -1) {
                    threeColor.setHex(color);

                } else if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                    threeColor.r = color.r;
                    threeColor.g = color.g;
                    threeColor.b = color.b;
                } else {
                    threeColor.set(color);
                }
            },

            /**
             * Change the default opacity for a given aspect. The opacity set with this command API will be persisted across different workflows, e.g. selection.
             *
             * @param {String}
             *            instancePath - Instance path of aspect to change opacity for
             */
            setOpacity: function (instancePath, opacity) {
                var mesh = GEPPETTO.getVARS().meshes[instancePath];
                if (mesh != undefined) {
                    mesh.defaultOpacity = opacity;
                    if (opacity == 1) {
                        mesh.traverse(function (object) {
                            if (object.hasOwnProperty("material")) {
                                object.material.transparent = false;
                                object.material.opacity = 1;
                                object.material.defaultOpacity = 1;
                            }
                        });
                    } else {
                        mesh.traverse(function (object) {
                            if (object.hasOwnProperty("material")) {
                                object.material.transparent = true;
                                object.material.opacity = opacity;
                                object.material.defaultOpacity = opacity;
                            }
                        });
                    }

                    return true;
                }
                return false;
            },

            /**
             * Set the threshold (number of 3D primitives on the scene) above which we switch the visualization to lines
             * for teh CompositeVisualTypes
             * @param threshold
             */
            setLinesThreshold: function (threshold) {
                GEPPETTO.SceneController.linesThreshold = threshold;
            },

            /**
             * Change the type of geometry used to visualize the instance
             *
             * @param {String}
             *            instance - The instance to change the geometry type for
             * @param {String}
             *            type - The geometry type, see GEPPETTO.Resources.GeometryTypes
             * @param {String}
             *            thickness - Optional: the thickness to be used if the geometry is "lines"
             */
            setGeometryType: function (instance, type, thickness) {
                var lines = false;
                if (type === GEPPETTO.Resources.GeometryTypes.LINES) {
                    lines = true;
                } else if (type === GEPPETTO.Resources.GeometryTypes.TUBES) {
                    lines = false
                } else if (type === GEPPETTO.Resources.GeometryTypes.CYLINDERS) {
                    lines = false
                } else {
                    return false;
                }
                GEPPETTO.SceneFactory.init3DObject(GEPPETTO.SceneFactory.generate3DObjects(instance, lines, thickness), instance);

                return true;
            },

            /**
             * Set the type of geometry used to visualize all the instances in the scene
             * @param type - The geometry type either "lines", "tubes" or "cylinders"
             */
            setAllGeometriesType: function (type) {
                var visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, window.Instances);
                for (var i = 0; i < visualInstances.length; i++) {
                    if (GEPPETTO.getVARS().meshes[visualInstances[i].getInstancePath()]) {
                        var visualType = visualInstances[i].getVisualType();
                        if (visualType) {
                            if (visualType.getWrappedObj().eClass == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                                GEPPETTO.SceneController.setGeometryType(visualInstances[i], type);
                            }
                        }
                    }
                }
            },


            /**
             *
             * @param instance
             */
            zoomToInstance: function (instance) {
                GEPPETTO.getVARS().controls.reset();

                var zoomParameters = {};
                var mesh = GEPPETTO.getVARS().meshes[instance.getInstancePath()];
                mesh.traverse(function (object) {
                    if (object.hasOwnProperty("geometry")) {
                        GEPPETTO.SceneController.addMeshToZoomParameters(object, zoomParameters);
                    }
                });

                GEPPETTO.SceneController.zoomToParameters(zoomParameters);

            },

            /**
             *
             * @param zoomParameters
             */
            zoomToParameters: function (zoomParameters) {
                // Compute world AABB center
                GEPPETTO.getVARS().sceneCenter.x = (zoomParameters.aabbMax.x + zoomParameters.aabbMin.x) * 0.5;
                GEPPETTO.getVARS().sceneCenter.y = (zoomParameters.aabbMax.y + zoomParameters.aabbMin.y) * 0.5;
                GEPPETTO.getVARS().sceneCenter.z = (zoomParameters.aabbMax.z + zoomParameters.aabbMin.z) * 0.5;

                GEPPETTO.updateCamera(zoomParameters.aabbMax, zoomParameters.aabbMin)
            },

            /**
             *
             * @param mesh
             * @param zoomParameters
             * @returns {*}
             */
            addMeshToZoomParameters: function (mesh, zoomParameters) {
                mesh.geometry.computeBoundingBox();
                aabbMin = mesh.geometry.boundingBox.min;
                aabbMax = mesh.geometry.boundingBox.max;

                bb = mesh.geometry.boundingBox;
                bb.translate(mesh.localToWorld(new THREE.Vector3()));

                // If min and max vectors are null, first values become default min and max
                if (zoomParameters.aabbMin == undefined && zoomParameters.aabbMax == undefined) {
                    zoomParameters.aabbMin = bb.min;
                    zoomParameters.aabbMax = bb.max;
                } else {
                    // Compare other meshes, particles BB's to find min and max
                    zoomParameters.aabbMin.x = Math.min(zoomParameters.aabbMin.x, bb.min.x);
                    zoomParameters.aabbMin.y = Math.min(zoomParameters.aabbMin.y, bb.min.y);
                    zoomParameters.aabbMin.z = Math.min(zoomParameters.aabbMin.z, bb.min.z);
                    zoomParameters.aabbMax.x = Math.max(zoomParameters.aabbMax.x, bb.max.x);
                    zoomParameters.aabbMax.y = Math.max(zoomParameters.aabbMax.y, bb.max.y);
                    zoomParameters.aabbMax.z = Math.max(zoomParameters.aabbMax.z, bb.max.z);
                }

                return zoomParameters;
            },

            /**
             *
             * @param instances
             */
            zoomTo: function (instances) {
                GEPPETTO.getVARS().controls.reset();

                GEPPETTO.SceneController.zoomToParameters(GEPPETTO.SceneController.zoomIterator(instances, {}));
            },

            /**
             *
             * @param instances
             * @param zoomParameters
             * @returns {*}
             */
            zoomIterator: function (instances, zoomParameters) {
                for (var i = 0; i < instances.length; i++) {
                    var instancePath = instances[i].getInstancePath();
                    var mesh = GEPPETTO.getVARS().meshes[instancePath];
                    if (mesh) {
                        mesh.traverse(function (object) {
                            if (object.hasOwnProperty("geometry")) {
                                GEPPETTO.SceneController.addMeshToZoomParameters(object, zoomParameters);
                            }
                        });
                    }
                    else {
                        zoomParameters = GEPPETTO.SceneController.zoomIterator(instances[i].getChildren(), zoomParameters);
                    }

                }
                return zoomParameters;
            },

            /**
             * Change color for meshes that are connected to other meshes. Color depends on whether that instance is an output, input or both
             *
             * @param {Instance}
             *            instance - The instance for which we want to show the connections
             * @param {String}
             *            type - Type of connection, input or output (See GEPPETTO.Resources.INPUT/OUTPUT)
             */
            highlightConnectedInstances: function (instance, type) {

                var inputs = {};
                var outputs = {};

                var connections = instance.getConnections(type);


                for (var c = 0; c < connections.length; c++) {
                    var connection = connections[c];

                    var otherEndPath = connection.getA().getPath() == instance.getInstancePath() ?
                        connection.getB().getPath() :
                        connection.getA().getPath();

                    var connectionType = connection.getA().getPath() == instance.getInstancePath() ?
                        GEPPETTO.Resources.OUTPUT :
                        GEPPETTO.Resources.INPUT;


                    // determine whether connection is input or output
                    if (connectionType == GEPPETTO.Resources.INPUT) {
                        //I want to change the colour the instances that are an input to the instance passed as a parameter
                        var mesh = GEPPETTO.getVARS().meshes[connection.getA().getPath()]; //this is the instance input to the current one
                        if (outputs[otherEndPath]) {
                            GEPPETTO.SceneController.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
                        }
                        else {
                            GEPPETTO.SceneController.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED);
                        }
                        inputs[otherEndPath] = connection.getInstancePath();
                    } else if (connectionType == GEPPETTO.Resources.OUTPUT) {
                        //I want to change the colour the instances that are an output of the instance passed as a parameter
                        var mesh = GEPPETTO.getVARS().meshes[connection.getB().getPath()]; //this is the instance output of the current on
                        if (inputs[otherEndPath]) {
                            GEPPETTO.SceneController.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
                        }
                        else {
                            GEPPETTO.SceneController.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED);
                        }
                        outputs[otherEndPath] = connection.getInstancePath();
                    }
                }
            },

            /**
             * Restore the original colour of the connected instances
             *
             * @param {Instance}
             *            instance - A connected instance
             */
            restoreConnectedInstancesColour: function (instance) {

                var connections = instance.getConnections();

                for (var c = 0; c < connections.length; c++) {
                    var connection = connections[c];

                    var mesh = connection.getA().getPath() == instance.getInstancePath() ?
                        GEPPETTO.getVARS().meshes[connection.getB().getPath()] :
                        GEPPETTO.getVARS().meshes[connection.getA().getPath()];

                    // if mesh is not selected, give it ghost or default color and opacity
                    if (!mesh.selected) {
                        // if there are nodes still selected, give it a ghost effect. If not nodes are
                        // selected, give the meshes old default color
                        if (G.getSelectionOptions().unselected_transparent) {
                            mesh.material.transparent = true;
                            mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
                            mesh.ghosted = true;
                        }
                        GEPPETTO.SceneController.setThreeColor(mesh.material.color, mesh.material.defaultColor);

                    }
                    // if mesh is selected, make it look like so
                    else {
                        GEPPETTO.SceneController.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.SELECTED);
                        mesh.material.transparent = true;
                        mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                    }
                }
            },

            /**
             *
             * @param instance
             */
            showConnectionLines: function (instance) {
                var connections = instance.getConnections();

                var mesh = GEPPETTO.getVARS().meshes[instance.getInstancePath()];
                var inputs = {};
                var outputs = {};
                var origin = mesh.position.clone();

                for (var c = 0; c < connections.length; c++) {

                    var connection = connections[c];
                    var type = connection.getA().getPath() == instance.getInstancePath() ?
                        GEPPETTO.Resources.OUTPUT :
                        GEPPETTO.Resources.INPUT;

                    var otherEndPath = connection.getA().getPath() == instance.getInstancePath() ?
                        connection.getB().getPath() :
                        connection.getA().getPath();


                    var otherEndMesh = GEPPETTO.getVARS().meshes[otherEndPath];

                    var destination = otherEndMesh.position.clone();

                    var geometry = new THREE.Geometry();

                    geometry.vertices.push(origin, destination);
                    geometry.verticesNeedUpdate = true;
                    geometry.dynamic = true;

                    var colour = null;
                    var thickness = 0;

                    if (type == GEPPETTO.Resources.INPUT) {

                        colour = GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED;

                        // figure out if connection is both, input and output
                        if (outputs[otherEndPath]) {
                            colour = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;

                            var lastLine = outputs[otherEndPath][outputs[otherEndPath].length - 1];
                            GEPPETTO.getVARS().scene.remove(GEPPETTO.getVARS().connectionLines[lastLine]);
                            delete GEPPETTO.getVARS().connectionLines[lastLine];
                            thickness = outputs[otherEndPath].length;
                        }

                        if (inputs[otherEndPath]) {
                            var lastLine = inputs[otherEndPath][inputs[otherEndPath].length - 1];
                            GEPPETTO.getVARS().scene.remove(GEPPETTO.getVARS().connectionLines[lastLine]);
                            delete GEPPETTO.getVARS().connectionLines[lastLine];
                            inputs[otherEndPath].push(connection.getInstancePath());
                        }
                        else {
                            inputs[otherEndPath] = [];
                            inputs[otherEndPath].push(connection.getInstancePath());
                        }

                        thickness = thickness + inputs[otherEndPath].length;

                    }

                    else if (type == GEPPETTO.Resources.OUTPUT) {

                        colour = GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED;
                        // figure out if connection is both, input and output
                        if (inputs[otherEndPath]) {
                            colour = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
                            var lastLine = inputs[otherEndPath][inputs[otherEndPath].length - 1];
                            GEPPETTO.getVARS().scene.remove(GEPPETTO.getVARS().connectionLines[lastLine]);
                            delete GEPPETTO.getVARS().connectionLines[lastLine];
                            thickness = inputs[otherEndPath].length;
                        }

                        if (outputs[otherEndPath]) {
                            var lastLine = outputs[otherEndPath][outputs[otherEndPath].length - 1];
                            GEPPETTO.getVARS().scene.remove(GEPPETTO.getVARS().connectionLines[lastLine]);
                            delete GEPPETTO.getVARS().connectionLines[lastLine];
                            outputs[otherEndPath].push(connection.getInstancePath());
                        }
                        else {
                            outputs[otherEndPath] = [];
                            outputs[otherEndPath].push(connection.getInstancePath());
                        }

                        thickness = thickness + outputs[otherEndPath].length;

                    }

                    var material = new THREE.LineDashedMaterial({dashSize: 3, gapSize: 1, linewidth: thickness});
                    material.color.setHex(colour);

                    var line = new THREE.LineSegments(geometry, material);
                    line.updateMatrixWorld(true);


                    if (GEPPETTO.getVARS().connectionLines[connection.getInstancePath()]) {
                        GEPPETTO.getVARS().scene.remove(GEPPETTO.getVARS().connectionLines[connection.getInstancePath()]);
                    }

                    GEPPETTO.getVARS().scene.add(line);
                    GEPPETTO.getVARS().connectionLines[connection.getInstancePath()] = line;
                }
            },

            /**
             * Removes connection lines, all if nothing is passed in or just the ones passed in.
             *
             * @param instance - optional, instance for which we want to remove the connections
             */
            removeConnectionLines: function (instance) {
                if (instance != undefined) {
                    var connections = instance.getConnections();
                    // get connections for given instance and remove only those
                    var lines = GEPPETTO.getVARS().connectionLines;
                    for (var i = 0; i < connections.length; i++) {
                        if (lines.hasOwnProperty(connections[i].getInstancePath())) {
                            // remove the connection line from the scene
                            GEPPETTO.getVARS().scene.remove(lines[connections[i].getInstancePath()]);
                            // remove the conneciton line from the GEPPETTO list of connection lines
                            delete lines[connections[i].getInstancePath()];
                        }
                    }
                } else {
                    // remove all connection lines
                    var lines = GEPPETTO.getVARS().connectionLines;
                    for (var key in lines) {
                        if (lines.hasOwnProperty(key)) {
                            GEPPETTO.getVARS().scene.remove(lines[key]);
                        }
                    }
                    GEPPETTO.getVARS().connectionLines = [];
                }
            },

            splitHighlightedMesh: function (targetObjects, aspects) {
                var groups = {};
                for (a in aspects) {
                    // create object to hold geometries used for merging objects
                    // in groups
                    var geometryGroups = {};

                    var mergedMesh = GEPPETTO.getVARS().meshes[a];

                    /*
                     * reset the aspect instance path group mesh, this is used to group /*visual objects that don't belong to any of the groups passed as parameter
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
                    GEPPETTO.SceneController.createGroupMeshes(a, geometryGroups, newGroups);
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
            highlight: function (targetObjects, aspects, mode) {
                var splitHighlightedGroups = GEPPETTO.SceneController.splitHighlightedMesh(targetObjects, aspects);

                for (groupName in splitHighlightedGroups) {
                    // get group mesh
                    var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];

                    if (!(groupName in aspects)) {
                        if (mode) {
                            GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, GEPPETTO.Resources.COLORS.HIGHLIGHTED);
                            groupMesh.highlighted = true;
                        } else {
                            GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, groupMesh.material.defaultColor);
                            groupMesh.highlighted = false;
                        }
                    } else {
                        GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, splitHighlightedGroups[groupName].color.getHex());
                    }
                }
            },

            /**
             * Split merged mesh into individual meshes
             *
             * @param {String}
             *            instancePath - Path of aspect, corresponds to original merged mesh
             * @param {AspectSubTreeNode}
             *            visualizationTree - Aspect Visualization Tree with groups info for visual objects
             * @param {object}
             *            groups - The groups that we need to split mesh into
             */
            splitGroups: function (instance, groupElements) {

                var instancePath = instance.getInstancePath();

                // retrieve the merged mesh
                var mergedMesh = GEPPETTO.getVARS().meshes[instancePath];
                // create object to hold geometries used for merging objects in
                // groups
                var geometryGroups = {};

                /*
                 * reset the aspect instance path group mesh, this is used to group visual objects that don't belong to any of the groups passed as parameter
                 */
                GEPPETTO.getVARS().splitMeshes[instancePath] = null;
                geometryGroups[instancePath] = new THREE.Geometry();

                // create map of geometry groups for groups
                for (var groupElement in groupElements) {
                    var groupName = instancePath + "." + groupElement;

                    var geometry = new THREE.Geometry();
                    geometry.groupMerge = true;

                    geometryGroups[groupName] = geometry;
                }

                // get map of all meshes that merged mesh was merging
                var map = mergedMesh.mergedMeshesPaths;

                // flag for keep track what visual objects were added to group
                // meshes already
                var added = false;
                // loop through individual meshes, add them to group, set new
                // material to them

                for (var v in map) {
                    if (v != undefined) {
                        var m = GEPPETTO.getVARS().visualModelMap[map[v]];

                        eval(map[v].substring(0, map[v].lastIndexOf(".")));
                        var object = instance.getVisualType()[map[v].replace(instancePath + ".", "")];

                        // If it is a segment compare to the id otherwise check in the visual groups
                        if (object.getId() in groupElements) {
                            // true means don't add to mesh with non-groups visual objects
                            added = GEPPETTO.SceneController.addMeshToGeometryGroup(instance, object.getId(), geometryGroups, m)
                        } else {
                            // get group elements list for object
                            var groupElementsReference = object.getInitialValue().value.groupElements;
                            for (var i = 0; i < groupElementsReference.length; i++) {
                                var objectGroup = GEPPETTO.ModelFactory.resolve(groupElementsReference[i].$ref).getId();
                                if (objectGroup in groupElements) {
                                    // true means don't add to mesh with non-groups visual objects
                                    added = GEPPETTO.SceneController.addMeshToGeometryGroup(instance, objectGroup, geometryGroups, m)
                                }
                            }
                        }

                        // if visual object didn't belong to group, add it to mesh
                        // with remainder of them
                        if (!added) {
                            var geometry = geometryGroups[instancePath];
                            if (m instanceof THREE.Line) {
                                geometry.vertices.push(m.geometry.vertices[0]);
                                geometry.vertices.push(m.geometry.vertices[1]);
                            } else {
                                // merged mesh into corresponding geometry
                                geometry.merge(m.geometry, m.matrix);
                            }
                        }
                        // reset flag for next visual object
                        added = false;
                    }
                }

                groupElements[instancePath] = {};
                groupElements[instancePath].color = GEPPETTO.Resources.COLORS.SPLIT;
                GEPPETTO.SceneController.createGroupMeshes(instancePath, geometryGroups, groupElements);
            },

            /**
             * Add mesh to geometry groups
             *
             * @param {String}
             *            instancePath - Path of aspect, corresponds to original merged mesh
             * @param {String}
             *            id - local path to the group
             * @param {object}
             *            groups - The groups that we need to split mesh into
             * @param {object}
             *            m - current mesh
             */
            addMeshToGeometryGroup: function (instance, id, geometryGroups, m) {
                // name of group, mix of aspect path and group name
                var groupName = instance.getInstancePath() + "." + id;
                // retrieve corresponding geometry for this group
                var geometry = geometryGroups[groupName];
                // only merge if flag is set to true
                if (m instanceof THREE.Line) {
                    geometry.vertices.push(m.geometry.vertices[0]);
                    geometry.vertices.push(m.geometry.vertices[1]);
                } else {
                    // merged mesh into corresponding geometry
                    geometry.merge(m.geometry, m.matrix);
                }
                return true;
            },

            /**
             * Create group meshes for given groups, retrieves from map if already present
             */
            createGroupMeshes: function (instancePath, geometryGroups, groups) {
                var mergedMesh = GEPPETTO.getVARS().meshes[instancePath];
                // switch visible flag to false for merged mesh and remove from scene
                mergedMesh.visible = false;
                GEPPETTO.getVARS().scene.remove(mergedMesh);

                for (g in groups) {
                    var groupName = g;
                    if (groupName.indexOf(instancePath) <= -1) {
                        groupName = instancePath + "." + g;
                    }

                    var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];
                    var geometryGroup = geometryGroups[groupName];

                    if (mergedMesh instanceof THREE.Line) {
                        var material = GEPPETTO.SceneFactory.getLineMaterial();
                        groupMesh = new THREE.LineSegments(geometryGroup, material);
                    } else {
                        var material = GEPPETTO.SceneFactory.getMeshPhongMaterial();
                        groupMesh = new THREE.Mesh(geometryGroup, material);
                    }
                    groupMesh.instancePath = instancePath;
                    groupMesh.geometry.dynamic = false;
                    groupMesh.position.copy(mergedMesh.position);


                    GEPPETTO.getVARS().splitMeshes[groupName] = groupMesh;

                    // Update visualization feature for a mesh
                    if (mergedMesh.ghosted) {
                        GEPPETTO.SceneController.ghostEffect([groupMesh], true);
                    }
                    if (mergedMesh.selected) {
                        GEPPETTO.SceneController.selectInstance(groupName);
                    }
                    groupMesh.selected = mergedMesh.selected;

                    // add split mesh to scenne and set flag to visible
                    groupMesh.visible = true;
                    GEPPETTO.getVARS().scene.add(groupMesh);
                }
            },

            /**
             * Merge mesh that was split before
             *
             * @param {String}
             *            aspectPath - Path to aspect that points to mesh
             */
            merge: function (aspectPath) {
                // get mesh from map
                var mergedMesh = GEPPETTO.getVARS().meshes[aspectPath];

                // if merged mesh is not visible, turn it on and turn split one
                // off
                if (!mergedMesh.visible) {
                    for (path in GEPPETTO.getVARS().splitMeshes) {
                        // retrieve split mesh that is on the scene
                        var splitMesh = GEPPETTO.getVARS().splitMeshes[path];
                        if (splitMesh) {
                            if (aspectPath == splitMesh.instancePath) {
                                splitMesh.visible = false;
                                // remove split mesh from scene
                                GEPPETTO.getVARS().scene.remove(splitMesh);
                            }
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
            showVisualGroups: function (visualGroups, mode, instances) {
            	for (var i = 0; i < instances.length; i++) {
            		var instance = instances[i];
            		var instancePath = instance.getInstancePath();            				
            		GEPPETTO.SceneController.merge(instancePath);
            		if (mode) {
            			var mergedMesh = GEPPETTO.getVARS().meshes[instancePath];
            			var map = mergedMesh.mergedMeshesPaths;
            			//no mergedMeshesPaths means object hasn't been merged, single object
            			if(map!=undefined||null){
            				GEPPETTO.SceneController.splitGroups(instance, visualGroups);
            				for (g in visualGroups) {
            					// retrieve visual group object
            					var visualGroup = visualGroups[g];

            					// get full group name to access group mesh
            					var groupName = g;
            					if (groupName.indexOf(instancePath) <= -1) {
            						groupName = instancePath + "." + g;
            					}

            					// get group mesh
            					var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];
            					groupMesh.visible = true;
            					GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, visualGroup.color);
            				}
            			}else{
            				for (g in visualGroups) {
            					// retrieve visual group object
            					var visualGroup = visualGroups[g];

            					// get full group name to access group mesh
            					var groupName = g;
            					if (groupName.indexOf(instancePath) <= -1) {
            						groupName = instancePath + "." + g;
            					}

            					// get original mesh and apply group color
            					var mesh = GEPPETTO.getVARS().meshes[instancePath];
            					mesh.visible = true;
            					GEPPETTO.SceneController.setThreeColor(mesh.material.color, visualGroup.color);
            				}        
            			}

            		}
            	}
            },


            isVisible: function (variables) {
                var visible = true;
                for (var i = 0; i < variables.length; i++) {
                    if (!variables[i].isVisible()) {
                        visible = false;
                        break;
                    }
                }
                return visible;
            },

            isSelected: function (variables) {
                var selected = true;
                for (var i = 0; i < variables.length; i++) {
                    if (!variables[i].isSelected()) {
                        selected = false;
                        break;
                    }
                }
                return selected;
            },

            /**
             * Animate simulation
             */
            animate: function () {
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

            /**
             * Remove given entity from scene
             *
             * @param entity
             */
            removeFromScene: function (entity) {
                var path = entity.getPath();
                var mergedMesh = GEPPETTO.getVARS().meshes[path];
                if (mergedMesh) {
                    GEPPETTO.getVARS().scene.remove(mergedMesh);
                    delete GEPPETTO.getVARS().meshes[path];
                }
                var splitMesh = GEPPETTO.getVARS().splitMeshes[path];
                if (splitMesh) {
                    if (path == splitMesh.instancePath) {
                        GEPPETTO.getVARS().scene.remove(splitMesh);
                    }
                    delete GEPPETTO.getVARS().splitMeshes[path];
                }
            },
        }
    }
})
;
