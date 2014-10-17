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
 * Client class use to represent a connection node, used to store the connections
 * between two entities in Geppetto.
 * 
 * @module nodes/ConnectionNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var VisualObjectReferenceNode = require('nodes/VisualObjectReferenceNode');
	var $ = require('jquery');

	return Node.Model.extend({
		relations : [ {
			type : Backbone.Many,
			key : 'customNodes',
			relatedModel : Node,
		}, {
			type : Backbone.Many,
			key : 'visualObjectReferenceNodes',
			relatedModel : VisualObjectReferenceNode
		}],

		defaults : {
			customNodes : [],
			visualObjectReferenceNodes : [],
		},

		properties : {},
		_metaType : "ConnectionNode",
		entityInstancePath : null,
		type : null,

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.id = options.id;
			this.entityInstancePath = options.entityInstancePath;
			this.type = options.type;
			this.instancePath = options.instancePath;
		},

		/**
		 * Get Instance path of entity this connection is connected to
		 * 
		 * @command ConnectionNode.getEntityInstancePath()
		 * @returns {String} Entity instance patch for entity this connection 
		 *                   is connected to
		 */
		getEntityInstancePath : function() {
			return this.entityInstancePath;
		},
		
		/**
		 * Get type of connection
		 * 
		 * @command ConnectionNode.getType()
		 * @returns {String} Type of connection
		 */
		getType : function() {
			return this.type;
		},

		/**
		 * Returns array of custom nodes for this connection
		 */
		getCustomNodes : function(){
			return this.get("customNodes");
		},
		
		/**
		 * Returns array of visual object reference nodes for this connection
		 */
		getVisualObjectReferenceNodes : function(){
			return this.get("visualObjectReferenceNodes");
		},
		
		highlight : function(mode){
			
		},
		
		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Id : " + this.id + "\n" 
					+ "    EntityInstancePath : " + this.entityInstancePath + "\n"
					+ "    Type : " + this.type + "\n";
		}
	});
});