define(function (require) {

    require('./ControlPanel.less');

    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    loadCss("geppetto/js/components/interface/controlPanel/vendor/css/bootstrap-colorpicker.min.css");

    //require('./vendor/css/bootstrap-colorpicker.min.css'); Matteo: This require is not working?!?

    var React = require('react'), $ = require('jquery');
    var Griddle = require('griddle-0.6-fork');
    var GEPPETTO = require('geppetto');
    var MenuButton = require('./../../controls/menuButton/MenuButton');
    var ToggleButton = require('./../../controls/toggleButton/ToggleButton');
    var colorpicker = require('./vendor/js/bootstrap-colorpicker.min');
    var PlotCtrlr = require('./../../widgets/plot/controllers/PlotsController');

    $.widget.bridge('uitooltip', $.ui.tooltip);

    GEPPETTO.ImageComponent = React.createClass({
        attachTooltip: function () {
            $('img[rel="tooltip"]').uitooltip({
                position: {my: "left+15 center", at: "right center"},
                tooltipClass: "tooltip-container",
                content: function () {
                    return this.getAttribute("title");
                },
            });
        },

        componentDidMount: function () {
            this.attachTooltip();
        },

        render: function () {
            var imgId = this.props.rowData.path.replace(/\./g, '_') + "_thumbnail";
            var titleValue = "<img src='" + this.props.data + "' class='thumbnail-img-tooltip'/>";

            var imgElement = "";
            if (this.props.data.indexOf("http") > -1) {
                imgElement = <img id={imgId} src={this.props.data} title={titleValue} className="thumbnail-img" rel="tooltip"/>
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
                GEPPETTO.CommandController.execute(actionStr, true);
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
                            var onClickActionStr = 'GEPPETTO.CommandController.execute("' + actionStr + '", true); return false;';
                            anchorElement.attr('onclick', onClickActionStr);

                            // retrieve markup to inject as string
                            var markupToInject = domObj.prop('outerHTML');

                            var getMarkup = function () {
                                return {__html: markupToInject};
                            };

                            return (
                                <span key={i} dangerouslySetInnerHTML={getMarkup()}/>
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
                                GEPPETTO.CommandController.execute(actionStr, true);
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
        refresh: function () {
            this.forceUpdate();
        },

        replaceTokensWithProjectExperimentIds: function (inputStr, projectId, experimentId) {
            return inputStr.replace(/\$projectId\$/gi, projectId).replace(/\$experimentId\$/gi, experimentId);
        },

        attachTooltip: function (content) {
            $('.control-panel-parameter-input').uitooltip({
                position: {my: "right+50", at: "left-100"},
                tooltipClass: "tooltip-container",
                content: content
            });
        },

        componentDidMount: function () {
            // listen to experiment status change and trigger a re-render to refresh input / read-only status
            GEPPETTO.on(GEPPETTO.Events.Experiment_completed, this.refresh, this);
            GEPPETTO.on(GEPPETTO.Events.Experiment_running, this.refresh, this);
            GEPPETTO.on(GEPPETTO.Events.Experiment_failed, this.refresh, this);
            var status = window.Project.getActiveExperiment().getStatus();
            if (GEPPETTO.UserController.hasPersistence() && !window.Project.persisted)
                this.attachTooltip("Save project (★) to enable editing.");
            else if (status != GEPPETTO.Resources.ExperimentStatus.DESIGN)
                this.attachTooltip("Experiment status is " + status + ". Create new experiment to enable parameter editing.");
        },

        componentWillUnmount: function () {
            GEPPETTO.off(GEPPETTO.Events.Experiment_failed, this.refresh, this);
            GEPPETTO.off(GEPPETTO.Events.Experiment_running, this.refresh, this);
            GEPPETTO.off(GEPPETTO.Events.Experiment_completed, this.refresh, this);
        },

        render: function () {
            // retrieve entity path
            var path = this.props.rowData.path;
            var projectId = this.props.rowData.projectId;
            var experimentId = this.props.rowData.experimentId;
            var entity = undefined;
            var unit = undefined;
            var defaultValue = undefined;
            var initialValue = undefined;

            if (this.props.rowData.fetched_value != undefined) {
                // we have a value in the record, we are dealing with an external item, it's not an actual entity that can be evaluated
                unit = this.props.rowData.unit;
                defaultValue = this.props.rowData.fetched_value - 1; //we don't have the default value and will never show it, this only allows for the value to show as edited
                initialValue = this.props.rowData.fetched_value;
            } else {
                try {
                    entity = eval(path);
                    // fetch unit
                    unit = entity.getUnit();
                    // fetch current or default value
                    defaultValue = entity.getInitialValue();
                    initialValue = entity.getValue();
                }
                catch (e) {
                    // something went horribly wrong - this should never happen
                    throw "ParameterInputComponent - could not eval path: " + path;
                }
            }

            // figure out if input is readonly, this is always true if not dealing with entities (entity == undefined)
            var readOnly = true;
            if (entity != undefined) {
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
            var onInputChangeHandler = function (event) {
                if (!readOnly) {
                    var newVal = event.target.value;

                    // only set if it's different than its current value, could be initial or set value
                    if (entity.getValue() != newVal) {
                        actionStr = actionStr.replace(/\$VALUE\$/gi, newVal);
                        actionStr = actionStr.replace(/\$entity\$/gi, path);
                        GEPPETTO.CommandController.execute(actionStr);
                        // refresh to trigger color update if edited from default
                        if (newVal != defaultValue) {
                            that.refresh();
                        }
                    }
                }
            };

            var onKeyPressHandler = function (event) {
                if (event.key == 'Enter') {
                    onInputChangeHandler(event);
                }
            };

            // if value is not default give it a different background
            var classString = (defaultValue === initialValue) ? "control-panel-parameter-input" : "control-panel-parameter-input control-panel-parameter-edited";

            // IMPORTANT NOTE: empty title tag in the markup below is needed or the tooltip stops working
            return (
                <div>
                    <input defaultValue={initialValue}
                           onBlur={onInputChangeHandler}
                           onKeyPress={onKeyPressHandler}
                           className={classString}
                           title=""
                           readOnly={readOnly}/>
                    <span className="control-panel-parameter-unit">{unit}</span>
                </div>
            )
        }
    });

    GEPPETTO.ControlsComponent = React.createClass({
        colorPickerBtnId: '',
        colorPickerActionFn: '',

        refresh: function () {
            this.forceUpdate();
        },

        replaceTokensWithPath: function (inputStr, path) {
            return inputStr.replace(/\$instance\$/gi, path).replace(/\$instances\$/gi, '[' + path + ']');
        },

        replaceTokensWithProjectExperimentIds: function (inputStr, projectId, experimentId) {
            return inputStr.replace(/\$projectId\$/gi, projectId).replace(/\$experimentId\$/gi, experimentId);
        },

        replaceAllTokensKnownToMan: function (inputStr, path, projectId, experimentId) {
            return this.replaceTokensWithProjectExperimentIds(this.replaceTokensWithPath(inputStr, path), projectId, experimentId);
        },

        getActionString: function (control, path, projectId, experimentId) {
            var actionStr = '';

            if (control.actions != null || undefined) {
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
            var that = this;

            // hookup color picker onChange
            if (this.colorPickerBtnId != '') {
                var path = this.props.rowData.path;
                var entity = eval(path);
                var defColor = '0Xffffff';

                // grab default color from instance
                if (entity.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                    defColor = entity.getColor();
                }
                var coloPickerElement = $('#' + this.colorPickerBtnId);
                coloPickerElement.colorpicker({format: 'hex', customClass: 'controlpanel-colorpicker'});

                if (defColor != undefined) {
                    var setColor = "";
                    if ($.isArray(defColor)) {
                        setColor = "0xfc6320";
                    }
                    else {
                        setColor = defColor.replace(/0X/i, "#");
                    }
                    // init dat color picker
                    coloPickerElement.colorpicker('setValue', setColor);
                }

                // closure on local scope at this point - hook on change event
                coloPickerElement.on('changeColor', function (e) {
                    that.colorPickerActionFn(e.color.toHex().replace("#", "0x"));
                    $(this).css("color", e.color.toHex());
                });
            }

            // listen to experiment status change and trigger a re-render to update controls
            GEPPETTO.on(GEPPETTO.Events.Experiment_completed, this.refresh, this);
            GEPPETTO.on(GEPPETTO.Events.Experiment_running, this.refresh, this);
            GEPPETTO.on(GEPPETTO.Events.Experiment_failed, this.refresh, this);
        },

        componentWillUnmount: function () {
            GEPPETTO.off(GEPPETTO.Events.Experiment_failed, this.refresh, this);
            GEPPETTO.off(GEPPETTO.Events.Experiment_running, this.refresh, this);
            GEPPETTO.off(GEPPETTO.Events.Experiment_completed, this.refresh, this);
        },


        // Utility method to iterate over a config property and populate a list of control buttons to be created
        addControlButtons: function (controlsConfig, showControlsConfig, configPropertyName, buttonsList, targetPath, projectId, experimentId) {
            for (var control in controlsConfig[configPropertyName]) {
                if ($.inArray(control.toString(), showControlsConfig[configPropertyName]) != -1) {
                    var add = true;

                    // check show condition
                    if (controlsConfig[configPropertyName][control].showCondition != undefined) {
                        var condition = this.replaceAllTokensKnownToMan(controlsConfig[configPropertyName][control].showCondition, targetPath, projectId, experimentId);
                        add = eval(condition);
                    }

                    if (add) {
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
                        if (control.menu != undefined && control.menu != null) {
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
                                GEPPETTO.CommandController.execute(actionStr, true);
                                // check custom action to run after configured command
                                if (that.props.metadata.actions != '' && that.props.metadata.actions != undefined) {
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
                            var color = entity.getColor();
                            if (color != undefined) {

                                var colorVal = ""
                                if ($.isArray(color)) {
                                    colorVal = "#fc6320";
                                }
                                else {
                                    colorVal = String(color.replace(/0X/i, "#") + "0000").slice(0, 7);
                                }

                                styleVal = {color: colorVal.startsWith('#') ? colorVal : ('#' + colorVal)};
                            }
                            classVal += " color-picker-button";
                        }

                        var controlPanelMenuButtonConfig = {};
                        if (control.menu) {
                            var menuButtonItems = [];
                            if (control.menuItems != null || control.menuItems != undefined) {
                                for (var i = 0; i < control.menuItems.length; i++) {
                                    var action = that.replaceAllTokensKnownToMan(control.menuItems[i].action, path, projectId, experimentId);
                                    control.menuItems[i].action = action;
                                }
                                menuButtonItems = control.menuItems;
                            } else {
                                menuButtonItems = control.menuMaker(projectId, experimentId, path);
                            }

                            controlPanelMenuButtonConfig = {
                                id: idVal,
                                openByDefault: false,
                                closeOnClick: true,
                                label: '',
                                iconOff: "",
                                iconOn: "",
                                containerClassName: "menuButtonContainer",
                                buttonClassName: "ctrlpanel-button fa " + controlConfig.icon,
                                menuPosition: null,
                                horizontalOffset: 107,
                                menuSize: {width: 150, height: 'auto'},
                                menuCSS: 'menuButtonStyle',
                                menuItems: menuButtonItems,
                                onClickHandler: actionFn
                            };
                        }
                        return (
                            <span key={id}>
                            {menuButton ?
                                <MenuButton ref={idVal} type={control.menuItemsType} configuration={controlPanelMenuButtonConfig}/>
                                :
                                <button id={idVal}
                                        className={classVal}
                                        style={styleVal}
                                        title={tooltip}
                                        onClick={
                                            controlConfig.id == "color" ? function () {
                                            } : actionFn
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

    var FilterComponent = React.createClass({

        optionsMap: {
            VISUAL_INSTANCES: ['visualInstancesFilterBtn'],
            ACTIVE_STATE_VARIABLES: ['stateVariablesFilterBtn', 'activeExperimentFilterBtn'],
            ACTIVE_RECORDED_STATE_VARIABLES: ['stateVariablesFilterBtn', 'activeExperimentFilterBtn', 'recordedFilterBtn'],
            ANY_EXPERIMENT_RECORDED_STATE_VARIABLES: ['stateVariablesFilterBtn', 'anyExperimentFilterBtn'],
            ANY_PROJECT_GLOBAL_STATE_VARIABLES: ['stateVariablesFilterBtn', 'anyProjectFilterBtn'],
            ACTIVE_PARAMETERS: ['parametersFilterBtn', 'activeExperimentFilterBtn'],
            ANY_EXPERIMENT_PARAMETERS: ['parametersFilterBtn', 'anyExperimentFilterBtn'],
            ANY_PROJECT_PARAMETERS: ['parametersFilterBtn', 'anyProjectFilterBtn']
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
                visualFilterVisible: true,
                stateVarsFilterVisible: true,
                paramsFilterVisible: true,
                activeExperimentFilterVisible: false,
                anyExperimentFilterVisible: false,
                anyProjectFilterVisible: false,
                recordedFilterVisible: false,
            };
        },

        setTogglesState: function (visualFilterToggledArg,
                                   stateVarsFilterToggledArg,
                                   paramsFilterToggledArg,
                                   activeExperimentFilterToggledArg,
                                   anyExperimentFilterToggledArg,
                                   anyProjectFilterToggledArg,
                                   recordedFilterToggledArg,
                                   visualFilterEnabledArg,
                                   stateVarsFilterEnabledArg,
                                   paramsFilterEnabledArg,
                                   activeExperimentFilterEnabledArg,
                                   anyExperimentFilterEnabledArg,
                                   anyProjectFilterEnabledArg,
                                   recordedFilterEnabledArg,
                                   visualFilterVisibleArg,
                                   stateVarsFilterVisibleArg,
                                   paramsFilterVisibleArg,
                                   activeExperimentFilterVisibleArg,
                                   anyExperimentFilterVisibleArg,
                                   anyProjectFilterVisibleArg,
                                   recordedFilterVisibleArg) {

            // manually set so it's available immediately after calling this method without waiting for next render
            // NOTE: doing set state the state is not available till the next render cycle
            this.state.visualFilterToggled = visualFilterToggledArg;
            this.state.stateVarsFilterToggled = stateVarsFilterToggledArg;
            this.state.paramsFilterToggled = paramsFilterToggledArg;
            this.state.activeExperimentFilterToggled = activeExperimentFilterToggledArg;
            this.state.anyExperimentFilterToggled = anyExperimentFilterToggledArg;
            this.state.anyProjectFilterToggled = anyProjectFilterToggledArg;
            this.state.recordedFilterToggled = recordedFilterToggledArg;
            this.state.visualFilterEnabled = visualFilterEnabledArg;
            this.state.stateVarsFilterEnabled = stateVarsFilterEnabledArg;
            this.state.paramsFilterEnabled = paramsFilterEnabledArg;
            this.state.activeExperimentFilterEnabled = activeExperimentFilterEnabledArg;
            this.state.anyExperimentFilterEnabled = anyExperimentFilterEnabledArg;
            this.state.anyProjectFilterEnabled = anyProjectFilterEnabledArg;
            this.state.recordedFilterEnabled = recordedFilterEnabledArg;
            this.state.visualFilterVisible = visualFilterVisibleArg;
            this.state.stateVarsFilterVisible = stateVarsFilterVisibleArg;
            this.state.paramsFilterVisible = paramsFilterVisibleArg;
            this.state.activeExperimentFilterVisible = activeExperimentFilterVisibleArg;
            this.state.anyExperimentFilterVisible = anyExperimentFilterVisibleArg;
            this.state.anyProjectFilterVisible = anyProjectFilterVisibleArg;
            this.state.recordedFilterVisible = recordedFilterVisibleArg;

            // force an update because we do want to re-render the filter component
            this.forceUpdate();
        },

        refreshToggleState: function(){
            // when control panel is open check if we have filter coming down from props
            if(this.props.filterOption != undefined){
                // retrieve items to toggle
                var buttonsToToggle = this.optionsMap[this.props.filterOption];
                if(buttonsToToggle != undefined){
                    for(var i=0; i<buttonsToToggle.length; i++){
                        this.computeResult(buttonsToToggle[i]);
                    }
                }
            } else if (!this.state.stateVarsFilterToggled && !this.state.paramsFilterToggled) {
                // if no other main component is toggled show visual instances
                // same logic as if viz instances filter was clicked
                this.computeResult('visualInstancesFilterBtn');
            }
        },

        componentDidMount: function () {
            GEPPETTO.on(GEPPETTO.Events.Control_panel_open, this.refreshToggleState, this);
        },

        componentWillUnmount: function () {
            GEPPETTO.off(GEPPETTO.Events.Control_panel_open, this.refreshToggleState, this);
        },

        computeResult: function (controlId) {
            // logic for disable/enable stuff here
            switch (controlId) {
                case 'visualInstancesFilterBtn':
                    if (!this.state.visualFilterToggled) {
                        this.setTogglesState(
                            // visual instance being toggled on, untoggle everything else
                            true, false, false, false, false, false, false,
                            // disable itself (so cannot be untoggled), enable state vars and params, disable the rest
                            false, true, true, false, false, false, false,
                            // set visibility only to visual instances, state vars and params as the rest doesnt apply
                            true, true, true, false, false, false, false
                        );
                    }
                    break;
                case 'stateVariablesFilterBtn':
                    if (!this.state.stateVarsFilterToggled) {
                        var activeExperimentToggleStatus = this.state.activeExperimentFilterToggled;
                        if (!(this.state.activeExperimentFilterToggled || this.state.anyExperimentFilterToggled || this.state.anyProjectFilterToggled)) {
                            // if state var is selected and none of the relevant sub-toggles are selected, select active experiment
                            activeExperimentToggleStatus = true;
                        }

                        this.setTogglesState(
                            // state variables being toggled on, untoggle visual instances and params, leave the rest untouched
                            false, true, false, activeExperimentToggleStatus, this.state.anyExperimentFilterToggled, this.state.anyProjectFilterToggled, activeExperimentToggleStatus,
                            // whatever is toggled is disabled
                            true, false, true, !activeExperimentToggleStatus, !this.state.anyExperimentFilterToggled, !this.state.anyProjectFilterToggled, activeExperimentToggleStatus,
                            // set visibility only to buttons that apply
                            true, true, true, true, true, true, activeExperimentToggleStatus
                        );
                    }
                    break;
                case 'parametersFilterBtn':
                    if (!this.state.paramsFilterToggled) {
                        var activeExperimentToggleStatus = this.state.activeExperimentFilterToggled;
                        if (!(this.state.activeExperimentFilterToggled || this.state.anyExperimentFilterToggled || this.state.anyProjectFilterToggled)) {
                            // if params is selected and none of the relevant sub-toggles are selected, select active experiment
                            activeExperimentToggleStatus = true;
                        }

                        this.setTogglesState(
                            // parameters being toggled on, untoggle visual instances and state vars, leave the rest untouched and untoggle recording
                            false, false, true, activeExperimentToggleStatus, this.state.anyExperimentFilterToggled, this.state.anyProjectFilterToggled, false,
                            // whatever is toggled is also disabled
                            true, true, false, !activeExperimentToggleStatus, !this.state.anyExperimentFilterToggled, !this.state.anyProjectFilterToggled, false,
                            // set visibility only to buttons that apply
                            true, true, true, true, true, true, false
                        );
                    }
                    break;
                case 'activeExperimentFilterBtn':
                    if (!this.state.activeExperimentFilterToggled) {
                        // recorded filter is only visible for state vars in the active experiment
                        // NOTE: this variable assignment is verbose but more readable
                        var recordedVisibility = this.state.stateVarsFilterToggled ? true : false;

                        this.setTogglesState(
                            // active experiment filter being toggled on, untoggle any experiment and any project, leave the rest alone
                            false, this.state.stateVarsFilterToggled, this.state.paramsFilterToggled, true, false, false, this.state.recordedFilterToggled,
                            // whatever is toggled needs to be disabled except recorded which is independent
                            true, !this.state.stateVarsFilterToggled, !this.state.paramsFilterToggled, false, true, true, recordedVisibility,
                            // keep visibility as is for record filter, the rest always visible
                            true, true, true, true, true, true, recordedVisibility
                        );
                    }
                    break;
                case 'anyExperimentFilterBtn':
                    if (!this.state.anyExperimentFilterToggled) {
                        // auto-toggle recording if state vars filter is toggled (can only look at recorded state vars for external experiments) otherwise leave as is
                        var recordingToggleStatus = this.state.visualFilterToggled ? true : this.state.recordedFilterToggled;

                        this.setTogglesState(
                            // any experiment filter being toggled on, untoggle active experiment and any project, leave the rest alone
                            this.state.visualFilterToggled, this.state.stateVarsFilterToggled, this.state.paramsFilterToggled, false, true, false, recordingToggleStatus,
                            // enable everything except recording disabled is and disable itself (it can only be untoggled by clicking something else)
                            !this.state.visualFilterToggled, !this.state.stateVarsFilterToggled, !this.state.paramsFilterToggled, true, false, true, false,
                            // recorded never applies so hide (external stuff is always recorded)
                            true, true, true, true, true, true, recordingToggleStatus
                        );
                    }
                    break;
                case 'anyProjectFilterBtn':
                    if (!this.state.anyProjectFilterToggled) {
                        // auto-toggle recording if state vars filter is toggled (can only look at recorded state vars for external projects/experiments) otherwise leave as is
                        var recordingToggleStatus = this.state.visualFilterToggled ? true : this.state.recordedFilterToggled;

                        this.setTogglesState(
                            // any project filter being toggled on, untoggle active experiment and any experiment, leave the rest alone
                            this.state.visualFilterToggled, this.state.stateVarsFilterToggled, this.state.paramsFilterToggled, false, false, true, recordingToggleStatus,
                            // enable everything except recording disabled and disable itself (it can only be untoggled by clicking something else)
                            !this.state.visualFilterToggled, !this.state.stateVarsFilterToggled, !this.state.paramsFilterToggled, true, true, false, false,
                            // recorded is visible is state vars are selected but disabled (external stuff is always recorded)
                            true, true, true, true, true, true, recordingToggleStatus
                        );
                    }
                    break;
                case 'recordedFilterBtn':
                    // just flip the toggle status on click, this filter is independent, if it's enabled it can toggle/untoggle itself
                    this.state.recordedFilterToggled = !this.state.recordedFilterToggled;
                    this.forceUpdate();
                    break;
            }

            // this will cause the control panel to refresh data based on injected filter handler
            var filterHandler = this.props.filterHandler;
            if (this.state.visualFilterToggled) {
                filterHandler(controlPanelFilterOptions.VISUAL_INSTANCES);
            } else if (this.state.stateVarsFilterToggled) {
                if (this.state.activeExperimentFilterToggled && this.state.recordedFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ACTIVE_RECORDED_STATE_VARIABLES);
                } else if (this.state.activeExperimentFilterToggled && !this.state.recordedFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ACTIVE_STATE_VARIABLES);
                } else if (this.state.anyExperimentFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ANY_EXPERIMENT_RECORDED_STATE_VARIABLES);
                } else if (this.state.anyProjectFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ANY_PROJECT_GLOBAL_STATE_VARIABLES);
                }
            } else if (this.state.paramsFilterToggled) {
                if (this.state.activeExperimentFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ACTIVE_PARAMETERS);
                } else if (this.state.anyExperimentFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ANY_EXPERIMENT_PARAMETERS);
                } else if (this.state.anyProjectFilterToggled) {
                    filterHandler(controlPanelFilterOptions.ANY_PROJECT_PARAMETERS);
                }
            }
        },

        render: function () {
            var that = this;
            var vizConfig = {
                id: 'visualInstancesFilterBtn',
                condition: function () {
                    return that.state.visualFilterToggled;
                },
                true: {
                    icon: 'gpt-3dshape',
                    action: '',
                    label: '',
                    tooltip: 'Visual objects'
                },
                false: {
                    icon: 'gpt-3dshape',
                    action: '',
                    label: '',
                    tooltip: 'Visual objects'
                },
                clickHandler: this.computeResult
            };
            var stateVarConfig = {
                id: 'stateVariablesFilterBtn',
                condition: function () {
                    return that.state.stateVarsFilterToggled;
                },
                true: {
                    icon: 'fa fa-superscript',
                    action: '',
                    label: '',
                    tooltip: 'State variables'
                },
                false: {
                    icon: 'fa fa-superscript',
                    action: '',
                    label: '',
                    tooltip: 'State variables'
                },
                clickHandler: this.computeResult
            };
            var paramConfig = {
                id: 'parametersFilterBtn',
                condition: function () {
                    return that.state.paramsFilterToggled;
                },
                true: {
                    icon: 'fa fa-sliders',
                    action: '',
                    label: '',
                    tooltip: 'Parameters'
                },
                false: {
                    icon: 'fa fa-sliders',
                    action: '',
                    label: '',
                    tooltip: 'Parameters'
                },
                clickHandler: this.computeResult
            };
            var activeConfig = {
                id: 'activeExperimentFilterBtn',
                condition: function () {
                    return that.state.activeExperimentFilterToggled;
                },
                true: {
                    icon: 'gpt-activeExp',
                    action: '',
                    tooltip: 'Active Experiment',
                    label: ''
                },
                false: {
                    icon: 'gpt-activeExp',
                    action: '',
                    tooltip: 'Active Experiment',
                    label: ''
                },
                clickHandler: this.computeResult
            };
            var anyExpConfig = {
                id: 'anyExperimentFilterBtn',
                condition: function () {
                    return that.state.anyExperimentFilterToggled;
                },
                tooltipPosition: {my: "center bottom", at: "center-50 top-10"},
                true: {
                    icon: 'fa fa-flask',
                    action: '',
                    tooltip: 'Look in any Experiment for the current project',
                    label: ''
                },
                false: {
                    icon: 'fa fa-flask',
                    action: '',
                    tooltip: 'Look in any Experiment for the current project',
                    label: ''
                },
                clickHandler: this.computeResult
            };
            var anyProjConfig = {
                id: 'anyProjectFilterBtn',
                condition: function () {
                    return that.state.anyProjectFilterToggled;
                },
                tooltipPosition: {my: "center bottom", at: "center-50 top-10"},
                true: {
                    icon: 'fa fa-globe',
                    action: '',
                    tooltip: 'Look in any of your projects',
                    label: ''
                },
                false: {
                    icon: 'fa fa-globe',
                    action: '',
                    tooltip: 'Look in any of your projects',
                    label: ''
                },
                clickHandler: this.computeResult
            };
            var recordedConfig = {
                id: 'recordedFilterBtn',
                condition: function () {
                    return that.state.recordedFilterToggled;
                },
                true: {
                    icon: 'fa fa-dot-circle-o',
                    action: '',
                    tooltip: 'Recorded variables',
                    label: ''
                },
                false: {
                    icon: 'fa fa-dot-circle-o',
                    action: '',
                    tooltip: 'Recorded variables',
                    label: ''
                },
                clickHandler: this.computeResult
            };

            return (
                <div className="built-in-filter">
                    <div className="left-filter-panel">
                        <ToggleButton id="visualInstancesFilterBtn" ignoreProjectEvents={true} hidden={!this.state.visualFilterVisible}
                                      disabled={!this.state.visualFilterEnabled} toggled={this.state.visualFilterToggled}
                                      configuration={vizConfig} className="control-panel-filter-toggle"/>
                        <ToggleButton id="stateVariablesFilterBtn" ignoreProjectEvents={true} hidden={!this.state.stateVarsFilterVisible}
                                      disabled={!this.state.stateVarsFilterEnabled} toggled={this.state.stateVarsFilterToggled}
                                      configuration={stateVarConfig} className="control-panel-filter-toggle"/>
                        <ToggleButton id="parametersFilterBtn" ignoreProjectEvents={true} hidden={!this.state.paramsFilterVisible}
                                      disabled={!this.state.paramsFilterEnabled} toggled={this.state.paramsFilterToggled}
                                      configuration={paramConfig} className="control-panel-filter-toggle"/>
                    </div>
                    <div className="right-filter-panel">
                        <ToggleButton id="recordedFilterBtn" ignoreProjectEvents={true} hidden={!this.state.recordedFilterVisible}
                                      disabled={!this.state.recordedFilterEnabled} toggled={this.state.recordedFilterToggled}
                                      configuration={recordedConfig} className="control-panel-filter-toggle"/>
                        <ToggleButton id="activeExperimentFilterBtn" ignoreProjectEvents={true} hidden={!this.state.activeExperimentFilterVisible}
                                      disabled={!this.state.activeExperimentFilterEnabled} toggled={this.state.activeExperimentFilterToggled}
                                      configuration={activeConfig} className="control-panel-filter-toggle"/>
                        <ToggleButton id="anyExperimentFilterBtn" ignoreProjectEvents={true} hidden={!this.state.anyExperimentFilterVisible}
                                      disabled={!this.state.anyExperimentFilterEnabled} toggled={this.state.anyExperimentFilterToggled}
                                      configuration={anyExpConfig} className="control-panel-filter-toggle"/>
                        <ToggleButton id="anyProjectFilterBtn" ignoreProjectEvents={true} hidden={!this.state.anyProjectFilterVisible}
                                      disabled={!this.state.anyProjectFilterEnabled} toggled={this.state.anyProjectFilterToggled}
                                      configuration={anyProjConfig} className="control-panel-filter-toggle"/>
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
            "actions": "G.addWidget(3).then(w=>{w.setData($entity$).setName('$entity$');});"
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
        "Common": {}
    };
    var defaultDataFilter = function (entities) {
        return GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.VISUAL_CAPABILITY, entities);
    };

    //Control panel initialization
    var createPlotButtonMenuItems = async function (projectId, experimentId, instance) {
        var menuButtonItems = [];
        var controller = await GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT);
        var plots = controller.getWidgets()
            .filter(function (plot) {
                return !controller.isColorbar(plot);
            });
        if (plots.length > 0) {
            for (var i = 0; i < plots.length; i++) {
                menuButtonItems.push({
                    label: "Add to " + plots[i].getId(),
                    action: "GEPPETTO.ControlPanel.plotController.plotStateVariable(" + projectId + "," + experimentId + ",'" + instance + "'," + plots[i].getId() + ")",
                    value: "plot_variable"
                });
            }
        } else {
            //add default item
            menuButtonItems.push({
                label: "Add new plot ",
                action: "GEPPETTO.ControlPanel.plotController.plotStateVariable(" + projectId + "," + experimentId + ",'" + instance + "')",
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
            "actions": "G.addWidget(3).then(w=>{w.setData($entity$).setName('$entity$');});",
            "cssClassName": "control-panel-type-column"
        },
    ];
    var instancesCols = ['name', 'type', 'controls'];
    var instancesColsWithoutType = ['name', 'controls'];
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
                    "GEPPETTO.ControlPanel.plotController.plotStateVariable($projectId$, $experimentId$, '$instance$')",
                ],
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "icon": "fa-area-chart",
                "label": "Plot",
                "tooltip": "Plot state variable in a new widget"
            },
            //dynamic menu button, no initial list of items, and adds menu items on the go as plots are created
            "plot2": {
                "menu": true,
                "menuMaker": createPlotButtonMenuItems,
                "actions": ["GEPPETTO.ControlPanel.refresh();"],
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "id": "plot2",
                "icon": "gpt-addplot",
                "label": "Plot2",
                "tooltip": "Plot state variable in a an existing widget"
            }
        },
        "Common": {}
    };
    var instancesControls = {
        "Common": [],
        "VisualCapability": ['color', 'randomcolor', 'visibility', 'zoom'],
        "StateVariableCapability": ['watch', 'plot', 'plot2']
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
            "actions": "G.addWidget(3).then(w=>{w.setData($entity$).setName('$entity$');});",
            "cssClassName": "control-panel-type-column"
        }
    ];
    var stateVariablesCols = ['name', 'controls'];
    var stateVariablesColsWithExperiment = ['name', 'controls', 'experimentName'];
    var stateVariablesColsWithProjectAndExperiment = ['name', 'controls', 'projectName', 'experimentName'];
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
                    "GEPPETTO.ControlPanel.plotController.plotStateVariable($projectId$, $experimentId$, '$instance$')",
                ],
                "icon": "fa-area-chart",
                "label": "Plot",
                "tooltip": "Plot state variable in a new widget"
            },
            //dynamic menu button, no initial list of items, and adds menu items on the go as plots are created
            "plot2": {
                "menu": true,
                "menuMaker": createPlotButtonMenuItems,
                "actions": ["GEPPETTO.ControlPanel.refresh();"],
                "showCondition": "GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal($projectId$, $experimentId$, '$instance$');",
                "id": "plot2",
                "icon": "gpt-addplot",
                "label": "Plot2",
                "tooltip": "Plot state variable in a an existing widget"
            }
        }
    };
    var stateVariablesControls = {"Common": ['watch', 'plot', 'plot2']};

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
            "actions": "G.addWidget(3).then(w=>{w.setData($entity$).setName('$entity$');});",
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
    var paramsCols = ['name', 'value'];
    var paramsColsWithExperiment = ['name', 'value', 'experimentName'];
    var paramsColsWithProjectAndExperiment = ['name', 'value', 'projectName', 'experimentName'];
    var parametersControlsConfig = {};
    var parametersControls = {"Common": []};

    var controlPanelFilterOptions = {
        VISUAL_INSTANCES: 'VISUAL_INSTANCES',
        ACTIVE_STATE_VARIABLES: 'ACTIVE_STATE_VARIABLES',
        ACTIVE_RECORDED_STATE_VARIABLES: 'ACTIVE_RECORDED_STATE_VARIABLES',
        ANY_EXPERIMENT_RECORDED_STATE_VARIABLES: 'ANY_EXPERIMENT_RECORDED_STATE_VARIABLES',
        ANY_PROJECT_GLOBAL_STATE_VARIABLES: 'ANY_PROJECT_GLOBAL_STATE_VARIABLES',
        ACTIVE_PARAMETERS: 'ACTIVE_PARAMETERS',
        ANY_EXPERIMENT_PARAMETERS: 'ANY_EXPERIMENT_PARAMETERS',
        ANY_PROJECT_PARAMETERS: 'ANY_PROJECT_PARAMETERS'
    };

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',
        filterOptions: controlPanelFilterOptions,

        refresh: function () {
            this.forceUpdate();
        },

        refreshData: function () {
            var self = this;
            var callback = function () {
                self.forceUpdate();
            };
            GEPPETTO.ProjectsController.refreshUserProjects(callback);
        },

        getInitialState: function () {
            return {
                columns: ['name', 'type', 'controls'],
                data: [],
                controls: {"Common": [], "VisualCapability": ['color', 'randomcolor', 'visibility', 'zoom']},
                controlsConfig: defaultControlsConfiguration,
                dataFilter: defaultDataFilter,
                columnMeta: defaultControlPanelColumnMeta,
                filterOption: this.VISUAL_INSTANCES
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

        addData: function (instances) {
            if (instances != undefined && instances.length > 0) {

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
                    for (var k = 0; k < gridInput.length; k++) {
                        if (gridInput[k].path == entityPath) {
                            isDuplicate = true;
                        }
                    }

                    if (!isDuplicate) {
                        // loop column meta and grab column names + source
                        for (var j = 0; j < columnMeta.length; j++) {
                            // eval result - empty string by default so griddle doesn't complain
                            var result = '';
                            if (columnMeta[j].source != undefined) {
                                var sourceActionStr = columnMeta[j].source;

                                // replace token with path from input entity
                                sourceActionStr = sourceActionStr.replace(/\$entity\$/gi, entityPath);

                                try {
                                    if (sourceActionStr != "") {
                                        result = eval(sourceActionStr);
                                    }
                                } catch (e) {
                                    GEPPETTO.CommandController.log(GEPPETTO.Resources.CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT + " " + sourceActionStr, true);
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

        deleteData: function (instancePaths) {
            if (instancePaths != undefined && instancePaths.length > 0) {
                // grab existing input
                var gridInput = this.state.data;
                var newGridInput = [];

                // remove unwanted instances from grid input
                for (var i = 0; i < instancePaths.length; i++) {
                    for (var j = 0; j < gridInput.length; j++) {
                        if (instancePaths[i] != gridInput[j].path) {
                            newGridInput.push(gridInput[j]);
                        }
                    }
                }

                // set state to refresh grid
                if (gridInput.length != newGridInput.length) {
                    this.setState({data: newGridInput});
                }
            }
        },

        clearData: function () {
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
                for (var j = 0; j < columnMeta.length; j++) {
                    // eval result - empty string by default so griddle doesn't complain
                    var result = '';
                    if (columnMeta[j].source != undefined) {
                        var sourceActionStr = columnMeta[j].source;

                        // replace token with path from input entity
                        var entityPath = records[i].getPath();
                        sourceActionStr = sourceActionStr.replace(/\$entity\$/gi, entityPath);

                        try {
                            if (sourceActionStr != "") {
                                result = eval(sourceActionStr);
                            }
                        } catch (e) {
                            GEPPETTO.CommandController.log(GEPPETTO.Resources.CONTROL_PANEL_ERROR_RUNNING_SOURCE_SCRIPT + " " + sourceActionStr, true);
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

        componentWillUnmount: function () {
            GEPPETTO.off(null, null, this);
        },

        setTab: function(filterTabOption){
            // only do something if builtin filters are being used
            if (this.props.useBuiltInFilters === true) {
                // default goes to visual instances
                if (filterTabOption == undefined) {
                    filterTabOption = this.filterOptions.VISUAL_INSTANCES;
                }

                this.setState({filterOption: filterTabOption});
                var that = this;
                setTimeout(function () {
                    that.refs.filterComponent.refreshToggleState();
                }, 25);
            }
        },

        openWithFilter: function(filterTabOption, filterText) {
            if (filterTabOption == undefined) {
                filterTabOption = this.filterOptions.VISUAL_INSTANCES;
            }

            if (filterText == undefined){
                filterText = '';
            }

            // set state this like this to avoid double refresh, open will trigger a refresh
            this.state.filterOption = filterTabOption;

            // show control panel
            this.open();
            var that = this;
        },

        open: function () {
            // show control panel
            $("#controlpanel").show();

            // refresh to reflect latest state (might have changed)
            this.refresh();

            GEPPETTO.trigger(GEPPETTO.Events.Control_panel_open);
        },

        close: function () {
            // hide any color picker that is still visible
            $(".colorpicker-visible").addClass('colorpicker-hidden').removeClass('colorpicker-visible');
            // hide control panel
            $("#controlpanel").hide();

            GEPPETTO.trigger(GEPPETTO.Events.Control_panel_close);
        },

        setFilter: function (filterText) {
            var filterElement = $('#controlpanel input.form-control[name=filter]');
            filterElement.val(filterText);
            // trigger input change the way react likes it
            filterElement[0].dispatchEvent(new Event('input', {bubbles: true}));
        },

        resetControlPanel: function (columns, colMeta, controls, controlsConfig) {
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
            // set like this to avoid triggering an extra refresh
            this.state.filterOption = value;
            switch (value) {
                case this.filterOptions.VISUAL_INSTANCES:
                    // displays actual instances
                    this.resetControlPanel(instancesCols, instancesColumnMeta, instancesControls, instancesControlsConfiguration);

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
                    var that = this;
                    setTimeout(function () {
                        that.setData(visualInstances);
                    }, 5);
                    break;
                case this.filterOptions.ACTIVE_STATE_VARIABLES:
                    // displays potential instances
                    this.resetControlPanel(stateVariablesCols, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

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
                    var that = this;
                    setTimeout(function () {
                        that.setData(potentialStateVarInstances);
                    }, 5);
                    break;
                case this.filterOptions.ACTIVE_RECORDED_STATE_VARIABLES:
                    // displays actual instances
                    this.resetControlPanel(instancesColsWithoutType, instancesColumnMeta, instancesControls, instancesControlsConfiguration);

                    var recordedStateVars = [];
                    if (window.Project.getActiveExperiment() != undefined) {
                        // show all state variable instances (means they are recorded)
                        // if experiment is completed, need to check that they have been watched

                        recordedStateVars = GEPPETTO.ModelFactory.getAllInstancesWithCapability(GEPPETTO.Resources.STATE_VARIABLE_CAPABILITY, window.Instances)
                            .filter(
                                function(instance) {
                                    if (window.Project.getActiveExperiment().getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                                        if (instance.getPath() != "time") {
                                            return GEPPETTO.ExperimentsController.isLocalWatchedInstanceOrExternal(window.Project.id, window.Project.activeExperiment.id, instance.getPath());
                                        } else {
                                            return true;
                                        }
                                    } else {
                                        return true;
                                    }
                                }
                            )
                            .map(
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
                    var that = this;
                    setTimeout(function () {
                        that.setData(recordedStateVars);
                    }, 5);
                    break;
                case this.filterOptions.ANY_EXPERIMENT_RECORDED_STATE_VARIABLES:
                    // this will display potential instances with state variables col meta / controls
                    this.resetControlPanel(stateVariablesColsWithExperiment, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var projectStateVars = GEPPETTO.ProjectsController.getProjectStateVariables(window.Project.getId());

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    var that = this;
                    setTimeout(function () {
                        that.setData(projectStateVars);
                    }, 5);
                    break;
                case this.filterOptions.ANY_PROJECT_GLOBAL_STATE_VARIABLES:
                    // this will display potential instances with state variables col meta / controls
                    this.resetControlPanel(stateVariablesColsWithProjectAndExperiment, stateVariablesColMeta, stateVariablesControls, stateVariablesControlsConfig);

                    var globalStateVars = GEPPETTO.ProjectsController.getGlobalStateVariables(window.Project.getId(), false);

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    var that = this;
                    setTimeout(function () {
                        that.setData(globalStateVars);
                    }, 5);
                    break;
                case this.filterOptions.ACTIVE_PARAMETERS:
                    // displays indexed parameters / similar to potential instances
                    this.resetControlPanel(paramsCols, parametersColMeta, parametersControls, parametersControlsConfig);

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
                    var that = this;
                    setTimeout(function () {
                        that.setData(potentialParamInstances);
                    }, 5);
                    break;
                case this.filterOptions.ANY_EXPERIMENT_PARAMETERS:
                    // this will display potential instances with parameters col meta / controls
                    this.resetControlPanel(paramsColsWithExperiment, parametersColMeta, parametersControls, parametersControlsConfig);

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
                    var that = this;
                    setTimeout(function () {
                        that.setData(projectEditedParameters);
                    }, 5);
                    break;
                case this.filterOptions.ANY_PROJECT_PARAMETERS:
                    // this will display potential instances with parameters col meta / controls
                    this.resetControlPanel(paramsColsWithProjectAndExperiment, parametersColMeta, parametersControls, parametersControlsConfig);

                    var globalEditedParameters = GEPPETTO.ProjectsController.getGlobalParameters(window.Project.getId(), false);

                    // set data (delay update to avoid race conditions with react dealing with new columns)
                    var that = this;
                    setTimeout(function () {
                        that.setData(globalEditedParameters);
                    }, 5);
                    break;
            }
        },

        isOpen: function () {
            return $("#controlpanel").is(':visible');
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
                    e.preventDefault();
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
            GEPPETTO.on(GEPPETTO.Events.Project_loaded, function () {
                that.clearData();
            }, this);

            GEPPETTO.on(GEPPETTO.Events.Experiment_properties_saved, function () {
            	if(that.isOpen()){
            		that.refreshData();
            	}
            }, this);

            GEPPETTO.on(GEPPETTO.Events.Project_properties_saved, function () {
            	if(that.isOpen()){
            		that.refreshData();
            	}
            }, this);

            GEPPETTO.on(GEPPETTO.Events.Parameters_set, function () {
            	if(that.isOpen()){
            		that.refreshData();
            	}
            }, this);

            if (this.props.listenToInstanceCreationEvents) {
                GEPPETTO.on(GEPPETTO.Events.Instance_deleted, this.handleDeleteData, this);
                GEPPETTO.on(GEPPETTO.Events.Instances_created, this.handleAddData, this);
            }

            if (GEPPETTO.ForegroundControls != undefined) {
                GEPPETTO.ForegroundControls.refresh();
            }

            this.plotController = new PlotCtrlr();

            this.addData(window.Instances);
        },


        handleDeleteData:function (parameters) {
            this.deleteData([parameters]);
        },

        handleAddData:function (instances) {
            if (instances != undefined) {
                this.addData(instances);
            }
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
                    <MenuButton configuration={controlPanelMenuButtonConfig}/>
                );
            }

            var filterMarkup = '';
            if (this.props.useBuiltInFilters === true) {
                filterMarkup = (
                    <FilterComponent id="controlPanelBuiltInFilter" ref="filterComponent" filterOption={this.state.filterOption} filterHandler={this.filterOptionsHandler}/>
                );
            }

            // figure out if we are to use infinite scrolling for results and store in state
            var infiniteScroll = true;
            if (this.props.enablePagination != undefined) {
                infiniteScroll = !this.props.enablePagination;
            }

            return (
                <div id="controlpanel-container">
                    {menuButtonMarkup}
                    {filterMarkup}
                    <Griddle columns={this.state.columns} results={this.state.data}
                             showFilter={true} showSettings={false} enableInfiniteScroll={infiniteScroll} resultsPerPage={this.props.resultsPerPage}
                             bodyHeight={400} useGriddleStyles={false} columnMetadata={this.state.columnMeta}/>
                </div>
            );
        }
    });

    return ControlPanel;
});
