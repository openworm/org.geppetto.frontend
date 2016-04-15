define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/controlpanel/controlpanel.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react'), $ = require('jquery');
    var ReactDOM = require('react-dom');
    var Griddle = require('griddle');
    //var ColorPicker = require('color-picker');
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
                            var actionStr = "G.addWidget(3).setData(" + item + ").setName('" + displayText + "')";
                            GEPPETTO.Console.executeCommand(actionStr);
                        };
                        return <li key={i}><a href='#' onClick={action}>{displayText}</a></li>;
                    })}
                </ul>
            )
        }
    });

    var ControlsComponent = React.createClass({

        getInitialState: function() {
            return {
                displayColorPicker: false
            }
        },

        getActionString: function(control, path){
            var actionStr = '';

            if(control.actions.length > 0){
                for(var i=0; i<control.actions.length; i++){
                    actionStr += ((i!=0)?";":"") + control.actions[i].replace(/\$instance\$/gi, path);
                }
            }

            return actionStr;
        },

        resolveCondition: function(control, path, negateCondition){
            if(negateCondition == undefined){
                negateCondition = false;
            }

            var resolvedConfig = control;

            if(resolvedConfig.hasOwnProperty('condition')) {
                // evaluate condition and reassign control depending on results
                var conditionStr = control.condition.replace(/\$instance\$/gi, path);
                if (eval(conditionStr)) {
                    resolvedConfig = negateCondition ? resolvedConfig.false: resolvedConfig.true;
                } else {
                    resolvedConfig = negateCondition ? resolvedConfig.true: resolvedConfig.false;
                }
            }

            return resolvedConfig;
        },

        handleColorPickerControlClick: function(){
            // show picker
            this.setState({ displayColorPicker: !this.state.displayColorPicker });
        },

        handleColorPickerControlClose: function(){
            // hide picker
            this.setState({ displayColorPicker: false });
        },

        render: function(){
            // TODO: would be nicer to pass controls and config straight from the parent component rather than assume
            var showControls = GEPPETTO.ControlPanel.state.controls;
            var config = GEPPETTO.ControlPanel.state.controlsConfig;
            var path = this.props.rowData.path;
            var ctrlButtons = [];

            // retrieve entity/instance
            var entity = undefined;
            try{
                // need to eval because this is a nested path - not simply a global on window
                entity = eval(path)
            } catch (e) {
                throw( "The instance " + path + " does not exist in the current model" );
            }

            // Add common control buttons to list
            for(var control in config.Common){
                if($.inArray(control.toString(), showControls.Common) != -1){
                    ctrlButtons.push(config.Common[control]);
                }
            }

            if(entity.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                // Add visual capability controls to list
                for (var control in config.VisualCapability) {
                    if ($.inArray(control.toString(), showControls.VisualCapability) != -1) {
                        ctrlButtons.push(config.VisualCapability[control]);
                    }
                }
            }

            var that = this;

            return (
                <div>
                    {ctrlButtons.map(function(control, id) {
                        // grab attributes to init button attributes
                        var controlConfig = that.resolveCondition(control, path);
                        var idVal = path + "_" + controlConfig.id + "_ctrlPanel_btn";
                        var classVal = "btn ctrlpanel-button fa " + controlConfig.icon;

                        // define action function
                        var actionFn = function(param){
                            // NOTE: there is a closure on 'control' so it's always the right one
                            var controlConfig = that.resolveCondition(control, path);

                            // take out action string
                            var actionStr = that.getActionString(controlConfig, path);

                            if(param != undefined){
                                actionStr = actionStr.replace(/\$param\$/gi, param);
                            }

                            // run action
                            if(actionStr!='' && actionStr!=undefined){
                                GEPPETTO.Console.executeCommand(actionStr);
                            }

                            // if conditional, swap icon with the other condition outcome
                            if(control.hasOwnProperty('condition')) {
                                var otherConfig = that.resolveCondition(control, path);
                                var element = $('#' + idVal);
                                element.removeClass();
                                element.addClass("btn ctrlpanel-button fa " + otherConfig.icon);
                            }
                        };

                        // figure out if we need to include the color picker
                        var colorPickerControl = undefined;
                        if(controlConfig.id == "color"){
                            // create picker control
                            /*colorPickerControl = React.createElement(ColorPicker, {
                                display: that.state.displayColorPicker,
                                onClose: that.handleColorPickerControlClose,
                                onChange: actionFn,
                                type: "compact"});*/
                        }

                        // TODO: add this below once it works --> {colorPickerControl}

                        return (
                            <span key={id}>
                                <button id={idVal}
                                        className={classVal}
                                        onClick={
                                            controlConfig.id == "color" ? that.handleColorPickerControlClick : actionFn
                                        }>
                                </button>
                            </span>
                        )
                    })}
                </div>
            )
        }
    });

    var fakeControlPanelData = [
        {
            "path": "path.TestA",
            "name": "TestA",
            "type": ['Model.common.TypeA', 'Model.common.TypeB'],
            "image": 'http://i.imgur.com/N5G3Ref.png',
            "controls": ""
        },
        {
            "path": "path.TestB",
            "name": "TestB",
            "type": ['Model.common.TypeX', 'Model.common.TypeY'],
            "image": 'http://i.imgur.com/N5G3Ref.png',
            "controls": ""
        },
        {
            "path": "path.TestC",
            "name": "TestC",
            "type": ['Model.common.TypeW', 'Model.common.TypeV'],
            "image": 'http://i.imgur.com/N5G3Ref.png',
            "controls": ""

        },
        {
            "path": "path.TestD",
            "name": "TestD",
            "type": ['Model.common.TypeY', 'Model.common.TypeZ'],
            "image": 'http://i.imgur.com/N5G3Ref.png',
            "controls": ""
        }
    ];

    var controlPanelColumnMeta = [
        {
            "columnName": "path",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "Path"
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
        {
            "columnName": "controls",
            "order": 5,
            "locked": false,
            "visible": true,
            "customComponent": ControlsComponent,
            "displayName": "Controls"
        },
    ];

    var defaultControlsConfiguration = {
        "VisualCapability": {
            "visibility": {
                "condition": "$instance$.isVisible()",
                "false": {
                    "id": "visibility",
                    "actions": [
                        "$instance$.show()"
                    ],
                    "icon": "fa-eye-slash",
                    "label": "Hidden",
                    "tooltip": "Show"
                },
                "true": {
                    "id": "visibility",
                    "actions": [
                        "$instance$.hide()"
                    ],
                    "icon": "fa-eye",
                    "label": "Visible",
                    "tooltip": "Hide"
                }
            },
            "color": {
                "id": "color",
                "actions": [
                    "$instance$.setColor($param$)"
                ],
                "icon": "fa-tint",
                "label": "Color",
                "tooltip": "Color"
            }
        },
        "Common": {
            "info": {
                "id": "info",
                "actions": [
                    "G.addWidget(3).setData($instance$)"
                ],
                "icon": "fa-info-circle",
                "label": "Info",
                "tooltip": "Info"
            },
            "delete": {
                "id": "delete",
                "actions": [
                    "alert('TODO: delete ' + $instance$.getName())"
                ],
                "icon": "fa-trash-o",
                "label": "Delete",
                "tooltip": "Delete"
            }
        }
    };

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',

        getInitialState: function() {
            return {
                columns: ['name', 'type', 'controls'],
                data: [],
                controls: {"Common": ['info', 'delete'], "VisualCapability": ['color', 'visibility']},
                controlsConfig: defaultControlsConfiguration
            };
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

        setData: function(records) {
            // go from list of instances / variables to simple JSON
            var gridInput = [];
            for(var i=0; i < records.length; i++){
                gridInput.push({
                    "path": records[i].getPath(),
                    "name": records[i].getName(),
                    "type": records[i].getTypes().map(function(t){ return t.getPath() }),
                    "image": "",
                    "controls": ""
                });
            }

            // set state to refresh grid
            this.setState({data: gridInput});
        },

        setControls: function(showControls) {
            // set state to refresh grid
            this.setState({controls: showControls});
        },

        setControlsConfig: function(controlsConfig) {
            // set state to refresh grid
            this.setState({controlsConfig: controlsConfig});
        },

        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        componentWillMount: function() {
            GEPPETTO.ControlPanel = this;
        },

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