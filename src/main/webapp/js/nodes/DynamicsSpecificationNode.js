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
 * Client class use to represent a specification node, used for model tree properties.
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var FunctionNode = require('nodes/FunctionNode');
	var $ = require('jquery');
		
	return Node.Model.extend({
		relations:[
		           {
		        	   type:Backbone.One,
		        	   key:'dynamics',
		        	   relatedModel:FunctionNode,
		           }
		           ],
		defaults : {
			dynamics : {}
		},
		unit:"",
		value : "",
		scalingFactor : "",
		dynamics : null,
		_metaType : "",
		
		initialize : function(options){
			this.unit = options.unit;
			this.value = options.value;
			this.scalingFactor = options.scalingFactor;
			this.dynamics = options.dynamics;
			this.name = options.name;
			this._metaType = options._metaType;
		},
		
		/**
		 * Get the type of tree this is
		 *
		 * @name DynamicsSpecificationNode.getUnit()
		 * @returns {String} - Unit for quantity
		 */
		getUnit : function(){
			return this.unit;
		},
		
		/**
		 * Get value of quantity
		 *
		 * @name DynamicsSpecificationNode.getValue()
		 * @returns {String} - Value of quantity
		 */
		getValue : function(){
			return this.value;
		},
		
		/**
		 * Get scaling factor
		 *
		 * @name DynamicsSpecificationNode.getScalingFactor()
		 * @returns {String} - Scaling Factor for value and unit
		 */
		getScalingFactor : function(){
			return this.scalingFactor;
		},
		
		/**
		 * Get dynamics function node for this specifications node
		 * @returns {FunctionNode} - Specifies dynamics for node
		 */
		getDynamics : function(){
			return this.get("dynamics");
		}
	});
});