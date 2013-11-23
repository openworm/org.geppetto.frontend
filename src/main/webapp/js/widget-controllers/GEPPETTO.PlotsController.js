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
GEPPETTO.PlotsController = GEPPETTO.PlotsController ||
{
	REVISION : '1'
};

var plots = new Array();

var plotsON = false;

/**
 * Toggles plotting widget on and off
 */
GEPPETTO.PlotsController.toggle = function(){
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
};

/**
 * Returns all plotting widgets objects
 */
GEPPETTO.PlotsController.getPlotWidgets = function(){
	return plots;
};

/**
 * Creates plotting widget
 * 
 * @ return {Widget} - Plotting widget
 */
GEPPETTO.PlotsController.addPlotWidget = function(){

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
	
	//add commands to console autocomplete and help option
	updateCommands("widgets/plots/Plot.js", p, id);

	return p;
};

function widgetHelp(){return extractCommandsFromFile("widgets/plots/Plot.js", Plot, "Plot");};

/**
 * Removes existing plotting widgets
 */
GEPPETTO.PlotsController.removePlotWidgets = function(){
	//remove all existing plotting widgets
	for(p in plots){
		var plot = plots[p];

		plot.destroy();
		
		removeTags(plot.getId());

		delete window[plot.getName()];
	}	

	plots = new Array();
};
