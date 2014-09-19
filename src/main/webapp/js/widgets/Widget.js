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
 *
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */

/**
 * Parent Widget Base class
 */

define(function(require) {

	var Backbone = require('backbone');
	var $ = require('jquery');
	return {

		/**
		 * Not yet implemented, used for local storage and history.
		 */
		Model: Backbone.Model.extend({

		}),

		/**
		 * Creates base view for widget
		 */
		View: Backbone.View.extend({

			id: null,
			dialog: null,
			visible: true,
			size: {height: 300, width: 350},
			position: {left: "50%", top: "50%"},

			/**
			 * Initializes the widget
			 *
			 * @param id - id of widget
			 * @param name - name of widget
			 * @param visibility - visibility of widget window
			 */
			initialize: function(options) {
				this.id = options.id;
				this.name = options.name;
				this.visible = options.visible;
				this.contextMenu = new GEPPETTO.ContextMenuView();
			},

			/**
			 * Destroy the widget, remove it from DOM
			 *
			 * @name destroy()
			 * @returns {String} - Action Message
			 */
			destroy: function() {
				$("#" + this.id).remove();

				return this.name + " destroyed";
			},

			/**
			 *
			 * Hides the widget
			 *
			 * @name hide()
			 * @returns {String} - Action Message
			 */
			hide: function() {
				$("#" + this.id).dialog('close');

				this.visible = false;

				return "Hiding " + this.name + " widget";
			},

			/**
			 *  Opens widget dialog
			 *
			 * @name show()
			 * @returns {String} - Action Message
			 */
			show: function() {
				$("#" + this.id).dialog('open');
				this.visible = true;

				//Unfocused close button 
				$(".ui-dialog-titlebar-close").blur();

				return "Showing " + this.name + " widget";
			},

			/**
			 * Gets the name of the widget
			 *
			 * @name getName()
			 * @returns {String} - Name of widget
			 */
			getName: function() {
				return this.name;
			},

			/**
			 * Sets the name of the widget
			 * @name setName(name)
			 * @param name - Name of widget
			 */
			setName: function(name) {
				this.name = name;

				// set name to widget window
				$("#" + this.id).dialog("option", "title", this.name);

				return "Widget has been renamed to " + this.name;
			},

			/**
			 * @name setPosition(left,top)
			 */
			setPosition: function(left, top) {

				this.position.left = left;
				this.position.top = top;
				$("#" + this.id).dialog('option', 'position', [this.position.left, this.position.top]);

				return this.name + " Widget's position has been updated";
			},

			/**
			 * @name setSize(h,w)
			 */
			setSize: function(h, w) {
				this.size.height = h;
				this.size.width = w;
				$("#" + this.id).dialog({ height: this.size.height, width: this.size.width });

				return this.name + " Widget has been resized";
			},

			/**
			 * @name getPosition()
			 */
			getPosition: function() {
				return this.position;
			},

			/**
			 * @name getSize()
			 */
			getSize: function() {
				return this.size;
			},

			/**
			 * Gets the ID of the widget
			 *
			 * @name getId()
			 * @returns {String} - ID of widget
			 */
			getId: function() {
				return this.id;
			},

			/**
			 * Returns whether widget is visible or not
			 *
			 * @name isVisible()
			 * @returns {Boolean} - Widget visibility state
			 */
			isVisible: function() {
				return this.visible;
			},
			
			/**
			 * Search obj for the value of node within using path.
			 * E.g. If obj = {"tree":{"v":1}} and path is "tree.v", it will
			 * search within the obj to find the value of "tree.v", returning object 
			 * containing {value : val, unit : unit, scale : scale}.
			 */
			getState : function(tree, state) {
				var paths = state.split('.')
				, current = tree
				, i;

				for (i = 0; i < paths.length; ++i) {
					//get index from node if it's array
					var index = paths[i].match(/[^[\]]+(?=])/g);

					if(index == null){
						if (current[paths[i]] == undefined) {
							return undefined;
						} else {
							current = current[paths[i]];
						}
					}
					else{
						var iNumber =index[0].replace(/[\[\]']+/g,"");

						//take index and brackets out of the equation for now
						var node = paths[i].replace(/ *\[[^]]*\] */g, "");

						if (current[node][parseInt(iNumber)] == undefined) {
							return undefined;
						} else {
							current = current[node][parseInt(iNumber)];
						}
					}
				}
				return current;
			},

			showContextMenu: function (event, data) {
				var handlers = GEPPETTO.MenuManager.getCommandsProvidersFor(data._metaType);
				
				if (handlers.length >0){
					var groups = [];	
					for (var handlerIndex = 0; handlerIndex < handlers.length; handlerIndex++){
						groups = groups.concat(handlers[handlerIndex](data));
					}
				
				    this.contextMenu.show({
				        top: event.pageY,
				        left: event.pageX + 1,
				        groups: groups,
	//			        registeredItems: registeredItems,
				        data: data
				    });
				}
			    
				if (event!=null){
					event.preventDefault();
				}
			    
			    return false;
			},
			
			/**
			 * Renders the widget dialog window
			 */
			render: function() {

				//create the dialog window for the widget
				this.dialog = $("<div id=" + this.id + " class='dialog' title='" + this.name + " Widget'></div>").dialog(
					{
						resizable: true,
						draggable: true,
						top: 10,
						height: 300,
						width: 350,
						close: function(event, ui) {
							if(event.originalEvent &&
								$(event.originalEvent.target).closest(".ui-dialog-titlebar-close").length) {
								$("#" + this.id).remove();
							}
						}
					});

				this.$el = $("#"+this.id);
				
				//Take focus away from close button
				$(".ui-dialog-titlebar-close").blur();

			}
		})
	};

});
