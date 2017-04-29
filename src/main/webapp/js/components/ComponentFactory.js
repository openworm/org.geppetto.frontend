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
		var spinner=require('./interface/loadingSpinner/LoadingSpinner.js');

		var addWidget = require('./widgets/NewWidget.js');
		var _widgets = {};

		//All the components potentially instantiable go here
		var components = {
			'FORM':'interface/form/Form',
			'PANEL':'controls/panel/Panel',
			'LOGO':'interface/logo/Logo',
			'LOADINGSPINNER':'interface/loadingSpinner/LoadingSpinner',
			'SAVECONTROL':'interface/save/SaveControl',
			'TOGGLEBUTTON' : 'controls/toggleButton/ToggleButton',
			'CONTROLPANEL':'interface/controlPanel/controlpanel',
			'SPOTLIGHT':'interface/spotlight/spotlight',
			'MENUBUTTON':'controls/menuButton/MenuButton',
			'FOREGROUND':'interface/foregroundControls/ForegroundControls',
			'EXPERIMENTSTABLE':'interface/experimentsTable/ExperimentsTable',
			'HOME':'interface/home/HomeControl',
			'SIMULATIONCONTROLS':'interface/simulationControls/ExperimentControls',
			'CAMERACONTROLS': 'interface/cameraControls/CameraControls',
			'SHARE':'interface/share/share',
			'INFOMODAL':'controls/modals/InfoModal',
			'MDMODAL':'controls/modals/MarkDownModal',
			'QUERY':'interface/query/query',
			'TUTORIAL':'interface/tutorial/TutorialModule',
			'PYTHONCONSOLE': 'interface/pythonConsole/PythonConsole',
			'CHECKBOX': 'controls/Checkbox',
			'TEXTFIELD': 'controls/TextField',
			'RAISEDBUTTON': 'controls/RaisedButton',
			'DICOMVIEWER': 'interface/dicomViewer/DicomViewer',
			'GOOGLEVIEWER': 'interface/googleViewer/GoogleViewer',
			'BIGIMAGEVIEWER': 'interface/bigImageViewer/BigImageViewer',
			'CAROUSEL': 'interface/carousel/Carousel',
			'CANVAS3D': 'interface/3dCanvas/Canvas',
			//'WIDGETCONTAINER': 'widgets/WidgetContainer'
		}
		
	
		GEPPETTO.ComponentFactory = {
				
			loadSpinner:function(){
				//We require this synchronously to properly show spinner when loading projects
				this.renderComponent(React.createFactory(spinner)(),document.getElementById("load-spinner"));
			},
			
			addComponent: function(componentID, properties, container, callback){
				var that=this;
				require(["./" + components[componentID]], function(loadedModule){
					var component = React.createFactory(loadedModule)(properties)
					var renderedComponent = that.renderComponent(component, container, callback);
					return renderedComponent;
				});
				
			},

			camelize: function(str) {
				return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
					if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
					return index == 0 ? match.toUpperCase() : match.toLowerCase();
				});
			},


			/**
             * Get an available id for an specific widget
             *
             * @module WidgetUtility
             * @param {String} prefix
             * @param {Array} widgetsList
             * @returns {String} id - Available id for a widget
             */
            getAvailableWidgetId: function (prefix, widgetsList) {
                var index = 0;
                var id = "";
                var available;

                do {
                    index++;
                    id = prefix + index;
                    available = true;

                    for (var p in widgetsList) {
                        if (widgetsList[p].getId().toUpperCase() == id.toUpperCase()) {
                            available = false;
                            break;
                        }
                    }
                }
                while (available == false);

                return this.camelize(id);
            },

			/**
             * Get the comments of a given widget file through an Ajax call. This is used to extract the comments on the methods
             * and visualize them when using the help command.
             *
             * @param {String} file
             */
            getFileComments: function (file) {
				// var comments = "";
                // if (comments.length == 0) {
                    var comments = [];
                    //retrieve the script to get the comments for all the methods
                    $.ajax({
                        async: false,
                        type: 'GET',
                        url: file,
                        dataType: "text",
                        //at success, read the file and extract the comments
                        success: function (data) {
                            var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
                            comments = data.match(STRIP_COMMENTS);
                        },
                        error: function () {
                            console.log('error fetching file with Ajax request');
                        }
                    });

                    // comments = fetchedComments;
                // }
                return comments;
            },

			addWidget: function(componentID, properties, callback){
				
				if (!("id" in properties)){
					var widgetsList = [];
					if(componentID in _widgets){
						widgetsList = _widgets[componentID].widgets;
					}
					else{
						_widgets[componentID] = {widgets: [], comments: this.getFileComments("geppetto/js/components/" + components[componentID] + ".js")}
					}
					properties["id"] = this.getAvailableWidgetId(componentID, widgetsList);

					
					
				}


				var that=this;
				require(["./" + components[componentID]], function(loadedModule){
					var component = React.createFactory(addWidget(loadedModule))(properties);
					var renderedComponent = window[properties.id] = that.renderComponent(component, document.getElementById('widgetContainer'), callback);
					_widgets[componentID].widgets.push(renderedComponent);
					GEPPETTO.Console.updateHelpCommand(renderedComponent, properties.id, _widgets[componentID].comments);
					GEPPETTO.Console.updateTags(properties.id, renderedComponent);

					//registers remove handler for widget
					renderedComponent.$el.on("remove", function () {
						
						console.log('Pako');
						//remove tags and delete object upon destroying widget
						GEPPETTO.Console.removeCommands(properties.id);
						var widgetsList = _widgets[componentID].widgets;
						for (var p in widgetsList) {
							if (widgetsList[p].getId() == this.id) {
								widgetsList.splice(p, 1);
								break;
							}
						}
					});

					//register resize handler for widget
					renderedComponent.$el.on("dialogresizestop", function (event, ui) {

						var height = ui.size.height;
						var width = ui.size.width;

						GEPPETTO.Console.executeImplicitCommand(properties.id + ".setSize(" + height + "," + width + ")");

						var left = ui.position.left;
						var top = ui.position.top;

						window[properties.id].setPosition(left, top);
					});

					// //register drag handler for widget
					renderedComponent.$el.on("dialogdragstop", function (event, ui) {

						var left = ui.position.left;
						var top = ui.position.top;

						GEPPETTO.Console.executeImplicitCommand(properties.id + ".setPosition(" + left + "," + top + ")");
					});

					return renderedComponent;
				});
			},


			renderComponent: function(component, container, callback){
				//Let's create a dialog
				if (container == undefined){

					//create the dialog window for the widget
	                var dialog = $("<div id=" + component.props.id + "_dialog" + " class='dialog' title='" + component.props.name + "'></div>").dialog(
	                    {
	                        resizable: true,
	                        draggable: true,
	                        top: 10,
	                        height: 300,
	                        width: 350,
	                        dialogClass: component.props.id + "_dialog",
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

	                container = dialog.get(0);
				}

				return ReactDOM.render(component, container, callback);
			}
	    };
	};
});
