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
 * Tree Visualiser Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 * @author Boris Marin 
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
		
			datasets: [],
			
			defaultConnectivityOptions:  {
				width: 460,
				height: 460,
				connectivityLayout: "matrix", //[matrix, hive, force]
			},
			
			initialize : function(options){
				Widget.View.prototype.initialize.call(this,options);
				
				this.options = this.defaultConnectivityOptions;

				this.render();
				this.setSize(options.width,options.height);
	
			},
			
			setData : function(state, options, dataset){
				this.setOptions(options);
	
				
				return "Metadata or variables added to connectivity widget";
			},
			
			/**
			 *
			 * Set the options for the connectivity widget
			 *
			 * @command setOptions(options)
			 * @param {Object} options - options to modify the plot widget
			 */
			setOptions: function(options) {
				if(options != null) {
					$.extend(this.options, options);
				}
			},
			
			/**
			 * Sets the legend for a variable
			 * 
			 * @command setLegend(variable, legend)
			 * @param {Object} variable - variable to change display label in legends
			 * @param {String} legend - new legend name
			 */
			setLegend : function(variable, legend){
				
			}
			
			
	
		});
});