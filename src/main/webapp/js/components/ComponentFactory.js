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
	
	return function (GEPPETTO) {

		var React = require('react');
		var ReactDOM = require('react-dom');
		var formComp = require('jsx!components/dev/form/Form');
		var panelComp = require('jsx!components/dev/panel/Panel');
		var logoComp = require('jsx!components/dev/logo/Logo');
		var infoModalComp = require('jsx!components/popups/InfoModal');
        var mdModalComp = require('jsx!components/popups/MarkDownModal');
		var loadingSpinnerComp = require('jsx!./loadingspinner/LoadingSpinner');
		var saveControlComp = require('jsx!components/dev/save/SaveControl');
		var controlPanelComp = require('jsx!components/dev/controlpanel/controlpanel');
		var spotlightComp = require('jsx!components/dev/spotlight/spotlight');
		var foregroundControlsComp = require('jsx!components/dev/foregroundcontrols/ForegroundControls');
		var experimentTableComp = require('jsx!components/dev/ExperimentsTable/ExperimentsTable');
		var homeControlsComp = require('jsx!components/dev/home/HomeControl');
		var simControlsComp = require('jsx!components/dev/simulationcontrols/ExperimentControls');
		var cameraControlsComp = require('jsx!./dev/cameracontrols/CameraControls');
		var shareComp = require('jsx!./dev/share/share');
		
		GEPPETTO.ComponentFactory = {
			getComponent: function(component, properties){
				
				if (component == 'FORM'){
	    	      	return React.createFactory(formComp)(properties);
				}
				else if (component == 'PANEL'){
					return React.createFactory(panelComp)(properties);
				}
				else if (component == 'LOGO'){
					return React.createFactory(logoComp)(properties);
				}
				else if (component == 'LOADINGSPINNER'){
					return React.createFactory(loadingSpinnerComp)(properties);
				}
				else if (component == 'SAVECONTROL'){
					return React.createFactory(saveControlComp)(properties);
				}
				else if (component == 'CONTROLPANEL'){
					return React.createFactory(controlPanelComp)(properties);
				}
				else if (component == 'SPOTLIGHT'){
					return React.createFactory(spotlightComp)(properties);
				}
				else if (component == 'FOREGROUND'){
					return React.createFactory(foregroundControlsComp)(properties);
				}
				else if (component == 'EXPERIMENTSTABLE'){
					return React.createFactory(experimentTableComp)(properties);
				}
				else if (component == 'HOME'){
					return React.createFactory(homeControlsComp)(properties);
				}
				else if (component == 'SIMULATIONCONTROLS'){
					return React.createFactory(simControlsComp)(properties);
				}
				else if (component == 'CAMERACONTROLS'){
					return React.createFactory(cameraControlsComp)(properties);
				}
				else if (component == 'SHARE'){
					return React.createFactory(shareComp)(properties);
				}
				else if (component == 'INFOMODAL'){
                    return React.createFactory(infoModalComp)(properties);
                }
                else if (component == 'MDMODAL'){
                    return React.createFactory(mdModalComp)(properties);
                }
			},
			
			addComponent: function(component, properties, container){
				return this.renderComponent(this.getComponent(component, properties), container);
			},
			
			renderComponent: function(component, container){
				//Let's create a dialog
				if (container == undefined){
					var containerId = component.props.id + "_container";
					var containerName = component.props.name;
					
					//create the dialog window for the widget
	                var dialog = $("<div id=" + containerId + " class='dialog' title='" + containerName + "'></div>").dialog(
	                    {
	                        resizable: true,
	                        draggable: true,
	                        top: 10,
	                        height: 300,
	                        width: 350,
	                        close: function (event, ui) {
	                            if (event.originalEvent &&
	                                $(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length) {
	                                $("#" + this.id).remove();
	                            }
	                        }
	                    });
	
	                var dialogParent = dialog.parent();
	                var that = this;
	
	                //add history
	                dialogParent.find("div.ui-dialog-titlebar").prepend("<div class='fa fa-history historyIcon'></div>");
	                dialogParent.find("div.historyIcon").click(function (event) {
	                    that.showHistoryMenu(event);
	                    event.stopPropagation();
	                });
	
	                //remove the jQuery UI icon
	                dialogParent.find("button.ui-dialog-titlebar-close").html("");
	                dialogParent.find("button").append("<i class='fa fa-close'></i>");
	
	
	                //Take focus away from close button
	                dialogParent.find("button.ui-dialog-titlebar-close").blur();	
	                
	                container = dialog.get(0);
				}
				
				return ReactDOM.render(component, container);
			}
	    };
	};
});