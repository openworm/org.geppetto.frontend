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
 *
 * Base Widget Class, all widgets extend this class.
 * @module Widgets/Widget
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Backbone = require('backbone');
	var $ = require('jquery');
	return {
		/**
		 * Creates base view for widget
		 */
		View: Backbone.View.extend({

			widgets : new Array(),
			on : true,
			registeredEvents : null,
			
			constructor: function() {
			    // Call the original constructor
			    Backbone.View.apply(this, arguments);
			    registeredEvents = new Array();
			 },
		
			/**
			 * Returns all plotting widgets objects
			 * 
			 * @returns {Array} Array containing all plots
			 */
			getWidgets: function() {
				return this.widgets;
			},
			
			/**
			 * Toggles variable visualiser widget on and off
			 */
			toggle: function() {
				if (this.widgets.length > 0) {
					this.on = !this.on;
					for (var w in this.widgets) {
						var widget = this.widgets[w];
						if (!this.on) {
							widget.hide();
						} else {
							widget.show();
						}
					}
				}
			},
			
			/**
			 * Removes existing plotting widgets
			 */
			removeWidgets: function() {
				//remove all existing widgets
				for(var i = 0; i < this.widgets.length; i++) {
					var widget = this.widgets[i];
					
					//remove commands 
					GEPPETTO.Console.removeCommands(widget.getId());

					widget.destroy();
					
					i--;
				}

				this.widgets = new Array();
			},
		})
	};

});
