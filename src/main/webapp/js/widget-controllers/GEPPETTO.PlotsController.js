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
GEPPETTO.PlotsController = GEPPETTO.PlotsController ||
{
	REVISION : '1'
};

var plots = new Array();

GEPPETTO.PlotsController.toggle = function(){
	if(plots.length==0){
		GEPPETTO.Console.executeCommand('W.addWidget(Widgets.PLOT)');
	}
	else{
		GEPPETTO.Console.executeCommand('W.removeWidget(Widgets.PLOT)');
	}
};

GEPPETTO.PlotsController.getPlotWidgets = function(){
	return plots;
};

GEPPETTO.PlotsController.addPlotWidget = function(){
	window.plot1 = new Plot("plot", "Plot");
	plots.push(window.plot1);
	
	return window.plot1;
};

GEPPETTO.PlotsController.removePlotWidgets = function(){
	for(p in plots){
		plots[p].destroy();
	}
	
	plots = new Array();
};
