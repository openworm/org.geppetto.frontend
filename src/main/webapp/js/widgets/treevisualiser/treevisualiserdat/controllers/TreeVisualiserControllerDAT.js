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
	var AWidgetController = require('widgets/AWidgetController');
	var TreeVisualiserDAT = require('widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT');

	/**
	 * @exports Widgets/Connectivity/TreeVisualiserControllerDATController
	 */
	return AWidgetController.View.extend ({
		
		initialize: function() {
			this.widgets = new Array();
		 },
		 
		/**
		 * Adds a new TreeVisualizerDAT Widget to Geppetto
		 */
		addTreeVisualiserDATWidget : function() {
			//TreeVisualiserDAT widget number
			var index = 1;
			//Name of TreeVisualiserDAT widget
			var name = "TreeVisualiserDAT" + index;

			for(var p in this.widgets){
				if(this.widgets[p].getId() == name){
					index++;
					name = "TreeVisualiserDAT" + index;
				}
			}
			var id = name;
			// create tree visualiser widget
			var tvdat = window[name] = new TreeVisualiserDAT({id : id, name : name,	visible : false, width: 260, height: 350});
			// create help command for plot
			tvdat.help = function() {
				return GEPPETTO.Utility.getObjectCommands(id);
			};
			// store in local stack
			this.widgets.push(tvdat);
			
			GEPPETTO.WidgetsListener.subscribe(this, id);

			// add commands to console autocomplete and help option
			GEPPETTO.Console.updateCommands("assets/js/widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT.js",	tvdat, id);
			//update tags for autocompletion
			GEPPETTO.Console.updateTags(tvdat.getId(), tvdat);
			return tvdat;
		},

		/**
		 * Receives updates from widget listener class to update TreeVisualizerDAT widget(s)
		 * 
		 * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
		 */
		update : function(event) {
			var treeVisualisersDAT = this.getWidgets();
			// delete treevisualiser widget(s)
			if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
				this.removeWidgets();
			}
			else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.SELECTION_CHANGED) {
				//loop through all existing widgets
				for(var i = 0; i < this.widgets.length; i++) {
					var treeVisualiser = this.widgets[i];
					
					if(treeVisualiser.registeredEvents.indexOf(event)>-1){
						var selected = GEPPETTO.Simulation.getSelection();
						treeVisualiser.reset();
						//update treevisualiser with new data set
						treeVisualiser.setData(selected[0]);
					}
				}
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
			var group1 = [{
				label: "Open with DAT Widget",
				action: ["GEPPETTO.TreeVisualiserControllerDAT.actionMenu(#node_instancepath#)"],
				//option: {option1: "option1"}
			}];
			var availableWidgets = GEPPETTO.TreeVisualiserControllerDAT.getWidgets();
			if (availableWidgets.length > 0){
				var group1Add =  {
						label : "Add to DAT Widget",
						position : 0
				} ;
				var subgroups1Add = [];
				for (var availableWidgetIndex in availableWidgets){
					var availableWidget = availableWidgets[availableWidgetIndex];
					subgroups1Add = subgroups1Add.concat([{
						label: "Add to " + availableWidget.name,
						action: [availableWidget.id + ".setData(#node_instancepath#)"],
						position: availableWidgetIndex
					}]);
				}
				group1Add["groups"] = [subgroups1Add];

				group1.push(group1Add);
			}

			var groups = [group1];

			if (node._metaType == "ConnectionNode"){
				var connectionGroup = [{
					label:"Highlight Connection",
					action: ["Simulation.unHighlightAll();","#node_instancepath#.highlight(true)"],
				}];

				groups.push(connectionGroup);
			}
			if (node._metaType == "EntityNode"){
				var entity = [{
					label:"Select Entity",
					action: ["Simulation.unSelectAll();","#node_instancepath#.select()"],
				}];

				groups.push(entity);
			}
			if (node._metaType == "AspectNode"){
				var aspect = [{
					label:"Select Aspect",
					action: ["Simulation.unSelectAll();","#node_instancepath#.select()"],
				}];

				groups.push(aspect);
			}
			if (node._metaType == "VisualGroupNode"){
				var visualGroup = [{
					label:"Show Visual Group",
					action: ["Simulation.unSelectAll();","#node_instancepath#.show(true)"],
				}];

				groups.push(visualGroup);
			}
			if (node._metaType == "FunctionNode"){
				if (node.getPlotMetadata() != undefined){
					var functionN = [{
						label:"Plot Function",
						action: ["GEPPETTO.TreeVisualiserControllerDAT.actionMenu2(#node_instancepath#)"],
					}];

					groups.push(functionN);
				}
			}

			return groups;
		},

		//TODO: Once G.addWidget() returns the widget name this needs to be modified
		actionMenu : function(node) {
			tv = this.addTreeVisualiserDATWidget();
			tv.setData(node);
		},

		//TODO: Once G.addWidget() returns the widget name this needs to be modified
		actionMenu2 : function(node) {
//			p = GEPPETTO.PlotsController.addPlotWidget();
//			p.plotFunctionNode(node);
//			p.setSize(200,450);
		},
	});
});
