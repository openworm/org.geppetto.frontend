/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2014 OpenWorm.
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
 * Controller class for variables visualiser widget.
 *
 * @author Dan Kruchinin (dkruchinin@acm.org)
 */
define(function(require) {
	return function(GEPPETTO) {

		var VarVis = require('widgets/variablevisualiser/VariableVisualiser');
		var visualisers = [];
		var vvisON = true;

		/**
		 * @exports Widgets/VariableVisualiser/VariableVisualiserController
		 */
		GEPPETTO.VariableVisualiserController = {

			/**
			 * Registers widget events to detect and execute following actions.
			 * Used when widget is destroyed.
			 *
			 * @param {String} vvisID - ID of the variable visualiser to register
			 */
			registerHandler: function(vvisID) {
				GEPPETTO.WidgetsListener.subscribe(GEPPETTO.VariableVisualiserController, vvisID);
			},

			/**
			 * Returns all variables visualiser widgets
			 *
			 * @returns {Array} Array of variable visualiser widgets
			 */
			getWidgets: function() {
				return visualisers;
			},

			/**
			 * Creates new variable visualiser widget
			 */
			addVariableVisualiserWidget: function() {

				var index = (visualisers.length + 1);
				var name = "VarVis" + index;
				var id = name;
				var vv = window[name] = new VarVis({id:id, name:name,visible:true});
				vv.help = function(){return GEPPETTO.Console.getObjectCommands(id);};
				visualisers.push(vv);
				this.registerHandler(id);

				//add commands to console autocomplete and help option
				GEPPETTO.Console.updateCommands("js/widgets/variablevisualiser/VariableVisualiser.js", vv, id);
				return vv;
			},

			/**
			 * Removes existing variable visualiser widgets
			 */
			removeVariableVisualiserWidgets: function() {
                for (var i = 0; i < visualisers.length; i++) {
					GEPPETTO.Console.removeCommands(visualisers[i].getId());
					visualisers[i].destroy();
				}

				visualisers = [];
			},

			/**
			 * Toggles variable visualiser widget on and off
			 */
			toggle: function() {
				if (visualisers.length == 0) {
					GEPPETTO.Console.executeCommand('G.addWidget(GEPPETTO.Widgets.VARIABLEVISUALISER)');
				}
				else if (visualisers.length > 0) {
					vvisON = !vvisON;

					for (var vv in visualisers) {
						var vvis = visualisers[vv];
						if (!vvisON) {
							vvis.hide();
						} else {
							vvis.show();
						}
					}
				}
			},

			/**
			 * Receives updates from widget listener class to update variable visualiser widget(s)
			 *
			 * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
			 */
			update: function(event) {
				//delete a widget(s)
				if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
					this.removeVariableVisualiserWidgets();
				}

				//reset widget's datasets
				else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA) {
					for (var i = 0; i < visualisers.length; i++) {
						visualisers[i].cleanVariables();
					}
				}

				//update widgets
				else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.UPDATE) {
					for (var i = 0; i < visualisers.length; i++) {
                        visualisers[i].updateVariables();
					}
				}
			}
		};
	};
});