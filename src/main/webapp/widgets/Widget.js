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
 * 
 * Base Widget Class, all widgets extend this class.
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

/**
 * Parent Widget Base class
 */
var Widget ={
		
		/**
		 * Not yet implemented, used for local storage and history. 
		 */
		Model : Backbone.Model.extend({
			
		}),
		
		/**
		 * Creates base view for widget
		 */
		View : Backbone.View.extend({

			id : null,
			dialog : null,
			visible : true,

			/**
			 * Initializes the widget
			 * 
			 * @param id - id of widget
			 * @param name - name of widget
			 * @param visibility - visibility of widget window
			 */
			constructor: function(id, name, visible) {
				this.id = id;
				this.name = name;
				this.visible = visible;

				// Call the original constructor
				Backbone.View.apply(this, arguments);
			},

			/**
			 * Destroy the widget, remove it from DOM
			 * 
			 * @returns {String} - Action Message
			 */
			destroy : function(){
				$("#"+this.id).remove();

				return this.name + " destroyed";
			},

			/**
			 * 
			 * Hides the widget 
			 * 
			 * @returns {String} - Action Message
			 */
			hide : function(){
				$("#"+this.id).dialog('close');;
				this.visible = false;

				return "Hiding " + this.name + " widget";
			},

			/**
			 *  Opens widget dialog
			 *  
			 * @returns {String} - Action Message
			 */
			show : function(){
				$("#"+this.id).dialog('open');
				this.visible = true;

				return "Showing " + this.name + " widget";
			}, 

			/**
			 * Gets the name of the widget
			 * 
			 * @returns {String} - Name of widget
			 */
			getName : function(){
				return this.name;
			},

			/**
			 * Gets the ID of the widget
			 * 
			 * @returns {String} - ID of widget
			 */
			getId : function(){
				return this.id;
			},

			/**
			 * Returns whether widget is visible or not
			 * 
			 * @returns {Boolean} - Widget visibility state
			 */
			isVisible : function(){
				return this.visible;
			},

			/**
			 * Renders the widget dialog window
			 */
			render: function() {
				//creat the dialog window for the widget
				this.dialog = $("<div id=" + this.id + " class='dialog' title='" + this.name + " Widget'></div>").dialog(
						{
							resizable :  true,
							draggable : true,
							height : 370,
							width : 430,
							modal : false
						});
			},
		}),
};
