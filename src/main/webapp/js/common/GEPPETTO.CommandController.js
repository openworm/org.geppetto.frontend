/**
 * Controls execution and propagation of commands and command related logic
 *
 */
define(function (require) {
    return function (GEPPETTO) {
        GEPPETTO.CommandController = {
            // Set of commands being inherited from Backbone ojects, ignored them while displaying autocomplete commands
            nonCommands: ["constructor()", "constructor(options)", "initialize(options)", "on(t,e,i)", "once(t,e,r)", "off(t,e,r)", "trigger(t)", "stopListening(t,e,r)", "listenTo(e,r,s)",
                "listenToOnce(e,r,s)", "bind(t,e,i)", "unbind(t,e,r)", "$(t)", "initialize()", "remove()", "setElement(t,i)", "delegateEvents(t)",
                "undelegateEvents()", "_ensureElement()", "constructor(a,c)", "on(a,c,d)", "off(a,c,d)", "get(a)", "set(a,c,d)", "_set(a,c)",
                "_setAttr(c={})", "_bubbleEvent(a,c,d)", "_isEventAvailable(a,c)", "_setupParents(a,c)", "_createCollection(a,c)", "_processPendingEvents()",
                "_transformRelatedModel(a,c)", "_transformCollectionType(a,c,d)", "trigger(a)", "toJSON(a)", "clone(a)", "cleanup(a)", "render()", "getState(tree,state)",
                "destroy(a)", "_getAttr(a)", "on(t,e,i)", "once(t,e,r)", "off(t,e,r)", "trigger(t)", "stopListening(t,e,r)", "listenTo(e,r,s)", "listenToOnce(e,r,s)",
                "bind(t,e,i)", "unbind(t,e,r)", "initialize()", "toJSON(t)", "sync()", "get(t)", "escape(t)", "has(t)", "set(t,e,r)",
                "unset(t,e)", "clear(t)", "hasChanged(t)", "changedAttributes(t)", "previous(t)", "previousAttributes()", "fetch(t)", "save(t,e,r)", "destroy(t)",
                "url()", "parse(t,e)", "clone()", "isNew()", "isValid(t)", "_validate(t,e)", "keys()", "values()", "pairs()", "invert()", "pick()", "omit()",
                "selectChildren(entity,apply)", "showChildren(entity,mode)", "getZoomPaths(entity)", "getAspectsPaths(entity)", "toggleUnSelected(entities,mode)",
                "addOnNodeUpdatedCallback(varnode,callback)", "traverseSelection(entities)", "clearOnNodeUpdateCallback(varnode)", "updateDataSet()",
                "showAllVisualGroupElements(visualizationTree,elements,mode)", "_all(predicate,matches)"],
            commands: [],
            helpObjectsMap: {},
            tags: [],

            /**
             * Available commands stored in an array
             *
             * @returns {Array}
             */
            availableCommands: function () {
                if (this.commands.length == 0) {
                    var commandsFormatted = "\n";
                    var map = this.getHelpObjectsMap();
                    for (var g in map) {
                        commandsFormatted += '\n' + map[g];
                    }
                    var commandsSplitByLine = commandsFormatted.split("\n");
                    var commandsCount = 0;
                    for (var i = 0; i < commandsSplitByLine.length; i++) {
                        var line = commandsSplitByLine[i].trim();
                        if (line.substring(0, 2) == "--") {
                            var command = line.substring(3, line.length);
                            this.commands[commandsCount] = command;
                            commandsCount++;
                        }
                    }
                }
                return this.commands;
            },

            /**
             * Update output of the help command. Usually called after widget
             * is created.
             *
             * @param object - Object whose commands will be added
             * @param id - Id of object
             * @param comments - the comments to use to decorate the methods
             * @returns {}
             */
            updateHelpCommand: function (object, id, comments) {
                var commandsFormmatted = id + GEPPETTO.Resources.COMMANDS;

                var commandsCount = this.commands.length;

                //var proto = object.__proto__;
                var proto = object;
                //	find all functions of object Simulation
                for (var prop in proto) {
                    if (typeof proto[prop] === "function" && proto.hasOwnProperty(prop)) {
                        var f = proto[prop].toString();
                        //get the argument for this function
                        var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');

                        var functionName = id + "." + prop + "(" + parameter + ")";

                        var isCommand = true;
                        for (var c = 0; c < this.getNonCommands().length; c++) {
                            if (functionName.indexOf(this.getNonCommands()[c]) != -1) {
                                isCommand = false;
                            }
                        }

                        if (isCommand) {
                            this.commands[commandsCount] = functionName;
                            commandsCount++;
                            //match the function to comment
                            var matchedDescription = "";
                            if (comments != null) {
                                for (var i = 0; i < comments.length; i++) {
                                    var description = comments[i].toString();

                                    //items matched
                                    if (description.indexOf(prop) != -1) {

                                        /*series of formatting of the comments for the function, removes unnecessary
                                         * blank and special characters.
                                         */
                                        var splitComments = description.replace(/\*/g, "").split("\n");
                                        splitComments.splice(0, 1);
                                        splitComments.splice(splitComments.length - 1, 1);
                                        for (var s = 0; s < splitComments.length; s++) {
                                            var line = splitComments[s].trim();
                                            if (line != "") {
                                                //ignore the name line, already have it
                                                if (line.indexOf("@command") == -1) {
                                                    //build description for function
                                                    matchedDescription += "         " + line + "\n";
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            //format and keep track of all commands available
                            commandsFormmatted += ("      -- " + functionName + "\n" + matchedDescription + "\n");
                        }
                    }
                }

                //after commands and comments are extract, update global help option
                if (this.helpObjectsMap[id] == null) {
                    this.helpObjectsMap[id] = commandsFormmatted.substring(0, commandsFormmatted.length - 2);
                }

                if (proto.__proto__ != null) {
                    this.updateHelpCommand(proto.__proto__, id, comments);
                }
            },

            /**
             * Remove commands that correspond to target object
             *
             * @param targetObject - Object whose command should no longer exist
             */
            removeAutocompleteCommands: function (targetObject) {

                //loop through commands and match the commands for object
                for (var index = 0; index < this.commands.length; index++) {
                    if (this.commands[index].indexOf(targetObject + ".") !== -1) {
                        this.commands.splice(index, 1);
                        //go back one index spot after deletion
                        index--;
                    }
                }

                //loop through tags and match the tags for object
                for (var t in this.tags) {
                    if (t.indexOf(targetObject) != -1) {
                        delete this.tags[t];
                    }
                }
            },

            removeCommands: function (id) {
                this.removeAutocompleteCommands(id);
                delete this.helpObjectsMap[id];
                delete window[id];
            },

            /**
             * Gets the commands associated with the object
             *
             * @param id - Id of object for commands
             * @returns the commands associated with the object
             */
            getObjectCommands: function (id) {
                return this.getHelpObjectsMap()[id];
            },

            getHelpObjectsMap: function () {
                return this.helpObjectsMap;
            },

            /**
             * Gets commands to exclude from autocomplete
             */
            getNonCommands: function () {
                return this.nonCommands;
            },

            /**
             * Update commands for help option. Usually called after widget
             * is created.
             *
             * @param scriptLocation - Location of files from where to read the comments
             * @param object - Object whose commands will be added
             * @param id - Id of object
             * @returns {}
             */
            updateTags: function (instancePath, object, original) {
                var proto = object.__proto__;
                if (original) {
                    proto = object;
                }
                //find all functions of object Simulation
                for (var prop in proto) {
                    if (typeof proto[prop] === "function") {
                        var f = proto[prop].toString();
                        //get the argument for this function
                        var parameter = f.match(/\(.*?\)/)[0].replace(/[()]/gi, '').replace(/\s/gi, '').split(',');

                        var functionName = instancePath + "." + prop + "(" + parameter + ")";
                        this.createTags(functionName);
                    }
                }
            },

            createTags: function (path, objectMethods) {
                if (path != undefined) {
                    var split = path.split(".");
                    var isTag = true;
                    for (var c = 0; c < this.getNonCommands().length; c++) {
                        if (path.indexOf(this.getNonCommands()[c]) != -1) {
                            isTag = false;
                        }
                    }
                    if (isTag) {
                        var current = this.tags;
                        for (var i = 0; i < split.length; i++) {
                            if (this.tags.hasOwnProperty(split[i])) {
                                current = this.tags[split[i]];
                            }
                            else {
                                if (current.hasOwnProperty(split[i])) {
                                    current = current[split[i]];
                                } else {
                                    current[split[i]] = {};
                                    current = current[split[i]];
                                }

                            }
                        }
                        if (objectMethods) {
                            for (var i = 0; i < objectMethods.length; i++) {
                                current[objectMethods[i]] = {};
                            }
                        }
                    }
                }
            },

            /**
             * Gets maps of available tags used for autocompletion
             */
            availableTags: function () {
                if (jQuery.isEmptyObject(this.tags)) {
                    this.populateDefaultTags();
                }
                return this.tags;
            },

            /**
             * Populates tags map at startup for default stuff
             */
            populateDefaultTags: function () {
                this.updateTags("G", GEPPETTO.G, true);
            },

            /**
             * Clear commands
             */
            clear: function() {
                GEPPETTO.trigger(GEPPETTO.Events.Command_clear);
            },

            /**
             * Toggle implicit commands
             */
            toggleImplicit: function() {
                GEPPETTO.trigger(GEPPETTO.Events.Command_toggle_implicit);
            },

            /**
             * Raise log events - any console will have to listen
             *
             * @param message
             * @param debug
             * @param run
             */
            log: function(message, debug, run){
                // default debug param to false
                if(debug == undefined){
                    debug = false;
                }
                if(run == undefined){
                    run = false;
                }

                if(debug === true) {
                    GEPPETTO.trigger(GEPPETTO.Events.Command_log_debug, message);
                }
                else {
                    if(run){
                        GEPPETTO.trigger(GEPPETTO.Events.Command_log_run, message);
                    }
                    else{
                        GEPPETTO.trigger(GEPPETTO.Events.Command_log, message);
                    }
                }
            },

            /**
             * The king of eval wrappers
             *
             * @param command
             * @param implicit
             */
            execute: function (command, implicit) {
                // default debug param to false
                if(implicit == undefined){
                    implicit = false;
                }

                // eval the command (this could be anything)
                try {
                    eval(command);

                    // log and propagate implicit (implicit command shows up only in debug mode)
                    this.log(command, implicit, true);
                } catch (e) {
                    // in case of error on the eval
                    if (e instanceof SyntaxError) {
                        // log in debug mode
                        this.log('ERROR: ' + e.message, true, true);
                    } else {
                        // do not swallow the generic exception
                        throw(e);
                    }
                }
            },
        }
    };
});
