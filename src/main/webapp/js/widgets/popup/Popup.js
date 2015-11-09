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
define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');
	
	/**
	 * Private function to hookup custom event handlers
	 * 
	 * NOTE: declared here so that it's private.
	 */
	var hookupCustomHandlers = function(handlers, popup){
		for (var i = 0; i < handlers.length; i++) {
			// if not hooked already, then go ahead and hook it
			if(handlers[i].hooked === false){
				// set hooked to avoid double triggers
				handlers[i].hooked = true;
				
				// Find and iterate <a> element with an instancepath attribute
				popup.find("a[instancepath]").each(function(){
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
					if(domainType === undefined || (domainType !== undefined && node!== undefined && node.domainType === domainType)){
						// hookup custom handler
						$(this).on(ev, function(){						
							// invoke custom handler with instancepath as arg
							fun(node);
							
							// stop default event handler of the anchor from doing anything
							return false;
						});
					}
				});
			}
		}
	}

	return Widget.View.extend({
		
		/**
		 * Initialize the popup widget
		 */
		initialize : function(options){
			this.id = options.id;
			this.name = options.name;
			this.visible = options.visible;
			this.render();
			this.setSize(100,300);
			this.customHandlers = [];
			//set class pop up
			$("#"+this.id).addClass("popup");
		},
		
		/**
		 * Sets the message that is displayed inside the widget
		 * 
		 * @command setMessage(msg)
		 * @param {String} msg - The message that is displayed inside the widget
		 */
		setMessage : function(msg){
			$("#"+this.id).html(msg);
			GEPPETTO.Console.log("Set new Message for " + this.id);
			
			if(this.customHandlers.length > 0){
				// msg has changed, set hooked attribute on handlers to false
				for (var i = 0; i < this.customHandlers.length; i++) {
					this.customHandlers[i].hooked = false;
				}
				
				// trigger routine that hooks up handlers
				hookupCustomHandlers(this.customHandlers, $("#"+this.id));
				GEPPETTO.Console.log("Hooked up custom handlers for " + this.id);
			}
			
			return this;
		},
		
		/**
		 * Sets a custom handler for a given event for nodes that point to nodes via instancePAth attribute on HTML anchors.
		 * 
		 * @command addCustomNodeHandler(funct, eventType)
		 * @param {fucntion} funct - Handler function
		 * @param {String} eventType - event that triggers the custom handler 
		 */
		addCustomNodeHandler : function(funct, eventType, domainType){
			this.customHandlers.push({ funct: funct, event: eventType, domain: domainType, hooked: false});
			
			// trigger routine that hooks up handlers
			hookupCustomHandlers(this.customHandlers, $("#"+this.id));
		}
	});
});
