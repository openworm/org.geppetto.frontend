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
 * The parent node from where all other nodes extend
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define([
	'jquery',
	'underscore',
	'backbone',
    
    //Add requirement for Backbone-associations module
    'backbone-associations'
 
], function (require) {
	return {
		Model : Backbone.AssociatedModel.extend({
		name : "",
		parent : null,
		

		/**
		 * Pauses the simulation
		 *
		 * @name Node.setName(name)
		 * @returns {String} - Status of Simulation after pausing it.
		 *
		 */
		setName : function(name){
			this.name = name;
		},
		

		/**
		 * Pauses the simulation
		 *
		 * @name Node.getName()
		 * @returns {String} - Status of Simulation after pausing it.
		 *
		 */
		getName : function(){
			return this.name;
		},
		

		/**
		 * Pauses the simulation
		 *
		 * @name Node.setParent()
		 * @returns {String} - Status of Simulation after pausing it.
		 *
		 */
		setParent : function(parent){
			this.parent = parent;
		},
		

		/**
		 * Pauses the simulation
		 *
		 * @name Node.getParent()
		 * @returns {String} - Status of Simulation after pausing it.
		 *
		 */
		getParent : function(){
			return this.parent;
		}			
	})
	};
});
    