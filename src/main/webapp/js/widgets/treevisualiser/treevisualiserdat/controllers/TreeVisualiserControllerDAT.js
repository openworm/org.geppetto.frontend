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
			 * @param plotID
			 */
			registerHandler: function(treeVisualiserDATID) {
				GEPPETTO.WidgetsListener.subscribe(GEPPETTO.TreeVisualiserControllerDAT, treeVisualiserDATID);
			},

			/**
			 * Returns all plotting widgets objects
			 */
			getWidgets: function() {
				return treeVisualisersDAT;
			},
			
			addTreeVisualiserDATWidget : function(){
				//Popup widget number
				var index = (treeVisualisersDAT.length + 1);

				//Name of popup widget
				var name = "TreeVisualiserDAT" + index;
				var id = name;

				//create tree visualiser widget
				var tv = window[name] = new TreeVisualiserDAT({id:id, name:name,visible:false});

				//create help command for plot
				tv.help = function(){return GEPPETTO.Utility.getObjectCommands(id);};

				//store in local stack
				treeVisualisersDAT.push(tv);
				
				this.registerHandler(id);

				//add commands to console autocomplete and help option
				GEPPETTO.Utility.updateCommands("js/widgets/treevisualiser/treevisualiserdat/TreeVisualiserDAT.js", tv, id);

				return tv;
			},
		
			removeTreeVisualiserDATWidgets : function(){
				//remove all existing popup widgets
				for(var i = 0; i < treeVisualisersDAT.length; i++) {
					var treeVisualiserDAT = treeVisualisersDAT[i];

					treeVisualiserDAT.destroy();
					i++;
				}

				treeVisualisersDAT = new Array();
			},
			
			//receives updates from widget listener class to update tree visualiser widget(s)
			update: function(event) {
				//delete treevisualiser widget(s)
				if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
					this.removeTreeVisualiserDATWidgets();
				}
				//update treevisualiser widgets
				else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
					//loop through all existing widgets
					for(var i = 0; i < treeVisualisersDAT.length; i++) {
						var treeVisualiserDAT = treeVisualisersDAT[i];

						//update treevisualiser with new data set
						treeVisualiserDAT.updateData();
					}
				}
			},
			
			getCommands: function(node) {
				console.log("getCommands" + node);
				
				commands = [{label:"Add to Widget 1", handler:"TreeVisualiserDAT1.setData('hhCell')", icon:"icon"},
				            {label:"Add to New Widget", handler:"TreeVisualiserDATController.", icon:"icon2"}];
				
				return commands;
				
			}
		};
		
	};
});