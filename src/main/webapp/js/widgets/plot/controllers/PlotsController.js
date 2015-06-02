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
 * Controller class for plotting widget. Use to make calls to widget from inside Geppetto.
 *
 * @author Jesus R Martinez (jesus@metacell.us)
 */
define(function(require) {

	var AWidgetController = require('widgets/AWidgetController');
	var Plot = require('widgets/plot/Plot');

	/**
	 * @exports Widgets/Plot/PlotsController
	 */
	return AWidgetController.View.extend ({

		initialize: function() {
			this.widgets = new Array();
			
			GEPPETTO.MenuManager.registerNewCommandProvider(["FunctionNode"],this.getCommands);
		},

		/**
		 * Creates plotting widget
		 */
		addPlotWidget: function() {

			//look for a name and id for the new widget
			var id = this.getAvailableWidgetId("Plot", this.widgets);
			var name = id;

			//create plotting widget
			var p = window[name] = new Plot({id:id, name:name,visible:true});

			//create help command for plot
			p.help = function(){return GEPPETTO.Console.getObjectCommands(id);};

			//store in local stack
			this.widgets.push(p);

			GEPPETTO.WidgetsListener.subscribe(this, id);

			//add commands to console autocomplete and help option
			GEPPETTO.Console.updateHelpCommand("assets/js/widgets/plot/Plot.js", p, id);
			//update tags for autocompletion
			GEPPETTO.Console.updateTags(p.getId(), p);
			return p;
		},

		/**
		 * Receives updates from widget listener class to update plotting widget(s)
		 * 
		 * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
		 */
		update: function(event, parameters) {
			//delete plot widget(s)
			if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
				this.removeWidgets();
			}

			//reset plot's datasets
			else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA) {
				for(var i = 0; i < this.widgets.length; i++) {
					var plot = this.widgets[i];

					plot.cleanDataSets();
				}
			}
			
			//update plotting widgets
			else if(event == Events.Experiment_play) {
			}
			
			//update plotting widgets
			else if(event == Events.Experiment_over) {
			}
			
			//update plotting widgets
			else if(event == Events.Experiment_update) {
				var playAll = parameters.playAll;
				var step = parameters.steps;
				//loop through all existing widgets
				for(var i = 0; i < this.widgets.length; i++) {
					console.log("request upate " + i);
					var plot = this.widgets[i];

					if(playAll){
						plot.options.playAll = true;
					}else{
						plot.options.playAll = false;
					}
					//update plot with new data set
					plot.updateDataSet(step);
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
			var groups = [];

			if (node._metaType == "FunctionNode"){
				if (node.getPlotMetadata() != undefined){
					var group1 = [{
						label:"Plot Function",
						action: ["var p = G.addWidget(Widgets.PLOT)", "p.plotFunctionNode(#node_instancepath#)", "p.setSize(200,450)"],
					}];

					var availableWidgets = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets();
					if (availableWidgets.length > 0){
						var group1Add =  {
								label : "Add to Plot Widget",
								position : 0
						} ;

						var subgroups1Add = [];
						for (var availableWidgetIndex in availableWidgets){
							var availableWidget = availableWidgets[availableWidgetIndex];
							subgroups1Add = subgroups1Add.concat([{
								label: "Add to " + availableWidget.name,
								action: [availableWidget.id + ".plotFunctionNode(#node_instancepath#)"],
								position: availableWidgetIndex
							}]);
						}
						group1Add["groups"] = [subgroups1Add];

						group1.push(group1Add);
					}

					groups.push(group1);

				}
			}

			return groups;
		}
	});
});
