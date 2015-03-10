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
 * Network Activity Widget
 *
 *
 * @author Kenny Ashton (kwashton12@gmail.com)
 * @author David Forcier (forcier.david1@gmail.com)
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
		
		datasets: [],
		
		defaultNetworkActivityOptions:  {
			width: 660,
			height: 500,
			networkActivityLayout: "list", //[matrix, hive, force]
		},
		
		initialize : function(options){
			this.options = options;
			Widget.View.prototype.initialize.call(this,options);
			this.setOptions(this.defaultNetworkActivityOptions);
			
			this.render();
			this.setSize(options.height, options.width);
			
			this.networkActivityContainer = $("#" +this.id);
			this.networkActivityContainer.on("dialogresizestop", function(event, ui) {
			    //TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
				var width = $(this).innerWidth()-20;
				var height = $(this).innerHeight()-20;
				if (window[this.id].options.networkActivityLayout == 'force'){
					window[this.id].svg.attr("width", width).attr("height", height);
					window[this.id].force.size([width, height]).resume();
				}
				else if (window[this.id].options.networkActivityLayout == 'list') {
					window[this.id].createLayout();
				}
				event.stopPropagation();
		    });
		},
		
		setData : function(root, options){
			this.setOptions(options);

			this.dataset = {};
			this.mapping = {};
			this.mappingSize = 0;
			this.dataset["root"] = root;
			this.widgetMargin = 20;
			
			this.createDataFromConnections();
			
			this.createLayout();
			
			return "Metadata or variables added to the network activity widget";
		},
		
		
		createDataFromConnections: function(){
			if (this.dataset["root"]._metaType == "EntityNode"){
				var subEntities = this.dataset["root"].getEntities();
				
				this.dataset["nodes"] = [];
				this.dataset["links"] = [];
//					this.dataset["graph"] = new Array(1);
//					this.dataset["multigraph"] = false;
//					this.dataset["directed"] = true;

				for (var subEntityIndex in subEntities){
					var connections = subEntities[subEntityIndex].getConnections();
					for (var connectionIndex in connections){
						var connectionItem = connections[connectionIndex];
						if (connectionItem.getType() == "FROM"){
							var source = connectionItem.getParent().getId();
							var target = connectionItem.getEntityInstancePath().substring(connectionItem.getEntityInstancePath().indexOf('.') + 1);
							
							this.createNode(source);
							this.createNode(target);
							
							var linkItem = {};
							linkItem["source"] = this.mapping[source];
							linkItem["target"] = this.mapping[target];
							
							var customNodes = connectionItem.getCustomNodes();
							for (var customNodeIndex in connectionItem.getCustomNodes()){
								if ('getChildren' in customNodes[customNodeIndex]){
									var customNodesChildren = customNodes[customNodeIndex].getChildren().models;
									for (var customNodeChildIndex in customNodesChildren){
										if (customNodesChildren[customNodeChildIndex].getId() == "Id"){
											linkItem["synapse_type"] = customNodesChildren[customNodeChildIndex].getValue();
										}
										else if (customNodesChildren[customNodeChildIndex].getId() == "GBase"){
											linkItem["weight"] = customNodesChildren[customNodeChildIndex].getValue();
										}
									}
								}
							}
							
							this.dataset["links"].push(linkItem);
						}
						
					}
				}
			}
		},
		
		createLayout: function(){
			$("svg").remove();
			
			this.options.innerWidth = 300;//this.networkActivityContainer.innerWidth() - this.widgetMargin;
			this.options.innerHeight = 200;//this.networkActivityContainer.innerHeight() - this.widgetMargin;
			
			this.svg = d3.select("#"+this.id).append("svg")
            .attr("width", this.options.innerWidth)
            .attr("height", this.options.innerHeight);
			console.log("Test : " + this.options.innerWidth);
			if (this.options.networkActivityLayout == 'list'){
				$("#filters").remove();
				this.createListLayout();
			}
			else if (this.options.networkActivityLayout == 'force') {
				this.createForceLayout();
			}
		},
		
		createListLayout: function(){
			var legendRectSize = 18;
			var legendSpacing = 4;
			var margin = {top: 50, right: 10, bottom: 10, left: 50};
			var sizeLegend = {width: 120};
			
			
			var listDim = (this.options.innerHeight < (this.options.innerWidth - sizeLegend.width))?(this.options.innerHeight):(this.options.innerWidth - sizeLegend.width);
			
			var width = 960,
		    height = 500;
			console.log("Creating Chart");
			var chart = d3.horizon()
			    .width(width)
			    .height(height)
			    .bands(1)
			    .mode("offset")
			    .interpolate("basis");
			
			
			var GERD=[2.21367, 2.74826, 1.96158, 1.80213, 0.39451, 1.52652, 3.01937, 1.44122, 3.84137, 2.20646, 2.78056, 0.5921, 1.14821, 2.64107, 1.78988, 4.2504, 1.26841, 3.33499, 3.3609, 1.67862, 0.41322, 1.81965, 1.13693, 1.75922, 0.67502, 1.65519, 1.24252, 0.48056, 1.85642, 0.92523, 1.38357, 3.61562, 2.99525, 0.84902, 1.82434, 2.78518];
			var growth=[2.48590317, 3.10741128, 1.89308521, 3.21494841, 5.19813626, 1.65489834, 1.04974368, 7.63563272, 2.85477157, 1.47996142, 2.99558644, -6.90796403, 1.69192342, -3.99988322, -0.42935239, 4.84602001, 0.43108032, 3.96559062, 6.16184325, 2.67806902, 5.56185685, 1.18517739, 2.33052515, 1.59773989, 4.34962928, -1.60958484, 4.03428262, 3.34920254, -0.17459255, 2.784, -0.06947685, 3.93555895, 2.71404473, 9.00558548, 2.09209263, 3.02171711];
			// Transpose column values to rows.
			var data = growth.map(function(data,i) {
			  return [i,data];
			});
			this.svg.data([data]).call(chart);
			
			return "Complete List creation";
		
		},
		/**
		 *
		 * Set the options for the plotting widget
		 *
		 * @command setOptions(options)
		 * @param {Object} options - options to modify the plot widget
		 */
		setOptions: function(options) {
			this.options = options;
		},
	});
});