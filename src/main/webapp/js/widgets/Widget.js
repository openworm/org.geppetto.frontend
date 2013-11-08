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
	
		View : Backbone.View.extend({
		
		id : null,
		dialog : null,
		
		constructor: function(id, name) {
			this.id = id + "-widget";
			this.name = name;

			// Call the original constructor
			Backbone.View.apply(this, arguments);
		},

		destroy : function(){
			GEPPETTO.Console.log("Destroying widget " + this.id);
			$(this.id).remove();
		},

		hide : function(){
			GEPPETTO.Console.log("Hiding widget " + this.id);
			$("#"+this.id).hide();;
		},

		show : function(){
			GEPPETTO.Console.log("Showing widget " + this.id);
			$("#"+this.id).show();
		}, 

		// Create the widget
		render: function() {
			GEPPETTO.Console.log("Rendering widget " + this.id);
			this.dialog = this.createWidgetFrame(this.id, "");

			return this;
		},
		
		createWidgetFrame : function(id, title)
		{
			return $("<div id=" + id + " class='dialog' title='" + this.name + " Widget'></div>").dialog(
					{
						resizable : true,
						draggable : true,
						height : 370,
						width : 430,
						modal : false
					});
		},
		}),
	};
