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
 * Client class use to augment a model with state variable capabilities
 * 
 * @module model/AStateVariableCapability
 * @author Matteo Cantarelli
 */

define([ 'jquery' ], function(require) {
	return {
		
		/**
		 * Get value of quantity
		 * 
		 * @command VariableNode.getTimeSeries()
		 * @returns {String} Value of quantity
		 */
		getTimeSeries : function() {
			return this.timeSeries;
		},
		
		/**
		 * Get the type of tree this is
		 * 
		 * @command VariableNode.getUnit()
		 * @returns {String} Unit for quantity
		 */
		getUnit : function() {
			return this.unit;
		},
		
		/**
		 * Set unit
		 * 
		 * @command VariableNode.setUnit()
		 * @param {String} unit - unit for variable node
		 */
		setUnit : function(unit) {
			this.unit = unit;
			return this;
		},

		/**
		 * Get watched
		 * 
		 * @command VariableNode.getWatched()
		 * @returns {boolean} true if this variable is being watched
		 */
		isWatched : function() {
			return this.watched;
		},
		
		/**
		 * Set watched
		 * 
		 * @command VariableNode.setWatched()
		 * @param {Boolean} watched - Object with options attributes to initialize node
		 */
		setWatched : function(isWatched) {
			if (isWatched != this.watched){
				Project.getActiveExperiment().watchVariables([this]);
				this.watched=isWatched;
			}
			return this;
		}
	}
});
