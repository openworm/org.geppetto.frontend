define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/spotlight/spotlight.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react'),
        $ = require('jquery'),
        typeahead = require('typeahead'),
        bh = require('bloodhound'),
        handlebars = require('handlebars');

    var ReactDOM = require('react-dom');
    var GEPPETTO = require('geppetto');

    var Spotlight = React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        potentialSuggestions: {},
        suggestions: null,
        instances: null,
        initialised:false,
        
        close : function () {
            $("#spotlight").hide();
            GEPPETTO.trigger(GEPPETTO.Events.Spotlight_closed);
        },
        
        addData : function(instances) {
            this.instances.add(instances);
            this.initialised=true;
        },

        componentDidMount: function () {

            var space = 32;
            var escape = 27;

            var that = this;

            $("#spotlight").click(function(e){
            	if (e.target==e.delegateTarget){
            		//we want this only to happen if we clicked on the div directly and not on anything therein contained
            		that.close();
            	}
            });
            
            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == space) {
                    that.open(GEPPETTO.Resources.SEARCH_FLOW, true);
                }
            });

            $(document).keydown(function (e) {
                if ($("#spotlight").is(':visible') && e.keyCode == escape) {
                	that.close();
                }
            });

            $('#typeahead').keydown(this, function (e) {
                if (e.which == 9 || e.keyCode == 9) {
                    e.preventDefault();
                }
            });

            $('#typeahead').keypress(this, function (e) {
                if (e.which == 13 || e.keyCode == 13) {
                    that.confirmed($('#typeahead').val());
                }
            });

            $('#typeahead').bind('typeahead:selected', function (obj, datum, name) {
                if (datum.hasOwnProperty("path")) {
                    //it's an instance
                    that.confirmed(datum.path);
                }
                else if (datum.hasOwnProperty("label")) {
                    //it's a suggestion
                    that.confirmed(datum.label);
                }
            });
           

            GEPPETTO.on(Events.Experiment_loaded, function () {
            	if(that.initialised){
            		that.initialised=false;
            		that.instances.initialize(true);
            	}
            });

            //Initializing Bloodhound sources, we have one for instances and one for the suggestions
            this.instances = new Bloodhound({
                datumTokenizer: function (str) {
                    return str.path ? str.path.split(".") : [];
                },
                queryTokenizer: function (str) {
                    return str ? str.split(/[\.\s]/) : [];
                },
                identify: function (obj) {
                    return obj.path;
                }
            });

            this.suggestions = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('label'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                identify: function (obj) {
                    return obj.label;
                }
            });

            Handlebars.registerHelper('geticonFromMetaType', function (metaType) {
                if (metaType) {
                    return new Handlebars.SafeString("<icon class='fa " + GEPPETTO.Resources.Icon[metaType] + "' style='margin-right:5px; color:" + GEPPETTO.Resources.Colour[metaType] + ";'/>");
                }
                else {
                    return;
                }

            });

            Handlebars.registerHelper('geticon', function (icon) {
                if (icon) {
                    return new Handlebars.SafeString("<icon class='fa " + icon + "' style='margin-right:5px;'/>");
                } else {
                    return;
                }

            });


            this.initTypeahead();

            GEPPETTO.Spotlight = this;

            //TODO: To be removed, just a sample of how to add a suggestion
            //this.addSuggestion(this.recordSample, GEPPETTO.Resources.RUN_FLOW);
            //this.addSuggestion(this.lightUpSample, GEPPETTO.Resources.PLAY_FLOW);
            this.addSuggestion(this.plotSample, GEPPETTO.Resources.PLAY_FLOW);

            if(GEPPETTO.ForegroundControls != undefined){
                GEPPETTO.ForegroundControls.refresh();
            }
        },

        recordSample: {
            "label": "Record all membrane potentials",
            "actions": [
                "var instances=Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'));",
                "GEPPETTO.ExperimentsController.watchVariables(instances,true);"
            ],
            "icon": "fa-dot-circle-o"
        },

        plotSample: {
            "label": "Plot all recorded variables",
            "actions": [
                "var p=G.addWidget(0).setName('Recorded Variables');",
                "$.each(Project.getActiveExperiment().getWatchedVariables(true,false),function(index,value){p.plotData(value)});"
            ],
            "icon": "fa-area-chart"
        },

        lightUpSample: {
            "label": "Link morphology colour to recorded membrane potentials",
            "actions": [
                "G.addBrightnessFunctionBulkSimplified(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), function(x){return (x+0.07)/0.1;});"
            ],
            "icon": "fa-lightbulb-o"
        },



        confirmed: function (item) {
            //check suggestions

            if (item && item != "") {
                var suggestionFound = false

                if (this.suggestions.get(item)) {
                    var found = this.suggestions.get(item);
                    if (found.length == 1) {
                        suggestionFound = true;
                        var actions = found[0].actions;
                        actions.forEach(function (action) {
                            GEPPETTO.Console.executeCommandinst(action)
                        });
                        $("#typeahead").typeahead('val', "");
                    }
                }

                //check the instances
                if (!suggestionFound) {
                    window._spotlightInstance = Instances.getInstance([item]);
                    if (window._spotlightInstance) {
                        this.loadToolbarFor(window._spotlightInstance);

                        if ($(".spotlight-toolbar").length == 0) {
                            this.loadToolbarFor(window._spotlightInstance);
                        }

                        $(".tt-menu").hide();
                        $(".spotlight-button").eq(0).focus();
                        $(".spotlight-input").eq(0).focus();
                    }
                }

            }
        },

        defaultSuggestions: function (q, sync) {
            if (q === '') {
                sync(this.suggestions.index.all());
            }
            else {
                this.suggestions.search(q, sync);
            }
        },

        defaultInstances: function (q, sync) {
            if (q === '') {
                var rootInstances = [];
                for (var i = 0; i < window.Instances.length; i++) {
                    rootInstances.push(window.Instances[i].getId());
                }
                sync(this.instances.get(rootInstances));
            }
            else {
                this.instances.search(q, sync);
            }
        },


        initTypeahead: function () {
            $('#typeahead').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 0
                },
                {
                    name: 'suggestions',
                    source: this.defaultSuggestions,
                    limit: 5,
                    display: 'label',
                    templates: {
                        suggestion: Handlebars.compile('<div class="spotlight-suggestion">{{geticon icon}} {{label}}</div>')
                    }
                },
                {
                    name: 'instances',
                    source: this.defaultInstances,
                    limit: 50,
                    display: 'path',
                    templates: {
                        suggestion: Handlebars.compile('<div>{{geticonFromMetaType metaType}} {{path}}</div>')
                    }
                });
            $('.twitter-typeahead').addClass("typeaheadWrapper");
        },


        open: function (flowFilter, useSelection) {
            if (useSelection == undefined) {
                useSelection = false;
            }
            this.suggestions.initialize(true);
            if(!this.initialised){
            	this.addData(GEPPETTO.ModelFactory.allPathsIndexing);
            }
            var that = this;
            if (flowFilter) {
                if ($.isArray(flowFilter)) {
                    $.each(flowFilter, function (index, value) {
                        if (that.potentialSuggestions[value]) {
                            that.suggestions.add(that.potentialSuggestions[value]);
                        }
                    });
                }
                else {
                    if (flowFilter && that.potentialSuggestions[flowFilter]) {
                        that.suggestions.add(that.potentialSuggestions[flowFilter]);
                    }
                }

            }
            else {
                $.each(this.potentialSuggestions, function (key, value) {
                    that.suggestions.add(value);
                });
            }
            $("#spotlight").show();
            $("#typeahead").focus();
            if (useSelection) {
                var selection = GEPPETTO.G.getSelection();
                if (selection.length > 0) {
                    var instance = selection[selection.length - 1];
                    $(".typeahead").typeahead('val', instance.getInstancePath());
                    $("#typeahead").trigger(jQuery.Event("keypress", {which: 13}));
                }
                else {
                    $("#typeahead").typeahead('val', "!"); //this is required to make sure the query changes otherwise typeahead won't update
                    $("#typeahead").typeahead('val', "");
                }
            }
            else {
                $("#typeahead").typeahead('val', "!"); //this is required to make sure the query changes otherwise typeahead won't update
                $("#typeahead").typeahead('val', "");
            }

        },


        addSuggestion: function (suggestion, flow) {
            if (flow == undefined) {
                flow = GEPPETTO.Resources.SEARCH_FLOW;
            }
            if (!this.potentialSuggestions[flow]) {
                this.potentialSuggestions[flow] = [];
            }
            this.potentialSuggestions[flow].push(suggestion);
            if (flow == GEPPETTO.Resources.SEARCH_FLOW) {
                //the only suggestions always displayed are those for the search flow
                this.suggestions.add(suggestion);
            }
        },


        BootstrapMenuMaker: {
            named: function (constructor, name, def, instance) {
                return constructor.bind(this)(def, name, instance).attr('id', name);
            },


            buttonCallback: function (button, name, bInstance) {
                var instance = bInstance;
                var that = this;
                return function () {
                    button.actions.forEach(function (action) {
                        GEPPETTO.Console.executeCommand(that.getCommand(action, instance))
                    });
                    $("#" + name).focus();
                }
            },

            statefulButtonCallback: function (button, name, bInstance) {
                var that = this;
                var instance = bInstance;
                return function () {
                    var condition = that.execute(button.condition, instance);
                    var actions = button[condition].actions;
                    actions.forEach(function (action) {
                        GEPPETTO.Console.executeCommand(that.getCommand(action, instance));
                    });
                    that.switchStatefulButtonState(button, name, condition);
                }
            },

            switchStatefulButtonState: function (button, name, condition) {
                $("#" + name)
                    .attr('title', button[condition].tooltip)
                    .removeClass(button[condition].icon)
                    .addClass(button[!condition].icon);
                $("#" + name + " .spotlight-button-label").html(button[!condition].label);
            },

            getCommand: function (action, instance, value) {
                var label="";
                var processed="";
                if($.isArray(instance)){
                    if (instance.length == 1) {
                        label = instance[0].getInstancePath();
                    }
                    else {
                        label = "Multiple instances of " + instance[0].getVariable().getId();
                    }
                    processed = action.split("$instances$").join("_spotlightInstance");
                    processed = processed.split("$instance0$").join("_spotlightInstance[0]");
                    processed = processed.split("$label$").join(label);
                    processed = processed.split("$value$").join(value);
                    processed = processed.split("$type$").join(instance[0].getType().getPath());
                    processed = processed.split("$typeid$").join(instance[0].getType().getId());
                    processed = processed.split("$variableid$").join(instance[0].getVariable().getId());
                }
                else{
                    processed = action.split("$instances$").join(instance.getInstancePath());
                    processed = processed.split("$label$").join(instance.getInstancePath());
                    processed = processed.split("$value$").join(value);
                    processed = processed.split("$type$").join(instance.getType().getPath());
                    processed = processed.split("$typeid$").join(instance.getType().getId());
                    processed = processed.split("$variableid$").join(instance.getVariable().getId());
                }

                return processed;
            },

            execute: function (action, instance) {
                return eval(this.getCommand(action, instance));
            },

            createUIElement: function (element, name, instance) {
                var label = null;
                var uiElement = null;
                var that=this;
                if (element.hasOwnProperty("condition")) {
                    //a stateful button
                    var condition = this.execute(element.condition, instance);
                    var b = element[condition];
                    label = $("<div class='spotlight-button-label'>").html(b.label);
                    uiElement = $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(b.icon)
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', b.tooltip)
                        .attr('container', 'body')
                        .on('click', this.statefulButtonCallback(element, name, instance));
                    uiElement.append(label);
                }
                else if (element.hasOwnProperty("inputValue")) {
                    //an input box
                    if(!(instance.length>1)){
                        var uiElement=$("<div>");
                        var value=eval(this.getCommand(element.inputValue, instance[0]));
                        var unit=eval(this.getCommand(element.label, instance[0]));
                        label = $("<div class='spotlight-input-label'>").html(unit);
                        var staticLabel=$("<div class='spotlight-input-label-info'>").html("This parameter is declared as <span class='code'>STATIC</span> in the underlying model, changing it will affect all of its instances.");
                        var input = $('<input>')
                            .addClass('spotlight-input')
                            .attr('value', value)
                            .on('change', function() {
                                var value=$("#" + name + " .spotlight-input").val();
                                GEPPETTO.Console.executeCommand(that.getCommand(element.onChange, instance[0],value));
                            })
                            .css("width",((value.length + 1) * 14) + 'px')
                            .on('keyup',function() {
                                this.style.width = ((this.value.length + 1) * 14) + 'px';
                            });
                        if(instance[0].getVariable().isStatic()){
                            uiElement.append(staticLabel);
                        }
                        uiElement.append(input);
                        uiElement.append(label);

                    }
                }
                else {
                    label = $("<div class='spotlight-button-label'>").html(element.label);
                    uiElement = $('<button>')
                        .addClass('btn btn-default btn-lg fa spotlight-button')
                        .addClass(element.icon)
                        .attr('data-toogle', 'tooltip')
                        .attr('data-placement', 'bottom')
                        .attr('title', element.tooltip)
                        .attr('container', 'body')
                        .on('click', this.buttonCallback(element, name, instance));
                    uiElement.append(label);
                }


                return uiElement;
            },

            createButtonGroup: function (bgName, bgDef, bgInstance) {
                var that = this;
                var instance = bgInstance;

                var bg = $('<div>')
                    .addClass('btn-group')
                    .attr('role', 'group')
                    .attr('id', bgName);
                $.each(bgDef, function (bName, bData) {
                    var button = that.named(that.createUIElement, bName, bData, instance);
                    bg.append(button)
                    $(button).keypress(that, function (e) {
                        if (e.which == 13 || e.keyCode == 13)  // enter
                        {
                            if (button.hasOwnProperty("condition")) {
                                e.data.statefulButtonCallback(button, instance);
                            }
                            else {
                                e.data.buttonCallback(button, instance);
                            }

                        }
                    });
                    $(button).keydown(that, function (e) {
                        if (e.which == 27 || e.keyCode == 27)  // escape
                        {
                            $(".spotlight-toolbar").remove();
                            $('#typeahead').focus();
                            e.stopPropagation();
                        }
                    });
                    $(button).keydown(function (e) {
                        if (e.which == 9 || e.keyCode == 9)  // tab
                        {
                            e.preventDefault();
                            var next = $(this).next();
                            if (next.length == 0) {
                                //check if there is a sibling of the parent, i.e. another buttonGroup
                                var nextParent = $(this).parent().next();
                                if (nextParent.length > 0) {
                                    next = $(nextParent).eq(0).children(" .spotlight-button").eq(0);
                                }
                                else {
                                    next = $(".spotlight-button").eq(0);
                                }
                            }
                            $(next).focus();
                        }
                    });
                    $(button).mouseover(function (e) {
                        $(button).focus();
                    });
                    $(button).mouseout(function (e) {
                        $(".typeahead-wrapper").focus();
                    })
                });
                return bg;
            },

            generateToolbar: function (buttonGroups, instance) {
                var that = this;
                var tbar = $('<div>').addClass('spotlight-toolbar');
                var instanceToCheck = instance;
                if ($.isArray(instance)) {
                    //asterisk was used, this is an array
                    instanceToCheck = instance[0];
                }
                $.each(buttonGroups, function (groupName, groupDef) {
                    if ((instanceToCheck.getCapabilities().indexOf(groupName) != -1) ||
                        (instanceToCheck.getType().getMetaType() == groupName)) {
                        tbar.append(that.createButtonGroup(groupName, groupDef, instance));
                    }
                });

                return tbar;
            }
        },

        loadToolbarFor: function (instance) {
            $(".spotlight-toolbar").remove();
            $('#spotlight').append(this.BootstrapMenuMaker.generateToolbar(this.configuration.SpotlightBar, instance));

        },

        render: function () {
            return <input id = "typeahead" className = "typeahead" type = "text" placeholder = "Lightspeed Search" />
        },

        configuration: {
            "SpotlightBar": {
                "CompositeType": {
                    "type": {
                        "actions": [
                            "G.addWidget(3).setData($type$).setName('$typeid$')",
                        ],
                        "icon": "fa-puzzle-piece",
                        "label": "Explore type",
                        "tooltip": "Explore type"
                    }
                },
                "TextType": {
                    "type": {
                        "actions": [
                            "G.addWidget(1).setText($instance0$).setName('$variableid$')",
                        ],
                        "icon": "fa-eye",
                        "label": "View text",
                        "tooltip": "View text"
                    }
                },
                "HTMLType": {
                    "type": {
                        "actions": [
                            "G.addWidget(1).setHTML($instance0$).setName('$variableid$').addCustomNodeHandler(function(node){G.addWidget(3).setData(node);}, 'click');",
                        ],
                        "icon": "fa-eye",
                        "label": "View HTML",
                        "tooltip": "View HTML"
                    }
                },
                "VisualCapability": {
                    "buttonOne": {
                        "condition": "GEPPETTO.SceneController.isSelected($instances$)",
                        "false": {
                            "actions": ["GEPPETTO.SceneController.select($instances$)"],
                            "icon": "fa-hand-stop-o",
                            "label": "Unselected",
                            "tooltip": "Select"
                        },
                        "true": {
                            "actions": ["GEPPETTO.SceneController.deselect($instances$)"],
                            "icon": "fa-hand-rock-o",
                            "label": "Selected",
                            "tooltip": "Deselect"
                        },
                    },
                    "buttonTwo": {
                        "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                        "false": {
                            "actions": [
                                "GEPPETTO.SceneController.show($instances$)"
                            ],
                            "icon": "fa-eye-slash",
                            "label": "Hidden",
                            "tooltip": "Show"
                        },
                        "true": {
                            "actions": [
                                "GEPPETTO.SceneController.hide($instances$)"
                            ],
                            "icon": "fa-eye",
                            "label": "Visible",
                            "tooltip": "Hide"
                        }

                    },
                    "buttonThree": {
                        "actions": [
                            "GEPPETTO.SceneController.zoomTo($instances$)"
                        ],
                        "icon": "fa-search-plus",
                        "label": "Zoom",
                        "tooltip": "Zoom"
                    },
                },
                "ParameterCapability": {
                    "parameterInput": {
                        "inputValue":"$instances$.getValue()",
                        "label":"$instances$.getUnit()",
                        "onChange":"$instances$.setValue($value$);",
                        "tooltip": "Set parameter value",
                        "multipleInstances":false
                    }
                },
                "StateVariableCapability": {
                    "watch": {
                        "condition": "GEPPETTO.ExperimentsController.isWatched($instances$);",
                        "false": {
                            "actions": ["GEPPETTO.ExperimentsController.watchVariables($instances$,true);"],
                            "icon": "fa-circle-o",
                            "label": "Not recorded",
                            "tooltip": "Record the state variable"
                        },
                        "true": {
                            "actions": ["GEPPETTO.ExperimentsController.watchVariables($instances$,false);"],
                            "icon": "fa-dot-circle-o",
                            "label": "Recorded",
                            "tooltip": "Stop recording the state variable"
                        }
                    },
                    "plot": {
                        "actions": [
                            "G.addWidget(0).plotData($instances$).setName('$label$')",
                        ],
                        "icon": "fa-area-chart",
                        "label": "Plot",
                        "tooltip": "Plot state variable"
                    }
                }

            }

        },
    });

    ReactDOM.render(React.createFactory(Spotlight)({},''), document.getElementById("spotlight"));
});