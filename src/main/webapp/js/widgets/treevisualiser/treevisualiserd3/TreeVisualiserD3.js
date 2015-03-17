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
 * @module Widgets/TreeVisualizerD3
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(function(require) {

	var TreeVisualiser = require('widgets/treevisualiser/TreeVisualiser');
	var $ = require('jquery');

	return TreeVisualiser.TreeVisualiser.extend({
		
		defaultTreeVisualiserOptions:  {
			width: 460,
			height: 460
		},
		
		/**
		 * Initializes the TreeVisualiser3D given a set of options
		 * 
		 * @param {Object} options - Object with options for the TreeVisualiser3D widget
		 */
		initialize : function(options){
			TreeVisualiser.TreeVisualiser.prototype.initialize.call(this,options);
			this.options = this.defaultTreeVisualiserOptions;
			
			this.treeVisualiserD3Container = $("#" +this.id);
			this.treeVisualiserD3Container.on("dialogresizestop", function(event, ui) {
			    //TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
				var datasets = window[this.id].datasets;
				for (var datasetIndex in datasets){
					var width = $(this).innerWidth()-20;
					var height = $(this).innerHeight()-20;
					datasets[datasetIndex].svg.attr("width", width).attr("height", height);
					datasets[datasetIndex].force.size([width, height]).resume();
				}
				event.stopPropagation();
		    });
		},
		
		/**
		 * Sets the data used inside the TreeVisualiser3D for rendering. 
		 * 
		 * @param {Array} state - Array of variables used to display inside TreeVisualiser3D
		 * @param {Object} options - Set of options passed to widget to customize it
		 */
		setData : function(state, options){
			dataset = TreeVisualiser.TreeVisualiser.prototype.setData.call(this, state, options);
			dataset.links = [];
			dataset.nodes = {};
			dataset.svg = null;
			dataset.force = null;
			
			this.datasets.push(dataset);
			
			this.prepareTree('', dataset.data, dataset);
			this.paintTree();

			return "Metadata or variables to display added to tree visualiser";
		},
		
		/**
		 * Prepares the tree for painting it on the widget
		 * 
		 * @param {Object} parent - Parent tree to paint
		 * @param {Array} data - Data to paint
		 * @param {Array} dataset - Sets within the data object to paint
		 */
		prepareTree: function(parent, data, dataset){
			nodeName = data.instancePath;
			
			if (nodeName != null){
				//TODO: Remove once all getName are implemented in all nodes
				if (data.getName() === undefined){label = data.getId();}
				else{label = data.getName();}
				
				
				if (data._metaType == "VariableNode"  | data._metaType == "DynamicsSpecificationNode" | data._metaType == "ParameterSpecificationNode" |
						data._metaType == "TextMetadataNode" | data._metaType == "FunctionNode" |
						data._metaType == "VisualObjectReferenceNode" | data._metaType == "VisualGroupElementNode") {
					var labelValue = this.getValueFromData(data);
					
					dataset.nodes[nodeName] = {name: label + "=" + labelValue, variable: data};
					if (parent != ''){
						var link = {};
						link.source = dataset.nodes[parent];
						link.target = dataset.nodes[nodeName];
						link.type = "suit";
						dataset.links.push(link);
					}
				}
				else{
					dataset.nodes[nodeName] = {name: label, variable: data};
					if (parent != ''){
						var link = {};
						link.source = dataset.nodes[parent];
						link.target = dataset.nodes[nodeName];
						link.type = "suit";
						dataset.links.push(link);
					}
					var children = data.getChildren();
					if (children.length > 0){
						var parentFolderTmp = nodeName; 
						for (var childIndex in children){
							this.prepareTree(parentFolderTmp, children[childIndex], dataset);
						}
					}
				}
			}	
		},
		
		/**
		 * Updates the data that the TreeVisualiser3D is rendering
		 */
		updateData: function(){
			for(var key in this.datasets) {
				dataset = this.datasets[key];
				
				if (dataset.variableToDisplay != null){
					dataset.links = [];
					dataset.nodes = {};
					this.prepareTree('', dataset.data, dataset);
					
					var nodes = dataset.force.nodes();
					$.extend(true, nodes, d3.values(dataset.nodes));
					dataset.svg.selectAll("text").data(nodes).text(function(d) { return d.name; });
				}
			}
		},
		
		/**
		 * Paints the tree for the widget
		 */
		paintTree: function(){
			for(var key in this.datasets) {
				dataset = this.datasets[key];
				if (dataset.nodes != {} && dataset.links != []){
					if (!dataset.isDisplayed){
						dataset.isDisplayed = true;
						
//						this.width = 860;
//						this.height = 500;
						var width = this.treeVisualiserD3Container.innerWidth()-20;
						var height = this.treeVisualiserD3Container.innerHeight()-20;
			
						dataset.force = d3.layout.force()
						    .nodes(d3.values(dataset.nodes))
						    .links(dataset.links)
						    .size([width, height])
						    .linkDistance(60)
						    .charge(-300)
						    .on("tick", tick)
						    .start();
			
						dataset.svg = d3.select("#"+this.id).append("svg")
						    .attr("width", width)
						    .attr("height", height)
						    .on("contextmenu",						    	
							 function(contextVariable) {
						    	return function(data, index){ 
						    		d3_target = d3.select(d3.event.target);
						    		if (typeof d3_target.datum() != 'undefined'){
						    			contextVariable.showContextMenu(d3.event, d3_target.datum()["variable"]);
						    		}
					            }
						    }(this));
						    
						// Per-type markers, as they don't inherit styles.
						dataset.svg.append("defs").selectAll("marker")
						    .data(["suit", "licensing", "resolved"])
						  .enter().append("marker")
						    .attr("id", function(d) { return d; })
						    .attr("viewBox", "0 -5 10 10")
						    .attr("refX", 15)
						    .attr("refY", -1.5)
						    .attr("markerWidth", 6)
						    .attr("markerHeight", 6)
						    .attr("orient", "auto")
						  .append("path")
						    .attr("d", "M0,-5L10,0L0,5");
			
						var path = dataset.svg.append("g").selectAll("path")
						    .data(dataset.force.links())
						  .enter().append("path")
						    .attr("class", function(d) { return "link " + d.type; })
						    .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });
			
						var circle = dataset.svg.append("g").selectAll("circle")
						    .data(dataset.force.nodes())
						  .enter().append("circle")
						    .attr("r", 6)
						    .call(dataset.force.drag);
							    
			
						var text = dataset.svg.append("g").selectAll("text")
						    .data(dataset.force.nodes())
						  .enter().append("text")
						    .attr("x", 8)
						    .attr("y", ".31em")
						    .text(function(d) { return d.name; });
						    
						
//						dataset.svg = this.svg;
//						dataset.force = this.force;
			
						// Use elliptical arc path segments to doubly-encode directionality.
						function tick() {
						  path.attr("d", linkArc);
						  circle.attr("transform", transform);
						  text.attr("transform", transform);
						}
			
						function linkArc(d) {
						  var dx = d.target.x - d.source.x,
						      dy = d.target.y - d.source.y,
						      dr = Math.sqrt(dx * dx + dy * dy);
						  return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
						}
			
						function transform(d) {
						  return "translate(" + d.x + "," + d.y + ")";
						}
					}
				}	
			}	
		}
		

	});
});