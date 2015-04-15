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
 * Button Bar Widget class
 * 
 * @module Widgets/ButtonBar
 * @author borismarin
 */
define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View
			.extend({
				root : null,
				variable : null,
				options : null,
				default_width : 270,
				default_height : 90,

				/**
				 * Initialises viriables visualiser with a set of options
				 * 
				 * @param {Object}
				 *            options - Object with options for the widget
				 */
				initialize : function(options) {
					this.id = options.id;
					this.name = options.name;
					this.options = options;

					if (!('width' in options)) {
						options.width = this.default_width;
					}
					if (!('height' in options)) {
						options.height = this.default_height;
					}

					this.render();
					this.setSize(options.height, options.width);
					this.dialog.append("<div class='bubar_body'></div>");
				},

				/**
				 * Creates a button bar from definitions specified in an
				 * external json file
				 * 
				 * @command fromJSON(url)
				 * @param {String}
				 *            url - URL of the json file defining the button bar
				 */

				createButtonGroup : function(bgName, bgDef) {

					function named(constructor, name, def) {
						return constructor(def).attr('id', name)
					};

					function createButtonContent(button) {
						return $('<span>')
							.addClass(button.icon)
							.append(' ' + button.label)
					};

					function createButtonCallback(button) {
						return function() {
							button.actions.forEach(function(action) {
								GEPPETTO.Console.executeCommand(action)
							});
						}
					}

					function createButton(button) {
						return $('<button>')
								.addClass('btn')
								.append(createButtonContent(button))
								.on('click', createButtonCallback(button))
					};

					var bg = $('<div>')
								.addClass('btn-group')
								.attr('role', 'group')
								.attr('id', bgName);
					$.each(bgDef, function(bName, bData) {
						bg.append(named(createButton, bName, bData))
					});
					return bg;
				},

				fromJSON : function(url) {
					var self = this;
					if (this.root == null) {
						this.root = $("#" + this.id)
					}
					//$.getJSON("menu.json", function(groups) {
					var groups = {
						    "buttonGroupOne": {
						        "buttonOne": {
						            "actions": [
						                "console.log('button1.action1')",
						                "console.log('button1.action2')"
						            ],
						            "icon": "myIcon-osb",
						            "label": "Button1",
						            "tooltip": "Thisisabutton"
						        },
						        "buttonTwo": {
						            "actions": [
						                "console.log('button2.action1')"
						            ],
						            "icon": "myIcon-tree",
						            "label": "Button2",
						            "tooltip": "Thisisanotherbutton"
						        }
						    },
						    "buttonGroupTwo": {
						        "buttonThree": {
						            "actions": [
						                "console.log('button3.action1')"
						            ],
						            "icon": "myIcon-make-group",
						            "label": "Button3",
						            "tooltip": "Thisisabutton"
						        }
						    }
						};
						var bbar = $('<div>').addClass('toolbar');
						$.each(groups, function(groupName, groupDef) {
							bbar.append(self.createButtonGroup(groupName, groupDef));
						});
					//});

					// this.setHeader(this.variable.name);
					this.setBody(bbar);
					return "Button Bar definition read from " + url;
				},

				/**
				 * @private
				 */
				setHeader : function(content) {
					this.getSelector("bubar_variable").html(content);
				},

				/**
				 * @private
				 */
				setBody : function(content) {
					this.getSelector("bubar_body").html(content);
				},

				/**
				 * @private
				 */
				getSelector : function(name) {
					return $(this.root.selector + " ." + name);
				}
			});
});
