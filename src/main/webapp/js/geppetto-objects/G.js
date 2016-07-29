/*******************************************************************************
 * The MIT License (MIT)
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
 *
 * Global objects. Handles global operations; clearing js console history commands,
 * turning on/off debug statements, copying history commands, help info, etc.
 *
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {

        var debugMode = false;
        var $ = require('jquery'),
            React = require('react'),
            ClipboardModal = require('jsx!components/popups/ClipboardModal');

        /**
         * @exports geppetto-objects/G
         */
        GEPPETTO.G = {
            listeners: {},
            selectionOptions: {
                show_inputs: true,
                show_outputs: true,
                draw_connection_lines: true,
                unselected_transparent: true
            },
            highlightedConnections: [],

            addWidget: function (type) {
                var newWidget = GEPPETTO.WidgetFactory.addWidget(type);
                return newWidget;
            },

            /**
             * Gets list of available widgets
             *
             * @command G.availableWidgets()
             * @returns {List} - List of available widget types
             */
            availableWidgets: function () {
                return GEPPETTO.Widgets;
            },

            /**
             * Clears the console history
             *
             * @command G.clear()
             */
            clear: function () {
                GEPPETTO.Console.getConsole().clear();
                return GEPPETTO.Resources.CLEAR_HISTORY;
            },

            /**
             * Copies console history to OS clipboard
             *
             * @command G.copyHistoryToClipboard()
             */
            copyHistoryToClipboard: function () {

                var commandsString = "";
                var commands = GEPPETTO.Console.consoleHistory();

                if (!commands || !commands.length) {
                    return GEPPETTO.Resources.EMPTY_CONSOLE_HISTORY;
                }

                for (var i = 0; i < commands.length; i++) {
                    var n = commands[i];
                    if (n.command) {

                        var command = n.command.trim();
                        if (command.indexOf(";") == -1) {
                            command = command + ";";
                        }

                        commandsString += command;
                        if (i != commands.length - 1) {
                            commandsString += '\n';
                        }
                    }
                }

                if (commandsString) {
                    var message = GEPPETTO.Resources.COPY_TO_CLIPBOARD_WINDOWS;

                    //different command for copying in macs means different message
                    if (navigator.userAgent.match(/(Mac|iPhone|iPod|iPad)/i)) {
                        message = GEPPETTO.Resources.COPY_TO_CLIPBOARD_MAC;
                    }

                    React.renderComponent(ClipboardModal({
                        show: true,
                        keyboard: false,
                        title: message,
                    }), document.getElementById('modal-region'));

                    $('#javascriptEditor').on('shown.bs.modal', function () {
                        if ($("#javascriptEditor").hasClass("in")) {
                            GEPPETTO.JSEditor.loadEditor();
                            GEPPETTO.JSEditor.loadCode(commandsString);
                        }
                    });

                    return GEPPETTO.Resources.COPY_CONSOLE_HISTORY;
                }
                else {
                    return '';
                }

            },
            /**
             * Toggles debug statement on/off
             *
             * @command G.debug(toggle)
             * @param toggle - toggles debug statements
             *
             */
            debug: function (mode) {
                debugMode = mode;

                if (mode) {
                    GEPPETTO.toggleStats(true);
                    return GEPPETTO.Resources.DEBUG_ON;
                }
                else {
                    GEPPETTO.toggleStats(false);
                    return GEPPETTO.Resources.DEBUG_OFF;
                }
            },

            /**
             * Retrieve a cookie
             */
            getCookie: function (cname) {
                var name = cname + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1);
                    if (c.indexOf(name) == 0) return c.substring(name.length, c.length).replace(/"/g, '');
                }
                return "";
            },

            /**
             * Get all commands and descriptions available for object G.
             *
             * @command G.help()
             * @returns {String} All commands and descriptions for G.
             */
            help: function () {
                return GEPPETTO.Utility.extractCommandsFromFile("geppetto/js/geppetto-objects/G.js", GEPPETTO.G, "G");
            },

            setIdleTimeOut: function (timeOut) {
                GEPPETTO.Main.idleTime = timeOut;
            },

            /**
             * Removes widget from Geppetto
             *
             * @command G.removeWidget(widgetType)
             * @param {WIDGET_EVENT_TYPE} type - Type of widget to remove from GEPPETTO. If no type is passed remove all the widgets from Geppetto.
             */
            removeWidget: function (type) {
                if (type) {
                    return GEPPETTO.WidgetFactory.removeWidget(type);
                }
                else {
                    for (var widgetKey in GEPPETTO.Widgets) {
                        GEPPETTO.WidgetFactory.removeWidget(GEPPETTO.Widgets[widgetKey]);
                    }
                }
            },

            /**
             * Takes the URL corresponding to a script, executes
             * commands inside the script.
             *
             * @command G.runScript(scriptURL)
             * @param {URL} scriptURL - URL of script to execute
             */
            runScript: function (scriptURL) {

                GEPPETTO.MessageSocket.send("get_script", scriptURL);

                return GEPPETTO.Resources.RUNNING_SCRIPT;
            },
            
            /**
             * Show or hide console using command
             *
             * @command G.showConsole(mode)
             * @param {boolean} mode - "true" to show, "false" to hide.
             */
            showConsole: function (mode) {
                var returnMessage;

                if (mode) {
                    returnMessage = GEPPETTO.Resources.SHOW_CONSOLE;
                }
                else {
                    returnMessage = GEPPETTO.Resources.HIDE_CONSOLE;
                }

                GEPPETTO.Console.showConsole(mode);

                return returnMessage;
            },

            

            /**
             * Show or hide help window using command
             *
             * @command G.showHelpWindow(mode)
             * @param {boolean} mode - "true" to show, "false" to hide.
             */
            showHelpWindow: function (mode) {
                var returnMessage;

                if (mode) {
                    GEPPETTO.trigger('simulation:show_helpwindow');
                    returnMessage = GEPPETTO.Resources.SHOW_HELP_WINDOW;
                }
                else {
                    var modalVisible = $('#help-modal').hasClass('in');
                    //don't try to hide already hidden help window
                    if (!modalVisible) {
                        returnMessage = GEPPETTO.Resources.HELP_ALREADY_HIDDEN;
                    }
                    //hide help window
                    else {
                        GEPPETTO.trigger('simulation:hide_helpwindow');
                        returnMessage = GEPPETTO.Resources.HIDE_HELP_WINDOW;
                        $('#help-modal').modal('hide');
                    }
                }
                return returnMessage;
            },

            /**
             *
             * Waits certain amount of time before running next command. Must be
             * used inside a script.
             *
             * @command G.wait(ms)
             */
            wait: function () {
                return GEPPETTO.Resources.INVALID_WAIT_USE;
            },

            /**
             * Waits some amount of time before executing a set of commands
             *
             * @command G.wait(commands,ms)
             * @param {Array} commands - Array of commands to execute
             * @param {Integer} ms - Milliseconds to wait before executing commands
             */
            wait: function (commands, ms) {
                setTimeout(function () {
                    //execute commands after ms milliseconds
                    GEPPETTO.ScriptRunner.executeScriptCommands(commands);
                }, ms);

                return GEPPETTO.Resources.WAITING;
            },

            linkDropBox: function (key) {
                if (key != null || key != undefined) {
                    var parameters = {};
                    parameters["key"] = key;
                    GEPPETTO.MessageSocket.send("link_dropbox", parameters);

                    return "Sending request to link dropbox to Geppetto";
                }
                else {
                    var dropboxURL =
                        "https://www.dropbox.com/1/oauth2/authorize?locale=en_US&client_id=kbved8e6wnglk4h&response_type=code";
                    var win = window.open(dropboxURL, '_blank');
                    win.focus();
                }
            },

            unLinkDropBox: function () {

            },

            /**
             * State of debug statements, whether they are turned on or off.
             *
             * @returns {boolean} Returns true or false depending if debug statements are turned on or off.
             */
            isDebugOn: function () {
                return debugMode;
            },

            /**
             * Resets Camera to initial position - same as after loading.
             *
             * @command - G.resetCamera()
             */
            resetCamera: function () {
                GEPPETTO.resetCamera();

                return GEPPETTO.Resources.CAMERA_RESET;
            },

            /**
             * Increments camera pan.
             *
             * @command - G.incrementCameraPan()
             * @param {Integer} x - x coordinate of pan increment vector
             * @param {Integer} y - y coordinate of pan increment vector
             */
            incrementCameraPan: function (x, y) {
                GEPPETTO.incrementCameraPan(x, y);

                return GEPPETTO.Resources.CAMERA_PAN_INCREMENT;
            },

            /**
             * Increments camera rotation.
             *
             * @command - G.incrementCameraRotate()
             * @param {Integer} x - x coordinate of rotate increment vector
             * @param {Integer} y - y coordinate of rotate increment vector
             * @param {Integer} z - z coordinate of rotate increment vector
             */
            incrementCameraRotate: function (x, y, z) {
                GEPPETTO.incrementCameraRotate(x, y, z);

                return GEPPETTO.Resources.CAMERA_ROTATE_INCREMENT;
            },

            /**
             * Increments camera zoom.
             *
             * @command - G.incrementCameraZoom()
             * @param {Integer} z - z coordinate for zoom increment vector
             */
            incrementCameraZoom: function (z) {
                GEPPETTO.incrementCameraZoom(z);

                return GEPPETTO.Resources.CAMERA_ZOOM_INCREMENT;
            },

            /**
             * Sets the camera position
             *
             * @command - G.setCameraPosition()
             * @param {Integer} x - new x axis position for the camera
             * @param {Integer} y - new y axis position for the camera
             * @param {Integer} z - new z axis position for the camera
             */
            setCameraPosition: function (x, y, z) {
                GEPPETTO.setCameraPosition(x, y, z);

                return GEPPETTO.Resources.CAMERA_SET_POSITION;
            },

            /**
             * Sets the camera rotation
             *
             * @command - G.setCameraRotation()
             * @param {Integer} rx - x euler angle for the rotation
             * @param {Integer} ry - y euler angle for the rotation
             * @param {Integer} rz - z euler angle for the rotation
             * @param {Integer} a  - trackball's radius
             */
            setCameraRotation: function (rx, ry, rz, a) {
                GEPPETTO.setCameraRotation(rx, ry, rz, a);

                return GEPPETTO.Resources.CAMERA_SET_ROTATION;
            },


            /**
             * Callback to be called whenever a watched node changes
             *
             * @param {Instance} node - node to couple callback to
             * @param {Function} callback - Callback function to be called whenever _variable_ changes
             */
            addOnNodeUpdatedCallback: function (node, callback) {
                if (!this.listeners[node.getInstancePath()]) {
                    this.listeners[node.getInstancePath()] = [];
                }
                this.listeners[node.getInstancePath()].push(callback);
            },

            /**
             * Clears callbacks coupled to changes in a node
             *
             * @param {Instance} node - node to which callbacks are coupled
             */
            clearOnNodeUpdateCallback: function (node) {
                this.listeners[node.getInstancePath()] = null;
            },

            /**
             * Applies visual transformations to a given entity given instance path of the transformations.
             *
             * @param {AspectNode} visualAspect - Aspect for the entity the visual transformation is to be applied to
             * @param {SkeletonAnimationNode} visualTransformInstancePath - node that stores the visual transformations
             */
            addVisualTransformListener: function (visualAspect, visualTransformInstancePath) {
                this.addOnNodeUpdatedCallback(visualTransformInstancePath, function (varnode, step) {
                    GEPPETTO.SceneController.applyVisualTransformation(visualAspect, varnode.skeletonTransformations[step]);
                });
            },

            /**
             * Modulates the brightness of an aspect visualization, given a watched node
             * and a normalization function. The normalization function should receive
             * the value of the watched node and output a number between 0 and 1,
             * corresponding to min and max brightness. If no normalization function is
             * specified, then brightness = value
             *
             * @param {Instance} instance - The instance to be lit
             * @param {Instance} modulation - Variable which modulates the brightness
             * @param {Function} normalizationFunction
             */
            addBrightnessFunction: function (instance, stateVariableInstances, normalizationFunction) {
            	// Check if instance is instance + visualObjects or instance (hhcell.hhpop[0].soma or hhcell.hhpop[0])
            	var newInstance = "";
            	var visualObjects = [];
            	if (instance.getInstancePath() in GEPPETTO.getVARS().meshes){
            		newInstance = instance; 
            	}
            	else{
            		newInstance = instance.getParent();
            		visualObjects= [instance.getId()];
            	}
            	
            	this.addBrightnessFunctionBulk(newInstance, visualObjects, [stateVariableInstances], normalizationFunction);
            },
            
            /**
             * Modulates the brightness of an aspect visualization, given a watched node
             * and a normalization function. The normalization function should receive
             * the value of the watched node and output a number between 0 and 1,
             * corresponding to min and max brightness. If no normalization function is
             * specified, then brightness = value
             *
             * @param {Instance} instance - The instance to be lit
             * @param {Instance} modulation - Variable which modulates the brightness
             * @param {Function} normalizationFunction
             */
            addBrightnessFunctionBulkSimplified: function (instances, normalizationFunction) {
            	// Check if instance is instance + visualObjects or instance (hhcell.hhpop[0].soma or hhcell.hhpop[0])
            	var newInstance = "";
            	var visualObjects = [];
            	if (instances[0].getParent().getInstancePath() in GEPPETTO.getVARS().meshes){
            		newInstance = instances[0].getParent(); 
            	}
            	else{
            		newInstance = instances[0].getParent().getParent();
            		for (var voInstance in instances){
                		visualObjects.push(instances[voInstance].getParent().getId());
                	}
            	}
            	
            	this.addBrightnessFunctionBulk(newInstance, visualObjects, instances, normalizationFunction);
            },

            /**
             * Modulates the brightness of an aspect visualization, given a watched node
             * and a normalization function. The normalization function should receive
             * the value of the watched node and output a number between 0 and 1,
             * corresponding to min and max brightness. If no normalization function is
             * specified, then brightness = value
             *
             * @param {Instance} instance - The instance to be lit
             * @param {Instance} modulation - Variable which modulates the brightness
             * @param {Function} normalizationFunction
             */
            addBrightnessFunctionBulk: function (instance, visualObjects, stateVariableInstances, normalizationFunction) {
            	var modulations = [];
            	if (visualObjects != null){
            		if (visualObjects.length > 0 ){
		            	var elements = {};
		            	for (var voIndex in visualObjects){
		            		elements[visualObjects[voIndex]] = "";
		            		modulations.push(instance.getInstancePath() + "." + visualObjects[voIndex]);
		            		
		            	}
		            	GEPPETTO.SceneController.splitGroups(instance, elements);
            		}
            		else{
            			modulations.push(instance.getInstancePath());
            		}
            	}
            	
            	for (var index in modulations){
	                this.addBrightnessListener(modulations[index], stateVariableInstances[index], normalizationFunction);
            	}
            },
            
            addBrightnessListener: function(instance, modulation, normalizationFunction){
            	this.addOnNodeUpdatedCallback(modulation, function (stateVariableInstance, step) {
                    GEPPETTO.SceneController.lightUpEntity(instance,
                        normalizationFunction ? normalizationFunction(stateVariableInstance.getTimeSeries()[step]) : stateVariableInstance.getTimeSeries()[step]);
                });
            },
            
            clearBrightnessFunctions: function (varnode) {
                this.clearOnNodeUpdateCallback(varnode);
            },

            /**
             * Dynamically change the visual representation of an aspect,
             * modulated by the value of a watched node. The _transformation_
             * to be applied to the aspect visual representation should be a
             * function receiving the aspect and the watched node's value,
             * which can be normalized via the _normalization_ function. The
             * latter is a function which receives the watched node's value
             * an returns a float between 0 and 1.
             *
             * @param {AspectNode} visualAspect - Aspect which contains the VisualizationTree with the entity to be dynamically changed
             * @param {String} visualEntityName - Name of visual entity in the visualAspect VisualizationTree
             * @param {Variable} dynVar - Dynamical variable which will modulate the transformation
             * @param {Function} transformation - Transformation to act upon the visualEntity, given the modulation value
             * @param {Function} normalization - Function to be applied to the dynamical variable, normalizing it to a suitable range according to _transformation_
             */
            addDynamicVisualization: function (visualAspect, visualEntityName, dynVar, transformation, normalization) {
                //TODO: things should be VisualizationTree centric instead of aspect centric...
                this.addOnNodeUpdatedCallback(dynVar, function (watchedNode) {
                    transformation(visualAspect, visualEntityName, normalization ? normalization(watchedNode.getTimeSeries()[0]) : watchedNode.getTimeSeries()[0]);
                });
            },

            /**
             * Sets options that happened during selection of an entity. For instance,
             * user can set things that happened during selection as if connections inputs and outputs are shown,
             * if connection lines are drawn and if other entities that were not selected are still visible.
             *
             * @param {Object} options - New set of options for selection process
             */
            setOnSelectionOptions: function (options) {
                if (options.show_inputs != null) {
                    this.selectionOptions.show_inputs = options.show_inputs;
                }
                if (options.show_outputs != null) {
                    this.selectionOptions.show_outputs = options.show_outputs;
                }
                if (options.draw_connection_lines != null) {
                    this.selectionOptions.draw_connection_lines = options.draw_connection_lines;
                }
                if (options.unselected_transparent != null) {
                    this.selectionOptions.unselected_transparent = options.unselected_transparent;
                }
            },

            /**
             * Options set for the selection event, turning on/off connections and lines.
             *
             * @returns {Object} Options for selection.
             */
            getSelectionOptions: function () {
                return this.selectionOptions;
            },

            /**
             * Deselects all selected entities
             *
             * @command G.unSelectAll()
             */
            unSelectAll: function () {
                var selection = this.getSelection();
                if (selection.length > 0) {
                    for (var key in selection) {
                        var entity = selection[key];
                        entity.deselect();
                    }
                }

                if (G.getSelectionOptions().unselected_transparent) {
                    GEPPETTO.SceneController.setGhostEffect(false);
                }
                return GEPPETTO.Resources.DESELECT_ALL;
            },


            /**
             *
             * Outputs list of commands with descriptions associated with the Simulation object.
             *
             * @command G.getSelection()
             * @returns  {Array} Returns list of all entities selected
             */
            getSelection: function () {
                var selection = this.traverseSelection(window.Instances);

                return selection;
            },

            /**
             * Unhighlight all highlighted connections
             *
             * @command G.unHighlightAll()
             */
            unHighlightAll: function () {
                for (var hc in this.highlightedConnections) {
                    this.highlightedConnections[hc].highlight(false);
                }

                return GEPPETTO.Resources.HIGHLIGHT_ALL;
            },

            /**
             * Sets the timer for updates during play/replay.
             *
             * @command G.setPlayTimerStep(interval)
             */
            setPlayTimerStep: function (interval) {
                GEPPETTO.getVARS().playTimerStep = interval;
            },

            /**
             * Set play in loop true/false.
             *
             * @command G.setPlayLoop(loop)
             */
            setPlayLoop: function (loop) {
                GEPPETTO.getVARS().playLoop = loop;
            },

            /**
             * Set canvas color.
             *
             * @command G.setBackgroundColour(color)
             *
             * * @param {String} color - hex or rgb color. e.g. "#ff0000" / "rgb(255,0,0)"
             */
            setBackgroundColour: function (color) {
                // set the VAR so that when the canvas refresh on timeout it keeps the color
                GEPPETTO.getVARS().backgroundColor = color;
                var threecolor = new THREE.Color(color);
                GEPPETTO.getVARS().renderer.setClearColor(threecolor, 1);
            },

            /**
             * Helper method that traverses through run time tree looking for selected entities.
             */
            traverseSelection: function (instances) {
                var selection = [];
                if(instances!=null || undefined){
                	for (var e = 0; e < instances.length; e++) {
                		var instance = instances[e];
                		if (instance.selected) {
                			selection.push(instance);
                		}
                		selection = selection.concat(this.traverseSelection(instance.getChildren()));
                	}
                }

                return selection;
            },
        };
    };
});
