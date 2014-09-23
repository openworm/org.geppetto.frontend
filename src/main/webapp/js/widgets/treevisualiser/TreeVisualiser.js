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
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var Node = require('nodes/Node');

	return {
		TreeVisualiser: Widget.View.extend({
		
			datasets: [],
			
			initialize : function(options){
				Widget.View.prototype.initialize.call(this,options);
				
				this.datasets = [];
				
//				this.id = options.id;
//				this.name = options.name;
//				this.visible = options.visible;
				this.render();
				this.setSize(options.width,options.height);
	
			},
			
			setData : function(state, options, dataset){
				// If no options specify by user, use default options
				if(options != null) {
					$.extend(this.options, options);
				}
	
				if (state!= null) {	
					var dataset = this.createDataset();
					dataset.variableToDisplay = state;
					dataset.data = state;
					return dataset;
				}
				return null;
			},
			
			getDatasets: function(){
				return this.datasets;
			},
			
			createDataset: function(){
				return {variableToDisplay:'', data:{}, isDisplayed:false};
			}
			
			
	
		})	
	};	
	
});