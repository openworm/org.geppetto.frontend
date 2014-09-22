/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
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
/**
 * Controller class for treevisualiser widget. Use to make calls to widget from inside Geppetto.
 *
 * @constructor
 *
 * @module Widgets/TreeVisualizerControllerD3
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function(require) {
	return function(GEPPETTO) {

		var TreeVisualiserD3 = require('widgets/treevisualiser/treevisualiserd3/TreeVisualiserD3');
		var treeVisualisersD3 = new Array();

		GEPPETTO.TreeVisualiserControllerD3 = {

			/**
			 * Registers widget events to detect and execute following actions.
			 * Used when widget is destroyed.
			 *
			 * @param {String} treeVisualiserD3ID - ID of widget to register handler
			 */
			registerHandler: function(treeVisualiserD3ID) {
				GEPPETTO.WidgetsListener.subscribe(GEPPETTO.TreeVisualiserControllerD3, treeVisualiserD3ID);
			},

			/**
			 * Returns all plotting widgets objects
			 * 
			 * @returns {Array} Array of TreeVisualiserD3ID widgets that exist
			 */
			getWidgets: function() {
				return treeVisualisersD3;
			},
			
			/**
			 * Adds a new TreeVisualizer3D Widget to Geppetto
			 */
			addTreeVisualiserD3Widget : function(){
				//Popup widget number
				var index = (treeVisualisersD3.length + 1);

				//Name of popup widget
				var name = "TreeVisualiserD3" + index;
				var id = name;

				//create tree visualiser widget
				var tvd3 = window[name] = new TreeVisualiserD3({id:id, name:name,visible:false, width: 500, height: 500});

				//create help command for tree visualiser d3
				tvd3.help = function(){return GEPPETTO.Utility.getObjectCommands(id);};

				//store in local stack
				treeVisualisersD3.push(tvd3);
				
				this.registerHandler(id);

				//add commands to console autocomplete and help option
				GEPPETTO.Console.updateCommands("js/widgets/treevisualiser/treevisualiserd3/TreeVisualiserD3.js", tvd3, id);

				return tvd3;
			},
		
			/**
			 * Remove the TreeVisualizer3D widget
			 */
			removeTreeVisualiserD3Widgets : function(){
				//remove all existing popup widgets
				for(var i = 0; i < treeVisualisersD3.length; i++) {
					var treeVisualiserD3 = treeVisualisersD3[i];

					treeVisualiserD3.destroy();
					i++;
				}

				treeVisualisersD3 = new Array();
			},
			
			/**
			 * Receives updates from widget listener class to update TreeVisualizer3D widget(s)
			 * 
			 * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
			 */
			update: function(event) {
				//delete treevisualiser widget(s)
				if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
					this.removeTreeVisualiserD3Widgets();
				}
				//update treevisualiser widgets
				else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
					//loop through all existing widgets
					for(var i = 0; i < treeVisualisersD3.length; i++) {
						var treeVisualiserD3 = treeVisualisersD3[i];

						//update treevisualiser with new data set
						treeVisualiserD3.updateData();
					}
				}
			},
			
			/**
			 * Retrieve commands for a specific variable node
			 * 
			 * @param {Node} node - Geppetto Node used for extracting commands
			 * @returns {Array} Set of commands associated with this node 
			 */
			getCommands: function(node) {
				var group1 = [{
							label:"Open with D3 Widget",
				        	action: "GEPPETTO.TreeVisualiserControllerD3.actionMenu",
							//action: GEPPETTO.TreeVisualiserControllerD3.actionMenu,
				        	//option: {option1: "option1"}
							}];
				
				
				var availableWidgets = GEPPETTO.TreeVisualiserControllerD3.getWidgets();
				if (availableWidgets.length > 0){
					var group1Add =  [ {
						label : "Add to D3 Widget",
						position : 0
					} ] ;
					
					var subgroups1Add = [];
					for (var availableWidgetIndex in availableWidgets){
						var availableWidget = availableWidgets[availableWidgetIndex];
						subgroups1Add = subgroups1Add.concat([{
																label: "Add to " + availableWidget.name,
																action: availableWidget.id + ".setData",
																position: availableWidgetIndex
																}]);
					}
					
					group1Add[0]["groups"] = [subgroups1Add];
					
					group1 = group1.concat(group1Add);
				}
				
				var groups = [group1];
				
				return groups;
				
			},
			
			/**
			 * Register action menu with the TreeVisualizer3D widget
			 */
			actionMenu: function(node){
				tv = GEPPETTO.TreeVisualiserControllerD3.addTreeVisualiserD3Widget();
				tv.setData(node);
			}
			
		};
		
	};
});