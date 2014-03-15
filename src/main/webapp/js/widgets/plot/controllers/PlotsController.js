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
 *     	OpenWorm - http://openworm.org/people.html
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
 * @constructor
 * 
 * @author Jesus R Martinez (jesus@metacell.us)
 */

var plots = new Array();

var plotsON = false;

var limit = 0;

var watchedVariables = {};

PlotsController = {

		/**
		 * Registers widget events to detect and execute following actions. 
		 * Used when widget is destroyed. 
		 * 
		 * @param plotID
		 */
		registerHandler : function(plotID){
			
			WidgetsListener.subscribe(PlotsController, plotID);
		},

		/**
		 * Returns all plotting widgets objects
		 */
		getWidgets : function(){
			return plots;
		},

		/**
		 * Creates plotting widget
		 * 
		 * @ return {Widget} - Plotting widget
		 */
		addPlotWidget : function(){

			//Plot widget number
			var index = (plots.length+1);

			//Name of plotting widget
			var name = "Plot"+ index;
			var id = name;

			//create plotting widget
			var p = window[name] = new Plot(id, name,true);

			//create help command for plot
			Plot.prototype.help = function widgetHelp(){return getObjectCommands(id);};

			//store in local stack
			plots.push(p);
			
			this.registerHandler(id);

			//add commands to console autocomplete and help option
			updateCommands("js/widgets/plot/Plot.js", p, id);

			return p;
		},

		/**
		 * Removes existing plotting widgets
		 */
		removePlotWidgets : function(){
			//remove all existing plotting widgets
			for(var i =0; i<plots.length; i++){
				var plot = plots[i];

				plot.destroy();
				i--;
			}	

			plots = new Array();
		},

		/**
		 * Toggles plotting widget on and off
		 */
		toggle : function(){
			//if there aren't plotting widgets to toggle, create one
			if(plots.length==0){
				GEPPETTO.Console.executeCommand('G.addWidget(Widgets.PLOT)');
			}
			//plot widgets exist, toggle them
			else if(plots.length > 0){
				plotsON = !plotsON;

				for(p in plots){
					var plot = plots[p];
					if(plotsON){
						plot.hide();
					}
					else{
						plot.show();
					}
				}	
			}
		},
		
		//receives updates from widget listener class to update plotting widget(s)
		update : function(event){
			//delete plot widget(s)
			if(event == WIDGET_EVENT_TYPE.DELETE){
				this.removePlotWidgets();
			}

			//update plotting widgets
			else if(event == WIDGET_EVENT_TYPE.UPDATE){
				//loop through all existing widgets
				for(var i =0; i<plots.length; i++){
					var plot = plots[i];

					//retrieve plot's datasets
					var dataSets = plot.getDataSets();

					if(dataSets != null){
						//keeps track of new values
						var newValues = [];

						var value;
						var u;
						for(var x =0; x <dataSets.length; x++)
						{
							var ds=dataSets[x].label.split("/");
							u = simulationStates[dataSets[x].label].unit;

							if(u != null){
								if(ds.length==1)
								{
									newValues.push({label : dataSets[x].label, data: [[simulationStates[ds[0]].value]], unit : u});
								}
								if(ds.length==2)
								{
									newValues.push({label : dataSets[x].label, data: [[
									                                                   simulationStates[ds[0]].value,
									                                                   simulationStates[ds[1]].value
									                                                   ]], unit : u});
								}	
							}
							else{
								if(ds.length==1)
								{
									newValues.push({label : dataSets[x].label, data: [[simulationStates[ds[0]].value]]});
								}
								if(ds.length==2)
								{
									newValues.push({label : dataSets[x].label, data: [[
									                                                   simulationStates[ds[0]].value,
									                                                   simulationStates[ds[1]].value
									                                                   ]]});
								}
							}						
						}

						//update plot with new data set
						plot.updateDataSet(newValues);
					}
				}
			}
		}
};
