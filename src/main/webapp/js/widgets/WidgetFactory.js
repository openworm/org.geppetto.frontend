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
 * Class used to create widgets and handle widget events from parent class.
 */

/**
 * Enum use to hold different types of widgets
 */

define(function(require) {

	return function(GEPPETTO) {
		GEPPETTO.Widgets = {
			PLOT: 0,
			SCATTER3D: 1
		};

		GEPPETTO.WidgetFactory = {
			/**
			 * Adds widget to Geppetto
			 */
			addWidget: function(widgetType) {
				var widget = null;

				switch(widgetType) {
					//create plotting widget
					case GEPPETTO.Widgets.PLOT:
						widget = GEPPETTO.PlotsController.addPlotWidget();
						break;
					case GEPPETTO.Widgets.SCATTER3D:
						widget = GEPPETTO.Scatter3dController.addScatter3dWidget();
						break;
					default:
						break;
				}

				return widget;
			},

			/**
			 * Removes widget from Geppetto
			 */
			removeWidget: function(widgetType) {
				switch(widgetType) {
					//removes plotting widget from geppetto
					case GEPPETTO.Widgets.PLOT:
						GEPPETTO.PlotsController.removePlotWidgets();
						return GEPPETTO.Resources.REMOVE_PLOT_WIDGETS;
					case GEPPETTO.Widgets.SCATTER3D:
						GEPPETTO.Scatter3dController.removeScatter3dWidgets();
						return GEPPETTO.Resources.REMOVE_SCATTER3D_WIDGETS;
					default:
						return GEPPETTO.Resources.NON_EXISTENT_WIDGETS;
				}
			}
		};
	};
});
