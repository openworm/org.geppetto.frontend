/*
 * The 3D engine used by the 3D canvas component. This class is internal, any method you
 * use from inside here might break between versions. Methods maintained are the exposed ones
 * through the 3D canvas component.
 *
 */
define(['jquery'], function () {

    var Instance = require('../../../geppettoModel/model/Instance');
    var ArrayInstance = require('../../../geppettoModel/model/ArrayInstance');
    var Type = require('../../../geppettoModel/model/Type');
    var Variable = require('../../../geppettoModel/model/Variable');

    var THREE = require('three');
    require('./TrackballControls');
    require('./OBJLoader');
    THREE.ColladaLoader = require('imports-loader?THREE=three!exports-loader?THREE.ColladaLoader!../../../../node_modules\/three\/examples\/js\/loaders\/ColladaLoader');
    THREE.ConvolutionShader = require('imports-loader?THREE=three!exports-loader?THREE.ConvolutionShader!../../../../node_modules\/three\/examples\/js\/shaders\/ConvolutionShader');
    THREE.CopyShader = require('imports-loader?THREE=three!exports-loader?THREE.CopyShader!../../../../node_modules\/three\/examples\/js\/shaders\/CopyShader');
    THREE.FilmShader = require('imports-loader?THREE=three!exports-loader?THREE.FilmShader!../../../../node_modules\/three\/examples\/js\/shaders\/FilmShader');
    THREE.FocusShader = require('imports-loader?THREE=three!exports-loader?THREE.FocusShader!../../../../node_modules\/three\/examples\/js\/shaders\/FocusShader');
    THREE.EffectComposer = require('imports-loader?THREE=three!exports-loader?THREE.EffectComposer!../../../../node_modules\/three\/examples\/js\/postprocessing\/EffectComposer');
    THREE.MaskPass = require('imports-loader?THREE=three!exports-loader?THREE.MaskPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/MaskPass');
    THREE.RenderPass = require('imports-loader?THREE=three!exports-loader?THREE.RenderPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/RenderPass');
    THREE.BloomPass = require('imports-loader?THREE=three!exports-loader?THREE.BloomPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/BloomPass');
    THREE.ShaderPass = require('imports-loader?THREE=three!exports-loader?THREE.ShaderPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/ShaderPass');
    THREE.FilmPass = require('imports-loader?THREE=three!exports-loader?THREE.FilmPass!../../../../node_modules\/three\/examples\/js\/postprocessing\/FilmPass');

    class ThreeDEngine {
        constructor(container, viewerId) {
            this.container = container;
            this.colorController = new (require('./ColorController'))(this);
            this.viewerId = viewerId;
            //Engine components
            this.scene = new THREE.Scene();
            this.camera = null;
            this.controls = null;
            this.renderer = null;
            this.stats = null;
            this.projector = null;
            this.sceneCenter = new THREE.Vector3();
            this.cameraPosition = new THREE.Vector3();
            this.mouse = { x: 0, y: 0 };
            //The content of the scene
            this.meshes = {};
            this.splitMeshes = {};
            this.connectionLines = {};
            this.visualModelMap = {};
            this.complexity = 0;
            //Settings
            this.linesThreshold = 2000;
            this.aboveLinesThreshold = false;
            this.wireframe = false;
            this.isAnimated = false;
            this.debugUpdate = false;
            this.needsUpdate = false;
            this.pickingEnabled = true; // flag to enable disable 3d picking
            this.linesUserInput = false;
            this.linesUserPreference = undefined;
            this.hoverListeners = undefined;
            //Initialisation
            this.setupCamera();
            this.setupRenderer();
            this.setupLights();
            this.setupControls();
            this.setupListeners();
            this.animate();
        }
    }


    ThreeDEngine.prototype = {

        constructor: ThreeDEngine,

        /**
         * Sets up the controls used by the camera to make it able to zoom and
         * pan.
         */
        setupControls: function () {
            // Controls
            this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement, this.viewerId);
            this.controls.noZoom = false;
            this.controls.noPan = false;
        },

        /**
         * Sets up the camera that is used to view the objects in the 3D Scene.
         * @command setupCamera()
         */
        setupCamera: function () {
            // Camera
            var width = $(this.container).width();
            var height = $(this.container).height();
            var angle = 60;
            var aspect = width / angle;
            var near = 10;
            var far = 2000000;
            this.camera = new THREE.PerspectiveCamera(angle, aspect, near, far);
            this.scene.add(this.camera);
            this.camera.position.set(this.cameraPosition.x, this.cameraPosition.y, this.cameraPosition.z);
            this.camera.up = new THREE.Vector3(0, 1, 0);
            this.camera.direction = new THREE.Vector3(0, 0, 1);
            this.camera.lookAt(this.sceneCenter);
        },

        /**
         * Set up the WebGL Renderer
         */
        setupRenderer: function () {
            // Reuse a single WebGL renderer.
            // NOTE: Recreating the renderer causes camera displacement on Chrome OSX.
            if (!this.canvasCreated) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: true
                });

            }
            this.configureRenderer();
            this.canvasCreated = true;
        },


        addHoverListener: function (listener) {
            if (this.hoverListeners == undefined) {
                this.hoverListeners = [];
            }
            this.hoverListeners.push(listener);
        },

        /**
         * Set up the listeners use to detect mouse movement and windoe resizing
         */
        setupListeners: function () {
            var that = this;
            // when the mouse moves, call the given function
            this.renderer.domElement.addEventListener('mousedown', function (event) {
                if (event.button == 0) //only for left click
                {
                    if (that.pickingEnabled) {
                        var intersects = that.getIntersectedObjects();

                        if (intersects.length > 0) {
                            var selected = "";
                            var geometryIdentifier = "";

                            // sort intersects
                            var compare = function (a, b) {
                                if (a.distance < b.distance)
                                    return -1;
                                if (a.distance > b.distance)
                                    return 1;
                                return 0;
                            };

                            intersects.sort(compare);

                            var selectedIntersect;
                            // Iterate and get the first visible item (they are now ordered by proximity)
                            for (var i = 0; i < intersects.length; i++) {
                                // figure out if the entity is visible
                                var instancePath = "";
                                if (intersects[i].object.hasOwnProperty("instancePath")) {
                                    instancePath = intersects[i].object.instancePath;
                                    geometryIdentifier = intersects[i].object.geometryIdentifier;
                                } else {
                                    //weak assumption: if the object doesn't have an instancePath its parent will
                                    instancePath = intersects[i].object.parent.instancePath;
                                    geometryIdentifier = intersects[i].object.parent.geometryIdentifier;
                                }
                                if (instancePath != null || undefined) {
                                    var visible = eval(instancePath + '.visible');
                                    if (intersects.length == 1 || i == intersects.length) {
                                        //if there's only one element intersected we select it regardless of its opacity
                                        if (visible) {
                                            selected = instancePath;
                                            selectedIntersect = intersects[i];
                                            break;
                                        }
                                    } else {
                                        //if there are more than one element intersected and opacity of the current one is less than 1
                                        //we skip it to realize a "pick through"
                                        var opacity = that.meshes[instancePath].defaultOpacity;
                                        if ((opacity == 1 && visible) || GEPPETTO.isKeyPressed("ctrl")) {
                                            selected = instancePath;
                                            selectedIntersect = intersects[i];
                                            break;
                                        } else if (visible && opacity < 1 && opacity > 0) {
                                            //if only transparent objects intersected select first or the next down if
                                            //one is already selected in order to enable "burrow through" sample.
                                            if (selected == "" && !eval(instancePath + '.selected')) {
                                                selected = instancePath;
                                                selectedIntersect = intersects[i];
                                            } else {
                                                if (eval(instancePath + '.selected') && i != intersects.length - 1) {
                                                    selected = "";
                                                }
                                            }
                                        }
                                    }
                                }
                            }


                            if (selected != "") {
                                if (that.meshes.hasOwnProperty(selected) || that.splitMeshes.hasOwnProperty(selected)) {
                                    if (!GEPPETTO.isKeyPressed("shift")) {
                                        that.deselectAll();
                                    }

                                    var selectedIntersectCoordinates = [selectedIntersect.point.x, selectedIntersect.point.y, selectedIntersect.point.z]
                                    if (geometryIdentifier == undefined) {
                                        geometryIdentifier = "";
                                    }
                                    GEPPETTO.CommandController.execute(selected + '.select(' + false + ', ' + '"' + geometryIdentifier + '", [' + selectedIntersectCoordinates + '])');
                                }
                            }
                        } else if (GEPPETTO.isKeyPressed("ctrl")) {
                            that.deselectAll();
                        }
                    }
                }
            }, false);


            this.renderer.domElement.addEventListener('mousemove', function (event) {
                that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                if (that.hoverListeners) {
                    var intersects = that.getIntersectedObjects();
                    for (var listener in that.hoverListeners) {
                        if (intersects.length != 0) {
                            that.hoverListeners[listener](intersects);
                        }
                    }
                }
            }, false);

        },

        /**
         *
         * @param width
         * @param height
         */
        setSize: function (width, height) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.composer.setSize(width, height);
        },

        /**
         *
         * @param shaders
         */
        configureRenderer: function (shaders) {

            if (shaders == undefined) {
                shaders = false;
            }

            var color = new THREE.Color(this.backgroundColor);
            //this.renderer.setClearColor(color, 1);
            this.renderer.setPixelRatio(window.devicePixelRatio);

            this.renderer.autoClear = false;
            this.container.appendChild(this.renderer.domElement);

            var renderModel = new THREE.RenderPass(this.scene, this.camera);

            this.composer = new THREE.EffectComposer(this.renderer);

            if (shaders) {
                var effectBloom = new THREE.BloomPass(0.75);
                var effectFilm = new THREE.FilmPass(0.5, 0.5, 1448, false);
                var effectFocus = new THREE.ShaderPass(THREE.FocusShader);

                effectFocus.uniforms["screenWidth"].value = window.innerWidth;
                effectFocus.uniforms["screenHeight"].value = window.innerHeight;

                effectFocus.renderToScreen = true;

                this.composer.addPass(renderModel);
                this.composer.addPass(effectBloom);
                this.composer.addPass(effectFilm);
                this.composer.addPass(effectFocus);
            } else {
                //standard
                renderModel.renderToScreen = true;
                this.composer.addPass(renderModel);
            }

        },

        /**
         * Light up the scene
         */
        setupLights: function () {
            // Lights
            this.camera.add(new THREE.PointLight(0xffffff, 1.5));
        },

        /**
         *
         * @param askUser
         */
        setLinesUserInput: function (askUser) {
            this.linesUserInput = askUser;
        },

        /**
         * Reset camera
         */
        resetCamera: function () {
            this.controls.reset();

            var aabbMin = null;
            var aabbMax = null;

            this.scene.traverse(function (child) {
                if (child.hasOwnProperty("geometry")) {
                    child.geometry.computeBoundingBox();

                    var bb = child.geometry.boundingBox;
                    bb.translate(child.localToWorld(new THREE.Vector3()));

                    // If min and max vectors are null, first values become
                    // default min and max
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

            if (aabbMin != null && aabbMax != null) {
                // Compute world AABB center
                this.sceneCenter.x = (aabbMax.x + aabbMin.x) * 0.5;
                this.sceneCenter.y = (aabbMax.y + aabbMin.y) * 0.5;
                this.sceneCenter.z = (aabbMax.z + aabbMin.z) * 0.5;

                this.updateCamera(aabbMax, aabbMin);
            }
        },

        /**
         * Update camera with new position and place to lookat
         */
        updateCamera: function (aabbMax, aabbMin) {
            // Compute world AABB "radius"
            var diag = new THREE.Vector3();
            diag = diag.subVectors(aabbMax, aabbMin);
            var radius = diag.length() * 0.5;

            this.pointCameraTo(this.sceneCenter);

            // Compute offset needed to move the camera back that much needed to center AABB
            var offset = radius / Math.sin(Math.PI / 180.0 * this.camera.fov * 0.5);

            var dir = this.camera.direction.clone();
            dir.multiplyScalar(offset);

            // Store camera position
            this.camera.position.addVectors(dir, this.controls.target);
            this.camera.updateProjectionMatrix();
        },


        /**
         * Receives updates from widget listener class to update moving objects on the 3d canvas
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event, parameters) {
            //reset plot's datasets
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA) {


            }
            else if (event == GEPPETTO.Events.Experiment_update) {
                this.scene.traverse(function (child) {
                    if (child instanceof THREE.Points) {
                        var instance = Instances.getInstance(child.instancePath);
                        if (instance.getTimeSeries() != undefined && instance.getTimeSeries()[parameters.step] != undefined) {
                            //if we have recorded this object we'll have a timeseries
                            var particles = instance.getTimeSeries()[parameters.step].particles;
                            for (var p = 0; p < particles.length; p++) {
                                child.geometry.vertices[p].x = particles[p].x;
                                child.geometry.vertices[p].y = particles[p].y;
                                child.geometry.vertices[p].z = particles[p].z;
                            }
                            child.geometry.verticesNeedUpdate = true;
                        }
                    }
                });

            }

        },

        /**
         *
         * @param obj
         * @returns {*}
         */
        boundingBox: function (obj) {
            if (obj instanceof THREE.Mesh) {

                var geometry = obj.geometry;
                geometry.computeBoundingBox();
                return geometry.boundingBox;

            }

            if (obj instanceof THREE.Object3D) {

                var bb = new THREE.Box3();
                for (var i = 0; i < obj.children.length; i++) {
                    bb.union(this.boundingBox(obj.children[i]));
                }
                return bb;
            }
        },

        /**
         *
         * @param obj
         * @returns {*}
         */
        shapeCenterOfGravity: function (obj) {
            return this.boundingBox(obj).center();
        },

        /**
         *
         * @param node
         */
        pointCameraTo: function (node) {
            // Refocus camera to the center of the new object
            var COG;
            if (node instanceof THREE.Vector3) {
                COG = node;
            } else {
                COG = this.shapeCenterOfGravity(node);
            }
            var v = new THREE.Vector3();
            v.subVectors(COG, this.controls.target);
            this.camera.position.addVectors(
                this.camera.position, v);

            // retrieve camera orientation

            this.camera.lookAt(COG);
            this.controls.target.set(COG.x, COG.y, COG.z);
        },

        /**
         * Sets up the HUD display with the scene stat's fps.
         */
        setupStats: function () {
            // Stats
            if ($("#stats").length == 0) {
                if (VARS != null) {
                    this.stats = new Stats();
                    this.stats.domElement.style.float = 'right';
                    this.stats.domElement.style.position = 'absolute';
                    this.stats.domElement.style.top = '60px';
                    this.stats.domElement.style.right = '5px';
                    this.stats.domElement.style.zIndex = 100;
                    $('#controls').append(this.stats.domElement);
                }
            }
        },

        /**
         * Displays HUD for FPS stats
         */
        toggleStats: function (mode) {
            if (mode) {
                if ($("#stats").length == 0) {
                    this.setupStats();
                } else {
                    $("#stats").show();
                }
            } else {
                $("#stats").hide();
            }
        },


        /**
         * Adds debug axis to the scene
         */
        showAxis: function (show) {
            // To use enter the axis length
            if (show) {
                if (!this.axis) {
                    this.axis = new THREE.AxisHelper(200);
                    this.scene.add(this.axis);
                }
            } else
                this.scene.remove(this.axis);
        },

        /**
         * Renders objects in the scene
         */
        renderCanvas: function () {
            this.renderer.clear();
            this.composer.render(0.01);
        },

        /**
         * Returns intersected objects from mouse click
         *
         * @returns {Array} a list of objects intersected by the current mouse coordinates
         */
        getIntersectedObjects: function () {
            // create a Ray with origin at the mouse position and direction into th scene (camera direction)
            var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
            vector.unproject(this.camera);

            var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

            var visibleChildren = [];
            this.scene.traverse(function (child) {
                if (child.visible && !(child.clickThrough == true)) {
                    if (child.geometry != null && child.geometry != undefined) {
                        child.geometry.computeBoundingBox();
                        visibleChildren.push(child);
                    }
                }
            });

            // returns an array containing all objects in the scene with which the ray intersects
            return raycaster.intersectObjects(visibleChildren);
        },

        getDefaultGeometryType: function () {
            // Unless it's being forced we use a threshold to decide whether to use lines or cylinders
            if (!this.aboveLinesThreshold) {
                //Unless we are already above the threshold...
                this.aboveLinesThreshold = this.complexity > this.linesThreshold;

                if (this.aboveLinesThreshold) {

                    if (this.linesUserInput && this.linesUserPreference == undefined) {

                        //we need to ask the user
                        this.linesUserPreference = confirm("The model you are loading has a complex morphology, would you like to render it using lines instead of 3D shapes? Be careful, choosing to use 3D shapes might crash your browser!");
                    }
                }
            }

            if (this.aboveLinesThreshold && this.linesUserInput) {
                geometry = this.linesUserPreference ? 'lines' : 'cylinders';
            }
            else {
                geometry = this.aboveLinesThreshold ? 'lines' : 'cylinders';
            }

            return geometry;
        },

        /**
         *
         * @param instances
         */
        updateSceneWithNewInstances: function (instances) {
            var traversedInstances = this.traverseInstances(instances);
            if (traversedInstances.length > 0) {
                this.setAllGeometriesType(this.getDefaultGeometryType());
                this.scene.updateMatrixWorld(true);
                this.resetCamera();
            }
        },

        /**
         * Sets whether to use wireframe for the materials of the meshes
         */
        setWireframe: function (wireframe) {
            this.wireframe = wireframe;
            var that = this;
            this.scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    if (!(child.material.nowireframe == true)) {
                        child.material.wireframe = that.wireframe;
                    }
                }
            });
        },

        /**
         * Sets whether picking is enabled or not
         */
        enablePicking: function (pickingEnabled) {
            this.pickingEnabled = pickingEnabled;
        },

        getWireframe: function () {
            return this.wireframe;
        },

        /**
         * Traverse the instances building a visual object when needed
         *
         * @param instances -
         *            skeleton with instances and visual entities
         */
        traverseInstances: function (instances, lines, thickness) {

            for (var j = 0; j < instances.length; j++) {
                var traversedInstances = this.checkVisualInstance(instances[j], lines, thickness);
            }
            return traversedInstances
        },

        /**
         * Check if we need to create a visual object for a given instance and keeps iterating
         *
         * @param instances -
         *            skeleton with instances and visual entities
         */
        checkVisualInstance: function (instance, lines, thickness) {
            var traversedInstances = [];
            if (instance.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                //since the visualcapability propagates up through the parents we can avoid visiting things that don't have it
                if ((instance.getType().getMetaType() != GEPPETTO.Resources.ARRAY_TYPE_NODE) && instance.getVisualType()) {
                    this.buildVisualInstance(instance, lines, thickness);
                }
                // this block keeps traversing the instances
                if (instance.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
                    this.traverseInstances(instance.getChildren(), lines, thickness);
                } else if (instance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                    this.traverseInstances(instance, lines, thickness);
                }
                traversedInstances.push(instance);
            }
            return traversedInstances;
        },


        /**
         *
         * @param instance
         * @param lines
         * @param thickness
         */
        buildVisualInstance: function (instance, lines, thickness) {
            var meshes = this.generate3DObjects(instance, lines, thickness);
            this.init3DObject(meshes, instance);
        },


        /**
         * Initializes a group of meshes that were created and adds them to the 3D scene
         *
         * @param {Object}
         *            meshes - The meshes that need to be initialized
         */
        init3DObject: function (meshes, instance) {
            var instancePath = instance.getInstancePath();
            var position = instance.getPosition();
            for (var m in meshes) {
                var mesh = meshes[m];

                mesh.instancePath = instancePath;
                // if the model file is specifying a position for the loaded meshes then we translate them here
                if (position != null) {
                    var p = new THREE.Vector3(position.x, position.y, position.z);
                    mesh.position.set(p.x, p.y, p.z);
                    mesh.geometry.verticesNeedUpdate = true;
                    mesh.updateMatrix();
                }
                this.scene.add(mesh);
                this.meshes[instancePath] = mesh;
                this.meshes[instancePath].visible = true;
                this.meshes[instancePath].ghosted = false;
                this.meshes[instancePath].defaultOpacity = 1;
                this.meshes[instancePath].selected = false;
                this.meshes[instancePath].input = false;
                this.meshes[instancePath].output = false;

                //Split anything that was splitted before
                if (instancePath in this.splitMeshes) {
                    var splitMeshes = this.splitMeshes;
                    var elements = {};
                    for (var splitMesh in splitMeshes) {
                        if (splitMeshes[splitMesh].instancePath == instancePath && splitMesh != instancePath) {
                            visualObject = splitMesh.substring(instancePath.length + 1);
                            elements[visualObject] = "";
                        }
                    }
                    if (Object.keys(elements).length > 0) {
                        this.splitGroups(instance, elements);
                    }
                }
            }
        },

        /**
         *
         * @param instance
         * @param lines
         * @param thickness
         * @returns {Array}
         */
        generate3DObjects: function (instance, lines, thickness) {
            var previous3DObject = this.meshes[instance.getInstancePath()];
            var color = undefined;
            if (previous3DObject) {
                color = previous3DObject.material.defaultColor;
                // if an object already exists for this aspect we remove it. This could happen in case we are changing how an aspect
                // is visualized, e.g. lines over tubes representation
                this.scene.remove(previous3DObject);
                var splitMeshes = this.splitMeshes;
                for (var m in splitMeshes) {
                    if (m.indexOf(instance.getInstancePath()) != -1) {
                        this.scene.remove(splitMeshes[m]);
                        //splitMeshes[m] = null;
                    }
                }

            }
            var that = this;
            //TODO This can be optimised, no need to create both
            var materials =
                {
                    "mesh": that.getMeshPhongMaterial(color),
                    "line": that.getLineMaterial(thickness, color)
                };
            var instanceObjects = [];
            var threeDeeObjList = this.walkVisTreeGen3DObjs(instance, materials, lines);

            // only merge if there are more than one object
            if (threeDeeObjList.length > 1) {
                var mergedObjs = this.merge3DObjects(threeDeeObjList, materials);
                // investigate need to obj.dispose for obj in threeDeeObjList
                if (mergedObjs != null) {
                    mergedObjs.instancePath = instance.getInstancePath();
                    instanceObjects.push(mergedObjs);
                } else {
                    for (var obj in threeDeeObjList) {
                        threeDeeObjList[obj].instancePath = instance.getInstancePath();
                        instanceObjects.push(threeDeeObjList[obj]);
                    }
                }
            }
            else if (threeDeeObjList.length == 1) {
                // only one object in list, add it to local array and set
                instanceObjects.push(threeDeeObjList[0]);
                instanceObjects[0].instancePath = instance.getInstancePath();
            }

            return instanceObjects;
        },

        /**
         *
         * @param instance
         * @param materials
         * @param lines
         * @returns {Array}
         */
        walkVisTreeGen3DObjs: function (instance, materials, lines) {
            var threeDeeObj = null;
            var threeDeeObjList = [];
            var visualType = instance.getVisualType();
            if (visualType == undefined) {
                return threeDeeObjList;
            }
            else {
                if ($.isArray(visualType)) {
                    //TODO if there is more than one visual type we need to display all of them
                    visualType = visualType[0];
                }
            }
            if (visualType.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                for (var v in visualType.getVariables()) {
                    var visualValue = visualType.getVariables()[v].getWrappedObj().initialValues[0].value;
                    threeDeeObj = this.create3DObjectFromInstance(instance, visualValue, visualType.getVariables()[v].getId(), materials, lines);
                    if (threeDeeObj) {
                        threeDeeObjList.push(threeDeeObj);
                    }
                }
            }
            else if (visualType.getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE && visualType.getId() == "particles") {
                var visualValue = instance.getVariable().getWrappedObj().initialValues[0].value;
                threeDeeObj = this.create3DObjectFromInstance(instance, visualValue, instance.getVariable().getId(), materials, lines);
                if (threeDeeObj) {
                    threeDeeObjList.push(threeDeeObj);
                }
            } else {
                var visualValue = visualType.getWrappedObj().defaultValue;
                threeDeeObj = this.create3DObjectFromInstance(instance, visualValue, visualType.getId(), materials, lines);
                if (threeDeeObj) {
                    threeDeeObjList.push(threeDeeObj);
                }
            }

            return threeDeeObjList;
        },


        /**
         *
         * @param objArray
         * @param materials
         * @returns {*}
         */
        merge3DObjects: function (objArray, materials) {
            var mergedMeshesPaths = [];
            var ret = null;
            var mergedLines;
            var mergedMeshes;
            objArray.forEach(function (obj) {
                if (obj instanceof THREE.Line) {
                    if (mergedLines === undefined) {
                        mergedLines = new THREE.Geometry()
                    }
                    mergedLines.vertices.push(obj.geometry.vertices[0]);
                    mergedLines.vertices.push(obj.geometry.vertices[1]);
                }
                else if (obj.geometry.type == "Geometry") {
                    // This catches both Collada an OBJ
                    if (objArray.length > 1) {
                        throw Error("Merging of multiple OBJs or Colladas not supported");
                    }
                    else {
                        ret = obj;
                    }
                }
                else {
                    if (mergedMeshes === undefined) {
                        mergedMeshes = new THREE.Geometry()
                    }
                    obj.geometry.dynamic = true;
                    obj.geometry.verticesNeedUpdate = true;
                    obj.updateMatrix();
                    mergedMeshes.merge(obj.geometry, obj.matrix);
                }
                mergedMeshesPaths.push(obj.instancePath);

            });

            if (mergedLines === undefined) {
                // There are no line geometries, we just create a mesh for the merge of the solid geometries
                // and apply the mesh material
                ret = new THREE.Mesh(mergedMeshes, materials["mesh"]);
            } else {
                ret = new THREE.LineSegments(mergedLines, materials["line"]);
                if (mergedMeshes != undefined) {
                    // we merge into a single mesh both types of geometries (from lines and 3D objects)
                    var tempmesh = new THREE.Mesh(mergedMeshes, materials["mesh"]);
                    ret.geometry.merge(tempmesh.geometry, tempmesh.matrix);
                }
            }

            if (ret != null && !Array.isArray(ret)) {
                ret.mergedMeshesPaths = mergedMeshesPaths;
            }

            return ret;

        },


        /**
         *
         * @param instance
         * @param node
         * @param id
         * @param materials
         * @param lines
         * @returns {*}
         */
        create3DObjectFromInstance: function (instance, node, id, materials, lines) {
            var threeObject = null;

            if (lines === undefined) {
                lines = this.getDefaultGeometryType() == 'lines' ? true : false;
            }

            var material = lines ? materials["line"] : materials["mesh"];

            switch (node.eClass) {
                case GEPPETTO.Resources.PARTICLES:
                    threeObject = this.createParticles(node);
                    break;

                case GEPPETTO.Resources.CYLINDER:
                    if (lines) {
                        threeObject = this.create3DLineFromNode(node, material);
                    } else {
                        threeObject = this.create3DCylinderFromNode(node, material);
                    }
                    this.complexity++;
                    break;

                case GEPPETTO.Resources.SPHERE:
                    if (lines) {
                        threeObject = this.create3DLineFromNode(node, material);
                    } else {
                        threeObject = this.create3DSphereFromNode(node, material);
                    }
                    this.complexity++;
                    break;
                case GEPPETTO.Resources.COLLADA:
                    threeObject = this.loadColladaModelFromNode(node);
                    this.complexity++;
                    break;
                case GEPPETTO.Resources.OBJ:
                    threeObject = this.loadThreeOBJModelFromNode(node);
                    this.complexity++;
                    break;
            }
            if (threeObject) {
                threeObject.visible = true;
                // TODO: this is empty for collada and obj nodes
                var instancePath = instance.getInstancePath() + "." + id;
                threeObject.instancePath = instancePath;
                threeObject.highlighted = false;

                // TODO: shouldn't that be the vistree? why is it also done at the loadEntity level??
                this.visualModelMap[instancePath] = threeObject;
            }
            return threeObject;
        },

        /**
         *
         * @param node
         * @returns {*}
         */
        loadColladaModelFromNode: function (node) {
            var loader = new THREE.ColladaLoader();
            loader.options.convertUpAxis = true;
            var scene = null;
            var that = this;
            loader.parse(node.collada, function (collada) {
                scene = collada.scene;
                scene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
                        child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.material.wireframe = that.wireframe;
                        child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.geometry.computeVertexNormals();
                    }
                    if (child instanceof THREE.SkinnedMesh) {
                        child.material.skinning = true;
                        child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
                        child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.material.wireframe = that.wireframe;
                        child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.geometry.computeVertexNormals();
                    }
                });
            });
            return scene;
        },

        /**
         *
         * @param node
         * @returns {*}
         */
        loadThreeOBJModelFromNode: function (node) {
            var manager = new THREE.LoadingManager();
            manager.onProgress = function (item, loaded, total) {
                console.log(item, loaded, total);
            };
            var loader = new THREE.OBJLoader(manager);
            var scene = loader.parse(node.obj);
            var that = this;
            scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    that.setThreeColor(child.material.color, GEPPETTO.Resources.COLORS.DEFAULT);
                    child.material.wireframe = that.wireframe;
                    child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
                    child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                    child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                    child.geometry.computeVertexNormals();
                }
            });

            return scene;
        },

        /**
         *
         * @param node
         * @returns {THREE.Vector3|*}
         */
        createParticles: function (node) {
            var geometry = new THREE.Geometry();
            var threeColor = new THREE.Color();
            var color = ('0x' + Math.floor(Math.random() * 16777215).toString(16));
            threeColor.setHex(color);

            var textureLoader = new THREE.TextureLoader();
            var material = new THREE.PointsMaterial(
                {
                    size: 2,
                    map: textureLoader.load("geppetto/js/components/interface/3dCanvas/3dparticle.png"),
                    blending: THREE.NormalBlending,
                    depthTest: true,
                    transparent: true,
                    color: threeColor
                });

            for (var p = 0; p < node.particles.length; p++) {
                geometry.vertices.push(new THREE.Vector3(node.particles[p].x, node.particles[p].y, node.particles[p].z));

            }

            material.defaultColor = color;
            material.defaultOpacity = 1;
            var threeObject = new THREE.Points(geometry, material);
            threeObject.visible = true;
            threeObject.instancePath = node.instancePath;
            threeObject.highlighted = false;
            return threeObject;

        },

        /**
         *
         * @param node
         * @param material
         * @returns {THREE.Line}
         */
        create3DLineFromNode: function (node, material) {
            var threeObject = null;
            if (node.eClass == GEPPETTO.Resources.CYLINDER) {
                var bottomBasePos = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
                var topBasePos = new THREE.Vector3(node.distal.x, node.distal.y, node.distal.z);

                var axis = new THREE.Vector3();
                axis.subVectors(topBasePos, bottomBasePos);
                var midPoint = new THREE.Vector3();
                midPoint.addVectors(bottomBasePos, topBasePos).multiplyScalar(0.5);

                var geometry = new THREE.Geometry();
                geometry.vertices.push(bottomBasePos);
                geometry.vertices.push(topBasePos);
                threeObject = new THREE.Line(geometry, material);
                threeObject.applyMatrix(new THREE.Matrix4().makeTranslation(0, axis.length() / 2, 0));
                threeObject.applyMatrix(new THREE.Matrix4().makeRotationY(Math.PI / 2));
                threeObject.lookAt(axis);
                threeObject.position.fromArray(bottomBasePos.toArray());
                threeObject.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI / 2));

                threeObject.geometry.verticesNeedUpdate = true;
            } else if (node.eClass == GEPPETTO.Resources.SPHERE) {
                var sphere = new THREE.SphereGeometry(node.radius, 20, 20);
                threeObject = new THREE.Mesh(sphere, material);
                threeObject.position.set(node.position.x, node.position.y, node.position.z);
                threeObject.geometry.verticesNeedUpdate = true;
            }
            return threeObject;
        },

        /**
         *
         * @param cylNode
         * @param material
         * @returns {THREE.Mesh}
         */
        create3DCylinderFromNode: function (cylNode, material) {

            var bottomBasePos = new THREE.Vector3(cylNode.position.x, cylNode.position.y, cylNode.position.z);
            var topBasePos = new THREE.Vector3(cylNode.distal.x, cylNode.distal.y, cylNode.distal.z);

            var axis = new THREE.Vector3();
            axis.subVectors(topBasePos, bottomBasePos);

            var c = new THREE.CylinderGeometry(cylNode.topRadius, cylNode.bottomRadius, axis.length(), 20, 1, false);

            // shift it so one end rests on the origin
            c.applyMatrix(new THREE.Matrix4().makeTranslation(0, axis.length() / 2, 0));
            // rotate it the right way for lookAt to work
            c.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
            // make a mesh with the geometry
            var threeObject = new THREE.Mesh(c, material);
            // make it point to where we want
            threeObject.lookAt(axis);
            // move base
            threeObject.position.fromArray(bottomBasePos.toArray());
            threeObject.geometry.verticesNeedUpdate = true;

            return threeObject;
        },

        /**
         * Modify the origin and radius of a sphere
         * @returns {THREE.Mesh}
         */
        modify3DSphere: function (object, x, y, z, radius, material) {
            // Impossible to change the radius of a Sphere.
            // Removing old object and creating a new one
            this.scene.remove(object);
            var mesh = this.add3DSphere(x, y, z, radius, material);
            mesh.instancePath = object.instancePath;
            return mesh;
        },

        /**
         * Add a 3D sphere to the scene at the given coordinates (4) points.
         * It could be any geometry really.
         * @returns {THREE.Mesh}
         */
        add3DSphere: function (x, y, z, radius, material) {
            if (this.aboveLinesThreshold) {
                radius = 1;
            }

            if (typeof material == 'undefined') {
                var material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
                material.nowireframe = true;
                material.opacity = 0.6;
                material.transparent = true;
                material.color.setHex("0xff0000");
            }

            var sphereNode = { radius: radius, position: { x: x, y: y, z: z } }
            var mesh = this.create3DSphereFromNode(sphereNode, material)
            mesh.renderOrder = 1;
            this.scene.add(mesh);
            return mesh;
        },


        /**
         * Add a 3D plane to the scene at the given coordinates (4) points.
         * It could be any geometry really.
         * @returns {THREE.Mesh}
         */
        add3DPlane: function (x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4, textureURL) {

            var geometry = new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(x1, y1, z1),//vertex0
                new THREE.Vector3(x2, y2, z2),//1
                new THREE.Vector3(x3, y3, z3),//2
                new THREE.Vector3(x4, y4, z4)//3
            );
            geometry.faces.push(
                new THREE.Face3(2, 1, 0),//use vertices of rank 2,1,0
                new THREE.Face3(3, 1, 2)//vertices[3],1,2...
            );
            geometry.computeBoundingBox();

            var max = geometry.boundingBox.max,
                min = geometry.boundingBox.min;
            var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
            var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
            var faces = geometry.faces;

            geometry.faceVertexUvs[0] = [];

            for (var i = 0; i < faces.length; i++) {

                var v1 = geometry.vertices[faces[i].a],
                    v2 = geometry.vertices[faces[i].b],
                    v3 = geometry.vertices[faces[i].c];

                geometry.faceVertexUvs[0].push([
                    new THREE.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
                    new THREE.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
                    new THREE.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
                ]);
            }
            geometry.uvsNeedUpdate = true;
            geometry.dynamic = true;

            var material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
            material.nowireframe = true;
            if (textureURL != undefined) {
                var loader = new THREE.TextureLoader();
                // load a resource
                loader.load(
                    // resource URL
                    textureURL,
                    // Function when resource is loaded
                    function (texture) {
                        //texture.minFilter = THREE.LinearFilter;
                        material.map = texture;
                        texture.flipY = false;
                        material.opacity = 0.3;
                        material.transparent = true;
                        material.needsUpdate = true;

                    },
                    // Function called when download progresses
                    function (xhr) {
                        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                    },
                    // Function called when download errors
                    function (xhr) {
                        console.log('An error happened');
                    }
                );

            }
            else {
                material.opacity = 0.3;
                material.transparent = true;
                material.color.setHex("0xb0b0b0");
            }

            var mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder = 1;
            mesh.clickThrough = true;
            this.scene.add(mesh);
            return mesh;
        },

        /**
         * Modify the coordinates (4) points of an existing plane.
         * @returns {THREE.Mesh}
         */
        modify3DPlane: function (object, x1, y1, z1, x2, y2, z2, x3, y3, z3, x4, y4, z4) {
            object.geometry.vertices[0].set(x1, y1, z1);
            object.geometry.vertices[1].set(x2, y2, z2);
            object.geometry.vertices[2].set(x3, y3, z3);
            object.geometry.vertices[3].set(x4, y4, z4);
            object.geometry.verticesNeedUpdate = true;
            return object;
        },

        /**
         * Remove an object from the scene
         */
        removeObject: function (object) {
            this.scene.remove(object);
        },

        /**
         *
         * @param sphereNode
         * @param material
         * @returns {THREE.Mesh|*}
         */
        create3DSphereFromNode: function (sphereNode, material) {

            var sphere = new THREE.SphereGeometry(sphereNode.radius, 20, 20);
            // sphere.applyMatrix(new THREE.Matrix4().makeScale(-1,1,1));
            var threeObject = new THREE.Mesh(sphere, material);
            threeObject.position.set(sphereNode.position.x, sphereNode.position.y, sphereNode.position.z);

            return threeObject;
        },

        /**
         *
         * @param thickness
         * @returns {THREE.LineBasicMaterial}
         */
        getLineMaterial: function (thickness, color) {
            var options = {};
            if (thickness) {
                options.linewidth = thickness;
            }
            if (color == undefined) {
                color = GEPPETTO.Resources.COLORS.DEFAULT;
            }
            var material = new THREE.LineBasicMaterial(options);
            this.setThreeColor(material.color, color);
            material.defaultColor = color;
            material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            return material;
        },

        /**
         *
         * @param color
         * @returns {THREE.MeshPhongMaterial}
         */
        getMeshPhongMaterial: function (color) {
            if (color == undefined) {
                color = GEPPETTO.Resources.COLORS.DEFAULT;
            }
            var material = new THREE.MeshPhongMaterial(
                {
                    opacity: 1,
                    shininess: 10,
                    flatShading: false
                });

            this.setThreeColor(material.color, color);
            material.defaultColor = color;
            material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            material.nowireframe = true;
            return material;
        },

        /**
         *
         * @returns {THREE.PointsMaterial}
         */
        getParticleMaterial: function () {
            var textureLoader = new THREE.TextureLoader();
            var pMaterial = new THREE.PointsMaterial(
                {
                    size: 5,
                    map: textureLoader.load("geppetto/images/particle.png"),
                    blending: THREE.AdditiveBlending,
                    depthTest: false,
                    transparent: true
                });
            this.setThreeColor(pMaterial.color, GEPPETTO.Resources.COLORS.DEFAULT);
            pMaterial.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
            pMaterial.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            pMaterial.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            return pMaterial;
        },

        /**
         *
         * @param threeColor
         * @param color
         */
        setThreeColor: function (threeColor, color) {
            if (!isNaN(color % 1)) {
                // we have an integer (hex) value
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
         *
         * @param zoomParameters
         */
        zoomToParameters: function (zoomParameters) {
            // Compute world AABB center
            this.sceneCenter.x = (zoomParameters.aabbMax.x + zoomParameters.aabbMin.x) * 0.5;
            this.sceneCenter.y = (zoomParameters.aabbMax.y + zoomParameters.aabbMin.y) * 0.5;
            this.sceneCenter.z = (zoomParameters.aabbMax.z + zoomParameters.aabbMin.z) * 0.5;

            this.updateCamera(zoomParameters.aabbMax, zoomParameters.aabbMin);
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
         * Remove given entity from scene
         *
         * @param entity
         */
        removeFromScene: function (entityPath) {
            var path = entityPath;
            var mergedMesh = this.meshes[path];
            if (mergedMesh) {
                this.scene.remove(mergedMesh);
                delete this.meshes[path];
            }
            var splitMesh = this.splitMeshes[path];
            if (splitMesh) {
                if (path == splitMesh.instancePath) {
                    this.scene.remove(splitMesh);
                }
                delete this.splitMeshes[path];
            }
        },

        /**
         * @param x
         * @param y
         */
        incrementCameraPan: function (x, y) {
            this.controls.incrementPanEnd(x, y);
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        incrementCameraRotate: function (x, y, z) {
            this.controls.incrementRotationEnd(x, y, z);
        },

        /**
         * @param z
         */
        incrementCameraZoom: function (z) {
            this.controls.incrementZoomEnd(z);
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        setCameraPosition: function (x, y, z) {
            this.controls.setPosition(x, y, z);
        },

        /**
         * @param rx
         * @param ry
         * @param rz
         * @param radius
         */
        setCameraRotation: function (rx, ry, rz, radius) {
            this.controls.setRotation(rx, ry, rz, radius);
        },

        /**
         * Rotate the camera around the selection
         *
         */
        autoRotate: function () {
            var that = this;
            if (this.rotate == null) {
                this.movieMode(true);
                this.rotate = setInterval(function () {
                    that.incrementCameraRotate(0.01, 0)
                }, 100);
            }
            else {
                this.movieMode(false);
                clearInterval(this.rotate);
                this.rotate = null;
            }
        },

        /**
         *
         */
        animate: function () {
            var that = this;
            that.debugUpdate = that.needsUpdate;
            // so that we log only the cycles when we are updating the scene

            that.controls.update();

            that.isAnimated = true;

            requestAnimationFrame(function () {
                that.animate();
            });
            that.renderCanvas();

            if (that.stats) {
                that.stats.update();
            }

            if (that.debugUpdate) {
                GEPPETTO.log(GEPPETTO.Resources.UPDATE_FRAME_END);
            }
        },


        /**
         * Get Meshes associated to an instance
         *
         * @param {String}
         *            instancePath - Path of the instance
         */
        getRealMeshesForInstancePath: function (instancePath) {
            var meshes = [];
            if (instancePath in this.splitMeshes) {
                for (var keySplitMeshes in this.splitMeshes) {
                    if (keySplitMeshes.startsWith(instancePath)) {
                        meshes.push(this.splitMeshes[keySplitMeshes]);
                    }

                }
            }
            else {
                if (instancePath in this.meshes) {
                    meshes.push(this.meshes[instancePath]);
                }
            }
            return meshes;
        },

        /**
         * Selects an aspect given the path of it. Color changes to yellow, and opacity become 100%.
         *
         * @param {String}
         *            instancePath - Path of aspect of mesh to select
         */
        selectInstance: function (instancePath, geometryIdentifier) {
            if (!this.hasInstance(instancePath)) {
                return;
            }
            var that = this;
            if (geometryIdentifier != undefined && geometryIdentifier != "") {
                instancePath = instancePath + "." + geometryIdentifier;
            }
            var meshes = this.getRealMeshesForInstancePath(instancePath);
            if (meshes.length > 0) {
                for (var meshesIndex in meshes) {
                    var mesh = meshes[meshesIndex];

                    if (!mesh.visible) {
                        this.merge(instancePath, true);
                    }
                    if (mesh.selected == false) {
                        if (mesh instanceof THREE.Object3D) {
                            mesh.traverse(function (child) {
                                if (child.hasOwnProperty("material")) {
                                    that.setThreeColor(child.material.color, GEPPETTO.Resources.COLORS.SELECTED);
                                    child.material.opacity = Math.max(0.5, child.material.defaultOpacity);

                                    if (GEPPETTO.isKeyPressed('c')) {
                                        child.geometry.computeBoundingBox();
                                        that.controls.target.copy(child.position);
                                        that.controls.target.add(child.geometry.boundingBox.getCenter());
                                    }
                                }
                            });
                        } else {
                            this.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.SELECTED);
                            mesh.material.opacity = Math.max(0.5, mesh.material.defaultOpacity);
                            if (GEPPETTO.isKeyPressed('c')) {
                                mesh.geometry.computeBoundingBox();
                                //let's set the center of rotation to the selected mesh
                                this.controls.target.copy(mesh.position);
                                this.controls.target.add(mesh.geometry.boundingBox.getCenter());
                            }
                        }
                        mesh.selected = true;
                        mesh.ghosted = false;


                        this.camera.updateProjectionMatrix();

                    }
                    if (GEPPETTO.isKeyPressed('z')) {
                        this.zoomTo([eval(instancePath)]);
                    }

                }

            }

            var instance = eval(instancePath);

            // Behaviour: help exploration of networks by ghosting and not highlighting non connected or selected
            if (instance !== undefined && instance.getConnections().length > 0) {
                // allOtherMeshes will contain a list of all the non connected entities in the scene
                var allOtherMeshes = $.extend({}, this.meshes);
                // look on the simulation selection options and perform necessary operations
                if (G.getSelectionOptions().show_inputs && G.getSelectionOptions().show_outputs) {
                    var meshes = this.highlightInstances(instancePath, true);
                    for (var i in meshes) {
                        delete allOtherMeshes[meshes[i]];
                    }
                }
                else if (G.getSelectionOptions().show_inputs) {
                    var inputs = this.highlightInstances(true, GEPPETTO.Resources.INPUT);
                    for (var i in inputs) {
                        delete allOtherMeshes[inputs[i]];
                    }
                }
                else if (G.getSelectionOptions().show_outputs) {
                    var outputs = this.highlightInstances(true, GEPPETTO.Resources.OUTPUT);
                    for (var o in outputs) {
                        delete allOtherMeshes[outputs[o]];
                    }
                }
                if (G.getSelectionOptions().draw_connection_lines) {
                    this.showConnectionLines(instancePath, true);
                }
                if (G.getSelectionOptions().unselected_transparent) {
                    this.unselectedTransparent(allOtherMeshes, true);
                }
            }
        },


        /**
         * Deselect aspect, or mesh as far as tree js is concerned.
         *
         * @param {String}
         *            instancePath - Path of the mesh/aspect to select
         */
        deselectInstance: function (instancePath) {
            if (!this.hasInstance(instancePath)) {
                return;
            }
            var meshes = this.getRealMeshesForInstancePath(instancePath);
            if (meshes.length > 0) {
                for (var meshesIndex in meshes) {
                    var mesh = meshes[meshesIndex];
                    // match instancePath to mesh store in variables properties
                    if (!mesh.visible) {
                        this.merge(instancePath, false);
                    }
                    // make sure that path was selected in the first place
                    if (mesh.selected == true) {
                        var that = this;
                        if (mesh instanceof THREE.Object3D) {
                            mesh.traverse(function (child) {
                                if (child.hasOwnProperty("material")) {
                                    that.setThreeColor(child.material.color, child.material.defaultColor);
                                    child.material.opacity = child.material.defaultOpacity;
                                }
                            });
                            mesh.selected = false;
                        }
                    } else {
                        this.setThreeColor(mesh.material.color, mesh.material.defaultColor);
                        mesh.material.opacity = mesh.material.defaultOpacity;
                        mesh.selected = false;
                    }
                }
            }

            if (G.getSelectionOptions().show_inputs && G.getSelectionOptions().show_outputs) {
                this.highlightInstances(instancePath, false);
            }
            else if (G.getSelectionOptions().show_inputs) {
                this.highlightInstances(instancePath, false, GEPPETTO.Resources.INPUT);
            }
            else if (G.getSelectionOptions().show_outputs) {
                this.highlightInstances(instancePath, false, GEPPETTO.Resources.OUTPUT);
            }

            if (G.getSelectionOptions().draw_connection_lines) {
                this.showConnectionLines(instancePath, false);
            }

            // TODO: trigger highlight on the ones still selected

            var selection = GEPPETTO.SceneController.getSelection();

            // NOTE: do this down here, ghost effect won't be removed if stuff is still highlighted
            if (G.getSelectionOptions().unselected_transparent) {
                if (selection != undefined && selection.length > 0) {
                    // else (there is something selected) make this transparent
                    var mesh = {};
                    mesh[instancePath] = this.meshes[instancePath];
                    if (mesh[instancePath] != undefined) {
                        this.unselectedTransparent(this.meshes, false);
                    }
                } else {
                    // if nothing else is selected do remove ghost effect
                    this.unselectedTransparent(false);
                }
            }

        },

        /**
         * Show output connections for this object.

         * @command AVisualCapability.highlightInstances()
         * @param {boolean} mode - Show or hide output connections
         */
        highlightInstances: function (path, mode, type) {
            if (mode == null || mode == undefined) {
                mode = true;
            }
            var entity = eval(path);
            if (entity instanceof Instance || entity instanceof ArrayInstance) {
                //show/hide connections
                if (mode) {
                    this.highlightConnectedInstances(entity, type);
                }
                else {
                    this.restoreConnectedInstancesColour(entity);
                }
            } else if (entity instanceof Type || entity instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(entity);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability('VisualCapability')) {
                        this.highlightInstances(instances[j].getInstancePath(), mode, type);
                    }
                }
            }
        },

        /**
         * Deselects all selected instancies
         *
         */
        deselectAll: function () {
            var selection = GEPPETTO.SceneController.getSelection();
            if (selection.length > 0) {
                for (var key in selection) {
                    var entity = selection[key];
                    entity.deselect();
                }
            }

            if (G.getSelectionOptions().unselected_transparent) {
                this.unselectedTransparent(false);
            }
            return GEPPETTO.Resources.DESELECT_ALL;
        },


        /**
         * Make unselected instances transparent or not
         *
         * @param {boolean}
         *            apply - Turn on or off the transparency
         */
        unselectedTransparent: function (apply) {
            GEPPETTO.SceneController.unselectedTransparent(this.meshes, apply);
            GEPPETTO.SceneController.unselectedTransparent(this.splitMeshes, apply);
        },

        /**
         * Make unselected instances transparent or not
         *
         * @param {Array}
         *            meshes - Array of meshes to apply the transparency to
         * @param {boolean}
         *            apply - Transparency effect on or off
         */
        unselectedTransparent: function (meshes, apply) {
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


        /**
         * Show aspect, make it visible.
         *
         * @param {String}
         *            instancePath - Instance path of aspect to make visible
         */
        showInstance: function (instancePath) {
            if (!this.hasInstance(instancePath)) {
                return;
            }
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
         * Hide all instances
         *
         */
        hideAllInstances: function () {
            for (var instancePath in this.meshes) {
                if (this.meshes.hasOwnProperty(instancePath)) {
                    this.hideInstance(instancePath);
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
            if (!this.hasInstance(instancePath)) {
                return;
            }
            var meshes = this.getRealMeshesForInstancePath(instancePath);
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                if (mesh) {
                    mesh.traverse(function (object) {
                        object.visible = false;
                    });
                }
            }
        },

        /**
         * Change the color of a given instance
         *
         * @param instancePath
         * @param color
         */
        setColor: function (instancePath, color) {
            if (!this.hasInstance(instancePath)) {
                return;
            }
            if (typeof color === 'string')
                color = color.replace(/0X/i, "#");
            var meshes = this.getRealMeshesForInstancePath(instancePath);
            if (meshes.length > 0) {
                for (var i = 0; i < meshes.length; i++) {
                    var mesh = meshes[i];
                    if (mesh) {
                        var that = this;
                        mesh.traverse(function (object) {
                            if (object.hasOwnProperty("material")) {
                                that.setThreeColor(object.material.color, color);
                                object.material.defaultColor = color;
                            }
                        });
                    }
                }
            }
        },

        /**
         * Retrieves the color of a given instance in this canvas
         * @param instance
         * @return {string}
         */
        getColor: function (instance) {
            var color = "";
            if (typeof instance.getChildren === "function") {
                //this is a an array, it will contain children
                var children = instance.getChildren();

                var color = "";
                for (var i = 0; i < children.length; i++) {
                    if (typeof children[i].getColor === "function") {
                        var newColor = children[i].getColor();
                        if (color == "") {
                            color = newColor;
                        }
                        else if (color != newColor) {
                            return "";
                        }
                    }
                }
            }

            var meshes = this.getRealMeshesForInstancePath(instance.getInstancePath());
            if (meshes.length > 0) {
                for (var i = 0; i < meshes.length; i++) {
                    var mesh = meshes[i];
                    if (mesh) {
                        mesh.traverse(function (object) {
                            if (object.hasOwnProperty("material")) {
                                if (color == "") {
                                    color = object.material.defaultColor;
                                }
                                else if (color != object.material.defaultColor) {
                                    return "";
                                }
                            }
                        });
                    }
                }
            }

            return color;
        },
        /**
         * Assign random color to instance if leaf - if not leaf assign random colr to all leaf children recursively
         * @param instance
         */
        assignRandomColor: function (instance) {

            var that = this;

            var getRandomColor = function () {
                var letters = '0123456789ABCDEF';
                var color = '#';
                for (var i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }
                return color;
            };

            if (instance.hasCapability('VisualCapability')) {
                var children = instance.getChildren();

                if (children.length == 0 || instance.getMetaType() == GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE) {
                    if (!this.hasInstance(instance)) {
                        return;
                    }
                    var meshes = this.getRealMeshesForInstancePath(instance.getInstancePath());
                    if (meshes.length > 0) {
                        for (var i = 0; i < meshes.length; i++) {
                            var mesh = meshes[i];
                            if (mesh) {
                                var randomColor = getRandomColor();

                                mesh.traverse(function (object) {
                                    if (object.hasOwnProperty("material")) {
                                        that.setThreeColor(object.material.color, randomColor);
                                        object.material.defaultColor = randomColor;
                                    }
                                });
                            }
                        }
                    }
                } else {
                    for (var i = 0; i < children.length; i++) {
                        this.assignRandomColor(children[i]);
                    }
                }
            }
            GEPPETTO.trigger(GEPPETTO.Events.Color_set, { instance: instance, color: randomColor });
        }

        ,

        /**
         * Change the default opacity for a given aspect. The opacity set with this command API will be persisted across different workflows, e.g. selection.
         *
         * @param {String}
         *            instancePath - Instance path of aspect to change opacity for
         */
        setOpacity: function (instancePath, opacity) {
            if (!this.hasInstance(instancePath)) {
                return;
            }
            var mesh = this.meshes[instancePath];
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
        }
        ,

        /**
         * Set the threshold (number of 3D primitives on the scene) above which we switch the visualization to lines
         * for teh CompositeVisualTypes
         * @param threshold
         */
        setLinesThreshold: function (threshold) {
            this.linesThreshold = threshold;
        }
        ,

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
            if (!this.hasInstance(instance)) {
                return;
            }
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

            this.traverseInstances([instance], lines, thickness);

            return true;
        }
        ,

        /**
         * Set the type of geometry used to visualize all the instances in the scene
         * @param type - The geometry type either "lines", "tubes" or "cylinders"
         */
        setAllGeometriesType: function (type) {
            var visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, window.Instances);
            for (var i = 0; i < visualInstances.length; i++) {
                if (this.meshes[visualInstances[i].getInstancePath()]) {
                    var visualType = visualInstances[i].getVisualType();
                    if (visualType) {
                        if (visualType.getWrappedObj().eClass == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                            this.setGeometryType(visualInstances[i], type);
                        }
                    }
                }
            }
        }
        ,


        /**
         *
         * @param instance
         */
        zoomToInstance: function (instance) {
            if (!this.hasInstance(instance)) {
                return;
            }
            this.controls.reset();
            var that = this;
            var zoomParameters = {};
            var mesh = this.meshes[instance.getInstancePath()];
            mesh.traverse(function (object) {
                if (object.hasOwnProperty("geometry")) {
                    that.addMeshToZoomParameters(object, zoomParameters);
                }
            });

            this.zoomToParameters(zoomParameters);

        }
        ,

        /**
         *
         * @param instances
         */
        zoomTo: function (instances) {
            this.controls.reset();
            this.zoomToParameters(this.zoomIterator(instances, {}));
        },

        /**
         *
         * @param instances
         * @param zoomParameters
         * @returns {*}
         */
        zoomIterator: function (instances, zoomParameters) {
            var that = this;
            for (var i = 0; i < instances.length; i++) {
                var instancePath = instances[i].getInstancePath();
                var mesh = this.meshes[instancePath];
                if (mesh) {
                    mesh.traverse(function (object) {
                        if (object.hasOwnProperty("geometry")) {
                            that.addMeshToZoomParameters(object, zoomParameters);
                        }
                    });
                }
                else {
                    zoomParameters = this.zoomIterator(instances[i].getChildren(), zoomParameters);
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
            if (!this.hasInstance(instance)) {
                return;
            }
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
                    var mesh = this.meshes[connection.getA().getPath()]; //this is the instance input to the current one
                    if (outputs[otherEndPath]) {
                        this.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
                    }
                    else {
                        this.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED);
                    }
                    inputs[otherEndPath] = connection.getInstancePath();
                } else if (connectionType == GEPPETTO.Resources.OUTPUT) {
                    //I want to change the colour the instances that are an output of the instance passed as a parameter
                    var mesh = this.meshes[connection.getB().getPath()]; //this is the instance output of the current on
                    if (inputs[otherEndPath]) {
                        this.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT);
                    }
                    else {
                        this.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED);
                    }
                    outputs[otherEndPath] = connection.getInstancePath();
                }
            }
        }
        ,

        /**
         *
         * @param instance
         * @returns {boolean}
         */
        hasInstance: function (instance) {
            var instancePath = typeof instance == "string" ? instance : instance.getInstancePath();
            return this.meshes[instancePath] != undefined;
        }
        ,

        /**
         * Restore the original colour of the connected instances
         *
         *            instance - A connected instance
         * @param instance
         */
        restoreConnectedInstancesColour: function (instance) {
            if (!this.hasInstance(instance)) {
                return;
            }

            var connections = instance.getConnections();


            for (var c = 0; c < connections.length; c++) {
                var connection = connections[c];

                var mesh = connection.getA().getPath() == instance.getInstancePath() ?
                    this.meshes[connection.getB().getPath()] :
                    this.meshes[connection.getA().getPath()];


                // if mesh is not selected, give it ghost or default color and opacity
                if (!mesh.selected) {
                    // if there are nodes still selected, give it a ghost effect. If not nodes are
                    // selected, give the meshes old default color
                    if (G.getSelectionOptions().unselected_transparent) {
                        mesh.material.transparent = true;
                        mesh.material.opacity = GEPPETTO.Resources.OPACITY.GHOST;
                        mesh.ghosted = true;
                    }
                    this.setThreeColor(mesh.material.color, mesh.material.defaultColor);

                }
                // if mesh is selected, make it look like so
                else {
                    this.setThreeColor(mesh.material.color, GEPPETTO.Resources.COLORS.SELECTED);
                    mesh.material.transparent = true;
                    mesh.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                }
            }
        }
        ,


        /**
         * Show connection lines for this instance.

         * @command AVisualCapability.showConnectionLines()
         * @param {boolean} mode - Show or hide connection lines
         * @param instancePath
         */
        showConnectionLines: function (instancePath, mode) {
            if (mode == null || mode == undefined) {
                mode = true;
            }
            var entity = eval(instancePath);
            if (entity instanceof Instance || entity instanceof ArrayInstance) {
                //show or hide connection lines
                if (mode) {
                    this.showConnectionLinesForInstance(entity);
                }
                else {
                    this.removeConnectionLines(entity);
                }
            } else if (entity instanceof Type || entity instanceof Variable) {
                // fetch all instances for the given type or variable and call hide on each
                var instances = GEPPETTO.ModelFactory.getAllInstancesOf(entity);
                for (var j = 0; j < instances.length; j++) {
                    if (instances[j].hasCapability('VisualCapability')) {
                        this.showConnectionLines(instances[j], mode);
                    }
                }
            }
        }
        ,

        /**
         *
         *
         * @param instance
         */
        showConnectionLinesForInstance: function (instance) {
            var connections = instance.getConnections();

            var mesh = this.meshes[instance.getInstancePath()];
            var inputs = {};
            var outputs = {};
            var defaultOrigin = mesh.position.clone();

            for (var c = 0; c < connections.length; c++) {

                var connection = connections[c];
                var type = connection.getA().getPath() == instance.getInstancePath() ?
                    GEPPETTO.Resources.OUTPUT :
                    GEPPETTO.Resources.INPUT;

                var thisEnd = connection.getA().getPath() == instance.getInstancePath() ? connection.getA() : connection.getB();
                var otherEnd = connection.getA().getPath() == instance.getInstancePath() ? connection.getB() : connection.getA();
                var otherEndPath = otherEnd.getPath();

                var otherEndMesh = this.meshes[otherEndPath];

                var destination;
                var origin;

                if (thisEnd.getPoint() == undefined) {
                    //same as before
                    origin = defaultOrigin;
                }
                else {
                    //the specified coordinate
                    var p = thisEnd.getPoint();
                    origin = new THREE.Vector3(p.x + mesh.position.x, p.y + mesh.position.y, p.z + mesh.position.z);
                }

                if (otherEnd.getPoint() == undefined) {
                    //same as before
                    destination = otherEndMesh.position.clone();
                }
                else {
                    //the specified coordinate
                    var p = otherEnd.getPoint();
                    destination = new THREE.Vector3(p.x + otherEndMesh.position.x, p.y + otherEndMesh.position.y, p.z + otherEndMesh.position.z);
                }

                var geometry = new THREE.Geometry();

                geometry.vertices.push(origin, destination);
                geometry.verticesNeedUpdate = true;
                geometry.dynamic = true;

                var colour = null;


                if (type == GEPPETTO.Resources.INPUT) {

                    colour = GEPPETTO.Resources.COLORS.INPUT_TO_SELECTED;

                    // figure out if connection is both, input and output
                    if (outputs[otherEndPath]) {
                        colour = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
                    }

                    if (inputs[otherEndPath]) {
                        inputs[otherEndPath].push(connection.getInstancePath());
                    }
                    else {
                        inputs[otherEndPath] = [];
                        inputs[otherEndPath].push(connection.getInstancePath());
                    }
                }

                else if (type == GEPPETTO.Resources.OUTPUT) {

                    colour = GEPPETTO.Resources.COLORS.OUTPUT_TO_SELECTED;
                    // figure out if connection is both, input and output
                    if (inputs[otherEndPath]) {
                        colour = GEPPETTO.Resources.COLORS.INPUT_AND_OUTPUT;
                    }

                    if (outputs[otherEndPath]) {
                        outputs[otherEndPath].push(connection.getInstancePath());
                    }
                    else {
                        outputs[otherEndPath] = [];
                        outputs[otherEndPath].push(connection.getInstancePath());
                    }
                }

                var material = new THREE.LineDashedMaterial({ dashSize: 3, gapSize: 1 });
                this.setThreeColor(material.color, colour);

                var line = new THREE.LineSegments(geometry, material);
                line.updateMatrixWorld(true);


                if (this.connectionLines[connection.getInstancePath()]) {
                    this.scene.remove(this.connectionLines[connection.getInstancePath()]);
                }

                this.scene.add(line);
                this.connectionLines[connection.getInstancePath()] = line;
            }
        }
        ,

        /**
         * Removes connection lines, all if nothing is passed in or just the ones passed in.
         *
         * @param instance - optional, instance for which we want to remove the connections
         */
        removeConnectionLines: function (instance) {
            if (instance != undefined) {
                var connections = instance.getConnections();
                // get connections for given instance and remove only those
                var lines = this.connectionLines;
                for (var i = 0; i < connections.length; i++) {
                    if (lines.hasOwnProperty(connections[i].getInstancePath())) {
                        // remove the connection line from the scene
                        this.scene.remove(lines[connections[i].getInstancePath()]);
                        // remove the conneciton line from the GEPPETTO list of connection lines
                        delete lines[connections[i].getInstancePath()];
                    }
                }
            } else {
                // remove all connection lines
                var lines = this.connectionLines;
                for (var key in lines) {
                    if (lines.hasOwnProperty(key)) {
                        this.scene.remove(lines[key]);
                    }
                }
                this.connectionLines = [];
            }
        }
        ,

        /**
         *
         * @param targetObjects
         * @param aspects
         * @returns {{}}
         */
        splitHighlightedMesh: function (targetObjects, aspects) {
            var groups = {};
            for (a in aspects) {
                // create object to hold geometries used for merging objects
                // in groups
                var geometryGroups = {};

                var mergedMesh = this.meshes[a];

                /*
                 * reset the aspect instance path group mesh, this is used to group /*visual objects that don't belong to any of the groups passed as parameter
                 */
                this.splitMeshes[a] = null;
                geometryGroups[a] = new THREE.Geometry();
                var highlightedMesh = a + ".highlighted";
                this.splitMeshes[highlightedMesh] = null;
                geometryGroups[highlightedMesh] = new THREE.Geometry();

                // get map of all meshes that merged mesh was merging
                var map = mergedMesh.mergedMeshesPaths;

                // loop through individual meshes, add them to group, set
                // new material to them
                for (v in map) {
                    var m = this.visualModelMap[map[v]];
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
                this.createGroupMeshes(a, geometryGroups, newGroups);
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
            var splitHighlightedGroups = this.splitHighlightedMesh(targetObjects, aspects);

            for (groupName in splitHighlightedGroups) {
                // get group mesh
                var groupMesh = this.splitMeshes[groupName];

                if (!(groupName in aspects)) {
                    if (mode) {
                        this.setThreeColor(groupMesh.material.color, GEPPETTO.Resources.COLORS.HIGHLIGHTED);
                        groupMesh.highlighted = true;
                    } else {
                        this.setThreeColor(groupMesh.material.color, groupMesh.material.defaultColor);
                        groupMesh.highlighted = false;
                    }
                } else {
                    this.setThreeColor(groupMesh.material.color, splitHighlightedGroups[groupName].color.getHex());
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
            if (!this.hasInstance(instance)) {
                return;
            }
            var instancePath = instance.getInstancePath();

            // retrieve the merged mesh
            var mergedMesh = this.meshes[instancePath];
            // create object to hold geometries used for merging objects in
            // groups
            var geometryGroups = {};

            /*
             * reset the aspect instance path group mesh, this is used to group visual objects that don't belong to any of the groups passed as parameter
             */
            this.splitMeshes[instancePath] = null;
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
                    var m = this.visualModelMap[map[v]];

                    eval(map[v].substring(0, map[v].lastIndexOf(".")));
                    var object = instance.getVisualType()[map[v].replace(instancePath + ".", "")];

                    // If it is a segment compare to the id otherwise check in the visual groups
                    if (object.getId() in groupElements) {
                        // true means don't add to mesh with non-groups visual objects
                        added = this.addMeshToGeometryGroup(instance, object.getId(), geometryGroups, m)
                    } else {
                        // get group elements list for object
                        var groupElementsReference = object.getInitialValue().value.groupElements;
                        for (var i = 0; i < groupElementsReference.length; i++) {
                            var objectGroup = GEPPETTO.ModelFactory.resolve(groupElementsReference[i].$ref).getId();
                            if (objectGroup in groupElements) {
                                // true means don't add to mesh with non-groups visual objects
                                added = this.addMeshToGeometryGroup(instance, objectGroup, geometryGroups, m)
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
            this.createGroupMeshes(instancePath, geometryGroups, groupElements);
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
        addMeshToGeometryGroup: function (instance, id, geometryGroups, m) {
            if (!this.hasInstance(instance)) {
                return;
            }
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
        }
        ,

        /**
         * Create group meshes for given groups, retrieves from map if already present
         * @param instancePath
         * @param geometryGroups
         * @param groups
         */
        createGroupMeshes: function (instancePath, geometryGroups, groups) {
            if (!this.hasInstance(instancePath)) {
                return;
            }
            var mergedMesh = this.meshes[instancePath];
            // switch visible flag to false for merged mesh and remove from scene
            mergedMesh.visible = false;
            this.scene.remove(mergedMesh);

            for (g in groups) {
                var groupName = g;
                if (groupName.indexOf(instancePath) <= -1) {
                    groupName = instancePath + "." + g;
                }

                var groupMesh = this.splitMeshes[groupName];
                var geometryGroup = geometryGroups[groupName];

                if (mergedMesh instanceof THREE.Line) {
                    var material = this.getLineMaterial();
                    groupMesh = new THREE.LineSegments(geometryGroup, material);
                } else {
                    var material = this.getMeshPhongMaterial();
                    groupMesh = new THREE.Mesh(geometryGroup, material);
                }
                groupMesh.instancePath = instancePath;
                groupMesh.geometryIdentifier = g;
                groupMesh.geometry.dynamic = false;
                groupMesh.position.copy(mergedMesh.position);


                this.splitMeshes[groupName] = groupMesh;

                // Update visualization feature for a mesh
                if (mergedMesh.ghosted) {
                    this.unselectedTransparent([groupMesh], true);
                }
                if (mergedMesh.selected) {
                    this.selectInstance(groupName);
                }
                groupMesh.selected = mergedMesh.selected;

                // add split mesh to scenne and set flag to visible
                groupMesh.visible = true;
                this.scene.add(groupMesh);
            }
        }
        ,

        /**
         * Merge mesh that was split before
         *
         *            aspectPath - Path to aspect that points to mesh
         * @param instancePath
         * @param visible
         */
        merge: function (instancePath, visible) {
            // get mesh from map
            var mergedMesh = this.meshes[instancePath];

            // if merged mesh is not visible, turn it on and turn split one
            // off
            if (!mergedMesh.visible) {
                for (path in this.splitMeshes) {
                    // retrieve split mesh that is on the scene
                    var splitMesh = this.splitMeshes[path];
                    if (splitMesh) {
                        if (instancePath == splitMesh.instancePath) {
                            splitMesh.visible = false;
                            // remove split mesh from scene
                            this.scene.remove(splitMesh);
                        }
                    }
                }
                if (visible) {
                    // add merged mesh to scene and set flag to true
                    mergedMesh.visible = true;
                    this.scene.add(mergedMesh);
                }
            }
        }
        ,

        /**
         *
         * @param visualGroups
         * @param instance
         * @param meshesContainer
         */
        showVisualGroupsForInstance: function (instance, visualGroupElement) {
            if (!this.hasInstance(instance)) {
                return;
            }
            var instancePath = instance.getInstancePath();
            // retrieve the merged mesh
            var mergedMesh = this.meshes[instancePath];

            // get map of all meshes that merged mesh was merging
            var map = mergedMesh.mergedMeshesPaths;

            var elements = {}
            for (var v in map) {
                if (v != undefined) {
                    eval(map[v].substring(0, map[v].lastIndexOf(".")));
                    var object = instance.getVisualType()[map[v].replace(instancePath + ".", "")];
                    // get group elements list for object
                    var groupElementsReference = object.getInitialValue().value.groupElements;
                    for (var i = 0; i < groupElementsReference.length; i++) {
                        var objectGroup = GEPPETTO.ModelFactory.resolve(groupElementsReference[i].$ref).getId();
                        if (objectGroup == visualGroupElement.getId()) {
                            elements[object.getId()] = { 'color': visualGroupElement.getColor() }
                        }
                    }
                }
            }

            this.showVisualGroupsRaw(elements, instance, this.splitMeshes);
        }
        ,

        /**
         *
         * @param visualGroups
         * @param instance
         * @param meshesContainer
         */
        showVisualGroupsRaw: function (visualGroups, instance, meshesContainer) {
            var instancePath = instance.getInstancePath();
            for (g in visualGroups) {
                // retrieve visual group object
                var visualGroup = visualGroups[g];

                // get full group name to access group mesh
                var groupName = g;
                if (groupName.indexOf(instancePath) <= -1) {
                    groupName = instancePath + "." + g;
                }

                // get group mesh
                var groupMesh = meshesContainer[groupName];
                groupMesh.visible = true;
                this.setThreeColor(groupMesh.material.color, visualGroup.color);
            }
        }
        ,

        /**
         * Shows a visual group
         * @param visualGroups
         * @param mode
         * @param instances
         */
        showVisualGroups: function (visualGroups, mode, instances) {
            for (var i = 0; i < instances.length; i++) {
                var instance = instances[i];
                var instancePath = instance.getInstancePath();
                this.merge(instancePath, true);
                if (mode) {
                    var mergedMesh = this.meshes[instancePath];
                    var map = mergedMesh.mergedMeshesPaths;
                    //no mergedMeshesPaths means object hasn't been merged, single object
                    if (map != undefined || null) {
                        this.splitGroups(instance, visualGroups);
                        this.showVisualGroupsRaw(visualGroups, instance, this.splitMeshes);

                    } else {
                        this.showVisualGroupsRaw(visualGroups, instance, this.meshes);
                    }

                }
            }
        }
        ,

        /**
         *
         * @param variables
         * @returns {boolean}
         */
        isVisible: function (variables) {
            var visible = false;
            for (var i = 0; i < variables.length; i++) {
                if (variables[i].isVisible()) {
                    visible = true;
                    break;
                }
            }
            return visible;
        }
        ,

        /**
         *
         * @param variables
         * @returns {boolean}
         */
        isSelected: function (variables) {
            var selected = false;
            for (var i = 0; i < variables.length; i++) {
                if (variables[i].hasOwnProperty('isSelected') && variables[i].isSelected()) {
                    selected = true;
                    break;
                }
            }
            return selected;
        }
        ,

        /**
         * Reinitializes the camera with the Y axis flipped
         */
        flipCameraY: function () {
            this.camera.up = new THREE.Vector3(0, -1, 0);
            this.setupControls();
            this.resetCamera();
        }
        ,

        /**
         *
         */
        flipCameraZ: function () {
            this.camera.direction = new THREE.Vector3(0, 0, -1);
            this.setupControls();
            this.resetCamera();
        }
        ,

        /**
         *
         * @param toggle
         */
        movieMode: function (toggle) {
            this.configureRenderer(toggle);
        }
        ,

        /**
         * Resets the scene controller
         */
        reset: function () {
            this.complexity = 0;
            this.aboveLinesThreshold = false;
        }

    }
        ;

    return ThreeDEngine;
});

