/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
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
 * @class GEPPETTO.Init
 */
define(function (require) {
    return function (GEPPETTO) {
        var $ = require('jquery');

        var createChannel = function () {
            // Change link from blank to self for embedded environments
            if (window.EMBEDDED && window.EMBEDDEDURL !== "/" && typeof handleRequest == 'undefined') {
                handleRequest = function (e) {
                    if (window.EMBEDDEDURL.indexOf(e.origin) != -1) {
                        if (e.data.command == 'loadSimulation') {
                            if (e.data.projectId) {
                                GEPPETTO.Console.executeCommand('Project.loadFromID(' + e.data.projectId + ')');
                            }
                            else if (e.data.url) {
                                GEPPETTO.Console.executeCommand('Project.loadFromURL("' + e.data.url + '")');
                            }
                        }
                        else if (e.data.command == 'removeWidgets') {
                            GEPPETTO.Console.executeCommand('G.removeWidget()');
                        }
                        else {
                        	eval(e.data.command); 
                        }
                    }
                };
                // we have to listen for 'message'
                window.addEventListener('message', handleRequest, false);
                if($.isArray(window.EMBEDDEDURL)){
                	window.parent.postMessage({"command": "ready"}, window.EMBEDDEDURL[0]);	
                }
                else{
                	window.parent.postMessage({"command": "ready"}, window.EMBEDDEDURL);
                }
            }
        };

        var setupScene = function () {
            GEPPETTO.getVARS().scene = new THREE.Scene();
            GEPPETTO.getVARS().visualModelMap = {};
            GEPPETTO.getVARS().meshes = {};
            GEPPETTO.getVARS().splitMeshes = {};
            GEPPETTO.getVARS().connectionLines = {};
        };

        /**
         * Sets up the camera that is used to view the objects in the 3D Scene.
         */
        var setupCamera = function () {
            // Camera
            var SCREEN_WIDTH = $(GEPPETTO.getVARS().container).width();
            var SCREEN_HEIGHT = $(GEPPETTO.getVARS().container).height();
            var VIEW_ANGLE = 60;
            var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
            var NEAR = 10;
            var FAR = 2000000;
            GEPPETTO.getVARS().camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
            GEPPETTO.getVARS().scene.add(GEPPETTO.getVARS().camera);
            GEPPETTO.getVARS().camera.position.set(GEPPETTO.getVARS().cameraPosition.x, GEPPETTO.getVARS().cameraPosition.y, GEPPETTO.getVARS().cameraPosition.z);
            GEPPETTO.getVARS().camera.up = new THREE.Vector3(0, 1, 0);
            GEPPETTO.getVARS().camera.direction = new THREE.Vector3(0, 0, 1);
            GEPPETTO.getVARS().camera.lookAt(GEPPETTO.getVARS().sceneCenter);
        };

        /**
         * Set up the WebGL Renderer
         */
        var setupRenderer = function () {
            // Reuse a single WebGL renderer.
            // NOTE: Recreating the renderer causes camera displacement on Chrome OSX.
            if (!GEPPETTO.getVARS().canvasCreated) {
                GEPPETTO.getVARS().renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha:true
                });

            }

            configureRenderer();
            GEPPETTO.getVARS().canvasCreated = true;
        };

        var configureRenderer = function (shaders) {

        	if(shaders==undefined){
        		shaders=false;
        	}
        
            var color = new THREE.Color(GEPPETTO.getVARS().backgroundColor);
            //GEPPETTO.getVARS().renderer.setClearColor(color, 1);
            var width = $(GEPPETTO.getVARS().container).width();
            var height = $(GEPPETTO.getVARS().container).height();
            GEPPETTO.getVARS().renderer.setPixelRatio(window.devicePixelRatio);
            GEPPETTO.getVARS().renderer.setSize(width, height);
            GEPPETTO.getVARS().renderer.autoClear = false;
            GEPPETTO.getVARS().container.appendChild(GEPPETTO.getVARS().renderer.domElement);

            var renderModel = new THREE.RenderPass(GEPPETTO.getVARS().scene, GEPPETTO.getVARS().camera);

            GEPPETTO.getVARS().composer = new THREE.EffectComposer(GEPPETTO.getVARS().renderer);

            if(shaders){
                var effectBloom = new THREE.BloomPass(0.75);
                var effectFilm = new THREE.FilmPass(0.5, 0.5, 1448, false);
                var effectFocus = new THREE.ShaderPass(THREE.FocusShader);

                effectFocus.uniforms["screenWidth"].value = window.innerWidth;
                effectFocus.uniforms["screenHeight"].value = window.innerHeight;

                effectFocus.renderToScreen = true;
                
            	GEPPETTO.getVARS().composer.addPass(renderModel);
                GEPPETTO.getVARS().composer.addPass( effectBloom );
                GEPPETTO.getVARS().composer.addPass( effectFilm );
                GEPPETTO.getVARS().composer.addPass( effectFocus );
            }
            else{
            	//standard
                var copyPass = new THREE.ShaderPass(THREE.CopyShader);
                copyPass.renderToScreen = true;
            	GEPPETTO.getVARS().composer.addPass(renderModel);
                GEPPETTO.getVARS().composer.addPass(copyPass);
            }
            
        };

        /**
         * Light up the scene
         */
        var setupLights = function () {
            // Lights
        	GEPPETTO.getVARS().camera.add(new THREE.PointLight(0xffffff,1.5));

        };

        /**
         * Sets up the controls used by the camera to make it able to zoom and
         * pan.
         */
        var setupControls = function () {
            // Controls
            GEPPETTO.getVARS().controls = new THREE.TrackballControls(GEPPETTO
                .getVARS().camera, GEPPETTO.getVARS().renderer.domElement);
            GEPPETTO.getVARS().controls.noZoom = false;
            GEPPETTO.getVARS().controls.noPan = false;
        };

        /**
         * Set up the listeners use to detect mouse movement and windoe resizing
         */
        var setupListeners = function () {
            if (!GEPPETTO.getVARS().listenersCreated) {
                // when the mouse moves, call the given function
                GEPPETTO.getVARS().renderer.domElement.addEventListener('mousedown', function (event) {
                    if (event.button == 0) //only for left click
                    {
                        if (GEPPETTO.getVARS().pickingEnabled) {
                            var intersects = GEPPETTO.getIntersectedObjects();

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
                                    }
                                    else {
                                        //weak assumption: if the object doesn't have an instancePath its parent will
                                    	instancePath = intersects[i].object.parent.instancePath;
                                        geometryIdentifier = intersects[i].object.parent.geometryIdentifier;
                                    }
                                    if(instancePath!=null||undefined){
                                    	var visible = eval(instancePath + '.visible');
                                    	if (intersects.length == 1 || i == intersects.length) {
                                    		//if there's only one element intersected we select it regardless of its opacity
                                    		if (visible) {
                                    			selected = instancePath;
                                                selectedIntersect = intersects[i];
                                    			break;
                                    		}
                                    	}
                                    	else {
                                    		//if there are more than one element intersected and opacity of the current one is less than 1
                                    		//we skip it to realize a "pick through"
                                    		var opacity = GEPPETTO.getVARS().meshes[instancePath].defaultOpacity;
                                    		if ((opacity == 1 && visible) || GEPPETTO.isKeyPressed("ctrl")) {
                                    			selected = instancePath;
                                                selectedIntersect = intersects[i];
                                    			break;
                                    		}
                                    		else if (visible && opacity < 1 && opacity > 0) {
                                    			//if only transparent objects intersected select first or the next down if
                                    			//one is already selected in order to enable "burrow through" sample.
                                    			if (selected == "" && !eval(instancePath + '.selected')) {
                                    				selected = instancePath;
                                                    selectedIntersect = intersects[i];
                                    			}
                                    			else {
                                    				if (eval(instancePath + '.selected') && i != intersects.length - 1) {
                                    					selected = "";
                                    				}
                                    			}
                                    		}
                                    	}
                                    }
                                }


                                if (selected != "") {
                                    if (GEPPETTO.getVARS().meshes.hasOwnProperty(selected) || GEPPETTO.getVARS().splitMeshes.hasOwnProperty(selected)) {
                                        if (!GEPPETTO.isKeyPressed("shift")) {
                                            GEPPETTO.G.unSelectAll();
                                        }
                                        
                                        var selectedIntersectCoordinates = [selectedIntersect.point.x, selectedIntersect.point.y, selectedIntersect.point.z]
                                        if(geometryIdentifier==undefined){
                                        	geometryIdentifier="";
                                        }
                                        GEPPETTO.Console.executeCommand(selected + '.select(' + false + ', ' + '"' + geometryIdentifier + '", [' + selectedIntersectCoordinates + '])');
                                    }
                                }
                            }
                            else if (GEPPETTO.isKeyPressed("ctrl")) {
                                GEPPETTO.G.unSelectAll();
                            }
                        }
                    }
                }, false);

                GEPPETTO.getVARS().renderer.domElement
                    .addEventListener(
                    'mousemove',
                    function (event) {
                        GEPPETTO.getVARS().mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                        GEPPETTO.getVARS().mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                    }, false);

                window
                    .addEventListener(
                    'resize',
                    function () {
                        var container = $(GEPPETTO.getVARS().container), width = container.width(), height = container.height();

                        GEPPETTO.getVARS().camera.aspect = (width) / (height);
                        GEPPETTO.getVARS().camera.updateProjectionMatrix();
                        GEPPETTO.getVARS().renderer.setSize(width, height);
                        GEPPETTO.getVARS().composer.setSize(width, height);
                    }, false);

                document.addEventListener("keydown",
                    GEPPETTO.Vanilla.checkKeyboard, false);
                GEPPETTO.getVARS().listenersCreated = true;
            }
        };

        // ============================================================================
        // Application logic.
        // ============================================================================
        GEPPETTO.Init = {

        	initialised : false,
        	
            /**
             *
             */
            initEventListeners: function () {
                // setup listeners for geppetto events that can be triggered
                if (!GEPPETTO.Events.listening) {
                    GEPPETTO.Events.listen();
                    GEPPETTO.Events.listening = true;
                }
            },

            /**
             *
             * @param containerp
             * @returns {*|Object}
             */
            initialize: function (containerp) {
                GEPPETTO.getVARS().container = containerp;
                createChannel();
                setupScene();
                setupCamera();
                setupRenderer();
                setupLights();
                setupControls();
                setupListeners();
                this.initialised = true;
                GEPPETTO.trigger(Events.Canvas_initialised);
                return GEPPETTO.getVARS();
            },

            /**
             * Reinitializes the camera with the Y axis flipped
             */
            flipCameraY: function () {
                GEPPETTO.getVARS().camera.up = new THREE.Vector3(0, -1, 0);
                setupControls();
                GEPPETTO.resetCamera();
            },

            flipCameraZ: function () {
                GEPPETTO.getVARS().camera.direction = new THREE.Vector3(0, 0, -1);
                setupControls();
                GEPPETTO.resetCamera();
            },
            
            movieMode: function(toggle){
            	configureRenderer(toggle);
            }
        };
    };
});
