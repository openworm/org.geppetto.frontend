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
 * @authot Jesus R Martinez (jesus@metacell.us)
 */
define(function(require) {

    var $ = require('jquery'),
        _ = require('underscore'),
        Backbone = require('backbone');

    require('vendor/Detector');
    require('three');
    require('vendor/THREEx.KeyboardState');

    /**
     * Local variables
     */
    var VARS;

    
    /**
     * Initialize the engine
     *
     * @class GEPPETTO
     */
    var GEPPETTO = {

        /**
         * Initialize Geppetto
         *
         * @param {HTML} containerp - HTML element to draw the 3D Scene
         * @returns {Boolean}
         */
        init : function(containerp) {
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
                return false;
            } else {
                VARS = GEPPETTO.Init.initialize(containerp);
                return true;
            }
        },      

        /**
         *
         * @returns {Boolean} True or false, whether webgl is detected or not
         */
        webGLAvailable : function(){
            if (!Detector.webgl) {
                Detector.addGetWebGLMessage();
                return false;
            } else {
                return true;
            }
        },

        /**
         * Returns variables object used to store meshes, and other properties of the 3D scene
         * @returns {Object} Object with important properties for the 3D Scene.
         */
        getVARS : function(){
            return VARS;
        },

        /**
         * Set object local rotation, with respect to z (Euler angle)
         * @param {AspectNode} aspect - the aspect containing the entity to rotate
         * @param {String} entityName - the name of the entity to be rotated (in the 3d model)
         * @param {Float} angle - the angle (radians) of the local rotation around z
         */
        setLocalRotationZ : function(aspect, entityName, angle) {
            //TODO: the first arg should be a vis tree
            var threeObject = GEPPETTO.get3DObjectInVisualizationTree(aspect.getInstancePath(), entityName);
            if (threeObject != null) {
                threeObject.rotation.z = angle;
            }
        },


        /**
         * Compute the center of the scene.
         */
        calculateSceneCenter : function(scene) {
            var aabbMin = null;
            var aabbMax = null;

            scene.traverse(function(child) {
                if (child instanceof THREE.Mesh
                    || child instanceof THREE.ParticleSystem) {
                    child.geometry.computeBoundingBox();

                    // If min and max vectors are null, first values become
                    // default min and max
                    if (aabbMin == null && aabbMax == null) {
                        aabbMin = child.geometry.boundingBox.min;
                        aabbMax = child.geometry.boundingBox.max;
                    }

                    // Compare other meshes, particles BB's to find min and max
                    else {
                        aabbMin.x = Math.min(aabbMin.x,
                            child.geometry.boundingBox.min.x);
                        aabbMin.y = Math.min(aabbMin.y,
                            child.geometry.boundingBox.min.y);
                        aabbMin.z = Math.min(aabbMin.z,
                            child.geometry.boundingBox.min.z);
                        aabbMax.x = Math.max(aabbMax.x,
                            child.geometry.boundingBox.max.x);
                        aabbMax.y = Math.max(aabbMax.y,
                            child.geometry.boundingBox.max.y);
                        aabbMax.z = Math.max(aabbMax.z,
                            child.geometry.boundingBox.max.z);
                    }
                }
            });

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

            var camDir = new THREE.Vector3(1, 0, 0);
            camDir.multiplyScalar(offset);

            // Store camera position
            GEPPETTO.getVARS().cameraPosition = new THREE.Vector3();
            GEPPETTO.getVARS().cameraPosition.addVectors(GEPPETTO.getVARS().sceneCenter, camDir);
        },

        /**
         * Update camera with new position and place to lookat
         */
        updateCamera : function() {
            // Update camera
            GEPPETTO.getVARS().camera.rotationAutoUpdate = false;
            GEPPETTO.getVARS().camera.position.set(GEPPETTO.getVARS().cameraPosition.x,
                GEPPETTO.getVARS().cameraPosition.y, GEPPETTO.getVARS().cameraPosition.z);
            GEPPETTO.getVARS().camera.lookAt(GEPPETTO.getVARS().sceneCenter);
            GEPPETTO.getVARS().camera.up = new THREE.Vector3(0, 1, 0);
            GEPPETTO.getVARS().camera.rotationAutoUpdate = true;
            GEPPETTO.getVARS().controls.target = GEPPETTO.getVARS().sceneCenter;
        },

        /**
         * Status of scene, populated or not
         *
         * @returns {Boolean} True or false depending whether scene is populated or not
         */
        isScenePopulated : function() {
            return !(_.isEmpty(GEPPETTO.getVARS().visualModelMap));
        },

        /**
         * Has canvas been created?
         *
         * @returns {Boolean] True or false if canvas has been created or not
			 */
        isCanvasCreated : function() {
            return GEPPETTO.getVARS().canvasCreated;
        },

        /**
         * Sets up the HUD display with the scene stat's fps.
         */
        setupStats : function() {
            // Stats
            if ($("#stats").length == 0) {
                if (VARS != null) {
                    GEPPETTO.getVARS().stats = new Stats();
                    GEPPETTO.getVARS().stats.domElement.style.float = 'right';
                    GEPPETTO.getVARS().stats.domElement.style.position = 'absolute';
                    GEPPETTO.getVARS().stats.domElement.style.top = '60px';
                    GEPPETTO.getVARS().stats.domElement.style.right = '5px';
                    GEPPETTO.getVARS().stats.domElement.style.zIndex = 100;
                    $('#controls').append(GEPPETTO.getVARS().stats.domElement);
                }
            }
        },

        /**
         * Displays HUD for FPS stats
         */
        toggleStats : function(mode) {
            if(mode){
                if ($("#stats").length == 0) {
                    GEPPETTO.setupStats();
                } else {
                    $("#stats").show();
                }
            }else{
                $("#stats").hide();
            }
        },

        /**
         * Create a GUI element based on the available metadata
         */
        setupGUI : function() {
            var data = !(_.isEmpty(GEPPETTO.getVARS().metadata));

            // GUI
            if (!GEPPETTO.getVARS().gui && data) {
                GEPPETTO.getVARS().gui = new dat.GUI({
                    width : 400
                });
                GEPPETTO.addGUIControls(GEPPETTO.getVARS().gui, GEPPETTO.getVARS().metadata);
            }
            for (f in GEPPETTO.getVARS().gui.__folders) {
                // opens only the root folders
                GEPPETTO.getVARS().gui.__folders[f].open();
            }

        },

        /**
         * Adds GUI controls to GEPPETTO
         *
         * @param gui
         * @param metadatap
         */
        addGUIControls : function(parent, current_metadata) {
            if (current_metadata.hasOwnProperty("ID")) {
                parent.add(current_metadata, "ID").listen();
            }
            for ( var m in current_metadata) {
                if (m != "ID") {
                    if (typeof current_metadata[m] == "object") {
                        var folder = parent.addFolder(m);
                        // recursive call to populate the GUI with sub-metadata
                        GEPPETTO.addGUIControls(folder, current_metadata[m]);
                    } else {
                        parent.add(current_metadata, m).listen();
                    }
                }
            }
        },

        /**
         * Adds debug axis to the scene
         */
        setupAxis : function() {
            // To use enter the axis length
            GEPPETTO.getVARS().scene.add(new THREE.AxisHelper(200));
        },

        /**
         * Renders objects in the scene
         */
        render : function() {
            GEPPETTO.getVARS().renderer.render(GEPPETTO.getVARS().scene, GEPPETTO.getVARS().camera);
        },

        /**
         * Returns intersected objects from mouse click
         *
         * @returns {Array} a list of objects intersected by the current mouse
         *          coordinates
         */
        getIntersectedObjects : function() {
            // create a Ray with origin at the mouse position and direction into
            // the
            // scene (camera direction)
            var vector = new THREE.Vector3(GEPPETTO.getVARS().mouse.x, GEPPETTO.getVARS().mouse.y, 1);
            GEPPETTO.getVARS().projector.unprojectVector(vector, GEPPETTO.getVARS().camera);

            var raycaster = new THREE.Raycaster(GEPPETTO.getVARS().camera.position, vector
                .sub(GEPPETTO.getVARS().camera.position).normalize());

            var visibleChildren = [];
            GEPPETTO.getVARS().scene.traverse(function(child) {
                if (child.visible) {
                    visibleChildren.push(child);
                }
            });

            // returns an array containing all objects in the scene with which
            // the ray intersects
            return raycaster.intersectObjects(visibleChildren);
        },

        /**
         * @param{String} key - The pressed key
         * @returns {boolean} True if the key is pressed
         */
        isKeyPressed : function(key) {
            return GEPPETTO.getVARS().keyboard.pressed(key);
        },

        /**
         * Generate new id
         *
         * @returns {Number} A new id
         */
        getNewId : function() {
            return GEPPETTO.getVARS().idCounter++;
        },

        /**
         * Show metadata
         * @param {String} entityIndex - the id of the entity for which we want to display metadata
         */
        showMetadataForEntity : function(entityIndex) {
            if (GEPPETTO.getVARS().gui) {
                GEPPETTO.getVARS().gui.domElement.parentNode.removeChild(GEPPETTO.getVARS().gui.domElement);
                GEPPETTO.getVARS().gui = null;
            }

            GEPPETTO.getVARS().metadata = GEPPETTO.getVARS().runtimetree[entityIndex].metadata;
            GEPPETTO.getVARS().metadata.ID = GEPPETTO.getVARS().runtimetree[entityIndex].id;

            GEPPETTO.setupGUI();

        },

        /**
         * @param {Entity} aroundObject - The object around which the rotation will happen
         */
        enterRotationMode : function(aroundObject) {
            GEPPETTO.getVARS().rotationMode = true;
            if (aroundObject) {
                GEPPETTO.getVARS().camera.lookAt(aroundObject);
            }
        },

        /**
         * Exit rotation mode
         */
        exitRotationMode : function() {
            GEPPETTO.getVARS().rotationMode = false;
        },

        /**
         * Gets 3D object node from Visualization tree by feeding it the instance
         * path of the 3D object as search key.
         */
        get3DObjectInVisualizationTree : function(visualizationTree, objectPath){
            var objectPathFormat = objectPath.replace(visualizationTree.getInstancePath()+".","");
            var object = GEPPETTO.Utility.deepFind(visualizationTree.content, objectPathFormat);

            return object;
        },

        resetCamera : function() {
            GEPPETTO.calculateSceneCenter(GEPPETTO.getVARS().scene);
            GEPPETTO.updateCamera();
        },

        /**
         * @param x
         * @param y
         */
        incrementCameraPan : function(x, y) {
            GEPPETTO.getVARS().controls.incrementPanEnd(x, y);
        },

        /**
         * @param x
         * @param y
         * @param z
         */
        incrementCameraRotate : function(x, y, z) {
            GEPPETTO.getVARS().controls.incrementRotationEnd(x, y, z);
        },

        /**
         * @param z
         */
        incrementCameraZoom : function(z) {
            GEPPETTO.getVARS().controls.incrementZoomEnd(z);
        },

        /**
         * @param msg
         */
        log : function(msg) {
            if (GEPPETTO.getVARS().debug) {
                var d = new Date();
                var curr_hour = d.getHours();
                var curr_min = d.getMinutes();
                var curr_sec = d.getSeconds();
                var curr_msec = d.getMilliseconds();

                console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":"
                    + curr_msec + ' - ' + msg, "");

            }
        },

        /**
         * @param category
         * @param action
         * @param opt_label
         * @param opt_value
         * @param opt_noninteraction
         */
        trackActivity : function(category, action, opt_label, opt_value,
                                 opt_noninteraction) {
            if (typeof _gaq != 'undefined') {
                _gaq.push([ '_trackEvent', category, action, opt_label,
                    opt_value, opt_noninteraction ]);
            }
        },

        winHeight: function() {
            return window.innerHeight || (document.documentElement || document.body).clientHeight;
        }
    };

    _.extend(GEPPETTO, Backbone.Events);

    require('SandboxConsole')(GEPPETTO);
    require('GEPPETTO.Resources')(GEPPETTO);
    require('GEPPETTO.Events')(GEPPETTO);
    require('GEPPETTO.Init')(GEPPETTO);
    require('3d_visualization/GEPPETTO.SceneFactory')(GEPPETTO);
    require('3d_visualization/GEPPETTO.SceneController')(GEPPETTO);
    require('GEPPETTO.Vanilla')(GEPPETTO);
    require('GEPPETTO.FE')(GEPPETTO);
    require('GEPPETTO.ScriptRunner')(GEPPETTO);
    //require('GEPPETTO.SimulationContentEditor')(GEPPETTO);
    require('GEPPETTO.JSEditor')(GEPPETTO);
    require('GEPPETTO.Console')(GEPPETTO);
    require('GEPPETTO.Utility')(GEPPETTO);
    require('GEPPETTO.Share')(GEPPETTO);
    require('GEPPETTO.MenuManager')(GEPPETTO);
    require('websocket-handlers/GEPPETTO.MessageSocket')(GEPPETTO);
    require('websocket-handlers/GEPPETTO.GlobalHandler')(GEPPETTO);
    require('websocket-handlers/GEPPETTO.SimulationHandler')(GEPPETTO);
    require('geppetto-objects/Simulation')(GEPPETTO);
    require('geppetto-objects/G')(GEPPETTO);
    require('GEPPETTO.Main')(GEPPETTO);
    //require('GEPPETTO.Tutorial')(GEPPETTO);
    require("widgets/includeWidget")(GEPPETTO);
    require('nodes/RuntimeTreeFactory')(GEPPETTO);


    return GEPPETTO;

});
