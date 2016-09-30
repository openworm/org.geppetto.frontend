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
		

		//All the components potentially instantiable go here
		var components = {
			'FORM':'jsx!components/dev/form/Form',
			'PANEL':'jsx!components/dev/panel/Panel',
			'LOGO':'jsx!components/dev/logo/Logo',
			'LOADINGSPINNER':'jsx!./loadingspinner/LoadingSpinner',
			'SAVECONTROL':'jsx!components/dev/save/SaveControl',
			'CONTROLPANEL':'jsx!components/dev/controlpanel/controlpanel',
			'SPOTLIGHT':'jsx!components/dev/spotlight/spotlight',
			'DROPDOWNBUTTON':'jsx!./dev/DropDownPanel/DropDownButton',
			'DROPDOWNPANEL':'jsx!./dev/DropDownPanel/DropDownPanel',
			'FOREGROUND':'jsx!components/dev/foregroundcontrols/ForegroundControls',
			'EXPERIMENTSTABLE':'jsx!components/dev/ExperimentsTable/ExperimentsTable',
			'HOME':'jsx!components/dev/home/HomeControl',
			'SIMULATIONCONTROLS':'jsx!components/dev/simulationcontrols/ExperimentControls',
			'CAMERACONTROLS': 'jsx!./dev/cameracontrols/CameraControls',
			'SHARE':'jsx!./dev/share/share',
			'INFOMODAL':'jsx!components/popups/InfoModal',
			'MDMODAL':'jsx!components/popups/MarkDownModal',
			'QUERY':'jsx!./dev/query/query',
			'TUTORIAL':'jsx!./dev/tutorial/TutorialModule',
			'PYTHONCONSOLE': 'jsx!components/dev/PythonConsole/PythonConsole',
			'CHECKBOX': 'jsx!components/dev/BasicComponents/Checkbox',
			'TEXTFIELD': 'jsx!components/dev/BasicComponents/TextField',
			'RAISEDBUTTON': 'jsx!components/dev/BasicComponents/RaisedButton'
		}
		
		//We require this synchronously to properly show spinner when loading projects
		var LoadingSpinner = require('jsx!./loadingspinner/LoadingSpinner');
		
		GEPPETTO.ComponentFactory = {
			
				
			//This exception will be removed once the spinner will behave like other components, and set its status (spinning/visible) depening
			//on what is currently ongoing in the project
			addSpinner : function(properties, container){
				var that=this;
				var component = React.createFactory(LoadingSpinner)(properties)
				var renderedComponent = that.renderComponent(component, container);
				return renderedComponent;
			},
			
			addComponent: function(componentID, properties, container, callback){
				var that=this;
				require([components[componentID]], function(loadedModule){
					var component = React.createFactory(loadedModule)(properties)
					var renderedComponent = that.renderComponent(component, container);
					if(callback!=undefined){
						callback(renderedComponent);
					}
					return renderedComponent;
				});
				
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

	                //remove the jQuery UI icon
	                dialogParent.find("button.ui-dialog-titlebar-close").html("");
	                dialogParent.find("button").append("<i class='fa fa-close'></i>");


	                //Take focus away from close button
	                dialogParent.find("button.ui-dialog-titlebar-close").blur();
	                dialogParent.css("z-index","100");

	                container = dialog.get(0);
				}

				return ReactDOM.render(component, container);
			}
	    };
	};
});
