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
 * Popup Widget
 *
 * @module Widgets/Popup
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');
	var Type = require('model/Type');

	/**
	 * Private function to hookup custom event handlers
	 *
	 * NOTE: declared here so that it's private.
	 */
	var hookupCustomHandlers = function (handlers, popupDOM, popup) {
		for (var i = 0; i < handlers.length; i++) {
			// if not hooked already, then go ahead and hook it
			if (handlers[i].hooked === false) {
				// set hooked to avoid double triggers
				handlers[i].hooked = true;

				// Find and iterate <a> element with an instancepath attribute
				popupDOM.find("a[instancepath]").each(function () {
					var fun = handlers[i].funct;
					var ev = handlers[i].event;
					var domainType = handlers[i].domain;
					var path = $(this).attr("instancepath").replace(/\$/g, "");
					var node;

					try {
						node = eval(path);
					} catch (ex) {
						// if instance path doesn't exist set path to undefined
						node = undefined;
					}

					// hookup IF domain type is undefined OR it's defined and it matches the node type
					if (domainType === undefined || (domainType !== undefined && node !== undefined && node.domainType === domainType)) {
						// hookup custom handler
						$(this).on(ev, function () {
							// invoke custom handler with instancepath as arg
							fun(node, path, popup);

							// stop default event handler of the anchor from doing anything
							return false;
						});
					}
				});
			}
		}
	};

	return Widget.View.extend({

		/**
		 * Initialize the popup widget
		 */
		initialize: function (options) {
			Widget.View.prototype.initialize.call(this, options);
			this.render();
			this.setSize(100, 300);
			this.customHandlers = [];
			//set class pop up
			$("#" + this.id).addClass("popup");
		},

		/**
		 * Sets the message that is displayed inside the widget
		 *
		 * @command setMessage(msg)
		 * @param {String} msg - The message that is displayed inside the widget
		 */
		setMessage: function (msg) {
			$("#" + this.id).html(msg);
			GEPPETTO.Console.log("Set new Message for " + this.id);

			if (this.customHandlers.length > 0) {
				// msg has changed, set hooked attribute on handlers to false
				for (var i = 0; i < this.customHandlers.length; i++) {
					this.customHandlers[i].hooked = false;
				}

				// trigger routine that hooks up handlers
				hookupCustomHandlers(this.customHandlers, $("#" + this.id), this);
				GEPPETTO.Console.log("Hooked up custom handlers for " + this.id);
			}

			return this;
		},

		/**
		 * Sets the message that is displayed inside the widget through an instance of type Text
		 *
		 * @command setText(textInstance)
		 * @param {Object} textInstance - An instance of type Text
		 */
		setText: function (textNode) {
			return this.setMessage(this.getVariable(textNode).getInitialValues()[0].value.text);
		},

		/**
		 * Sets the message that is displayed inside the widget through an instance of type HTML
		 *
		 * @command setHTML(htmlInstance)
		 * @param {Object} htmlInstance - An instance of type HTML
		 */
		setHTML: function (htmlNode) {
			if($.isArray(htmlNode)){
				var html = "";
				for(var i in htmlNode){
					var values = this.getVariable(htmlNode[i]).getInitialValues();
					html += values[0].value.html;
				}
				this.setMessage(html);
			}else{
				this.setMessage(this.getVariable(htmlNode).getInitialValues()[0].value.html);
			}
		},


		/**
		 * Sets the message that is displayed inside the widget through an instance of any type.
		 *
		 * @command setData(anyInstance)
		 * @param {Object} anyInstance - An instance of any type
		 */
		setData: function (anyInstance, filter) {
			this.controller.addToHistory(anyInstance.getName(),"setData",[anyInstance, filter]);

			this.setMessage(this.getHTML(anyInstance, "", filter));
			var changeIcon=function(chevron){
				if (chevron.hasClass('fa-chevron-circle-down')) {
					chevron.removeClass("fa-chevron-circle-down").addClass("fa-chevron-circle-up");
				}
				else {
					chevron.removeClass("fa-chevron-circle-up").addClass("fa-chevron-circle-down");
				}
			};
			$("#" + this.getId() + ' .popup-title').click(function (e) {
				changeIcon($($(e.target).attr("data-target") + "_chevron"));
			});
			$("#" + this.getId() + " .popup-chevron").click(function (e) {
				changeIcon($(e.target));
			});
			$("#" + this.getId() + " .slickdiv").slick();
			return this;
		},

		/**
		 *
		 * @param anyInstance
		 * @returns {string}
		 */
		getHTML: function (anyInstance, id, filter) {
			var type = anyInstance;
			if(!(type instanceof Type)){
				type=anyInstance.getType();
			}
			var html = "";
			
			//let's check the filter
			if(filter!=undefined && type.getMetaType() != GEPPETTO.Resources.COMPOSITE_TYPE_NODE){
				if($.inArray(type.getMetaType(), filter)==-1){
					//this type is not in the filter!
					return html;
				}
			}
			
			if (type.getMetaType() == GEPPETTO.Resources.COMPOSITE_TYPE_NODE) {
				for (var i = 0; i < type.getVariables().length; i++) {
					var v = type.getVariables()[i];
					
					if(filter!=undefined){
						if($.inArray(v.getType().getMetaType(), filter)==-1){
							//this type is not in the filter!
							continue;
						}
					}

					var id = this.getId() + "_" + type.getId() + "_el_" + i;
					if(filter==undefined){
						//Titles are only displayed if there's no filter..maybe random, make it a separate parameter
						html += "<div class='popup-title' data-toggle='collapse' data-target='#" + id + "'>" + v.getName() + "</div><div id='" + id + "_chevron" + "' data-toggle='collapse' data-target='#" + id + "' class='popup-chevron fa fa-chevron-circle-down '></div>"
					}
					html += this.getHTML(v, id, filter);
				}
			}
			else if (type.getMetaType() == GEPPETTO.Resources.HTML_TYPE) {
				var value = this.getVariable(anyInstance).getInitialValues()[0].value;
				html += "<div id='" + id + "' class='collapse in popup-html'>" + value.html + "</div>";
			}
			else if (type.getMetaType() == GEPPETTO.Resources.TEXT_TYPE) {
				var value = this.getVariable(anyInstance).getInitialValues()[0].value;
				html += "<div id='" + id + "' class='collapse in popup-text'>" + value.text + "</div>";
			}
			else if (type.getMetaType() == GEPPETTO.Resources.IMAGE_TYPE) {
				var value = this.getVariable(anyInstance).getInitialValues()[0].value;
				if (value.eClass == GEPPETTO.Resources.ARRAY_VALUE) {
					//if it's an array we use slick to create a carousel
					var elements = "";
					for (var j = 0; j < value.elements.length; j++) { 
						var image = value.elements[j].initialValue;
						elements += "<div class='popup-slick-image'>"+image.name+"<a href='' instancepath='" + image.reference + "'><img  class='popup-image invert' src='" + image.data + "'/></a></div>";
					}
					html += "<div id='" + id + "' class='slickdiv popup-slick collapse in' data-slick='{\"fade\": true,\"centerMode\": true, \"slidesToShow\": 1, \"slidesToScroll\": 1}' >" + elements + "</div>";
				}
				else if (value.eClass == GEPPETTO.Resources.IMAGE) {
					//otherwise we just show an image
					var image = value;
					html += "<div id='" + id + "' class='popup-image collapse in'><a href='' instancepath='" + image.reference + "'><img  class='popup-image invert' src='" + image.data + "'/></a></div>";
				}

			}
			return html;
		},

		/**
		 * Returns the variable for a node or variable node
		 *
		 * @command getVariable(node)
		 * @param {Object} variable - A variable
		 */
		getVariable: function (node) {
			if (node.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
				return node.getVariable();
			}
			else {
				return node;
			}
		},

		/**
		 * Sets a custom handler for a given event for nodes that point to nodes via instancePath attribute on HTML anchors.
		 *
		 * @command addCustomNodeHandler(funct, eventType)
		 * @param {fucntion} funct - Handler function
		 * @param {String} eventType - event that triggers the custom handler
		 */
		addCustomNodeHandler: function (funct, eventType, domainType) {
			this.customHandlers.push({funct: funct, event: eventType, domain: domainType, hooked: false});

			// trigger routine that hooks up handlers
			hookupCustomHandlers(this.customHandlers, $("#" + this.id), this);
			return this;
		}
	});
});
