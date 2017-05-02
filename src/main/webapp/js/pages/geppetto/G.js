

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
        var $ = require('jquery');
        var React = require('react');
        var ClipboardModal = require('../../components/interface/jsEditor/ClipboardModal');

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
            litUpInstances: [],

            //TODO Design something better to hold abritrary status
            timeWidget: {},
            timeWidgetVisible: false,
            recordedVariablesWidget: {},
            recordedVariablesPlot: false,
            enableColorPlottingActive: false,
            brightnessFunctionSet: false,
            consoleFocused: true,

            isConsoleFocused: function () {
                return this.consoleFocused;
            },

            autoFocusConsole: function (mode) {
                this.consoleFocused = mode;
            },

            isBrightnessFunctionSet: function() {
                return this.brightnessFunctionSet;
            },
            
            /**
             * Adds widgets to Geppetto
             *
             * @param type
             * @param isStateless
             * @returns {*}
             */
            addWidget: function (type, properties, callback) {
                var newWidget = GEPPETTO.ComponentFactory.addWidget(type, properties, callback);
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
                this.debugMode = mode;
                if(!GEPPETTO.Console.getConsole().showImplicitCommands){
                	GEPPETTO.Console.toggleImplicitCommands();
                }
                return mode?GEPPETTO.Resources.DEBUG_ON:GEPPETTO.Resources.DEBUG_OFF;
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
                return GEPPETTO.Utility.extractCommandsFromFile("geppetto/js/pages/geppetto/G.js", GEPPETTO.G, "G");
            },

            /**
             * Sets idle timeout, -1 for no timeout
             *
             * @param timeOut
             */
            setIdleTimeOut: function (timeOut) {
                GEPPETTO.Main.idleTime = timeOut;
            },

            /**
             * Enables Geppetto local storage features (persist views with no db)
             *
             * @param enabled
             */
            enableLocalStorage: function (enabled) {
                GEPPETTO.Main.localStorageEnabled = enabled;
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
            
            toggleTutorial : function() {
            	 var returnMessage;
            	 var modalVisible = $('#tutorial_dialog').is(':visible');
            	 
                 if (modalVisible) {
                	 GEPPETTO.trigger(GEPPETTO.Events.Hide_Tutorial);
                     returnMessage = GEPPETTO.Resources.HIDE_TUTORIAL;
                 }
                 else {
                	 GEPPETTO.trigger(GEPPETTO.Events.Show_Tutorial);
                     returnMessage = GEPPETTO.Resources.SHOW_TUTORIAL;
                 }
                 return returnMessage;
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
             * Callback to be called whenever a watched node changes
             *
             * @param {Instance} node - node to couple callback to
             * @param {Function} callback - Callback function to be called whenever _variable_ changes
             */
            addOnNodeUpdatedCallback: function (node, callback) {
                if (node != null || undefined) {
                    if (!this.listeners[node.getInstancePath()]) {
                        this.listeners[node.getInstancePath()] = [];
                    }
                    this.listeners[node.getInstancePath()].push(callback);
                }
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
             * and a color function. The color function should receive
             * the value of the watched node and output [r,g,b].
             *
             * @param {Instance} instance - The instance to be lit
             * @param {Instance} modulation - Variable which modulates the brightness
             * @param {Function} colorfn - Converts time-series value to [r,g,b]
             */
            addBrightnessFunction: function (instance, stateVariableInstances, colorfn) {
                // Check if instance is instance + visualObjects or instance (hhcell.hhpop[0].soma or hhcell.hhpop[0])
                var newInstance = "";
                var visualObjects = [];
                if (instance.getInstancePath() in GEPPETTO.getVARS().meshes) {
                    newInstance = instance;
                }
                else {
                    newInstance = instance.getParent();
                    visualObjects = [instance.getId()];
                }

                this.addBrightnessFunctionBulk(newInstance, visualObjects, [stateVariableInstances], colorfn);
            },

            /**
             * Modulates the brightness of an aspect visualization, given a watched node
             * and a color function. The color function should receive
             * the value of the watched node and output [r,g,b].
             *
             * @param {Instance} instance - The instance to be lit
             * @param {Instance} modulation - Variable which modulates the brightness
             * @param {Function} colorfn - Converts time-series value to [r,g,b]
             */
            addBrightnessFunctionBulkSimplified: function (instances, colorfn) {
                // Check if instance is instance + visualObjects or instance (hhcell.hhpop[0].soma or hhcell.hhpop[0])
                for (var i = 0; i < instances.length; ++i) {
                    this.litUpInstances.push(instances[i]);
                }
                var compositeToLit = {};
                var visualObjectsToLit = {};
                var variables = {};
                var currentCompositePath = undefined;

                for (var i = 0; i < instances.length; i++) {
                    var composite = undefined;
                    var multicompartment = false;

                    composite = instances[i].getParent();

                    while (composite.getMetaType() != GEPPETTO.Resources.ARRAY_ELEMENT_INSTANCE_NODE) {
                        if (composite.getParent() == null) {
                            throw "Unsupported model to use this function";
                        } else {
                            composite = composite.getParent();
                            multicompartment = true;
                        }
                    }

                    var currentCompositePath = composite.getInstancePath();
                    if (!compositeToLit.hasOwnProperty(currentCompositePath)) {
                        compositeToLit[currentCompositePath] = composite;
                        visualObjectsToLit[currentCompositePath] = [];
                        variables[currentCompositePath] = [];

                    }

                    if (multicompartment) {
                        for (var j = 0; j < composite.getChildren().length; ++j) {
                            visualObjectsToLit[currentCompositePath].push(composite.getChildren()[j].getId());
                        }
                    }
                    variables[currentCompositePath].push(instances[i]);

                }

                for (var i in Object.keys(compositeToLit)) {
                    var path = Object.keys(compositeToLit)[i];
                    this.addBrightnessFunctionBulk(compositeToLit[path], visualObjectsToLit[path], variables[path], colorfn);
                }

            },

            /**
             * Removes brightness functions 
             * 
             * @param {Instance} instance - The instance to be lit
             */
            removeBrightnessFunctionBulkSimplified: function (instances) {
                while (instances.length > 0) {
                    this.clearBrightnessFunctions(instances[0]);
                }

                // update flag
                if (this.litUpInstances.length == 0) {
                    this.brightnessFunctionSet = false;
                }
            },

            /**
             * Modulates the brightness of an aspect visualization, given a watched node
             * and a color function. The color function should receive
             * the value of the watched node and output [r,g,b].
             *
             * @param {Instance} instance - The instance to be lit
             * @param {Instance} modulation - Variable which modulates the brightness
             * @param {Function} colorfn - Converts time-series value to [r,g,b]
             */
            addBrightnessFunctionBulk: function (instance, visualObjects, stateVariableInstances, colorfn) {
                var modulations = [];
                if (visualObjects != null) {
                    if (visualObjects.length > 0) {
                        var elements = {};
                        for (var voIndex in visualObjects) {
                            elements[visualObjects[voIndex]] = "";
                            modulations.push(instance.getInstancePath() + "." + visualObjects[voIndex]);

                        }
                        GEPPETTO.SceneController.splitGroups(instance, elements);
                    }
                    else {
                        modulations.push(instance.getInstancePath());
                    }
                }

                var matchedMap = [];
                //statevariableinstances come out of order, needs to sort into map to avoid nulls
                for (var index in modulations) {
                    for (var i in stateVariableInstances) {
                        if (stateVariableInstances[i].getParent().getInstancePath() == modulations[index]) {
                            matchedMap[modulations[index]] = stateVariableInstances[i];
                        }
                    }
                }

                //add brightness listener for map of variables
                for (var index in matchedMap) {
                    this.addBrightnessListener(index, matchedMap[index], colorfn);
                }

                // update flag
                this.brightnessFunctionSet = true;
            },

            addBrightnessListener: function (instance, modulation, colorfn) {
                GEPPETTO.trigger(GEPPETTO.Events.Lit_entities_changed);
                this.addOnNodeUpdatedCallback(modulation, function (stateVariableInstance, step) {
                    if ((stateVariableInstance.getTimeSeries() != undefined) &&
                        (step < stateVariableInstance.getTimeSeries().length)) {
                        GEPPETTO.SceneController.lightUpEntity(instance, colorfn, stateVariableInstance.getTimeSeries()[step]);
                    }
                });
            },

            clearBrightnessFunctions: function (varnode) {
                var i = this.litUpInstances.indexOf(varnode);
                this.litUpInstances.splice(i, 1);
                GEPPETTO.trigger(GEPPETTO.Events.Lit_entities_changed);
                if (this.litUpInstances.length == 0) {
                    this.brightnessFunctionSet = false;
                }
                this.clearOnNodeUpdateCallback(varnode);
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
                $("body").css("background", color);
            }

        };
    };
});
