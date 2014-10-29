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
 * Client class use to represent a VisualGroup Node, used for visualization tree
 * properties.
 * 
 * @module nodes/VisualGroupNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var VisualGroupElementNode = require('nodes/VisualGroupElementNode');

	return Node.Model.extend({
		relations : [ {
			type : Backbone.Many,
			key : 'visualGroupElements',
			relatedModel : VisualGroupElementNode,
		}],

		defaults : {
			visualGroupElements : [],
		},

		type : "",
		highSpectrumColor : "",
		lowSpectrumColor : "",

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.type = options.type;
			this.highSpectrumColor = options.highSpectrumColor;
			this.lowSpectrumColor = options.lowSpectrumColor;
			this.name = options.name;
			this.id = options.id;
			this.instancePath = options.instancePath;
			this.domainType = options.domainType;
			this._metaType = options._metaType;
		},

		/**
		 * Get type of Visual Group Node
		 * 
		 * @command VisualGroupNode.getType()
		 * @returns {String} Type of Visual Group
		 */
		getType : function() {
			return this.type;
		},

		/**
		 * Get low spectrum color
		 * 
		 * @command VisualGroupNode.getLowSpectrumColor()
		 * @returns {String} Low Spectrum Color
		 */
		getLowSpectrumColor : function() {
			return this.scalingFactor;
		},
		
		/**
		 * Get high spectrum color of visual group
		 * 
		 * @command VisualGroupNode.getHighSpectrumColor()
		 * @returns {String} High Spectrum color of visual gorup
		 */
		getHighSpectrumColor : function() {
			return this.highSpectrumColor;
		},

		/**
		 * Get this visual group's elements
		 * 
		 * @command VisualGroupNode.getVisualGroupElements()
		 * @returns {Array} Array of Visual Group Elements
		 * 
		 */
		getVisualGroupElements : function() {
			var connections = this.get("visualGroupElements").models;
			return connections;
		},

		/**
		 * Get this visual group children
		 * 
		 * @command VisualGroupNode.getChildren()
		 * @returns {List<Aspect>} All children e.g. Visual Group Element Nodes
		 */
		getChildren : function() {
			 var children = new Backbone.Collection();
			 children.add(this.get("visualGroupElements").models);
			 return children;
		},
		
		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
					+ "    Type : " + this.type + "\n"
					+ "    HighSpectrumColor : " + this.highSpectrumColor + "\n"
					+ "    LowSpectrumColor : " + this.lowSpectrumColor + "\n";
		}
	});
});