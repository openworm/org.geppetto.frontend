/**
 * javascript sandbox console 0.1.5 - joss crowcroft
 *
 * requires underscore, backbone, backbone-localStorage and jquery
 *
 * http://josscrowcroft.github.com/javascript-sandbox-console/
 */

define(function (require) {
    return function (GEPPETTO) {
        var delta = 500;
        var lastKeypressTime = 0;
        var doubleTab = false;
        var Backbone = require('backbone');
        var templates = require('./templates.js');
        var $ = require('jquery');
        var _ = require('underscore');

        require("backbone.localstorage");

        GEPPETTO.SandboxConsole = {

            /**
             * The Sandbox.Model
             *
             * Takes care of command evaluation, history and persistence via localStorage adapter
             */
            Model: Backbone.Model.extend({
                defaults: {
                    history: [],
                    iframe: false, // if true, run `eval` inside a sandboxed iframe
                    fallback: true // if true, use native `eval` if the iframe method fails
                },

                initialize: function () {
                    // Attempt to fetch the Model from localStorage
                    this.fetch();
                },

                // The Sandbox Model tries to use the localStorage adapter to save the command history
                localStorage: function () {
                    return new Store("SandboxConsole");
                },

                // Parser for restoring the Model's state
                // Backbone.localStorage adapter stores a collection, so grab the first 'model'
                parse: function (data) {

                    // `parse` also fires when doing a save, so just return the model for that
                    if (!_.isArray(data) || data.length < 1 || !data[0]) {
                        return data;
                    }

                    // Hide the saved command history, so that they don't show up in output,
                    // and delete the results and classes from each, because they won't be needed
                    data[0].history = _.map(data[0].history, function (command) {
                        command._hidden = true;
                        if (command.result) {
                            delete command.result;
                        }
                        if (command._class) {
                            delete command._class;
                        }
                        return command;
                    });

                    // Shouldn't save whether/not this is sandboxed (it's confusing)
                    delete data[0].iframe;
                    return data[0];
                },

                // Inspect an object and output the results
                // todo: Implement a custom stringify similar to jsconsole.com, to include native
                // and circular objects, and all object methods
                stringify: function (obj) {
                    try {
                        return JSON.stringify(obj);
                    }
                    catch (e) {
                        return obj.toString();
                    }
                }
            }),

            /**
             * The Sandbox.View
             *
             * Defers to the Sandbox.Model for history, evaluation and persistence
             * Takes care of all the rendering, controls, events and special commands
             */
            View: Backbone.View.extend({
                initialize: function (opts) {
                    _(this).bindAll(
                        'render',
                        'updateConsole',
                        'updateInputArea',
                        'focus',
                        'keydown',
                        'keyup',
                        'debugLog',
                        'showCommandsSuggestions',
                        'showMessage',
                        'executeCommand',
                        'loadScript',
                        'clear',
                        'getCaret',
                        'setCaret',
                        'setValue',
                        'specialCommands'
                    );


                    // Set up the iframe sandbox if needed
                    if (this.model.get('iframe')) {
                        this.iframeSetup();
                    }

                    this.model.set('history', []);

                    // Set up the history state (the up/down access to command history)
                    this.historyState = this.model.get('history').length;
                    this.currentHistory = "";

                    // Set up the View Options
                    this.resultPrefix = opts.resultPrefix || "  => ";
                    this.tabCharacter = opts.tabCharacter || "\t";
                    this.placeholder = opts.placeholder || "// type some javascript and hit enter (help() for info)";
                    this.helpText = opts.helpText || "type javascript commands into the console, hit enter to evaluate. \n[up/down] to scroll through history, ':clear' to reset it. \n[alt + return/up/down] for returns and multi-line editing.";
                    this.inputCommandAreaElSelector = opts.inputCommandAreaElSelector;
                    this.consoleComponent = opts.consoleComponent;

                    // Bind to the model's change event to update the View
                    this.model.on('update:console', this.updateConsole, this);

                    // Delegate key and mouse events to View input
                    this.$el.delegate("textarea", {
                        keydown: this.keydown,
                        keyup: this.keyup
                    });

                    // Delegate click event to View output
                    this.$el.delegate(".output", {
                        click: this.focus
                    });

                    // Render the textarea
                    this.render();

                    this.showImplicitCommands = false;
                },

                // The templating functions for the View and each history item
                template: _.template(templates.tplSandbox),
                format: _.template(templates.tplCommand),
                formatDebug: _.template(templates.tplDebug),

                // Renders the Sandbox View initially and stores references to the elements
                render: function () {
                    this.$el.html(this.template({
                        placeholder: this.placeholder
                    }));

                    this.textarea = this.$el.find("textarea");
                    this.output = this.$el.find(".output");

                    return this;
                },

                updateInputArea: function () {
                    if (typeof this.currentHistory != "undefined") {
                        // Set the textarea to the value of the currently selected history item
                        // Update the textarea's `rows` attribute, as history items may be multiple lines
                        this.textarea.val(this.currentHistory).attr('rows', this.currentHistory.split("\n").length);
                    }
                },

                // Updates the Sandbox View, redrawing the output and checking the input's value
                updateConsole: function (model) {
                    this.output.html(
                        // Reduce the Model's history into HTML, using the command format templating function
                        _.reduce(this.model.get('history'), function (memo, command) {

                            var result;

                            if (command.command == null) {
                                if (command.result != null) {
                                    result = this.formatDebug({
                                        _hidden: command._hidden,
                                        _class: command._class,
                                        result: this.toEscaped(command.result) + "\n"
                                    });
                                    return memo + result;

                                }
                            }

                            else {
                                result = this.format({
                                    _hidden: command._hidden,
                                    _class: command._class,
                                    command: command.command,
                                    result: this.toEscaped(command.result)
                                });

                                if (typeof memo == "undefined") {
                                    memo = "";
                                }

                                return memo + result;

                            }

                        }, "", this)
                    );

                    // Scroll the output to the bottom, so that new commands are visible
                    if(this.output.length>0){
                        this.output.scrollTop(this.output[0].scrollHeight - this.output.height());
                    }
                },

                debugLog: function (message) {
                    this.addMessageHistory("debugMessage", {
                        result: message,
                        _class: "string"
                    });
                },

                logRunCommand: function (message) {
                    this.addMessageHistory("runMessage", {
                        result: message,
                        _class: "run"
                    });
                },

                showCommandsSuggestions: function (message) {
                    this.addMessageHistory("commandsSuggestions", {
                        result: message
                    });
                },

                showMessage: function (message) {
                    this.addMessageHistory("logMessage", {
                        result: message,
                        _class: "string"
                    });
                },

                executeCommand: function (command, isImplicit) {

                    // If submitting a command, set the currentHistory to blank (empties the textarea on update)
                    this.currentHistory = "";

                    // Run the command past the special commands to check for 'help()' and ':clear' etc.
                    if (!this.specialCommands(command)) {
                        // If if wasn't a special command, pass off to the Sandbox Model to evaluate and save
                        this.evaluate(command, isImplicit);
                    }

                    // Update the View's history state to reflect the latest history item
                    if (!isImplicit || (isImplicit && this.showImplicitCommands) || G.isDebugOn()) {
                        this.historyState = this.model.get('history').length;
                    }
                },

                clear: function () {
                    this.model.set('history', []);
                    this.model.trigger('update:console');
                    //this.model.destroy();
                },

                // Manually set the value in the sandbox textarea and focus it ready to submit:
                setValue: function (command) {
                    this.currentHistory = command;
                    this.updateConsole();
                    this.setCaret(this.textarea.val().length);
                    this.textarea.focus();
                    return false;
                },

                // Returns the index of the cursor inside the textarea
                getCaret: function () {
                    if (this.textarea[0].selectionStart) {
                        return this.textarea[0].selectionStart;
                    }
                    else if (document.selection) {
                        // This is for IE (apparently ... not tested yet)
                        this.textarea[0].focus();
                        var r = document.selection.createRange();
                        if (r === null) {
                            return 0;
                        }

                        var re = this.textarea[0].createTextRange(),
                            rc = re.duplicate();
                        re.moveToBookmark(r.getBookmark());
                        rc.setEndPoint('EndToStart', re);

                        return rc.text.length;
                    }
                    // If nothing else, assume index 0
                    return 0;
                },

                // Sets the cursor position inside the textarea (not IE, afaik)
                setCaret: function (index) {
                    this.textarea[0].selectionStart = index;
                    this.textarea[0].selectionEnd = index;
                },

                // Escapes a string so that it can be safely html()'ed into the output:
                toEscaped: function (string) {
                    return String(string)
                        .replace(/\\"/g, '"')
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');
                },

                // Focuses the input textarea
                focus: function (e) {
                    //e.preventDefault();
                    //this.textarea.focus();
                    //return false;
                },

                // The keydown handler, that controls all the input
                keydown: function (e) {
                    // Enter submits the command
                    if (e.which === 13) {
                        e.preventDefault();
                        var val = this.textarea.val().trim();

                        // If submitting a command, set the currentHistory to blank (empties the textarea on update)
                        this.currentHistory = "";
                        this.updateInputArea();

                        // Run the command past the special commands to check for 'help()' and ':clear' etc.
                        if (!this.specialCommands(val)) {

                            // If if wasn't a special command, pass off to the Sandbox Model to evaluate and save
                            this.evaluate(val);
                        }

                        // Update the View's history state to reflect the latest history item
                        this.historyState = this.model.get('history').length;

                        return false;
                    }

                    if ((e.which === 20 || e.which === 16)) {
                        e.preventDefault();
                    }
                    // Up / down keys cycle through past history or move up/down
                    if (!this.ctrl && (e.which === 38 || e.which === 40)) {
                        e.preventDefault();

                        var history = this.model.get('history');

                        // `direction` is -1 or +1 to go forward/backward through command history
                        var direction = e.which - 39;
                        this.historyState += direction;

                        // Keep it within bounds
                        if (this.historyState < 0) {
                            this.historyState = 0;
                        }
                        else if (this.historyState >= history.length) {
                            this.historyState = history.length;
                        }

                        // Update the currentHistory value and update the View
                        this.currentHistory = history[this.historyState] ? history[this.historyState].command : "";
                        this.updateConsole();
                        this.updateInputArea();

                        return false;
                    }

                    // Tab adds a tab character (instead of jumping focus)
                    if (e.which === 9) {
                        e.preventDefault();

                        var thisKeypressTime = new Date();
                        var input = $(this.inputCommandAreaElSelector).val();

                        //retrieve array of available commands
                        var commands = this.consoleComponent.availableSuggestions();

                        //case where input entered by user is an object path or has object on left
                        //Example  "Simulation.s"
                        if (input.split(".").length > 1) {
                            //detects double tab
                            if (thisKeypressTime - lastKeypressTime <= delta) {
                                var suggestions = this.getSuggestions(commands, input);
                                this.showCommandsSuggestions(suggestions + "\n");
                                thisKeypressTime = 0;
                                doubleTab = true;
                            }
                            else {
                                this.singleTab(commands, thisKeypressTime);
                            }
                        }
                        //input entered doesn't match that of an object path yet
                        //Example "Si"
                        else {
                            //detects double tab, displays most of commands available
                            if (thisKeypressTime - lastKeypressTime <= delta) {
                                commands = this.consoleComponent.availableCommands();
                                var suggestionsFormatted = "";
                                //loop through commands that match input and display them formatted
                                var ownLineCommands = [];
                                for (var i = 0; i < commands.length; i++) {
                                    var tag = commands[i];
                                    if (tag.indexOf(input) != -1) {
                                        if (tag.length <= 80) {
                                            if ((i + 1) % 2 == 0) {
                                                suggestionsFormatted = suggestionsFormatted + tag + "\n";
                                            }
                                            else {
                                                var formatSpaceAmount = 90 - tag.length;
                                                var spacing = "";
                                                for (var x = 0; x < formatSpaceAmount; x++) {
                                                    spacing = spacing + " ";
                                                }
                                                suggestionsFormatted = suggestionsFormatted + tag + spacing;
                                            }
                                        }
                                        else {
                                            ownLineCommands[ownLineCommands.length] = tag;
                                        }
                                    }
                                }
                                for (var i = 0; i < ownLineCommands.length; i++) {
                                    var tag = ownLineCommands[i];
                                    suggestionsFormatted = suggestionsFormatted + tag + "\n";
                                }

                                this.showCommandsSuggestions(suggestionsFormatted + "\n");
                                thisKeypressTime = 0;
                                doubleTab = true;
                            }
                            else {
                                this.singleTab(commands, thisKeypressTime);
                            }
                        }

                        lastKeypressTime = thisKeypressTime;

                        return false;
                    }
                },

                // The keyup handler, used to switch off shift/alt keys
                keyup: function (e) {
                },

                // Checks for special commands. If any are found, performs their action and returns true
                specialCommands: function (command) {
                    if (command == "help()") {
                        this.consoleComponent.help();
                        return true;
                    }
                    else if (command == "toggleImplicitCommands()") {
                        this.consoleComponent.toggleImplicitCommands();
                        return true;
                    }
                    // If no special commands, return false so the command gets evaluated
                    return false;
                },

                singleTab: function (commands) {
                    var textAreaValue = this.textarea.val();

                    //narrow down the matches found from commands
                    var matches = $.map(commands, function (tag) {
                        if (tag.toUpperCase().indexOf(textAreaValue.toUpperCase()) === 0) {
                            return tag;
                        }
                    });

                    var mostCommon = null;

                    if (matches.length > 1) {
                        var A = matches.slice(0).sort(),
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

                    }

                    if (matches.length == 1) {
                        //match up most common part
                        mostCommon = matches[0];

                    }

                    if (mostCommon != null) {

                        var parameter = mostCommon.match(/\(.*?\)/);

                        //remove parameter from function/command string
                        if (parameter != null) {
                            var parameterQuotation = mostCommon.match(/\".*?\"/);
                            if (parameterQuotation != null) {
                                parameter = parameterQuotation[0].replace(/[""""]/gi, '').split(',');
                            }
                            else {
                                parameter = parameter[0].replace(/[()]/gi, '').split(',');
                            }
                        }
                        var holder = "";
                        var pat = new RegExp('(\\b' + parameter + '\\b)(?!.*\\b\\1\\b)', 'i');
                        mostCommon = mostCommon.replace(pat, holder);
                                                
                        this.textarea.val(mostCommon);//change the input to the first match

                        // Get the value, and the parts between which the tab character will be inserted
                        var value = this.textarea.val();

                        // Set the caret (cursor) position to appropriate place
                        if (value.slice(-1) == ")" && parameter != "") {
                            //cursor set in between quotation for parameter
                            if (value.indexOf('""') != -1) {
                                this.setCaret(value.length - 2);
                            }
                            //cursor set in between parentheses
                            else {
                                this.setCaret(value.length - 1);
                            }
                        } else {
                            this.setCaret(value.length);
                        }

                    }
                },

                /**
                 * Matches suggestions in commands from input
                 */
                getSuggestions: function (commands, input) {
                    var suggestions = "";
                    var inputSplit = input.split(".");
                    var simplifyInput = "";
                    //remove entered input from match commands, no need to display input as
                    //part of suggestions
                    if (inputSplit.length > 1) {
                        if (inputSplit[inputSplit.length - 1] == "") {
                            inputSplit.pop(inputSplit.length - 1);
                        }
                        simplifyInput = input.replace("." + inputSplit[inputSplit.length - 1], "");
                    }

                    var addedTags = {};
                    for (var i = 0; i < commands.length; i++) {
                        var tag = commands[i];
                        if (tag.indexOf(input) != -1 && tag != input) {
                            //remove text area input from tag
                            //Example if input is "sample.fluid" and matched commands is
                            //"sample.fluid.bioPhys" then tag will be ".bioPhys"
                            tag = tag.replace(simplifyInput, "");
                            //remove any remaining dots at beginning of tag
                            if (tag.substring(0, 1) == ".") {
                                tag = tag.substring(1);
                            }

                            //split matched tags, and show only first object in path
                            //if tag is "bioPhys.naChans.k.q" only first part of object is shown
                            //as part of autosuggest
                            var tags = tag.split(".");
                            if (tags.length > 1) {
                                tag = tags[0];
                                if (!(tag in addedTags)) {
                                    //if input area has dot, add one to suggestion
                                    if (input.substring(input.length - 1) != ".") {
                                        tag = "." + tags[1];
                                    }
                                    else {
                                        //if tag is part of input, add next part of object
                                        if (inputSplit[inputSplit.length - 1] == tag) {
                                            tag = tags[1];
                                        }
                                    }
                                }
                            }

                            //formats the matched commands for suggestions, we keep track if suggestions is
                            //already added as well to avoid duplicates
                            if (!(tag in addedTags)) {
                                if ((i + 1) % 3 == 0) {
                                    suggestions = suggestions + tag + "\n";
                                }
                                else {
                                    var formatSpaceAmount = 60 - tag.length;
                                    var spacing = "";
                                    for (var x = 0; x < formatSpaceAmount; x++) {
                                        spacing = spacing + " ";
                                    }
                                    suggestions = suggestions + tag + spacing;
                                }
                                addedTags[tag] = {};
                            }
                        }
                    }

                    return suggestions;
                },

                // Adds a new item to the history
                addHistory: function (item) {
                    var history = this.model.get('history');

                    // Tidy up the item's result
                    if (_.isString(item.result)) {
                        item.result = '\"' + item.result.toString().replace(/"/g, '\\"') + '\"';
                    }
                    if (_.isFunction(item.result)) {
                        item.result = item.result.toString().replace(/"/g, '\\"');
                    }
                    if (_.isObject(item.result)) {
                        if (item.result.id) {
                            item.result = "[" + item.result.id + "]";
                        }
                        else {

                            item.result = "[Object]";//this.model.stringify(item.result).replace(/"/g, '\\"');
                        }
                    }
                    if (_.isUndefined(item.result)) {
                        item.result = "undefined";
                    }

                    // Add the command and result to the history
                    history.push(item);

                    // Update the history state and save the model
                    this.model.set('history', history);
                    this.model.trigger('update:console');
                    this.model.save();
                },

                addMessageHistory: function (message, item) {
                    var history = this.model.get('history');

                    if (message == "commandsSuggestions") {
                        item._class = "commandsSuggestions";
                    }
                    history.push(item);

                    // Update the history state and save the model
                    this.model.set('history', history);
                    this.model.trigger('update:console');
                    this.model.save();
                },

                // Evaluate a command and save it to history
                evaluate: function (command, isImplicit = false) {
                    if (!command) {
                        return false;
                    }

                    //check if command are multiple commands instead of single one
                    var multipleCommands = command.split("\n");
                    if (multipleCommands.length > 1) {
                        //run script if multiple commands
                        GEPPETTO.ScriptRunner.runScript(command);
                        //exit function
                        return false;
                    }

                    var str = command.replace(/&lt;/g, "<");
                    command = str.replace(/&gt;/g, ">");

                    var item = {
                        command: command
                    };

                    // Evaluate the command and store the eval result, adding some basic classes for syntax-highlighting
                    try {
                        item.result = this.model.get('iframe') ? this.iframeEval(command) : eval.call(window, command);
                        if (_.isUndefined(item.result)) {
                            item._class = "undefined";
                        }
                        if (_.isNumber(item.result)) {
                            item._class = "number";
                        }
                        if (_.isString(item.result)) {
                            item._class = "string";
                        }
                    }
                    catch (error) {
                        item.result = error.toString();
                        item._class = "error";
                    }

                    if (!isImplicit || (isImplicit && this.showImplicitCommands) || G.isDebugOn()) {
                        //Replace < and > commands with html equivalent in order to
                        //display in console area
                        str = command.replace(/\</g, "&lt;");
                        var formattedCommand = str.replace(/\>/g, "&gt;");

                        item.command = formattedCommand;

                        // Add the item to the history
                        this.addHistory(item);
                    }
                },


                // Creates the sandbox iframe, if needed, and stores it
                iframeSetup: function () {
                    this.sandboxFrame = $('<iframe width="0" height="0"/>').css({visibility: 'hidden'}).appendTo('body')[0];
                    this.sandbox = this.sandboxFrame.contentWindow;

                    // This should help IE run eval inside the iframe.
                    if (!this.sandbox.eval && this.sandbox.execScript) {
                        this.sandbox.execScript("null");
                    }
                },

                // Runs `eval` safely inside the sandboxed iframe
                iframeEval: function (command) {
                    // Set up the iframe if not set up already (in case iframe has been enabled):
                    if (!this.sandbox) {
                        this.iframeSetup();
                    }

                    // Evaluate inside the sandboxed iframe, if possible.
                    // If fallback is allowed, use basic eval, or else throw an error.
                    return this.sandbox.eval ? this.sandbox.eval(command) : this.model.get('fallback') ? eval(command) : new Error("Can't evaluate inside the iframe - please report this bug along with your browser information!");
                },

                // One way of loading scripts into the document or the sandboxed iframe:
                loadScript: function (src) {
                    var script = document.createElement('script');
                    script.type = "text/javascript";
                    script.src = src;

                    if (this.model.get('iframe')) {
                        return this.sandboxFrame ? this.sandboxFrame.contentDocument.body.appendChild(script) : new Error("sandbox: iframe has not been created yet, cannot load " + src);
                    }
                    else {
                        return document.body.appendChild(script);
                    }
                }
            })
        };

    };
});
