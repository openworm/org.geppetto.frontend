define(function (require) {
    var React = require('react');
    var AbstractComponent = require('../../AComponent');
    var $ = require('jquery');
    require('jquery-ui-bundle');

    require('./SandboxConsole')(GEPPETTO);
    require('./console.less');
    require('./jsConsole.less');

    return class Console extends AbstractComponent {
        constructor(props) {
            super(props);

            //keeps track of API commands
            this.commands = [];
            // suggestions for auto-complete
            this.suggestions = [];
            this.helpObjectsMap = {};
            this.nonCommands = [];
            this.tags = [];
            this.visible = false;

            var settings = {
                id: this.props.id + "_component"
            };

            this.state = {
                settings: $.extend(settings, this.props.settings)
            };
        }

        /**
         * Gets maps of available tags used for autocompletion
         */
        availableTags () {
            if (jQuery.isEmptyObject(this.tags)) {
                this.populateTags();
            }
            return this.tags;
        }

        /**
         * Populates tags map at startup
         */
        populateTags () {
            this.updateTags("G", GEPPETTO.G, true);
        }

        /**
         * Matches user input in console to terms in tags map, this to retrieve suggestions
         * for autocompletion.
         *
         * @param {String} request - User input
         * @param {Object} response - Object to give back response with suggestions to autocomplete
         */
        matches(request, response) {
            var path = request.term.split(".");
            var depth = path.length;
            var node = this.availableTags();
            var avail = [];

            var nodePath = "";
            // descent into the path tree to get a list of suggestions
            for (var n = 1; n <= depth && typeof node !== "undefined"; n++) {
                var cur = path[n - 1];
                if (node[cur] != null || node[cur] != undefined) {
                    node = node[cur];
                    nodePath = nodePath.concat(cur) + ".";
                }
            }

            if (nodePath == "") {
                nodePath = nodePath.substring(0, nodePath.length - 1);
            }

            if (avail.length == 0 && nodePath == (request.term + ".")) {
                avail.push(nodePath.substring(0, nodePath.length - 1));
            }


            // build a regex with the last directory entry being typed
            var last = path.pop();
            try {
                var re = new RegExp("^" + last + ".*", "i");

                // filter suggestions by matching with the regex
                for (var k in node) {
                    if (k.match(re)) avail.push(nodePath + k);
                }

                //save suggestions for request term
                this.suggestions = avail;
            }
            catch (e) {

            }

            // delegate back to autocomplete, but extract the last term
            response($.ui.autocomplete.filter(avail, last));
        }

        // Handles autocomplete functionality for the console
        autoComplete() {
            var that = this;
            var autocompleteOn = true;
            this.populateTags();

            var commandInputAreaEl = $("#" + this.props.id + "_component #commandInputArea");
            //bind console input area to autocomplete event
            commandInputAreaEl.bind("keydown", function (event) {
                if (event.keyCode === $.ui.keyCode.TAB &&
                    $(this).data("ui-autocomplete").menu.active) {
                    event.preventDefault();
                }
                if (event.keyCode === $.ui.keyCode.BACKSPACE) {
                    autocompleteOn = false;
                }
            })
                .autocomplete({
                    minLength: 0,
                    delay: 0,
                    source: that.matches.bind(that),
                    focus: function () {
                        // prevent value inserted on focus
                        return false;
                    },
                    open: function (event, ui) {
                        if (autocompleteOn) {
                            var suggestions = $(this).data("uiAutocomplete").menu.element[0].children
                                , firstElement = suggestions[0]
                                , inpt = commandInputAreaEl
                                , original = inpt.val()
                                , firstElementText = $(firstElement).text()
                                , suggestionsSize = suggestions.length;
                            /*
                             here we want to make sure that we're not matching something that doesn't start
                             with what was typed in
                             */
                            if (firstElementText.toLowerCase().indexOf(original.toLowerCase()) === 0) {

                                //only one suggestion
                                if (suggestionsSize == 1) {
                                    if (inpt.val() !== firstElementText) {
                                        inpt.val(firstElementText); //change the input to the first match

                                        inpt[0].selectionStart = original.length; //highlight from beginning of input
                                        inpt[0].selectionEnd = firstElementText.length;//highlight to the end
                                    }
                                }
                                //match multiple suggestions
                                else {
                                    if (inpt.val() !== "") {

                                        var elementsText = [];
                                        for (var i = 0; i < suggestionsSize; i++) {
                                            elementsText[i] = $(suggestions[i]).text();
                                        }
                                        var A = elementsText.slice(0).sort(),
                                            word1 = A[0], word2 = A[A.length - 1],
                                            i = 0;
                                        if (word1 != word2) {
                                            while (word1.charAt(i) == word2.charAt(i))++i;
                                            //match up most common part
                                            mostCommon = word1.substring(0, i);
                                        }
                                        else {
                                            mostCommon = word1;
                                        }

                                        if (inpt.val().indexOf(mostCommon) == -1) {
                                            inpt.val(mostCommon);//change the input to the first match

                                            inpt[0].selectionStart = original.length; //highlight from end of input
                                            inpt[0].selectionEnd = mostCommon.length;//highlight to the end
                                        }
                                    }
                                }
                            }
                        } else {
                            autocompleteOn = true;
                        }
                    }
                });
        }

        /**
         * Global help functions with all commands in global objects.
         *
         * @returns {String} - Message with help notes.
         */
        help () {
            var map = this.getHelpObjectsMap();

            var helpMsg = "";

            for (var g in map) {
                helpMsg += '\n\n' + map[g];
            }

            return helpMsg;
        }

        toggleImplicitCommands () {
            var cur = this.getConsole().showImplicitCommands;
            this.getConsole().showImplicitCommands = !cur;
            return "showImplicitCommands = " + !cur;
        }

        /**
         * Creates Javascript Console
         */
        createConsole () {
            var consoleElement = $("#" + this.props.id + "_component #" +  this.props.id + "_console");
            var inputCmdElSelector = "#" + this.props.id + "_component #commandInputArea";
            // Create the sandbox console:
            var that = this;
            this.console = new GEPPETTO.SandboxConsole.View({
                el: consoleElement,
                model: new GEPPETTO.SandboxConsole.Model(),
                resultPrefix: "  => ",
                tabCharacter: "\t",
                placeholder: "// type a javascript command and hit enter (help() for info)",
                inputCommandAreaElSelector: inputCmdElSelector,
                consoleComponent: that
            });

            this.autoComplete();

            //remove drop down menu that comes automatically with autocomplete
            $("#" + this.props.id + "_component #commandInputArea").focus(function () {
                $('.ui-menu').remove();
            });

            var sendMessage = setInterval(function () {
                if (GEPPETTO.MessageSocket.isReady() == 1) {
                    GEPPETTO.MessageSocket.send("geppetto_version", null);
                    clearInterval(sendMessage);
                }
            }, 100);

            return console;
        }

        consoleHistory () {
            return this.getConsole().model.get('history');
        }

        getConsole () {
            return this.console;
        }

        isConsoleVisible () {
            return this.visible;
        }

        /**
         * Log debug messages to Geppetto's console if debug mode is on
         */
        debugLog (message) {
            if (GEPPETTO.G.isDebugOn()) {
                this.getConsole().debugLog(message);
            }
        }

        /**
         * Logs messages to console without need for debug mode to be on
         */
        log (message) {
            this.getConsole().showMessage(message);
        }

        /**
         * Executes commands to console. Implicit commands only
         * shown in debug mode, or if showImplicitCommands true.
         */
        executeCommand (command, isImplicit = false) {
            this.getConsole().executeCommand(command, isImplicit);
            var justCommand = command.substring(0, command.indexOf("("));
            var commandParams = command.substring(command.indexOf("(") + 1, command.lastIndexOf(")"));
            GEPPETTO.trackActivity(this.getId(), justCommand, commandParams);
        }

        executeImplicitCommand (command) {
            this.executeCommand(command, true);
        }

        /**
         * Available commands stored in an array, used for autocomplete.
         *
         * @returns {Array}
         */
        availableCommands () {
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
        }

        /**;
         * Gets available suggestions already narrowed down from list of tags
         */
        availableSuggestions () {
            return this.suggestions;
        }

        /**
         * Gets commands to exclude from autocomplete
         */
        getNonCommands () {
            return this.nonCommands;
        }

        /**
         * Gets the commands associated with the object
         *
         * @param id - Id of object for commands
         * @returns the commands associated with the object
         */
        getObjectCommands (id) {
            return this.getHelpObjectsMap()[id];
        }

        getHelpObjectsMap () {
            return this.helpObjectsMap;
        }

        /**
         * Update commands for help option. Usually called after widget
         * is created.
         *
         * @param scriptLocation - Location of files from where to read the comments
         * @param object - Object whose commands will be added
         * @param id - Id of object
         * @returns {}
         */
        updateTags (instancePath, object, original) {
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
        }

        createTags (path, objectMethods) {
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
        }

        /**
         * Update output of the help command. Usually called after widget
         * is created.
         *
         * @param object - Object whose commands will be added
         * @param id - Id of object
         * @param comments - the comments to use to decorate the methods
         * @returns {}
         */
        updateHelpCommand (object, id, comments) {
            var commandsFormmatted = id + GEPPETTO.Resources.COMMANDS;

            var commandsCount = commands.length;

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
                        commands[commandsCount] = functionName;
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
            if (this.getHelpObjectsMap()[id] == null) {
                this.getHelpObjectsMap()[id] = commandsFormmatted.substring(0, commandsFormmatted.length - 2);
            }

            if (proto.__proto__ != null) {
                this.updateHelpCommand(proto.__proto__, id, comments);
            }
        }

        removeCommands (id) {
            this.removeAutocompleteCommands(id);
            delete this.getHelpObjectsMap()[id];
            // TODO: are we sure about this?
            delete window[id];
        }

        /**
         * Remove commands that correspond to target object
         *
         * @param targetObject - Object whose command should no longer exist
         */
        removeAutocompleteCommands (targetObject) {

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
        }

        componentDidUpdate() {
            // NOTE: nothing here for now as we are not using react render flow
        }

        componentDidMount() {
            // Set of commands being inherited from Backbone ojects, ignored them while displaying autocomplete commands
            this.nonCommands = ["constructor()", "constructor(options)", "initialize(options)", "on(t,e,i)", "once(t,e,r)", "off(t,e,r)", "trigger(t)", "stopListening(t,e,r)", "listenTo(e,r,s)",
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
                "showAllVisualGroupElements(visualizationTree,elements,mode)", "_all(predicate,matches)"];

            this.createConsole();
        }

        render() {
            return (
                <div key={this.props.id + "_component"} id={this.props.id + "_component"} className="consoleContainer">
                    <div id={this.props.id + "_console"} className="consoleElement"></div>
                </div>
            )
        }
    };
});
