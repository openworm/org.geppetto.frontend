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
 * Controller class for treevisualiser widget. Use to make calls to widget from
 * inside Geppetto.
 * 
 * @module Widgets/TreeVisualizerControllerDAT
 * 
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function(require) {
	return function(GEPPETTO) {

		var TreeVisualiserDAT = require('widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT');
		var treeVisualisersDAT = new Array();

		GEPPETTO.TreeVisualiserControllerDAT = {

				/**
				 * Registers widget events to detect and execute following actions.
				 * Used when widget is destroyed.
				 *
				 * @param {String} treeVisualiserDATID - ID of widget to register handler
				 */
				registerHandler : function(treeVisualiserDATID) {
					GEPPETTO.WidgetsListener.subscribe(
							GEPPETTO.TreeVisualiserControllerDAT,
							treeVisualiserDATID);
				},

				/**
				 * Returns all TreeVisualizerDAT widgets objects
				 */
				getWidgets : function() {
					return treeVisualisersDAT;
				},

				/**
				 * Adds a new TreeVisualizerDAT Widget to Geppetto
				 */
				addTreeVisualiserDATWidget : function() {
					// Popup widget number
					var index = (treeVisualisersDAT.length + 1);

					// Name of popup widget
					var name = "TreeVisualiserDAT" + index;
					var id = name;

					// create tree visualiser widget
					var tvdat = window[name] = new TreeVisualiserDAT({id : id, name : name,	visible : false, width: 260, height: 350});

					// create help command for plot
					tvdat.help = function() {
						return GEPPETTO.Utility.getObjectCommands(id);
					};

					// store in local stack
					treeVisualisersDAT.push(tvdat);

					this.registerHandler(id);

					// add commands to console autocomplete and help option
					GEPPETTO.Console.updateCommands("assets/js/widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT.js",	tvdat, id);

					//update tags for autocompletion
					GEPPETTO.Console.updateTags(tvdat.getId(), tvdat);
					
					return tvdat;
				},

				/**
				 * Remove the TreeVisualizerDAT widget
				 */
				removeTreeVisualiserDATWidgets : function() {
					// remove all existing popup widgets
					for (var i = 0; i < treeVisualisersDAT.length; i++) {
						var treeVisualiserDAT = treeVisualisersDAT[i];

						treeVisualiserDAT.destroy();
						i++;
					}

					treeVisualisersDAT = new Array();
				},

				/**
				 * Receives updates from widget listener class to update TreeVisualizerDAT widget(s)
				 * 
				 * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
				 */
				update : function(event) {
					// delete treevisualiser widget(s)
					if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
						this.removeTreeVisualiserDATWidgets();
					}
					// update treevisualiser widgets
					else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
						// loop through all existing widgets
						for (var i = 0; i < treeVisualisersDAT.length; i++) {
							var treeVisualiserDAT = treeVisualisersDAT[i];

							// update treevisualiser with new data set
							treeVisualiserDAT.updateData();
						}
					}
				},

				/**
				 * Retrieve commands for a specific variable node
				 * 
				 * @param {Node} node - Geppetto Node used for extracting commands
				 * @returns {Array} Set of commands associated with this node 
				 */
				getCommands : function(node) {
//					var groups = [ [ {
//					label : "Add to Chart",
//					icon : "icon0",
//					position : 0,
//					groups : [ [ {
//					label : "Add to New Chart",
//					action : GEPPETTO.TreeVisualiserControllerDAT.actionMenu,
//					icon : "icon01",
//					position : 0
//					}, {
//					label : "Add to Chart 1",
//					action : GEPPETTO.TreeVisualiserControllerDAT.actionMenu,
//					icon : "icon02",
//					position : 1
//					} ] ]
//					}, {
//					label : "Add as new line",
//					action : GEPPETTO.TreeVisualiserControllerDAT.actionMenu,
//					icon : "icon1",
//					position : 1
//					} ],

//					[ {
//					label : "Save to file as a Chart",
//					action : GEPPETTO.TreeVisualiserControllerDAT.actionMenu,
//					icon : "icon2"
//					} ] ];

					var group1 = [{
						label:"Open with DAT Widget",
						action: "GEPPETTO.TreeVisualiserControllerDAT.actionMenu",
						//option: {option1: "option1"}
					}];


					var availableWidgets = GEPPETTO.TreeVisualiserControllerDAT.getWidgets();
					if (availableWidgets.length > 0){
						var group1Add =  [ {
							label : "Add to DAT Widget",
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
				actionMenu : function(node) {
					tv = GEPPETTO.TreeVisualiserControllerDAT.addTreeVisualiserDATWidget();
					tv.setData(node);
				}
		};

	};
});