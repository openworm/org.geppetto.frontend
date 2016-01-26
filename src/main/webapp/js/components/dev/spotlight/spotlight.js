define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/spotlight/spotlight.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react'),
        $ = require('jquery'),
        typeahead = require('typeahead'),
        bh = require('bloodhound');

    var GEPPETTO = require('geppetto');

    var Spotlight = React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        componentDidMount: function () {

            var ctrlDown = false;
            var ctrlKey = 17, space = 32;
            var escape = 27;

            //there's a bug if I use keypress and .ctrlKey, which/keyCode returns always 0 when spacebar is pressed, works for other ctrl combinations
            $(document).keydown(function (e) {
                if (e.keyCode == ctrlKey) ctrlDown = true;
            }).keyup(function (e) {
                if (e.keyCode == ctrlKey) ctrlDown = false;
            });

            $(document).keydown(function (e) {
                if (ctrlDown && e.keyCode == space) {
                    $("#spotlight").show();
                    $("#typeahead").focus();
                }
            });

            $(document).keydown(function (e) {
                if ($("#spotlight").is(':visible') && e.keyCode == escape) {
                    $("#spotlight").hide();
                }
            });

            $('#typeahead').keydown(this, function (e) {
                    if (e.which == 9 || e.keyCode == 9) {
                        e.preventDefault();
                }
            });

            $('#typeahead').keypress(this, function (e) {
                if (e.which == 13 || e.keyCode == 13) {

                    if (!this.instance || this.instance.getInstancePath() != $('#typeahead').val()) {
                        var instancePath = $('#typeahead').val();
                        this.instance = Instances.getInstance(instancePath);
                    }

                    if(this.instance) {
                        if ($(".spotlight-toolbar").length == 0) {
                            e.data.loadToolbarFor(this.instance);
                        }

                        $(".tt-menu").hide();
                        $(".spotlight-button").eq(0).focus();
                    }

                }
            });



            GEPPETTO.on(Events.Experiment_loaded, (function () {

                states.add(GEPPETTO.ModelFactory.allPaths);

            }));


            // constructs the suggestion engine
            var states = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                // `states` is an array of state names defined in "The Basics"
            });

            $('#typeahead').typeahead({
                    hint: true,
                    highlight: true,
                    minLength: 1
                },
                {
                    name: 'states',
                    source: states
                });
            $('.twitter-typeahead').addClass("typeaheadWrapper");

        },

        BootstrapMenuMaker: {
            named: function (constructor, name, def, instance) {
                return constructor.bind(this)(def, instance).attr('id', name);
            },


            createButtonCallback: function (button, bInstance) {
                var instance=bInstance;
                return function () {
                    button.actions.forEach(function (action) {
                        GEPPETTO.Console.executeCommand(instance.getInstancePath()+action)
                    });
                }
            },

            createButton: function (button, instance) {
                return $('<button>')
                    .addClass('btn btn-default btn-lg fa spotlight-button')
                    .addClass(button.icon)
                    .attr('data-toogle', 'tooltip')
                    .attr('data-placement', 'bottom')
                    .attr('title', button.tooltip)
                    .attr('container', 'body')
                    .on('click', this.createButtonCallback(button, instance));
            },

            createButtonGroup: function (bgName, bgDef, bgInstance) {
                var that = this;
                var instance = bgInstance;s
                var bg = $('<div>')
                    .addClass('btn-group')
                    .attr('role', 'group')
                    .attr('id', bgName);
                $.each(bgDef, function (bName, bData) {
                    var button=that.named(that.createButton, bName, bData, instance);
                    bg.append(button)
                    $(button).keypress(that, function (e) {
                        if(e.which == 13 || e.keyCode == 13)  // enter
                        {
                            e.data.createButtonCallback(button, instance);
                        }
                    });
                    $(button).keydown(that, function (e) {
                        if(e.which == 27 || e.keyCode == 27)  // escape
                        {
                            $(".spotlight-toolbar").remove();
                            $('#typeahead').focus();
                            e.stopPropagation();
                        }
                    });
                    $(button).keydown(function (e) {
                        if(e.which == 9 || e.keyCode == 9)  // tab
                        {
                            e.preventDefault();
                            var next=$(this).next();
                            if(next.length==0)
                            {
                                next=$(".spotlight-button").eq(0);
                            }
                            $(next).focus();
                        }
                    });
                    $(button).mouseover(function (e) {
                        $(".spotlight-button").focusout();
                    })
                });
                return bg;
            },

            generateToolbar: function (buttonGroups, instance) {
                var that = this;
                var tbar = $('<div>').addClass('spotlight-toolbar');
                $.each(buttonGroups, function (groupName, groupDef) {
                    if(instance.get("capabilities").indexOf(groupName)!=-1) {
                        tbar.append(that.createButtonGroup(groupName, groupDef, instance));
                    }
                });
                return tbar;
            }
        },

        loadToolbarFor: function(instance){
            $(".spotlight-toolbar").remove();
            $('#spotlight').append(this.BootstrapMenuMaker.generateToolbar(this.configuration.SpotlightBar,instance));

        },

        render: function () {
            return <input id = "typeahead" className = "typeahead fa fa-search" type = "text" placeholder = "Lightspeed Search" />
        },


        configuration: {
            "SpotlightBar": {
                "VisualCapability": {
                    "buttonOne": {
                        "actions": [
                            ".zoomTo()"
                        ],
                        "icon": "fa-search-plus",
                        "label": "Zoom",
                        "tooltip": "Zoom"
                    },
                        "buttonTwo": {
                        "actions": [".select()"],
                        "icon": "fa-mouse-pointer",
                        "label": "Select",
                        "tooltip": "Select"
                    }
                },
                "ParameterCapability": {
                        "buttonOne": {
                            "actions": [
                                ".setValue($value)"
                            ],
                            "icon": "fa-i-cursor",
                            "label": "Set Value",
                            "tooltip": "Set Value"
                        }
                    }
                }
        },
    });

    React.renderComponent(Spotlight({}, ''), document.getElementById("spotlight"));
});