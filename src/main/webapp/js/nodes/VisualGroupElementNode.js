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
 * Client class use to represent a VisualGroupElement Node, used for visualization tree
 * properties.
 * 
 * @module nodes/VisualGroupElementNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');

	return Node.Model.extend({
		value : "",
		unit : "",
		scalingFactor : "",
		color : "",

		/**
		 * Initializes this node with passed attributes
		 * 
		 * @param {Object} options - Object with options attributes to initialize
		 *                           node
		 */
		initialize : function(options) {
			this.value = options.value;
			this.unit = options.unit;
			this.scalingFactor = options.scalingFactor;
			this.color = options.color;
			this.name = options.name;
			this.id = options.id;
			this.instancePath = options.instancePath;
			this.domainType = options.domainType;
			this._metaType = options._metaType;
		},

		/**
		 * Get value of quantity
		 * 
		 * @command VisualGroupElementNode.getValue()
		 * @returns {String} Value of quantity
		 */
		getValue : function() {
			return this.value;
		},
		
		/**
		 * Get unit of quantity
		 * 
		 * @command VisualGroupElementNode.getUnit()
		 * @returns {String} Unit of quantity
		 */
		getUnit : function() {
			return this.unit;
		},

		/**
		 * Get scaling factor
		 * 
		 * @command VisualGroupElementNode.getScalingFactor()
		 * @returns {String} Scaling Factor for value and unit
		 */
		getScalingFactor : function() {
			return this.scalingFactor;
		},
		
		/**
		 * Get color of element
		 * 
		 * @command VisualGroupElementNode.getValue()
		 * @returns {String} Color of VisualGroupElementNode
		 */
		getColor : function() {
			return this.color;
		},
		
		show : function(mode){
			var visualizationTree = this.getParent().getParent();
			
			if(mode){
				GEPPETTO.SceneController.split(visualizationTree.getParent().getInstancePath());
			}
			else{
				GEPPETTO.SceneController.merge(visualizationTree.getParent().getInstancePath());
			}
			
			var group = {};
			group[this.name] = {};
			group[this.name].color = this.getColor();
			
			GEPPETTO.SceneController.showVisualGroups(visualizationTree, group,mode);			
		},

		/**
		 * Print out formatted node
		 */
		print : function() {
			return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
					+ "    InstancePath : " + this.instancePath + "\n"
					+ "    Properties : " + this.properties + "\n";
		}
	});
});