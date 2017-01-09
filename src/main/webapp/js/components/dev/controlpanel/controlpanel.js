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
    var Griddle = require('griddle');
    var GEPPETTO = require('geppetto');
    var MenuButton = require('jsx!./../menubutton/MenuButton');
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

    GEPPETTO.LinkComponent = React.createClass({
        render: function () {

            var displayText = this.props.data;
            var path = this.props.rowData.path;
            var that = this;

            var action = function (e) {
                e.preventDefault();
                var actionStr = that.props.metadata.actions;
                actionStr = actionStr.replace(/\$entity\$/gi, path);
                GEPPETTO.Console.executeImplicitCommand(actionStr);
            };

            return (
                <div>
                    <a href='#' onClick={action}>{displayText}</a>
                </div>
            )
        }
    });

    GEPPETTO.LinkArrayComponent = React.createClass({
        render: function () {
            var that = this;
            return (
                <div>
                    {
                        that.props.data.map(function (item, i) {
                            // parse html for easy manipulation
                            var domObj = $(item.html);
                            var anchorElement = domObj.filter('a');

                            // extract action target
                            var actionItem = anchorElement.attr('instancepath');

                            // grab action string from metadata config and swap target
                            var actionStr = that.props.metadata.actions.replace(/\$entity\$/gi, actionItem);

                            // set action
                            var onClickActionStr = 'GEPPETTO.Console.executeImplicitCommand("' + actionStr + '")';
                            anchorElement.attr('onclick', onClickActionStr);

                            // retrieve markup to inject as string
                            var markupToInject = domObj.prop('outerHTML');

                            var getMarkup = function() {
                                return {__html: markupToInject};
                            };

                            return (
                                <span key={i} dangerouslySetInnerHTML={getMarkup()} />
                            );
                        })
                    }
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
                                var actionStr = that.props.metadata.actions;
                                actionStr = actionStr.replace(/\$entity\$/gi, item);
                                GEPPETTO.Console.executeImplicitCommand(actionStr);
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

    GEPPETTO.ParameterInputComponent = React.createClass({
        render: function () {
            // retrieve entity path
            var path = this.props.rowData.path;
            var entity = eval(path);

            // fetch unit
            var unit = entity.getUnit();
            // fetch current or default value
            var initialValue = entity.getValue();

            // get and ready action string
            var actionStr = this.props.metadata.actions;
            var onInputChangeHandler = function(event){
                var newVal = event.target.value;

                // only set if it's different than its current value, could be initial or set value
                if(entity.getValue() != newVal) {
                    actionStr = actionStr.replace(/\$VALUE\$/gi, newVal);
                    actionStr = actionStr.replace(/\$entity\$/gi, path);
                    GEPPETTO.Console.executeCommand(actionStr);
                }
            };

            var onKeyPressHandler = function(event){
                if(event.key == 'Enter'){
                    onInputChangeHandler(event);
                }
            };

            // figure out if input is readonly
            var readOnly = true;
            try {
                readOnly = eval(this.props.metadata.readOnlyCondition)
            } catch(e){
                // nothing to do here readOnly defaults to true if evaluation failed
            }

            return (
                <div>
                    <input defaultValue={initialValue}
                           onBlur={onInputChangeHandler}
                           onKeyPress={onKeyPressHandler}
                           className="control-panel-parameter-input"
                           readOnly={readOnly}/>
                    <span className="control-panel-parameter-unit">{unit}</span>
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

            if(control.actions!=null || undefined){
            	if (control.actions.length > 0) {
            		for (var i = 0; i < control.actions.length; i++) {
            			actionStr += ((i != 0) ? ";" : "") + this.replaceTokensWithPath(control.actions[i], path);
            		}
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
                var coloPickerElement = $('#' + this.colorPickerBtnId);
                coloPickerElement.colorpicker({format: 'hex', customClass: 'controlpanel-colorpicker'});
                coloPickerElement.colorpicker('setValue', defColor.replace(/0X/i, "#"));

                // closure on local scope at this point - hook on change event
                var that = this;
                coloPickerElement.on('changeColor', function (e) {
                    that.colorPickerActionFn(e.color.toHex().replace("#", "0x"));
                    $(this).css("color", e.color.toHex());
                });
            }
        },

        // Utility method to iterate over a config property and populate a list of control buttons to be created
        addControlButtons: function(controlsConfig, showControlsConfig, configPropertyName, buttonsList, targetPath){
            for (var control in controlsConfig[configPropertyName]) {
                if ($.inArray(control.toString(), showControlsConfig[configPropertyName]) != -1) {
                    var add = true;

                    // check show condition
                    if(controlsConfig[configPropertyName][control].showCondition != undefined){
                        var condition = this.replaceTokensWithPath(controlsConfig[configPropertyName][control].showCondition, targetPath);
                        add = eval(condition);
                    }

                    if(add) {
                        buttonsList.push(controlsConfig[configPropertyName][control]);
                    }
                }
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
                // NOTE: The instance doesn't exist yet
            }

            // TODO: refactor adding buttons and capability checks into functions and re-use those
            // Add common control buttons to list
            this.addControlButtons(config, showControls, 'Common', ctrlButtons, path);

            if (entity != undefined && entity.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                // Add visual capability controls to list
                this.addControlButtons(config, showControls, 'VisualCapability', ctrlButtons, path);
            }

            if (entity != undefined && entity.hasCapability(GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY)) {
                // Add state variable capability controls to list
                this.addControlButtons(config, showControls, 'StateVariableCapability', ctrlButtons, path);
            }

            var that = this;

            return (
                <div>
                    {ctrlButtons.map(function (control, id) {
                        var menuButton = false;
                    	if(control.menu!=undefined && control.menu!=null){
                    		menuButton = control.menu;
                    	}
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
                                GEPPETTO.Console.executeImplicitCommand(actionStr);
                                // check custom action to run after configured command
                                if(that.props.metadata.actions != '' && that.props.metadata.actions != undefined) {
                                    // straight up eval as we don't want this to show on the geppetto console
                                    eval(that.props.metadata.actions.replace(/\$entity\$/gi, path));
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
                        if (entity != undefined && controlConfig.id == "color") {
                            that.colorPickerBtnId = idVal;
                            that.colorPickerActionFn = actionFn;
                            // set style val to color tint icon
                            var colorVal = String(entity.getColor().replace(/0X/i, "#") + "0000").slice(0, 7);
                            styleVal = {color: colorVal.startsWith('#') ? colorVal : ('#' + colorVal) };
                            classVal += " color-picker-button";
                        }

                        var menuButtonItems = new Array();
                        if(control.menuItems!=null || control.menuItems != undefined){
                        	for(var i =0; i<control.menuItems.length; i++){
                        		var action = that.replaceTokensWithPath(control.menuItems[i].action, path)
                        		control.menuItems[i].action = action;
                        	}
                        	menuButtonItems = control.menuItems;
                        }else{
                        	if(control.menuItemsType == "dynamic_plot"){
                        		var plots = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets();
                        		for(var i =0 ; i<plots.length; i++){
                        			menuButtonItems.push({
                        				label: "Add to " +plots[i].getName(),
                        				action:plots[i].getId()+".plotData("+that.props.rowData.path+")",
                        				value: "plot_variable"
                        			});
                        		}
                        	}
                        }

                        var controlPanelMenuButtonConfig = {
                                id: idVal,
                                openByDefault: false,
                                closeOnClick: true,
                                label: '',
                                iconOff: "",
                                iconOn: "",
                                containerClassName : "menuButtonContainer",
                                buttonClassName : "ctrlpanel-button fa "+controlConfig.icon,
                                menuPosition: null,
                                menuSize: null,
                                menuCSS : 'menuButtonStyle',
                                menuItems: menuButtonItems,
                                onClickHandler: actionFn
                            };
                        
                        return (
                            <span key={id}>
                            {menuButton ?
                            		<MenuButton ref={idVal} type={control.menuItemsType} configuration={controlPanelMenuButtonConfig} />
                             	:
                             		<button id={idVal}
                                        className={classVal}
                                        style={styleVal}
                                        title={tooltip}
                                        onClick={
                                            controlConfig.id == "color" ? function(){} : actionFn
                                        }>
                             	    </button>
                            }
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
            "actions": "G.addWidget(3).setData($entity$).setName('$entity$')"
        },
        {
            "columnName": "controls",
            "order": 4,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ControlsComponent,
            "displayName": "Controls",
            "source": "",
            "actions": "GEPPETTO.ControlPanel.refresh();",
            "cssClassName": "controlpanel-controls-column"
        }
    ];

    var defaultDataFilter = function(entities){
        return GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, entities);
    };

    var defaultControlsConfiguration = {
        "VisualCapability": {
            "select": {
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
            },"visibility": {
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
            "randomcolor": {
                "id": "randomcolor",
                "actions": [
                    "GEPPETTO.SceneController.assignRandomColor($instance$);"
                ],
                "icon": "fa-random",
                "label": "Random Color",
                "tooltip": "Random Color"
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
        "Common": {}
    };

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',

        refresh: function() {
            this.forceUpdate();
        },

        getInitialState: function () {
            return {
                columns: ['name', 'type', 'controls'],
                data: [],
                controls: {"Common": [], "VisualCapability": ['color', 'randomcolor', 'visibility', 'zoom']},
                controlsConfig: defaultControlsConfiguration,
                dataFilter: defaultDataFilter,
                columnMeta: controlPanelColumnMeta
            };
        },

        getDefaultProps: function () {
            return {
                tableClassName: 'control-panel-table',
                listenToInstanceCreationEvents: true
            };
        },

        setColumns: function (cols) {
            this.setState({columns: cols});
        },

        setColumnMeta: function (colMeta) {
            this.setState({columnMeta: colMeta});
        },

        addData: function(instances){
        	if(instances!= undefined && instances.length>0){
        		
	            var columnMeta = this.state.columnMeta;
	
	            // filter new records with data filter
	            var records = this.state.dataFilter(instances);
	
	            // grab existing input
	            var gridInput = this.state.data;
	
	            for (var i = 0; i < records.length; i++) {
	                var gridRecord = {};
                    var entityPath = records[i].getPath();

                    // check for duplicates
                    var isDuplicate = false;
                    for(var k=0; k<gridInput.length; k++){
                        if(gridInput[k].path == entityPath){
                            isDuplicate = true;
                        }
                    }

                    if(!isDuplicate) {
                        // loop column meta and grab column names + source
                        for (var j = 0; j < columnMeta.length; j++) {
                            // eval result - empty string by default so griddle doesn't complain
                            var result = '';
                            if(columnMeta[j].source != undefined) {
                                var sourceActionStr = columnMeta[j].source;

                                // replace token with path from input entity
                                sourceActionStr = sourceActionStr.replace(/\$entity\$/gi, entityPath);

                                try {
                                    if (sourceActionStr != "") {
                                        result = eval(sourceActionStr);
                                    }
                                } catch (e) {
                                    GEPPETTO.Console.debugLog(GEPPETTO.Resources.CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT + " " + sourceActionStr);
                                }
                            } else {
                                // if no source assume the record has a property with the column name
                                result = records[i][columnMeta[j].columnName]
                            }

                            gridRecord[columnMeta[j].columnName] = result;
                        }

                        gridInput.push(gridRecord);
                    }
	            }
	
	            // set state to refresh grid
	            this.setState({data: gridInput});
        	}
        },

        deleteData: function(instancePaths){
            if(instancePaths!= undefined && instancePaths.length>0){
                // grab existing input
                var gridInput = this.state.data;
                var newGridInput = [];

                // remove unwanted instances from grid input
                for(var i=0; i<instancePaths.length; i++){
                    for(var j=0; j<gridInput.length; j++){
                        if(instancePaths[i] != gridInput[j].path){
                            newGridInput.push(gridInput[j]);
                        }
                    }
                }

                // set state to refresh grid
                if(gridInput.length != newGridInput.length){
                    this.setState({data: newGridInput});
                }
            }
        },

        clearData: function(){
            // set state to refresh grid
            this.setState({data: []});
        },

        setData: function (records) {
            var columnMeta = this.state.columnMeta;

            // filter records with data filter
            records = this.state.dataFilter(records);

            // go from list of instances / variables to simple JSON
            var gridInput = [];

            for (var i = 0; i < records.length; i++) {
                var gridRecord = {};

                // loop column meta and grab column names + source
                for(var j=0; j<columnMeta.length; j++){
                    // eval result - empty string by default so griddle doesn't complain
                    var result = '';
                    if(columnMeta[j].source != undefined) {
                        var sourceActionStr = columnMeta[j].source;

                        // replace token with path from input entity
                        var entityPath = records[i].getPath();
                        sourceActionStr = sourceActionStr.replace(/\$entity\$/gi, entityPath);

                        try{
                            if(sourceActionStr != "") {
                                result = eval(sourceActionStr);
                            }
                        } catch(e){
                            GEPPETTO.Console.debugLog(GEPPETTO.Resources.CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT + " " + sourceActionStr);
                        }
                    } else {
                        // if no source assume the record has a property with the column name
                        result = records[i][columnMeta[j].columnName];
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

        componentWillMount: function () {
            GEPPETTO.ControlPanel = this;
        },

        open: function () {
            // show control panel
            $("#controlpanel").show();
            // refresh to reflect latest state (might have changed)
            this.refresh();
        },
        
        close: function () {
            // hide any color picker that is still visible
            $(".colorpicker-visible").addClass('colorpicker-hidden').removeClass('colorpicker-visible');
            // hide control panel
            $("#controlpanel").hide();
        },

        setFilter: function(filterText){
            var filterElement = $('#controlpanel input.form-control[name=filter]');
            filterElement.val(filterText);
            // trigger input change the way react likes it
            filterElement[0].dispatchEvent(new Event('input', { bubbles: true }));
        },

        componentDidMount: function () {
            var escape = 27;
            var pKey = 80;

            var that = this;
            var controlPanelElement = $("#controlpanel");

            controlPanelElement.click(function (e) {
                if (e.target == e.delegateTarget || e.target == $(".griddle-body").children(":first")[0]) {
                    //we want this only to happen if we clicked on the div directly and not on anything therein contained
                    that.close();
                }
            });

            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == pKey) {
                    // show control panel
                    that.open();
                    // set focus on filter text box
                    $('#controlpanel .griddle-filter input').focus();
                }
            });

            $(document).keydown(function (e) {
                if (controlPanelElement.is(':visible') && e.keyCode == escape) {
                    that.close();
                }
            });

            // listen to events we need to react to
            GEPPETTO.on(Events.Project_loaded, function () {
                that.clearData();
            });

            if(this.props.listenToInstanceCreationEvents){
                GEPPETTO.on(Events.Instance_deleted, function (parameters) {
                    that.deleteData([parameters]);
                });

                GEPPETTO.on(Events.Instances_created, function(instances){
                    if(instances!=undefined){
                        that.addData(instances);
                    }
                });
            }

            if (GEPPETTO.ForegroundControls != undefined) {
                GEPPETTO.ForegroundControls.refresh();
            }
            
            this.addData(window.Instances);
        },

        render: function () {
            var menuButtonMarkup = '';
            if (this.props.showMenuButton === true) {
                var controlPanelMenuButtonConfig = {
                    id: "controlPanelMenuButton",
                    openByDefault: false,
                    closeOnClick: true,
                    label: ' Filters',
                    iconOn: 'fa fa-caret-square-o-up',
                    iconOff: 'fa fa-caret-square-o-down',
                    menuPosition: null,
                    menuSize: null,
                    onClickHandler: this.props.menuButtonClickHandler,
                    menuItems: this.props.menuButtonItems
                };
                menuButtonMarkup = (
                    <MenuButton configuration={controlPanelMenuButtonConfig} />
                );
            }

            return (
                <div id="controlpanel-container">
                    {menuButtonMarkup}
                    <Griddle columns={this.state.columns} results={this.state.data}
                    showFilter={true} showSettings={false} enableInfiniteScroll={true} bodyHeight={400}
                    useGriddleStyles={false} columnMetadata={this.state.columnMeta} />
                </div>
            );
        }
    });

    return ControlPanel;
});
