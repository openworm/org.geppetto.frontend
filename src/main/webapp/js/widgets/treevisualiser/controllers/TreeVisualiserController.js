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

		var TreeVisualiser = require('widgets/treevisualiser/TreeVisualiser');
		var treeVisualisers = new Array();

		GEPPETTO.TreeVisualiserController = {
			

			/**
			 * Registers widget events to detect and execute following actions.
			 * Used when widget is destroyed.
			 *
			 * @param plotID
			 */
			registerHandler: function(treeVisualiserID) {
				GEPPETTO.WidgetsListener.subscribe(GEPPETTO.TreeVisualiserController, treeVisualiserID);
			},

			/**
			 * Returns all plotting widgets objects
			 */
			getWidgets: function() {
				return treeVisualisers;
			},
			
			addTreeVisualiserWidget : function(){
				//Popup widget number
				var index = (treeVisualisers.length + 1);

				//Name of popup widget
				var name = "TreeVisualiser" + index;
				var id = name;

				//create tree visualiser widget
				var tv = window[name] = new TreeVisualiser({id:id, name:name,visible:false});

				//create help command for plot
				tv.help = function(){return GEPPETTO.Utility.getObjectCommands(id);};

				//store in local stack
				treeVisualisers.push(tv);
				
				this.registerHandler(id);

				//add commands to console autocomplete and help option
				GEPPETTO.Utility.updateCommands("js/widgets/treevisualiser/TreeVisualiser.js", tv, id);

				return tv;
			},
		
			removeTreeVisualiserWidgets : function(){
				//remove all existing popup widgets
				for(var i = 0; i < treeVisualisers.length; i++) {
					var treeVisualiser = treeVisualisers[i];

					treeVisualiser.destroy();
					i++;
				}

				treeVisualisers = new Array();
			},
			
			//receives updates from widget listener class to update tree visualiser widget(s)
			update: function(event) {
				//delete treevisualiser widget(s)
				if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
					this.removeTreeVisualiserWidgets();
				}
				//update treevisualiser widgets
				else if(event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
					//loop through all existing widgets
					for(var i = 0; i < treeVisualisers.length; i++) {
						var treeVisualiser = treeVisualisers[i];

						//update treevisualiser with new data set
						treeVisualiser.updateData();
					}
				}
			}
		};
		
	};
});