/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

define(function (require) {

    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    loadCss("geppetto/js/components/dev/controlpanel/controlpanel.css");
    loadCss("geppetto/js/components/dev/controlpanel/vendor/css/bootstrap-colorpicker.min.css");

    var React = require('react'), $ = require('jquery');
    var ReactDOM = require('react-dom');
    var Griddle = require('griddle');
    var GEPPETTO = require('geppetto');
    var colorpicker = require('./vendor/js/bootstrap-colorpicker.min');

    $.widget.bridge('uitooltip', $.ui.tooltip);

    GEPPETTO.ImageComponent = React.createClass({
        attachTooltip: function(){
            $('img[rel="tooltip"]').uitooltip({
                position: { my: "left+15 center", at: "right center" },
                tooltipClass: "tooltip-container",
                content: function () {
                    return this.getAttribute("title");
                },
            });
        },

        componentDidMount: function(){
            this.attachTooltip();
        },

        render: function () {
            var imgId = this.props.rowData.path.replace(/\./g,'_') + "_thumbnail";
            var titleValue = "<img src='" + this.props.data + "' class='thumbnail-img-tooltip'/>";

            var imgElement = "";
            if(this.props.data.indexOf("http") > -1){
                imgElement = <img id={imgId} src={this.props.data} title={titleValue} className="thumbnail-img" rel="tooltip" />
            }

            return (
                <div>
                    {imgElement}
                </div>
            )
        }
    });

    GEPPETTO.ArrayComponent = React.createClass({
        render: function () {
            var that = this;
            return (
                <div>
                    {
                        that.props.data.map(function (item, i, originalArray) {
                            var displayText = item.split('.')[item.split('.').length - 1];
                            var action = function (e) {
                                e.preventDefault();
                                var actionStr = that.props.metadata.action;
                                actionStr = actionStr.replace(/\$entity\$/gi, item);
                                GEPPETTO.Console.executeCommand(actionStr);
                            };

                            var separator = (i < originalArray.length - 1) ? <span>, </span> : <span></span>;

                            return (
                                <span key={i}><a href='#' onClick={action}>{displayText}</a>{ separator }</span>
                            );
                        })
                    }
                </div>
            )
        }
    });

    GEPPETTO.ControlsComponent = React.createClass({
        colorPickerBtnId: '',
        colorPickerActionFn: '',

        replaceTokensWithPath: function(inputStr, path){
            return inputStr.replace(/\$instance\$/gi, path).replace(/\$instances\$/gi, '[' + path + ']');
        },

        getActionString: function (control, path) {
            var actionStr = '';

            if (control.actions.length > 0) {
                for (var i = 0; i < control.actions.length; i++) {
                    actionStr += ((i != 0) ? ";" : "") + this.replaceTokensWithPath(control.actions[i], path);
                }
            }

            return actionStr;
        },

        resolveCondition: function (control, path, negateCondition) {
            if (negateCondition == undefined) {
                negateCondition = false;
            }

            var resolvedConfig = control;

            if (resolvedConfig.hasOwnProperty('condition')) {
                // evaluate condition and reassign control depending on results
                var conditionStr = this.replaceTokensWithPath(control.condition, path);
                if (eval(conditionStr)) {
                    resolvedConfig = negateCondition ? resolvedConfig.false : resolvedConfig.true;
                } else {
                    resolvedConfig = negateCondition ? resolvedConfig.true : resolvedConfig.false;
                }
            }

            return resolvedConfig;
        },

        componentDidMount: function () {
            // hookup color picker onChange
            if (this.colorPickerBtnId != '') {
                var path = this.props.rowData.path;
                var entity = eval(path);
                var defColor = '0Xffffff';

                // grab default color from instance
                if (entity.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                    defColor = entity.getColor();
                }

                // init dat color picker
                $('#' + this.colorPickerBtnId).colorpicker({format: 'hex', customClass: 'controlpanel-colorpicker'});
                $('#' + this.colorPickerBtnId).colorpicker('setValue', defColor.replace(/0X/i, "#"));

                // closure on local scope at this point - hook on change event
                var that = this;
                $('#' + this.colorPickerBtnId).on('changeColor', function (e) {
                    that.colorPickerActionFn(e.color.toHex().replace("#", "0x"));
                    $(this).css("color", e.color.toHex());
                });
            }
        },

        render: function () {
            // TODO: would be nicer to pass controls and config straight from the parent component rather than assume
            var showControls = GEPPETTO.ControlPanel.state.controls;
            var config = GEPPETTO.ControlPanel.state.controlsConfig;
            var path = this.props.rowData.path;
            var ctrlButtons = [];

            // retrieve entity/instance
            var entity = undefined;
            try {
                // need to eval because this is a nested path - not simply a global on window
                entity = eval(path)
            } catch (e) {
                throw( "The instance " + path + " does not exist in the current model" );
            }

            // Add common control buttons to list
            for (var control in config.Common) {
                if ($.inArray(control.toString(), showControls.Common) != -1) {
                    var add = true;

                    // check show condition
                    if(config.Common[control].showCondition != undefined){
                        var condition = this.replaceTokensWithPath(config.Common[control].showCondition, path);
                        add = eval(condition);
                    }

                    if(add) {
                        ctrlButtons.push(config.Common[control]);
                    }
                }
            }

            if (entity.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                // Add visual capability controls to list
                for (var control in config.VisualCapability) {
                    if ($.inArray(control.toString(), showControls.VisualCapability) != -1) {
                        var add = true;

                        // check show condition
                        if(config.VisualCapability[control].showCondition != undefined){
                            var condition = this.replaceTokensWithPath(config.VisualCapability[control].showCondition, path);
                            add = eval(condition);
                        }

                        if(add) {
                            ctrlButtons.push(config.VisualCapability[control]);
                        }
                    }
                }
            }

            var that = this;

            return (
                <div>
                    {ctrlButtons.map(function (control, id) {
                        // grab attributes to init button attributes
                        var controlConfig = that.resolveCondition(control, path);
                        var idVal = path.replace(/\./g, '_').replace(/\[/g, '_').replace(/\]/g, '_') + "_" + controlConfig.id + "_ctrlPanel_btn";
                        var tooltip = controlConfig.tooltip;
                        var classVal = "btn ctrlpanel-button fa " + controlConfig.icon;
                        var styleVal = {};

                        // define action function
                        var actionFn = function (param) {
                            // NOTE: there is a closure on 'control' so it's always the right one
                            var controlConfig = that.resolveCondition(control, path);

                            // take out action string
                            var actionStr = that.getActionString(controlConfig, path);

                            if (param != undefined) {
                                actionStr = actionStr.replace(/\$param\$/gi, param);
                            }

                            // run action
                            if (actionStr != '' && actionStr != undefined) {
                                GEPPETTO.Console.executeCommand(actionStr);
                                // check custom action to run after configured command
                                if(that.props.metadata.action != '' && that.props.metadata.action != undefined) {
                                    // straight up eval as we don't want this to show on the geppetto console
                                    eval(that.props.metadata.action.replace(/\$entity\$/gi, path));
                                }
                            }

                            // if conditional, swap icon with the other condition outcome
                            if (control.hasOwnProperty('condition')) {
                                var otherConfig = that.resolveCondition(control, path);
                                var element = $('#' + idVal);
                                element.removeClass();
                                element.addClass("btn ctrlpanel-button fa " + otherConfig.icon);
                            }
                        };

                        // figure out if we need to include the color picker (hook it up in didMount)
                        if (controlConfig.id == "color") {
                            that.colorPickerBtnId = idVal;
                            that.colorPickerActionFn = actionFn;
                            // set style val to color tint icon
                            styleVal = {color: String(entity.getColor().replace(/0X/i, "#") + "0000").slice(0, 7)};
                            classVal += " color-picker-button";
                        }

                        return (
                            <span key={id}>
                                <button id={idVal}
                                        className={classVal}
                                        style={styleVal}
                                        title={tooltip}
                                        onClick={
                                            controlConfig.id == "color" ? function(){} : actionFn
                                        }>
                                </button>
                            </span>
                        )
                    })}
                </div>
            )
        }
    });

    var controlPanelColumnMeta = [
        {
            "columnName": "path",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "Path",
            "source": "$entity$.getPath()"
        },
        {
            "columnName": "name",
            "order": 2,
            "locked": false,
            "visible": true,
            "displayName": "Name",
            "source": "$entity$.getPath()"
        },
        {
            "columnName": "type",
            "order": 3,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ArrayComponent,
            "displayName": "Type(s)",
            "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
            "action": "G.addWidget(3).setData($entity$).setName('$entity$')"
        },
        {
            "columnName": "controls",
            "order": 4,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ControlsComponent,
            "displayName": "Controls",
            "source": "",
            "action": "GEPPETTO.ControlPanel.refresh();"
        }
    ];

    var defaultDataFilter = function(entities){
        return GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, entities);
    };

    var defaultControlsConfiguration = {
        "VisualCapability": {
            "visibility": {
                "condition": "GEPPETTO.SceneController.isVisible($instances$)",
                "false": {
                    "id": "visibility",
                    "actions": [
                        "GEPPETTO.SceneController.show($instances$);"
                    ],
                    "icon": "fa-eye-slash",
                    "label": "Hidden",
                    "tooltip": "Show"
                },
                "true": {
                    "id": "visibility",
                    "actions": [
                        "GEPPETTO.SceneController.hide($instances$);"
                    ],
                    "icon": "fa-eye",
                    "label": "Visible",
                    "tooltip": "Hide"
                }
            },
            "color": {
                "id": "color",
                "actions": [
                    "$instance$.setColor('$param$');"
                ],
                "icon": "fa-tint",
                "label": "Color",
                "tooltip": "Color"
            },
            "zoom": {
                "id": "zoom",
                "actions": [
                    "GEPPETTO.SceneController.zoomTo($instances$)"
                ],
                "icon": "fa-search-plus",
                "label": "Zoom",
                "tooltip": "Zoom"
            }
        },
        "Common": {
            "info": {
                "id": "info",
                "actions": [
                    "G.addWidget(1).setData($instance$)"
                ],
                "icon": "fa-info-circle",
                "label": "Info",
                "tooltip": "Info"
            }
        }
    };

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',

        refresh: function() {
            this.setState({
                columns: this.state.columns,
                data: this.state.data,
                controls: this.state.controls,
                controlsConfig: this.state.controlsConfig,
                dataFilter: this.state.dataFilter
            });
        },

        getInitialState: function () {
            return {
                columns: ['name', 'type', 'controls'],
                data: [],
                controls: {"Common": ['info', 'delete'], "VisualCapability": ['color', 'visibility', 'zoom']},
                controlsConfig: defaultControlsConfiguration,
                dataFilter: defaultDataFilter,
            };
        },

        getDefaultProps: function () {
            return {
                "tableClassName": 'control-panel-table',
                "columnMeta": null
            };
        },

        setColumns: function (cols) {
            this.setState({columns: cols});
        },

        setColumnMeta: function (colMeta) {
            // if the user sets meta - NUKE everything and rebuild
            // NOTE: griddle does not pickup metadata for eventual new columns
            ReactDOM.unmountComponentAtNode(document.getElementById("controlpanel"));
            // re-instantiate the control panel in its entirety with the new column meta
            ReactDOM.render(
                React.createElement(ControlPanel, {columnMeta: colMeta}),
                document.getElementById("controlpanel")
            );
        },

        addData: function(instances){
        	if(instances.length>0){
        		
	            var columnMeta = this.props.columnMeta;
	
	            // filter records with data filter
	            var records = this.state.dataFilter(instances);
	
	            // go from list of instances / variables to simple JSON
	            var gridInput = this.state.data;
	
	            for (var i = 0; i < records.length; i++) {
	                var gridRecord = {};
	
	                // loop column meta and grab column names + source
	                for(var j=0; j<columnMeta.length; j++){
	                    var sourceActionStr = columnMeta[j].source;
	
	                    // replace token with path from input entity
	                    var entityPath = records[i].getPath();
	                    sourceActionStr = sourceActionStr.replace(/\$entity\$/gi, entityPath);
	
	                    // eval result - empty string by default so griddle doesn't complain
	                    var result = '';
	
	                    try{
	                        if(sourceActionStr != "") {
	                            result = eval(sourceActionStr);
	                        }
	                    } catch(e){
	                        GEPPETTO.Console.debugLog(GEPPETTO.Resources.CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT + " " + sourceActionStr);
	                    }
	
	                    gridRecord[columnMeta[j].columnName] = result;
	                }
	
	                gridInput.push(gridRecord);
	            }
	
	            // set state to refresh grid
	            this.setState({data: gridInput});
        	}
        },

        setData: function (records) {
            var columnMeta = this.props.columnMeta;

            // filter records with data filter
            records = this.state.dataFilter(records);

            // go from list of instances / variables to simple JSON
            var gridInput = [];

            for (var i = 0; i < records.length; i++) {
                var gridRecord = {};

                // loop column meta and grab column names + source
                for(var j=0; j<columnMeta.length; j++){
                    var sourceActionStr = columnMeta[j].source;

                    // replace token with path from input entity
                    var entityPath = records[i].getPath();
                    sourceActionStr = sourceActionStr.replace(/\$entity\$/gi, entityPath);

                    // eval result - empty string by default so griddle doesn't complain
                    var result = '';

                    try{
                        if(sourceActionStr != "") {
                            result = eval(sourceActionStr);
                        }
                    } catch(e){
                        GEPPETTO.Console.debugLog(GEPPETTO.Resources.CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT + " " + sourceActionStr);
                    }

                    gridRecord[columnMeta[j].columnName] = result;
                }

                gridInput.push(gridRecord);
            }

            // set state to refresh grid
            this.setState({data: gridInput});
        },

        setControls: function (showControls) {
            // set state to refresh grid
            this.setState({controls: showControls});
        },

        setControlsConfig: function (controlsConfig) {
            // set state to refresh grid
            this.setState({controlsConfig: controlsConfig});
        },

        setDataFilter: function (dataFilter) {
            // set state to refresh grid
            this.setState({dataFilter: dataFilter});
        },

        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        componentWillMount: function () {
            GEPPETTO.ControlPanel = this;
        },
        
        close: function () {
            // hide any color picker that is still visible
            $(".colorpicker-visible").addClass('colorpicker-hidden').removeClass('colorpicker-visible');
            // hide control panel
            $("#controlpanel").hide();
        },

        componentDidMount: function () {

            var escape = 27;
            var pKey = 80;

            var that = this;
            
            $("#controlpanel").click(function(e){
            	if (e.target==e.delegateTarget || e.target==$(".griddle-body").children(":first")[0]){
            		//we want this only to happen if we clicked on the div directly and not on anything therein contained
            		that.close();
            	}
            });
            
            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == pKey) {
                    // show control panel
                    $("#controlpanel").show();
                    // refresh to reflect up to date state of records
                    GEPPETTO.ControlPanel.refresh();
                    // set focus on filter text box
                    $('#controlpanel .griddle-filter input').focus();
                }
            });

            $(document).keydown(function (e) {
                if ($("#controlpanel").is(':visible') && e.keyCode == escape) {
                	that.close();
                }
            });

            if(GEPPETTO.ForegroundControls != undefined){
                GEPPETTO.ForegroundControls.refresh();
            }
        },

        render: function () {
            return React.createElement(Griddle, {
                columns: this.state.columns, results: this.state.data,
                showFilter: true, showSettings: false, enableInfiniteScroll: true, bodyHeight: 400,
                useGriddleStyles: false, columnMetadata: this.props.columnMeta
            });
        }
    });

    ReactDOM.render(
        React.createElement(ControlPanel, {columnMeta: controlPanelColumnMeta}),
        document.getElementById("controlpanel")
    );
});
