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

            $('#typeahead').keypress(function (e) {
                if (e.which == 13 || e.keyCode == 13) {
                    var instancePath = $('#typeahead').val();
                    var instance = Instances.getInstance(instancePath);

                    alert(instance.get("capabilities"));
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


        render: function () {
            return <input id = "typeahead" className = "typeahead fa fa-search" type = "text" placeholder = "Lightspeed Search" />
        }
    });

    React.renderComponent(Spotlight({}, ''), document.getElementById("spotlight"));
});