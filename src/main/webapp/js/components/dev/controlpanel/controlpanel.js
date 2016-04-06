define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/controlpanel/controlpanel.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react'), $ = require('jquery');
    var ReactDOM = require('react-dom');
    var Griddle = require('griddle');
    var GEPPETTO = require('geppetto');

    var fakeControlPanelData = [
        {
            "id": "TestA",
            "name": "TestA",
            "type": ['TypeA', 'TypeB']
        },
        {
            "id": "TestB",
            "name": "TestB",
            "type": ['TypeA', 'TypeB']
        },
        {
            "id": "TestC",
            "name": "TestC",
            "type": ['TypeA', 'TypeB']
        },
        {
            "id": "TestD",
            "name": "TestD",
            "type": ['TypeA', 'TypeB']
        }
    ];

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',

        getInitialState: function() {
            return {columns: ['id', 'name'], data: fakeControlPanelData, controls: []};
        },

        getDefaultProps: function() {
            return {
                tableClassName: 'control-panel-table'
            };
        },

        setColumns: function(cols) {
            this.setState({columns: cols});
        },

        setRecords: function(records) {
            this.setState({data: records});
        },

        setControls: function(controlsConfig) {
            this.setState({controls: controlsConfig});
        },

        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        componentDidMount: function () {

            var escape = 27;
            var pKey = 80;

            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == pKey) {
                    $("#controlpanel").show();
                }
            });

            $(document).keydown(function (e) {
                if ($("#controlpanel").is(':visible') && e.keyCode == escape) {
                    $("#controlpanel").hide();
                }
            });

            GEPPETTO.ControlPanel = this;
        },

        render: function () {
            return React.createFactory(Griddle)({columns: this.state.columns, results: this.state.data, showFilter: true, showSettings: false});
        }
    });

    ReactDOM.render(
        React.createElement(ControlPanel, {}),
        document.getElementById("controlpanel")
    );
});