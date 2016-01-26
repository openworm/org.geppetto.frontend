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

            /**
             * Populate the scene with given instances
             *
             * @param instances -
             *            skeleton with instances and visual entities
             */
            buildScene: function (instances) {
                GEPPETTO.SceneController.complexity = 0;
                GEPPETTO.SceneController.computeComplexity(instances);

                GEPPETTO.SceneController.traverseInstances(instances);
                GEPPETTO.getVARS().scene.updateMatrixWorld(true);

            },

            /**
             * Traverse the instances building a visual object when needed
             *
             * @param instances -
             *            skeleton with instances and visual entities
             */
            traverseInstances: function (instances) {
                if (!Array.isArray(instances) && instances.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                    // array - go over array elements
                    for (var i = 0; i < instances.getSize(); i++) {
                        GEPPETTO.SceneController.checkVisualInstance(instances[i], i);
                    }
                } else {
                    for (var j = 0; j < instances.length; j++) {
                        GEPPETTO.SceneController.checkVisualInstance(instances[j]);
                    }
                }
            },

            /**
             * Check if we need to create a visual object for a given instance and keeps iterating
             *
             * @param instances -
             *            skeleton with instances and visual entities
             */
            checkVisualInstance: function (instance, index) {
                // This block creates the visual objects if the variable has any in either the
                // visual type of a type or if the type itself is a visual type
                if ((instance.getVariable().getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE)
                    || (instance.getVariable().getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE)) {
                    GEPPETTO.SceneFactory.buildVisualInstance(instance, instance.getVariable().getType());
                } else if (instance.getVariable().getType().getVisualType() != undefined) {
                    GEPPETTO.SceneFactory.buildVisualInstance(instance, instance.getVariable().getType().getVisualType());
                } else if ((instance.getMetaType() != GEPPETTO.Resources.ARRAY_INSTANCE_NODE) && (instance.getVariable().getType().getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE)
                    && (instance.getVariable().getType().getType().getVisualType() != undefined)) {
                    GEPPETTO.SceneFactory.buildVisualInstance(instance, instance.getVariable().getType().getType().getVisualType(), index);
                }

                // this block keeps traversing the instances
                if (instance.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
                    GEPPETTO.SceneController.traverseInstances(instance.getChildren());
                } else if (instance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                    GEPPETTO.SceneController.traverseInstances(instance);
                }
            },

            /**
             * This method calculates the complexity of the scene based on the number of cylinders Note that this method doesn't currently take into account complexity coming from particles or
             * Collada/OBJ meshes
             *
             * @param node -
             *            runtime tree node to compute complexity for
             */
            computeComplexity: function (node) {
                // TODO: modify this to work with Geppetto model and not with the old scene - GI
                $.each(node, function (key, child) {

                    // TODO handle arrays, e.g. cylinder inside a population of 1000 = complexity+=1000
                    // TODO use resources

                    if (child.getMetaType() == GEPPETTO.Resources.CYLINDER) {
                        GEPPETTO.SceneController.complexity++;
                    } else if (child.getMetaType() == GEPPETTO.Resources.SPHERE) {
                        GEPPETTO.SceneController.complexity++;
                    }

                });
            },

            /**
             * Updates the scene call, tells factory to do it's job updating meshes
             *
             * @param {Object}
             *            newRuntimeTree - New server update.
             */
            updateScene: function (newRuntimeTree) {
                GEPPETTO.SceneFactory.updateScene(newRuntimeTree);
                GEPPETTO.getVARS().needsUpdate = false;
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
                var threeObject = GEPPETTO.getVARS().meshes[instance.getInstancePath()];
                if (threeObject != null) {
                    if (threeObject instanceof THREE.Line) {
                        threeObject.material.color = new THREE.Color(d3.scale.linear().domain([0, 1]).range(["#199e8", "red"])(intensity))
                    } else {
                        threeObject.material.emissive = new THREE.Color(d3.scale.linear().domain([0, 1]).range(["#199e8", "red"])(intensity))
                    }
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
                    var child = meshes[v];
                    if (child.visible) {
                        if (apply && (!child.ghosted) && (!child.selected)) {
                            if (child instanceof THREE.Object3D) {
                                child.ghosted = true;
                                child.traverse(function (object) {
                                    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
                                        if (object.visible) {
                                            object.ghosted = true;
                                            object.material.transparent = true;
                                            object.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
                                        }
                                    }
                                });
                            } else {
                                child.ghosted = true;
                                child.material.transparent = true;
                                child.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
                            }
                        } else if ((!apply) && (child.ghosted)) {
                            if (child instanceof THREE.Object3D) {
                                child.ghosted = false;
                                child.traverse(function (object) {
                                    if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
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
                                child.ghosted = false;
                                child.material.opacity = child.material.defaultOpacity;
                                if (child.material.opacity == 1) {
                                    child.material.transparent = false;
                                }
                            }
                        }
                    }
                    child.output = false;
                    child.input = false;
                }
            },

            /**
             * Selects an aspect given the path of it. Color changes to yellow, and opacity become 100%.
             *
             * @param {String}
             *            instancePath - Path of aspect of mesh to select
             */
            selectAspect: function (instancePath) {
                var mesh = GEPPETTO.getVARS().meshes[instancePath];
                if (mesh != null || undefined) {
                    if (!mesh.visible) {
                        GEPPETTO.SceneController.merge(instancePath);
                    }
                    if (mesh.selected == false) {
                        if (mesh instanceof THREE.Object3D) {
                            mesh.traverse(function (child) {
                                if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
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
            deselectAspect: function (instancePath) {
                // match instancePath to mesh store in variables properties
                var mesh = GEPPETTO.getVARS().meshes[instancePath];
                if (mesh != undefined) {
                    if (!mesh.visible) {
                        GEPPETTO.SceneController.merge(instancePath);
                    }
                    // make sure that path was selected in the first place
                    if (mesh.selected == true) {
                        if (mesh instanceof THREE.Object3D) {
                            mesh.traverse(function (child) {
                                if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
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
            showAspect: function (instancePath) {
                // if already visible, return false for unsuccessful
                // operation
                if (GEPPETTO.getVARS().meshes[instancePath].visible == true) {
                    return false;
                }
                // make mesh visible
                else {
                    GEPPETTO.getVARS().meshes[instancePath].visible = true;
                    return true;
                }
            },

            /**
             * Change the color of a given aspect
             *
             * @param {String}
             *            instancePath - Instance path of aspect to change color
             */
            setColor: function (instancePath, color) {
                var mesh = GEPPETTO.getVARS().meshes[instancePath];
                if (mesh != undefined) {
                    mesh.traverse(function (object) {
                        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
                            GEPPETTO.SceneController.setThreeColor(object.material.color, color);
                            object.material.defaultColor = color;
                        }
                    });
                    return true;
                }
                return false;
            },

            setThreeColor: function (threeColor, color) {
                if (color.indexOf("rgb") == -1) {
                    threeColor.setHex(color);

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
                            if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
                                object.material.transparent = false;
                                object.material.opacity = 1;
                                object.material.defaultOpacity = 1;
                            }
                        });
                    } else {
                        mesh.traverse(function (object) {
                            if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
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
             * Change opacity of a given aspect
             *
             * @param {String}
             *            instancePath - Instance path of aspect to change opacity for
             * @param {String}
             *            type - Instance path of aspect to change opacity for
             * @param {String}
             *            thickness - Instance path of aspect to change opacity for
             */
            setGeometryType: function (instance, type, thickness) {
                var lines = false;
                if (type === "lines") {
                    lines = true;
                } else if (type === "tubes") {
                    lines = false
                } else if (type === "cylinders") {
                    lines = false
                } else {
                    return false;
                }
                GEPPETTO.SceneFactory.init3DObject(GEPPETTO.SceneFactory.generate3DObjects(instance, lines, thickness), instance.getInstancePath(), instace.getVariable().getPosition());

                return true;
            },

            /**
             * Hide aspect
             *
             * @param {String}
             *            instancePath - Path of the aspect to make invisible
             */
            hideAspect: function (instancePath) {
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
             * Zoom to a mesh given the instance path of the aspect to which it belongs
             */
            zoomToMesh: function (path) {
                GEPPETTO.getVARS().controls.reset();

                var zoomParameters =
                {};
                var mesh = GEPPETTO.getVARS().meshes[path];
                mesh.traverse(function (object) {
                    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.PointCloud) {
                        GEPPETTO.SceneController.addMeshToZoom(object, zoomParameters);
                    }
                });

                GEPPETTO.SceneController.zoomTo(zoomParameters);

            },

            /**
             * Zoom to coordinates specified in the zoomParameters dictionary
             */
            zoomTo: function (zoomParameters) {
                // Compute world AABB center
                GEPPETTO.getVARS().sceneCenter.x = (zoomParameters.aabbMax.x + zoomParameters.aabbMin.x) * 0.5;
                GEPPETTO.getVARS().sceneCenter.y = (zoomParameters.aabbMax.y + zoomParameters.aabbMin.y) * 0.5;
                GEPPETTO.getVARS().sceneCenter.z = (zoomParameters.aabbMax.z + zoomParameters.aabbMin.z) * 0.5;

                GEPPETTO.updateCamera(zoomParameters.aabbMax, zoomParameters.aabbMin)
            },

            /**
             * To be invoked on a THREE object with a geometry. zoomParameters are updated to take into account also this new mesh.
             */
            addMeshToZoom: function (mesh, zoomParameters) {
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
             * Takes a path and zoom to all meshes in the scene that descend from it focus camera. The difference with zoomToMesh is that zoomToMesh only zoom to the one and only mesh identified by
             * the instancePath passed as parameter.
             */
            zoomToMeshes: function (path) {
                GEPPETTO.getVARS().controls.reset();

                var zoomParameters =
                {};

                for (var meshInstancePath in GEPPETTO.getVARS().meshes) {
                    var mesh = GEPPETTO.getVARS().meshes[meshInstancePath];
                    if (meshInstancePath.startsWith(path)) {
                        mesh.traverse(function (object) {
                            if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.PointCloud) {
                                GEPPETTO.SceneController.addMeshToZoom(object, zoomParameters);
                            }
                        });
                    }
                }

                GEPPETTO.SceneController.zoomTo(zoomParameters);
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
            }

            ,

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


                    // if mesh is not selected, give it ghost or default color
                    // and opacity
                    if (!mesh.selected) {
                        // if there are nodes still selected, give it a ghost
                        // effect. If not nodes are
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

                    var material =  new THREE.LineDashedMaterial( { dashSize: 3, gapSize: 1, linewidth: thickness });
                    material.color.setHex(colour);

                    var line = new THREE.LineSegments(geometry, material);
                    line.updateMatrixWorld(true);


                    if (GEPPETTO.getVARS().connectionLines[connection.getInstancePath()]) {
                        GEPPETTO.getVARS().scene.remove(GEPPETTO.getVARS().connectionLines[connection.getInstancePath()]);
                    }

                    GEPPETTO.getVARS().scene.add(line);
                    GEPPETTO.getVARS().connectionLines[connection.getInstancePath()] = line;
                }
            }
            ,

            removeAllConnectionLines: function () {
                var lines = GEPPETTO.getVARS().connectionLines;
                for (var key in lines) {
                    if (lines.hasOwnProperty(key)) {
                        GEPPETTO.getVARS().scene.remove(lines[key]);
                    }
                }
                GEPPETTO.getVARS().connectionLines = [];
            }

            ,

            splitHighlightedMesh: function (targetObjects, aspects) {
                var groups =
                {};
                for (a in aspects) {
                    // create object to hold geometries used for merging objects
                    // in groups
                    var geometryGroups =
                    {};

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

                    groups[a] =
                    {};
                    groups[a].color = mergedMesh.material.color;
                    groups[highlightedMesh] =
                    {};
                    var newGroups =
                    {};
                    newGroups[a] =
                    {};
                    newGroups[highlightedMesh] =
                    {};
                    GEPPETTO.SceneController.createGroupMeshes(a, geometryGroups, newGroups);
                }
                return groups;
            }
            ,

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
            }
            ,

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
            splitGroups: function (instancePath, visualizationTree, groups) {
                // retrieve the merged mesh
                var mergedMesh = GEPPETTO.getVARS().meshes[instancePath];
                // create object to hold geometries used for merging objects in
                // groups
                var geometryGroups =
                {};

                /*
                 * reset the aspect instance path group mesh, this is used to group visual objects that don't belong to any of the groups passed as parameter
                 */
                GEPPETTO.getVARS().splitMeshes[instancePath] = null;
                geometryGroups[instancePath] = new THREE.Geometry();

                // create map of geometry groups for groups
                for (var g in groups) {
                    var groupName = instancePath + "." + g;
                    var groupMesh = GEPPETTO.getVARS().splitMeshes[groupName];

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
                        // get object from visualizationtree by using the object's
                        // instance path as search key
                        var object = GEPPETTO.get3DObjectInVisualizationTree(visualizationTree, map[v]);

                        // If it is a segment compare to the id otherwise check in the visual groups
                        if (object.id in groups) {
                            // true means don't add to mesh with non-groups visual objects
                            added = GEPPETTO.SceneController.addMeshToGeometryGroup(instancePath, object.id, geometryGroups, m)
                        } else {
                            // get group elements list for object
                            var objectsGroups = object.groups;
                            for (var g in objectsGroups) {
                                if (objectsGroups[g] in groups) {
                                    // true means don't add to mesh with non-groups visual objects
                                    added = GEPPETTO.SceneController.addMeshToGeometryGroup(instancePath, objectsGroups[g], geometryGroups, m)
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

                groups[instancePath] =
                {};
                groups[instancePath].color = GEPPETTO.Resources.COLORS.SPLIT;
                GEPPETTO.SceneController.createGroupMeshes(instancePath, geometryGroups, groups);
            }
            ,

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
            addMeshToGeometryGroup: function (instancePath, id, geometryGroups, m) {
                // name of group, mix of aspect path and group name
                var groupName = instancePath + "." + id;
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
            }
            ,

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
                    groupMesh.name = instancePath;
                    groupMesh.geometry.dynamic = false;
                    groupMesh.position.copy(mergedMesh.position);

                    GEPPETTO.getVARS().splitMeshes[groupName] = groupMesh;

                    // add split mesh to scenne and set flag to visible
                    groupMesh.visible = true;
                    GEPPETTO.getVARS().scene.add(groupMesh);
                }
            }
            ,

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
                            if (aspectPath == splitMesh.name) {
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
            }
            ,

            /**
             * Shows a visual group
             */
            showVisualGroups: function (visualizationTree, visualGroups, mode) {
                // aspect path of visualization tree parent
                var aspectPath = visualizationTree.getParent().getInstancePath();

                GEPPETTO.SceneController.merge(aspectPath);
                if (mode) {
                    GEPPETTO.SceneController.splitGroups(aspectPath, visualizationTree, visualGroups);
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
                        groupMesh.visible = true;
                        GEPPETTO.SceneController.setThreeColor(groupMesh.material.color, visualGroup.color);
                    }
                }
            }
            ,

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
            }
            ,
        }
    }
})
;
