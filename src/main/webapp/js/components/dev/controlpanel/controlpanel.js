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

    var ImageComponent = React.createClass({
        render: function(){
            return (
                <div><img src={this.props.data} className="thumbnail-img"/></div>
            )
        }
    });

    var TypeComponent = React.createClass({
        render: function(){
            return (
                <ul>
                    {this.props.data.map(function(item, i){
                        var displayText = item.split('.')[item.split('.').length - 1];
                        var action = function(e){
                            e.preventDefault();
                            alert(item);
                        };
                        return <li key={i}><a href='#' onClick={action}>{displayText}</a></li>;
                    })}
                </ul>
            )
        }
    });

    var fakeControlPanelData = [
        {
            "id": "TestA",
            "name": "TestA",
            "type": ['Model.common.TypeA', 'Model.common.TypeB'],
            "image": 'http://i.imgur.com/N5G3Ref.png'
        },
        {
            "id": "TestB",
            "name": "TestB",
            "type": ['Model.common.TypeX', 'Model.common.TypeY'],
            "image": 'http://i.imgur.com/N5G3Ref.png'
        },
        {
            "id": "TestC",
            "name": "TestC",
            "type": ['Model.common.TypeW', 'Model.common.TypeV'],
            "image": 'http://i.imgur.com/N5G3Ref.png'

        },
        {
            "id": "TestD",
            "name": "TestD",
            "type": ['Model.common.TypeY', 'Model.common.TypeZ'],
            "image": 'http://i.imgur.com/N5G3Ref.png'
        }
    ];

    var controlPanelColumnMeta = [
        {
            "columnName": "id",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "Id"
        },
        {
            "columnName": "name",
            "order": 2,
            "locked": false,
            "visible": true,
            "displayName": "Name"
        },
        {
            "columnName": "type",
            "order": 3,
            "locked": false,
            "visible": true,
            "customComponent": TypeComponent,
            "displayName": "Type(s)"
        },
        {
            "columnName": "image",
            "order": 4,
            "locked": false,
            "visible": true,
            "customComponent": ImageComponent,
            "displayName": "Image"
        },
        /*{
            "columnName": "controls",
            "order": 5,
            "locked": false,
            "visible": true,
            "customComponent": ControlsComponent
        },*/
    ];

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',

        getInitialState: function() {
            return {columns: ['id', 'name', 'type', 'image'], data: fakeControlPanelData, controls: []};
        },

        getDefaultProps: function() {
            return {
                "tableClassName": 'control-panel-table',
                "columnMetadata": controlPanelColumnMeta
            };
        },

        setColumns: function(cols) {
            this.setState({columns: cols});
        },

        setRecords: function(records) {
            // TODO: go from list of instances / variables to simple JSON
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
            return React.createFactory(Griddle)({columns: this.state.columns, results: this.state.data,
                                                 showFilter: true, showSettings: false,
                                                 useGriddleStyles: false, columnMetadata: this.props.columnMetadata});
        }
    });

    ReactDOM.render(
        React.createElement(ControlPanel, {}),
        document.getElementById("controlpanel")
    );
});