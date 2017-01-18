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
    var ToggleButton = require('jsx!./../togglebutton/ToggleButton');
    var colorpicker = require('./vendor/js/bootstrap-colorpicker.min');
    var PlotCtrlr = require('widgets/plot/controllers/PlotsController');

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
        refresh: function() {
            this.forceUpdate();
        },

        replaceTokensWithProjectExperimentIds: function(inputStr, projectId, experimentId){
            return inputStr.replace(/\$projectId\$/gi, projectId).replace(/\$experimentId\$/gi, experimentId);
        },

        componentDidMount: function () {
            // listen to experiment status change and trigger a re-render to refresh input / read-only status
            GEPPETTO.on(Events.Experiment_completed, function () {
                this.refresh();
            });
            GEPPETTO.on(Events.Experiment_running, function () {
                this.refresh();
            });
            GEPPETTO.on(Events.Experiment_failed, function () {
                this.refresh();
            });
        },

        render: function () {
            // retrieve entity path
            var path = this.props.rowData.path;
            var projectId = this.props.rowData.projectId;
            var experimentId = this.props.rowData.experimentId;
            var entity=undefined;
            var unit = undefined;
            var defaultValue = undefined;
            var initialValue = undefined;

            if(this.props.rowData.fetched_value != undefined){
                // we have a value in the record, we are dealing with an external item, it's not an actual entity that can be evaluated
                unit = this.props.rowData.unit;
                defaultValue = this.props.rowData.fetched_value -1; //we don't have the default value and will never show it, this only allows for the value to show as edited
                initialValue = this.props.rowData.fetched_value;
            } else {
                try{
                    entity=eval(path);
                    // fetch unit
                    unit = entity.getUnit();
                    // fetch current or default value
                    defaultValue = entity.getInitialValue();
                    initialValue = entity.getValue();
                }
                catch(e){
                    // something went horribly wrong - this should never happen
                    throw "ParameterInputComponent - could not eval path: " + path;
                }
            }

            // figure out if input is readonly, this is always true if not dealing with entities (entity == undefined)
            var readOnly = true;
            if(entity != undefined) {
                try {
                    var deTokenizedCondition = this.replaceTokensWithProjectExperimentIds(this.props.metadata.readOnlyCondition, projectId, experimentId);
                    // eval condition + make sure we have a real entity
                    readOnly = eval(deTokenizedCondition) && entity != undefined;
                } catch (e) {
                    // nothing to do here readOnly defaults to true if evaluation failed
                }
            }
            
            var that = this;
            // get and ready action string
            var actionStr = this.props.metadata.actions;
            var onInputChangeHandler = function(event){
                if(!readOnly) {
                    var newVal = event.target.value;

                    // only set if it's different than its current value, could be initial or set value
                    if (entity.getValue() != newVal) {
                        actionStr = actionStr.replace(/\$VALUE\$/gi, newVal);
                        actionStr = actionStr.replace(/\$entity\$/gi, path);
                        GEPPETTO.Console.executeCommand(actionStr);
                        // refresh to trigger color update if edited from default
                        if (newVal != defaultValue) {
                            that.refresh();
                        }
                    }
                }
            };

            var onKeyPressHandler = function(event){
                if(event.key == 'Enter'){
                    onInputChangeHandler(event);
                }
            };

            // if value is not default give it a different background
            var classString = (defaultValue === initialValue) ? "control-panel-parameter-input" : "control-panel-parameter-input control-panel-parameter-edited";

            return (
                <div>
                    <input defaultValue={initialValue}
                           onBlur={onInputChangeHandler}
                           onKeyPress={onKeyPressHandler}
                           className={classString}
                           readOnly={readOnly}/>
                    <span className="control-panel-parameter-unit">{unit}</span>
                </div>
            )
        }
    });

    GEPPETTO.ControlsComponent = React.createClass({
        colorPickerBtnId: '',
        colorPickerActionFn: '',

        refresh: function() {
            this.forceUpdate();
        },

        replaceTokensWithPath: function(inputStr, path){
            return inputStr.replace(/\$instance\$/gi, path).replace(/\$instances\$/gi, '[' + path + ']');
        },

        replaceTokensWithProjectExperimentIds: function(inputStr, projectId, experimentId){
            return inputStr.replace(/\$projectId\$/gi, projectId).replace(/\$experimentId\$/gi, experimentId);
        },

        replaceAllTokensKnownToMan: function(inputStr, path, projectId, experimentId){
            return this.replaceTokensWithProjectExperimentIds(this.replaceTokensWithPath(inputStr, path), projectId, experimentId);
        },

        getActionString: function (control, path, projectId, experimentId) {
            var actionStr = '';

            if(control.actions!=null || undefined){
            	if (control.actions.length > 0) {
            		for (var i = 0; i < control.actions.length; i++) {
                        var deTokenizedStr = this.replaceAllTokensKnownToMan(control.actions[i], path, projectId, experimentId);
            			actionStr += ((i != 0) ? ";" : "") + deTokenizedStr;
            		}
            	}
            }
            return actionStr;
        },

        resolveCondition: function (control, path, negateCondition, projectId, experimentId) {
            if (negateCondition == undefined) {
                negateCondition = false;
            }

            var resolvedConfig = control;

            if (resolvedConfig.hasOwnProperty('condition')) {
                // evaluate condition and reassign control depending on results
                var conditionStr = this.replaceAllTokensKnownToMan(control.condition, path, projectId, experimentId);
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

            // listen to experiment status change and trigger a re-render to update controls
            GEPPETTO.on(Events.Experiment_completed, function () {
                this.refresh();
            });
            GEPPETTO.on(Events.Experiment_running, function () {
                this.refresh();
            });
            GEPPETTO.on(Events.Experiment_failed, function () {
                this.refresh();
            });
        },

        // Utility method to iterate over a config property and populate a list of control buttons to be created
        addControlButtons: function(controlsConfig, showControlsConfig, configPropertyName, buttonsList, targetPath, projectId, experimentId){
            for (var control in controlsConfig[configPropertyName]) {
                if ($.inArray(control.toString(), showControlsConfig[configPropertyName]) != -1) {
                    var add = true;

                    // check show condition
                    if(controlsConfig[configPropertyName][control].showCondition != undefined){
                        var condition = this.replaceAllTokensKnownToMan(controlsConfig[configPropertyName][control].showCondition, targetPath, projectId, experimentId);
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
            var projectId = this.props.rowData.projectId;
            var experimentId = this.props.rowData.experimentId;
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
            this.addControlButtons(config, showControls, 'Common', ctrlButtons, path, projectId, experimentId);

            if (entity != undefined && entity.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                // Add visual capability controls to list
                this.addControlButtons(config, showControls, 'VisualCapability', ctrlButtons, path, projectId, experimentId);
            }

            if (entity != undefined && entity.hasCapability(GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY)) {
                // Add state variable capability controls to list
                this.addControlButtons(config, showControls, 'StateVariableCapability', ctrlButtons, path, projectId, experimentId);
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
                        var controlConfig = that.resolveCondition(control, path, false, projectId, experimentId);
                        var idVal = path.replace(/\./g, '_').replace(/\[/g, '_').replace(/\]/g, '_') + "_" + controlConfig.id + "_ctrlPanel_btn";
                        var tooltip = controlConfig.tooltip;
                        var classVal = "btn ctrlpanel-button fa " + controlConfig.icon;
                        var styleVal = {};

                        // define action function
                        var actionFn = function (param) {
                            // NOTE: there is a closure on 'control' so it's always the right one
                            var controlConfig = that.resolveCondition(control, path, false, projectId, experimentId);

                            // take out action string
                            var actionStr = that.getActionString(controlConfig, path, projectId, experimentId);

                            if (param != undefined) {
                                actionStr = actionStr.replace(/\$param\$/gi, param);
                            }

                            // run action
                            if (actionStr != '' && actionStr != undefined) {
                                GEPPETTO.Console.executeImplicitCommand(actionStr);
                                // check custom action to run after configured command
                                if(that.props.metadata.actions != '' && that.props.metadata.actions != undefined) {
                                    // straight up eval as we don't want this to show on the geppetto console
                                    var evalString = that.replaceAllTokensKnownToMan(that.props.metadata.actions, path, projectId, experimentId);
                                    eval(evalString);
                                }
                            }

                            // if conditional, swap icon with the other condition outcome
                            if (control.hasOwnProperty('condition')) {
                                var otherConfig = that.resolveCondition(control, path, false, projectId, experimentId);
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

                        var controlPanelMenuButtonConfig= {};
                        if(control.menu){
                        	var menuButtonItems = [];
                        	if(control.menuItems!=null || control.menuItems != undefined){
                        		for(var i =0; i<control.menuItems.length; i++){
                        			var action = that.replaceAllTokensKnownToMan(control.menuItems[i].action, path, projectId, experimentId);
                        			control.menuItems[i].action = action;
                        		}
                        		menuButtonItems = control.menuItems;
                        	}else{
                        		menuButtonItems = control.menuMaker(projectId, experimentId, path);
                        	}

                        	controlPanelMenuButtonConfig = {
                        			id: idVal,
                        			openByDefault: false,
                        			closeOnClick: true,
                        			label: '',
                        			iconOff: "",
                        			iconOn: "",
                        			containerClassName : "menuButtonContainer",
                        			buttonClassName : "ctrlpanel-button fa "+controlConfig.icon,
                        			menuPosition: null,
                        			menuSize: {width : 150, height : 'auto'},
                        			menuCSS : 'menuButtonStyle',
                        			menuItems: menuButtonItems,
                        			onClickHandler: actionFn
                        	};
                        }
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

    GEPPETTO.FilterComponent = React.createClass({
        optionsList: {
            VISUAL: '',
        },

        togglesMap: {
            visualInstancesFilterBtn: {
                toggled: this.state.visualFilterToggled,
                enabled: this.state.visualFilterEnabled
            },
            stateVariablesFilterBtn: {
                toggled: this.state.stateVarsFilterToggled,
                enabled: this.state.stateVarsFilterEnabled
            },
            parametersFilterBtn: {
                toggled: this.state.paramsFilterToggled,
                enabled: this.state.paramsFilterEnabled
            },
            activeExperimentFilterBtn: {
                toggled: this.state.activeExperimentFilterToggled,
                enabled: this.state.activeExperimentFilterEnabled
            },
            anyExperimentFilterBtn: {
                toggled: this.state.anyExperimentFilterToggled,
                enabled: this.state.anyExperimentFilterEnabled
            },
            anyProjectFilterBtn: {
                toggled: this.state.anyProjectFilterToggled,
                enabled: this.state.anyProjectFilterEnabled
            },
            recordedFilterBtn: {
                toggled: this.state.recordedFilterToggled,
                enabled: this.state.recordedFilterEnabled
            }
        },

        getInitialState: function () {
            return {
                visualFilterEnabled: true,
                stateVarsFilterEnabled: true,
                paramsFilterEnabled: true,
                activeExperimentFilterEnabled: true,
                anyExperimentFilterEnabled: true,
                anyProjectFilterEnabled: true,
                recordedFilterEnabled: true,
                visualFilterToggled: false,
                stateVarsFilterToggled: false,
                paramsFilterToggled: false,
                activeExperimentFilterToggled: false,
                anyExperimentFilterToggled: false,
                anyProjectFilterToggled: false,
                recordedFilterToggled: false,
            };
        },

        setButtonsEnabledState: function(visualFilterEnabledArg, stateVarsFilterEnabledArg, paramsFilterEnabledArg, activeExperimentFilterEnabledArg, anyExperimentFilterEnabledArg, anyProjectFilterEnabledArg, recordedFilterEnabledArg){
            this.setState(
                {
                    visualFilterEnabled: visualFilterEnabledArg,
                    stateVarsFilterEnabled: stateVarsFilterEnabledArg,
                    paramsFilterEnabled: paramsFilterEnabledArg,
                    activeExperimentFilterEnabled: activeExperimentFilterEnabledArg,
                    anyExperimentFilterEnabled: anyExperimentFilterEnabledArg,
                    anyProjectFilterEnabled: anyProjectFilterEnabledArg,
                    recordedFilterEnabled: recordedFilterEnabledArg
                }
            );
        },

        setButtonsToggledState: function(visualFilterToggledArg, stateVarsFilterToggledArg, paramsFilterToggledArg, activeExperimentFilterToggledArg, anyExperimentFilterToggledArg, anyProjectFilterToggledArg, recordedFilterToggledArg){
            this.setState(
                {
                    visualFilterToggled: visualFilterToggledArg,
                    stateVarsFilterToggled: stateVarsFilterToggledArg,
                    paramsFilterToggled: paramsFilterToggledArg,
                    activeExperimentFilterToggled: activeExperimentFilterToggledArg,
                    anyExperimentFilterToggled: anyExperimentFilterToggledArg,
                    anyProjectFilterToggled: anyProjectFilterToggledArg,
                    recordedFilterToggled: recordedFilterToggledArg
                }
            );
        },

        computeResult: function(controlId){
            // logic for disable/enable stuff here
            switch(controlId) {
                case 'visualInstancesFilterBtn':
                    if(!this.togglesMap[controlId]){
                        // visual instance being toggled on, untoggle everything else
                        this.setButtonsToggledState(true, false, false, false, false, false, false);
                        // disable itself (so cannot be untoggled), enable state vars and params, disable the rest
                        this.setButtonsEnabledState(false, true, true, false, false, false, false);
                    }
                    break;
                case 'stateVariablesFilterBtn':
                    if(!this.togglesMap[controlId]){
                        // state variables being toggled on, untoggle visual instances and params, leave the rest untouched
                        this.setButtonsToggledState(false, true, false, this.togglesMap['activeExperimentFilterBtn'].toggled, this.togglesMap['anyExperimentFilterBtn'].toggled, this.togglesMap['anyProjectFilterBtn'].toggled, this.togglesMap['recordedFilterBtn'].toggled);
                        // disables itself (cannot be untoggled unless other stuff is clicked) enable everything else
                        this.setButtonsEnabledState(true, false, true, true, true, true, true);
                    }
                    break;
                case 'parametersFilterBtn':
                    if(!this.togglesMap[controlId]){
                        // parameters being toggled on, untoggle visual instances and state vars, leave the rest untouched and untoggle recording
                        this.setButtonsToggledState(false, false, true, this.togglesMap['activeExperimentFilterBtn'].toggled, this.togglesMap['anyExperimentFilterBtn'].toggled, this.togglesMap['anyProjectFilterBtn'].toggled, false);
                        // enable everything except recording and itself (it can only be untoggled by clicking something else)
                        this.setButtonsEnabledState(true, true, false, true, true, true, false);
                    }
                    break;
                case 'activeExperimentFilterBtn':
                    if(!this.togglesMap[controlId]){
                        // active experiment filter being toggled on, untoggle any experiment and any project, leave the rest alone
                        this.setButtonsToggledState(this.togglesMap['visualInstancesFilterBtn'].toggled, this.togglesMap['stateVariablesFilterBtn'].toggled, this.togglesMap['parametersFilterBtn'].toggled, true, false, false, this.togglesMap['recordedFilterBtn'].toggled);
                        // enable everything except recording keep as is and disable itself (it can only be untoggled by clicking something else)
                        this.setButtonsEnabledState(true, true, true, false, true, true, this.togglesMap['recordedFilterBtn'].enabled);
                    }
                    break;
                case 'anyExperimentFilterBtn':
                    if(!this.togglesMap[controlId]){
                        // auto-toggle recording if state vars filter is toggled (can only look at recorded state vars for external experiments) otherwise leave as is
                        var recordingToggleStatus = this.togglesMap['visualInstancesFilterBtn'].toggled ? true : this.togglesMap['recordedFilterBtn'].toggled;
                        // any experiment filter being toggled on, untoggle active experiment and any project, leave the rest alone
                        this.setButtonsToggledState(this.togglesMap['visualInstancesFilterBtn'].toggled, this.togglesMap['stateVariablesFilterBtn'].toggled, this.togglesMap['parametersFilterBtn'].toggled, false, true, false, recordingToggleStatus);
                        // enable everything except recording disabled is and disable itself (it can only be untoggled by clicking something else)
                        this.setButtonsEnabledState(true, true, true, true, false, true, false);
                    }
                    break;
                case 'anyProjectFilterBtn':
                    if(!this.togglesMap[controlId]){
                        // auto-toggle recording if state vars filter is toggled (can only look at recorded state vars for external projects/experiments) otherwise leave as is
                        var recordingToggleStatus = this.togglesMap['visualInstancesFilterBtn'].toggled ? true : this.togglesMap['recordedFilterBtn'].toggled;
                        // any project filter being toggled on, untoggle active experiment and any experiment, leave the rest alone
                        this.setButtonsToggledState(this.togglesMap['visualInstancesFilterBtn'].toggled, this.togglesMap['stateVariablesFilterBtn'].toggled, this.togglesMap['parametersFilterBtn'].toggled, false, false, true, recordingToggleStatus);
                        // enable everything except recording disabled and disable itself (it can only be untoggled by clicking something else)
                        this.setButtonsEnabledState(true, true, true, true, true, false, false);
                    }
                    break;
                case 'recordedFilterBtn':
                    // this filter is independent, if it's enabled it can toggle/untoggle itself
                    this.setState({ recordedFilterToggled: !this.togglesMap[controlId]});
                    break;
            }

            // logic for routing here to the injected filter handler based on what's toggled and whatnot
            var filterHandler = this.props.filterHandler;
            if(this.state.visualFilterToggled){
                filterHandler('VISUAL_INSTANCES');
            } else if(this.state.stateVarsFilterToggled){
                if(this.state.activeExperimentFilterToggled && this.state.recordedFilterToggled){
                    filterHandler('ACTIVE_RECORDED_STATE_VARIABLES');
                } else if(this.state.activeExperimentFilterToggled && !this.state.recordedFilterToggled){
                    filterHandler('ACTIVE_STATE_VARIABLES');
                } else if(this.state.anyExperimentFilterToggled){
                    filterHandler('ANY_EXPERIMENT_RECORDED_STATE_VARIABLES');
                } else if(this.state.anyProjectFilterToggled){
                    filterHandler('ANY_PROJECT_GLOBAL_STATE_VARIABLES');
                }
            } else if (this.state.paramsFilterToggled){
                if(this.state.activeExperimentFilterToggled){
                    filterHandler('ACTIVE_PARAMETERS');
                } else if(this.state.anyExperimentFilterToggled){
                    filterHandler('ANY_EXPERIMENT_PARAMETERS');
                } else if(this.state.anyProjectFilterToggled){
                    filterHandler('ANY_PROJECT_PARAMETERS');
                }
            }
        },

        render: function () {
            var that = this;
            var vizConfig = {
                condition: function(){return that.state.visualFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'Visual Instances',
                    tooltip: ''
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'Visual Instances',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };
            var stateVarConfig = {
                condition: function(){return that.state.stateVarsFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'State Vars',
                    tooltip: ''
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'State Vars',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };
            var paramConfig = {
                condition: function(){return that.state.paramsFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'Parameters',
                    tooltip: ''
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'Parameters',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };
            var activeConfig = {
                condition: function(){return that.state.activeExperimentFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'Active Experiment',
                    tooltip: 'Active Experiment toggled'
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'Active Experiment',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };
            var anyExpConfig = {
                condition: function(){return that.state.anyExperimentFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'Any Experiment',
                    tooltip: ''
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'Any Experiment',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };
            var anyProjConfig = {
                condition: function(){return that.state.anyProjectFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'Any Project',
                    tooltip: ''
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'Any Project',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };
            var recordedConfig = {
                condition: function(){return that.state.recordedFilterToggled;},
                true: {
                    icon: '',
                    action: '',
                    label: 'Recorded',
                    tooltip: ''
                },
                false: {
                    icon: '',
                    action: '',
                    label: 'Recorded',
                    tooltip: ''
                },
                clickHandler: this.computeResult
            };

            return (
                <div>
                    <div>
                        <ToggleButton id="visualInstancesFilterBtn" disabled={!this.state.visualFilterEnabled} toggled={this.state.visualFilterToggled} configuration={vizConfig} />
                        <ToggleButton id="stateVariablesFilterBtn" disabled={!this.state.stateVarsFilterEnabled} toggled={this.state.stateVarsFilterToggled} configuration={stateVarConfig} />
                        <ToggleButton id="parametersFilterBtn" disabled={!this.state.paramsFilterEnabled} toggled={this.state.paramsFilterToggled} configuration={paramConfig} />
                    </div>
                    <div>
                        <ToggleButton id="activeExperimentFilterBtn" disabled={!this.state.activeExperimentFilterEnabled} toggled={this.state.activeExperimentFilterToggled} configuration={activeConfig} />
                        <ToggleButton id="anyExperimentFilterBtn" disabled={!this.state.anyExperimentFilterEnabled} toggled={this.state.anyExperimentFilterToggled} configuration={anyExpConfig} />
                        <ToggleButton id="anyProjectFilterBtn" disabled={!this.state.anyProjectFilterEnabled} toggled={this.state.anyProjectFilterToggled} configuration={anyProjConfig} />
                    </div>
                    <div>
                        <ToggleButton id="recordedFilterBtn" disabled={!this.state.recordedFilterEnabled} toggled={this.state.recordedFilterToggled} configuration={recordedConfig} />
                    </div>
                </div>
            )
        }
    });

    // Control panel default configuration
    var defaultControlPanelColumnMeta = [
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
    var defaultDataFilter = function(entities){
        return GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, entities);
    };

    //Control panel initialization
    var createPlotButtonMenuItems = function(projectId, experimentId, instance){
        var menuButtonItems = [];
        var plots = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets();
        if(plots.length > 0){
            for(var i =0 ; i<plots.length; i++){
                menuButtonItems.push({
                    label: "Add to " +plots[i].getId(),
                    action:"GEPPETTO.ControlPanel.plotController.plotStateVariable(" + projectId + "," + experimentId + ",'" + instance + "'," + plots[i].getId() + ")",
                    value: "plot_variable"
                });
            }
        }else{
            //add default item
            menuButtonItems.push({
                label: "Add new plot ",
                action:"GEPPETTO.ControlPanel.plotController.plotStateVariable(" + projectId + "," + experimentId + ",'" + instance + "')",
                value: "plot_variable"
            });
        }

        return menuButtonItems;
    };

    // Control panel filter default configurations
    // instances config
    var instancesColumnMeta = [
        {
            "columnName": "projectId",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "Project Id"
        },
        {
            "columnName": "experimentId",
            "order": 2,
            "locked": false,
            "visible": true,
            "displayName": "Experiment Id"
        },
        {
            "columnName": "path",
            "order": 3,
            "locked": false,
            "visible": true,
            "displayName": "Path",
            "source": "$entity$.getPath()"
        },
        {
            "columnName": "name",
            "order": 4,
            "locked": false,
            "visible": true,
            "displayName": "Name",
            "source": "$entity$.getPath()",
            "cssClassName": "control-panel-path-column",
        },
        {
            "columnName": "controls",
            "order": 5,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ControlsComponent,
            "displayName": "Controls",
            "source": "",
            "actions": "GEPPETTO.ControlPanel.refresh();",
            "cssClassName": "controlpanel-controls-column"
        },
        {
            "columnName": "type",
            "order": 6,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ArrayComponent,
            "displayName": "Type(s)",
            "source": "$entity$.getTypes().map(function (t) {return t.getPath()})",
            "actions": "G.addWidget(3).setData($entity$).setName('$entity$')",
            "cssClassName": "control-panel-type-column"
        },
    ];
    var instancesCols = ['name', 'type', 'controls'];
    var instancesControlsConfiguration = {
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
            }, "visibility": {
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
        "StateVariableCapability": {
            "watch": {
                "showCondition": "GEPPETTO.UserController.canUserEditExperiment() && (window.Project.getId() == $projectId$ && window.Project.getActiveExperiment().getId() == $experimentId$)",
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
                "id": "plot",
                "actions": [
                    "window.PlotController.plotStateVariable($projectId$, $experimentId$, '$instance$')",
                ],
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "icon": "fa-area-chart",
                "label": "Plot",
                "tooltip": "Plot state variable in a new widget"
            },
            //dynamic menu button, no initial list of items, and adds menu items on the go as plots are created
            "plot2": {
                "menu" :true,
                "menuMaker" : createPlotButtonMenuItems,
                "actions" :["GEPPETTO.ControlPanel.refresh();"],
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "id": "plot2",
                "icon": "fa-line-chart",
                "label": "Plot2",
                "tooltip": "Plot state variable in a an existing widget"
            }
        },
        "Common": {}
    };
    var instancesControls = {
        "Common": [],
        "VisualCapability": ['color', 'randomcolor', 'visibility', 'zoom'],
        "StateVariableCapability": ['watch', 'plot','plot2']
    };

    // state variables config (treated as potential instances)
    var stateVariablesColMeta = [
        {
            "columnName": "projectId",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "Project Id"
        },
        {
            "columnName": "experimentId",
            "order": 2,
            "locked": false,
            "visible": true,
            "displayName": "Experiment Id"
        },
        {
            "columnName": "path",
            "order": 3,
            "locked": false,
            "visible": true,
            "displayName": "Path"
        },
        {
            "columnName": "projectName",
            "order": 4,
            "locked": false,
            "visible": true,
            "displayName": "Project"
        },
        {
            "columnName": "experimentName",
            "order": 5,
            "locked": false,
            "visible": true,
            "displayName": "Experiment"
        },
        {
            "columnName": "name",
            "order": 6,
            "locked": false,
            "visible": true,
            "displayName": "Name",
            "cssClassName": "control-panel-path-column",
        },
        {
            "columnName": "controls",
            "order": 7,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ControlsComponent,
            "displayName": "Controls",
            "source": "",
            "actions": "GEPPETTO.ControlPanel.refresh();",
            "cssClassName": "controlpanel-controls-column"
        },
        {
            "columnName": "type",
            "order": 8,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ArrayComponent,
            "displayName": "Type(s)",
            "actions": "G.addWidget(3).setData($entity$).setName('$entity$')",
            "cssClassName": "control-panel-type-column"
        }
    ];
    var stateVariablesCols = ['name', 'type', 'controls'];
    var stateVariablesColsWithExperiment = ['name', 'type', 'controls', 'experimentName'];
    var stateVariablesColsWithProjectAndExperiment = ['name', 'type', 'controls', 'projectName', 'experimentName'];
    var stateVariablesControlsConfig = {
        "Common": {
            "watch": {
                "showCondition": "GEPPETTO.UserController.canUserEditExperiment() && (window.Project.getId() == $projectId$ && window.Project.getActiveExperiment().getId() == $experimentId$)",
                "condition": "(function(){ var inst = undefined; try {inst = eval('$instance$');}catch(e){} if(inst != undefined){ return GEPPETTO.ExperimentsController.isWatched($instances$); } else { return false; } })();",
                "false": {
                    "actions": ["var inst = Instances.getInstance('$instance$'); GEPPETTO.ExperimentsController.watchVariables([inst],true);"],
                    "icon": "fa-circle-o",
                    "label": "Not recorded",
                    "tooltip": "Record the state variable"
                },
                "true": {
                    "actions": ["var inst = Instances.getInstance('$instance$'); GEPPETTO.ExperimentsController.watchVariables([inst],false);"],
                    "icon": "fa-dot-circle-o",
                    "label": "Recorded",
                    "tooltip": "Stop recording the state variable"
                }
            },
            "plot": {
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "id": "plot",
                "actions": [
                    "window.PlotController.plotStateVariable($projectId$, $experimentId$, '$instance$')",
                ],
                "icon": "fa-area-chart",
                "label": "Plot",
                "tooltip": "Plot state variable in a new widget"
            },
            //dynamic menu button, no initial list of items, and adds menu items on the go as plots are created
            "plot2": {
                "menu" :true,
                "menuMaker" : createPlotButtonMenuItems,
                "actions" :["GEPPETTO.ControlPanel.refresh();"],
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "id": "plot2",
                "icon": "fa-line-chart",
                "label": "Plot2",
                "tooltip": "Plot state variable in a an existing widget"
            }
        }
    };
    var stateVariablesControls = { "Common": ['watch', 'plot','plot2'] };

    // parameters config (treated as potential instances)
    var parametersColMeta = [
        {
            "columnName": "projectId",
            "order": 1,
            "locked": false,
            "visible": true,
            "displayName": "Project Id",
        },
        {
            "columnName": "experimentId",
            "order": 2,
            "locked": false,
            "visible": true,
            "displayName": "Experiment Id",
        },
        {
            "columnName": "path",
            "order": 3,
            "locked": false,
            "visible": true,
            "displayName": "Path"
        },
        {
            "columnName": "projectName",
            "order": 4,
            "locked": false,
            "visible": true,
            "displayName": "Project",
        },
        {
            "columnName": "experimentName",
            "order": 5,
            "locked": false,
            "visible": true,
            "displayName": "Experiment",
        },
        {
            "columnName": "name",
            "order": 6,
            "locked": false,
            "visible": true,
            "displayName": "Name",
            "cssClassName": "control-panel-parameter-path-column",
        },
        {
            "columnName": "value",
            "order": 7,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ParameterInputComponent,
            "displayName": "Value",
            "actions": "$entity$.setValue($VALUE$)",
            "readOnlyCondition": "!GEPPETTO.UserController.canUserEditExperiment() || !(window.Project.getId() == $projectId$ && window.Project.getActiveExperiment().getId() == $experimentId$)",
            "cssClassName": "control-panel-value-column",
        },
        {
            "columnName": "type",
            "order": 8,
            "locked": false,
            "visible": true,
            "customComponent": GEPPETTO.ArrayComponent,
            "displayName": "Type(s)",
            "actions": "G.addWidget(3).setData($entity$).setName('$entity$')",
            "cssClassName": "control-panel-type-column"
        },
        {
            "columnName": "unit",
            "order": 9,
            "locked": false,
            "visible": false
        },
        {
            "columnName": "fetched_value",
            "order": 10,
            "locked": false,
            "visible": false
        }
    ];
    var paramsCols = ['name', 'type', 'value'];
    var paramsColsWithExperiment = ['name', 'type', 'value', 'experimentName'];
    var paramsColsWithProjectAndExperiment = ['name', 'type', 'value', 'projectName', 'experimentName'];
    var parametersControlsConfig = {};
    var parametersControls = { "Common": [] };

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
                columnMeta: defaultControlPanelColumnMeta
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

        resetControlPanel: function(columns, colMeta, controls, controlsConfig){
            // reset filter and wipe data
            this.setFilter('');
            this.clearData();

            // reset control panel parameters for display of tabular data
            this.setColumns(columns);
            this.setColumnMeta(colMeta);
            this.setControlsConfig(controlsConfig);
            this.setControls(controls);
        },

        filterOptionsHandler: function (value) {
            switch (value) {
                case 'VISUAL_INSTANCES':
                    // displays actual instances
                    resetControlPanel(instancesCols, instancesColumnMeta, instancesControls, instancesControlsConfiguration);

                    // do filtering (always the same)
                    var visualInstances = [];
                    if (window.Project.getActiveExperiment() != undefined) {
                        visualInstances = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, window.Instances).map(
                            function (item) {
                                return {
                                    path: item.getPath(),
                                    name: item.getPath(),
                                    type: [item.getType().getPath()],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(visualInstances);
                    }, 5);
                    break;
                case 'ACTIVE_STATE_VARIABLES':
                    // displays potential instances
                    resetControlPanel(stateVariablesCols, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var potentialStateVarInstances = [];
                    if (window.Project.getActiveExperiment() != undefined) {
                        // take all potential state variables instances
                        var filteredPaths = GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType('StateVariableType', undefined, true).filter(
                            function (item) {
                                // only include paths without stars (real paths)
                                return item.path.indexOf('*') == -1;
                            }
                        );
                        potentialStateVarInstances = filteredPaths.map(
                            function (item) {
                                return {
                                    path: item.path,
                                    name: item.path,
                                    type: ['Model.common.StateVariable'],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(potentialStateVarInstances);
                    }, 5);
                    break;
                case 'ACTIVE_RECORDED_STATE_VARIABLES':
                    // displays actual instances
                    resetControlPanel(instancesCols, instancesColumnMeta, instancesControls, instancesControlsConfiguration);

                    var recordedStateVars = [];
                    if (window.Project.getActiveExperiment() != undefined) {
                        // show all state variable instances (means they are recorded)
                        recordedStateVars = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY, window.Instances).map(
                            function (item) {
                                return {
                                    path: item.getPath(),
                                    name: item.getPath(),
                                    type: ['Model.common.StateVariable'],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(recordedStateVars);
                    }, 5);
                    break;
                case 'ANY_EXPERIMENT_RECORDED_STATE_VARIABLES':
                    // this will display potential instances with state variables col meta / controls
                    resetControlPanel(stateVariablesColsWithExperiment, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var projectStateVars = GEPPETTO.ProjectsController.getProjectStateVariables(window.Project.getId());

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(projectStateVars);
                    }, 5);
                    break;
                case 'ANY_PROJECT_GLOBAL_STATE_VARIABLES':
                    // this will display potential instances with state variables col meta / controls
                    resetControlPanel(stateVariablesColsWithProjectAndExperiment, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var globalStateVars = GEPPETTO.ProjectsController.getGlobalStateVariables(window.Project.getId(), false);

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(globalStateVars);
                    }, 5);
                    break;
                case 'ACTIVE_PARAMETERS':
                    // displays indexed parameters / similar to potential instances
                    resetControlPanel(paramsCols, parametersColMeta, parametersControls, parametersControlsConfig);

                    var potentialParamInstances = [];
                    if (window.Project.getActiveExperiment() != undefined) {
                        // take all parameters potential instances
                        potentialParamInstances = GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType('ParameterType', undefined, true).map(
                            function (item) {
                                return {
                                    path: item.path,
                                    name: item.path.replace(/Model\.neuroml\./gi, ''),
                                    type: ['Model.common.Parameter'],
                                    projectId: window.Project.getId(),
                                    experimentId: window.Project.getActiveExperiment().getId(),
                                    getPath: function () {
                                        return this.path;
                                    }
                                }
                            }
                        );
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(potentialParamInstances);
                    }, 5);
                    break;
                case 'ANY_EXPERIMENT_PARAMETERS':
                    // this will display potential instances with parameters col meta / controls
                    resetControlPanel(paramsColsWithExperiment, parametersColMeta, parametersControls, parametersControlsConfig);

                    var projectEditedParameters = GEPPETTO.ProjectsController.getProjectParameters(window.Project.getId());

                    // add any parameters edited in the current experiment that haven't been fetched
                    var parametersDictionary = {};
                    for (var i = 0; i < projectEditedParameters.length; i++) {
                        // if matching project/experiment id add to dictionary
                        if (projectEditedParameters[i].projectId == window.Project.getId() &&
                            projectEditedParameters[i].experimentId == window.Project.getActiveExperiment().getId()) {
                            parametersDictionary[projectEditedParameters[i].path] = projectEditedParameters[i];
                        }
                    }

                    // loop through parameters current experiment state to check if any parameters have been edited
                    var localParamEdit = window.Project.getActiveExperiment().setParameters;
                    for (var key in localParamEdit) {
                        // query the other dictionary, anything not found add to projectEditedParameters in the same format
                        if (parametersDictionary[key] == undefined) {
                            projectEditedParameters.unshift({
                                path: key,
                                name: key,
                                fetched_value: localParamEdit[key],
                                unit: undefined,
                                type: ['Model.common.Parameter'],
                                projectId: window.Project.getId(),
                                projectName: window.Project.getName(),
                                experimentId: window.Project.getActiveExperiment().getId(),
                                experimentName: window.Project.getActiveExperiment().getName(),
                                getPath: function () {
                                    return this.path;
                                }
                            });
                        }
                    }

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(projectEditedParameters);
                    }, 5);
                    break;
                case 'ANY_PROJECT_PARAMETERS':
                    // this will display potential instances with parameters col meta / controls
                    resetControlPanel(paramsColsWithProjectAndExperiment, parametersColMeta, parametersControls, parametersControlsConfig);

                    var globalEditedParameters = GEPPETTO.ProjectsController.getGlobalParameters(window.Project.getId(), false);

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    setTimeout(function () {
                        this.setData(globalEditedParameters);
                    }, 5);
                    break;
            }
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

            this.plotController = new PlotCtrlr();
            
            this.addData(window.Instances);
        },

        render: function () {
            var menuButtonMarkup = '';
            if (this.props.showMenuButton === true) {
                var controlPanelMenuButtonConfig = {
                    id: "controlPanelMenuButton",
                    openByDefault: false,
                    closeOnClick: true,
                    label: ' Options',
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

            var filterMarkup = '';
            if (this.props.useBuiltInFilters === true) {
                filterMarkup = (
                    <FilterComponent id="controlPanelBuiltInFilter" filterHandler={this.filterOptionsHandler} />
                );
            }

            return (
                <div id="controlpanel-container">
                    {menuButtonMarkup}
                    {filterMarkup}
                    <Griddle columns={this.state.columns} results={this.state.data}
                    showFilter={true} showSettings={false} enableInfiniteScroll={true} bodyHeight={400}
                    useGriddleStyles={false} columnMetadata={this.state.columnMeta} />
                </div>
            );
        }
    });

    return ControlPanel;
});
