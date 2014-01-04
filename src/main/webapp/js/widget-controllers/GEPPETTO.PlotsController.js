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

GEPPETTO.PlotsController = {

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

		/**
		 * Returns all plotting widgets objects
		 */
		getPlotWidgets : function(){
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
			updateCommands("widgets/plots/Plot.js", p, id);

			return p;
		},
		
		/**
		 * Registers widget events to detect and execute following actions. 
		 * Used when widget is destroyed. 
		 * 
		 * @param plotID
		 */
		registerHandler : function(plotID){
			
			GEPPETTO.WidgetsListener.subscribe(GEPPETTO.PlotsController);
			
			//registers remove handler for widget
			$("#" +plotID).on("remove", function () {
				//remove tags and delete object upon destroying widget
				removeTags(plotID);

				for (p in plots)
				{
					if (plots[p].getId() == this.id)
					{
						plots.splice(p,1);
						break;
					}
				}

				var simStates = getSimulationStates();
				for(var state in simStates){
					if(window[state].isSubscribed(window[plotID])){
						window[state].unsubscribe(window[plotID]);
					}
				}
				
				delete window[plotID];
			});
			
			//subscribe widget to simulation state 
			$("#" +plotID).on("subscribe", function (event, param1) {
				//param1 corresponds to simulation state, subscribe widget to it
				window[param1].subscribe(window[plotID]);				
			});
			
			//subscribe widget to simulation state 
			$("#" +plotID).on("unsubscribe", function (event, param1) {
				//param1 corresponds to simulation state, subscribe widget to it
				window[param1].unsubscribe(window[plotID]);				
			});
			
			//register resize handler for widget
			$("#"+plotID).on("dialogresizestop", function(event, ui){
				
				var height = ui.size.height;
				var width = ui.size.width;
				
				GEPPETTO.Console.executeCommand(plotID+".setSize(" + height +"," +  width + ")");
				
				var left = ui.position.left;
				var top = ui.position.top;
				
				window[plotID].setPosition(left, top);
			});
			
			//register drag handler for widget
			$("#" +plotID).on("dialogdragstop", function(event,ui){
				
				var left = ui.position.left;
				var top = ui.position.top;
				
				GEPPETTO.Console.executeCommand(plotID+".setPosition(" + left +"," +  top + ")");
			});
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

		//receives updates from widget listener class
		update : function(event){
			if(event == WIDGET_EVENT_TYPE.DELETE){
				this.removePlotWidgets();
			}
		}
};