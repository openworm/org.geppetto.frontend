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
 * Class used to create widgets. 
 */

/**
 * Enum use to hold different types of widgets
 */
var Widgets = {
			PLOT : 0
};

(function(){
	GEPPETTO.WidgetFactory = GEPPETTO.WidgetFactory ||
	{
		REVISION : '1'
	};
	
	/**
	 * Adds widget to Geppetto
	 */
	GEPPETTO.WidgetFactory.addWidget = function(widgetType){
		var widget = null;
		
		switch(widgetType){
			//create plotting widget
			case Widgets.PLOT:
				widget = GEPPETTO.PlotsController.addPlotWidget();
				break;
			default: 
				break;
		}
		
		return widget;
	};
	
	/**
	 * Removes widget from Geppetto
	 */
	GEPPETTO.WidgetFactory.removeWidget = function(widgetType){
		switch(widgetType){
			//removes plotting widget from geppetto
			case Widgets.PLOT:
				GEPPETTO.PlotsController.removePlotWidgets();
				return REMOVE_PLOT_WIDGET;
				break;
			default: 
				break;
		}
	};	
})();	