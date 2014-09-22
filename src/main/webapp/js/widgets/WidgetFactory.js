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
define(function(require) {

	return function(GEPPETTO) {
		/**
		 * 
		 * Widgets
		 * 
		 * Different types of widgets that exist in Geppetto
		 * 
		 * @enum
		 */
		GEPPETTO.Widgets = {
			PLOT : 0,
			POPUP : 1,
			SCATTER3D: 2,
			TREEVISUALISERDAT: 3,
			TREEVISUALISERD3: 4
		};

		/**
		 * @exports Widgets/GEPPETTO.WidgetFactory
		 */
		GEPPETTO.WidgetFactory = {
			/**
			 * Adds widget to Geppetto
			 * 
			 * @param {GEPPETTO.Widgets}
			 *            widgetType - Widget to add to Geppetto
			 */
			addWidget : function(widgetType) {
				var widget = null;
				switch(widgetType) {
					//create plotting widget
					case GEPPETTO.Widgets.PLOT:
						widget = GEPPETTO.PlotsController.addPlotWidget();
						break;
					//create popup widget
					case GEPPETTO.Widgets.POPUP:
						widget = GEPPETTO.PopupsController.addPopupWidget();
						break;
					//create scatter widget			
					case GEPPETTO.Widgets.SCATTER3D:
						widget = GEPPETTO.Scatter3dController.addScatter3dWidget();
						break;
					//create tree visualiser DAT widget				
					case GEPPETTO.Widgets.TREEVISUALISERDAT:
						widget = GEPPETTO.TreeVisualiserControllerDAT.addTreeVisualiserDATWidget();
						break;
					//create tree visualiser D3 widget				
					case GEPPETTO.Widgets.TREEVISUALISERD3:
						widget = GEPPETTO.TreeVisualiserControllerD3.addTreeVisualiserD3Widget();
						break;	
					default:
						break;
				}

				return widget;
			},

			/**
			 * Removes widget from Geppetto
			 * 
			 * @param {GEPPETTO.Widgets}
			 *            widgetType - Widget to remove from Geppetto
			 */
			removeWidget: function(widgetType) {
				switch(widgetType) {
					//removes plotting widget from geppetto
					case GEPPETTO.Widgets.PLOT:
						GEPPETTO.PlotsController.removePlotWidgets();
						return GEPPETTO.Resources.REMOVE_PLOT_WIDGETS;
					//removes popup widget from geppetto
					case GEPPETTO.Widgets.POPUP:
						GEPPETTO.PlotsController.removePopupWidgets();
						return GEPPETTO.Resources.REMOVE_POPUP_WIDGETS;
					//removes scatter3d widget from geppetto
					case GEPPETTO.Widgets.SCATTER3D:
						GEPPETTO.Scatter3dController.removeScatter3dWidgets();
						return GEPPETTO.Resources.REMOVE_SCATTER3D_WIDGETS;	
					//removes tree visualiser DAT widget from geppetto						
					case GEPPETTO.Widgets.TREEVISUALISERDAT:
						GEPPETTO.TreeVisualiserController.removeTreeVisualiserDATWidgets();
						return GEPPETTO.Resources.REMOVE_TREEVISUALISERDAT_WIDGETS;
					//removes tree visualiser D3 widget from geppetto												
					case GEPPETTO.Widgets.TREEVISUALISERD3:
						GEPPETTO.TreeVisualiserController.removeTreeVisualiserD3Widgets();
						return GEPPETTO.Resources.REMOVE_TREEVISUALISERD3_WIDGETS;	
					default:
						return GEPPETTO.Resources.NON_EXISTENT_WIDGETS;
				}
			}
		};
	};
});
