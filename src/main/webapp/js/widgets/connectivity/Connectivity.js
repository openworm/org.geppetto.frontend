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
		
		dataset: {},
		
		defaultConnectivityOptions:  {
			width: 660,
			height: 500,
			connectivityLayout: "matrix", //[matrix, hive, force]
		},
		
		initialize : function(options){
			this.options = options;
			Widget.View.prototype.initialize.call(this,options);
			this.setOptions(this.defaultConnectivityOptions);
			
			this.render();
			this.setSize(options.height, options.width);
			
			this.connectivityContainer = $("#" +this.id);
			this.connectivityContainer.on("dialogresizestop", function(event, ui) {
			    //TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
				var width = $(this).innerWidth()-20;
				var height = $(this).innerHeight()-20;
				if (window[this.id].options.connectivityLayout == 'force'){
					window[this.id].svg.attr("width", width).attr("height", height);
					window[this.id].force.size([width, height]).resume();
				}
//				else if (window[this.id].options.connectivityLayout == 'matrix') {
//					window[this.id].rect.attr("width", width).attr("height", height);
//				}
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
			
			this.options.innerWidth = this.connectivityContainer.innerWidth() - this.widgetMargin;
			this.options.innerHeight = this.connectivityContainer.innerHeight() - this.widgetMargin;
			
			this.svg = d3.select("#"+this.id).append("svg")
            .attr("width", this.options.innerWidth)
            .attr("height", this.options.innerHeight);
			
			this.createDataFromConnections();
			
			if (this.options.connectivityLayout == 'matrix'){
				this.createMatrixLayout();
			}
			else if (this.options.connectivityLayout == 'force') {
				this.createForceLayout();
			}
			
			return "Metadata or variables added to connectivity widget";
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
		
		createForceLayout: function(){
			var ncolor = d3.scale.category10();
		    var scolor = d3.scale.category20().domain(["Acetylcholine","Acetylcholine_Tyramine",
		                                          "Dopamine","FMRFamide","GABA","Generic_GJ",
		                                          "Glutamate", "Octopamine", "Serotonin",
		                                          "Serotonin_Acetylcholine","Serotonin_Glutamate"]);
		    this.force = d3.layout.force()
		        .charge(-250)
		        .linkDistance(60)
		        .size([this.options.innerWidth, this.options.innerHeight]);

		        
		    this.force.nodes(this.dataset.nodes)
	            .links(this.dataset.links)
	            .start();

	        var link = this.svg.selectAll(".link")
	            .data(this.dataset.links)
	            .enter().append("line")
	            .attr("class", "link")
	            .style("stroke", function(d) {return scolor(d.neurotransmitter);})
	            .style("stroke-width", function(d) {return 0.5*d.weight;});

	            
	        var node = this.svg.selectAll(".node")
	            .data(this.dataset.nodes)
	            .enter().append("circle")
	            .attr("class", "node")
	            .attr("r", 5)  // radius
	            .style("fill", function(d) {
	                return ncolor(d.community); 
	            })
	            .call(this.force.drag);

	        node.append("title")
	            .text(function(d) { return d.id; });

	        this.force.on("tick", function() {
	            link.attr("x1", function(d) { return d.source.x; })
	                .attr("y1", function(d) { return d.source.y; })
	                .attr("x2", function(d) { return d.target.x; })
	                .attr("y2", function(d) { return d.target.y; });

	            node.attr("cx", function(d) { return d.x; })
	                .attr("cy", function(d) { return d.y; });
	        });
		},
		
		createMatrixLayout: function(){
			var legendRectSize = 18;
			var legendSpacing = 4;
			
			var margin = {top: 50, right: 10, bottom: 10, left: 50};
			var sizeLegend = {width: 120};
			var dim = (this.options.innerHeight < (this.options.innerWidth - sizeLegend.width))?(this.options.innerHeight):(this.options.innerWidth - sizeLegend.width);
			
			var x = d3.scale.ordinal().rangeBands([0, dim - margin.top]),
	        // Opacity
			z = d3.scale.linear().domain([0, 4]).clamp(true),
			// Colors
	        c = d3.scale.category10();
			
			this.svg
			.style("padding-left", margin.left + "px")
			.style("padding-top", margin.top + "px")
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		    var matrix = [];
		    var nodes = this.dataset.nodes;
		    var n = nodes.length;

		    // Compute index per node.
		    nodes.forEach(function(node, i) {
		    	node.pre_count = 0;
		        node.post_count = 0;
		        matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
		    });
		    
		    // Convert links to matrix; count pre / post conns.
		    this.dataset.links.forEach(function(link) {
		    	matrix[link.source][link.target].z = link.weight ? link.synapse_type : 0;
		    	nodes[link.source].pre_count += 1;
		    	nodes[link.target].post_count += 1;
		    });

		    // Precompute the orders.
		    var orders = {
		        id: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].id, nodes[b].id); }),
		        pre_count: d3.range(n).sort(function(a, b) { return nodes[b].pre_count - nodes[a].pre_count; }),
		        post_count: d3.range(n).sort(function(a, b) { return nodes[b].post_count - nodes[a].post_count; }),
		    };

		    // The default sort order.
		    x.domain(orders.id);
		    

		    this.rect = this.svg.append("rect")
		          .attr("class", "background")
		          .attr("width", dim - margin.left)
		          .attr("height", dim - margin.top);

		        
		    var row = this.svg.selectAll(".row")
		          .data(matrix)
		        .enter().append("g")
		          .attr("class", "row")
		          .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
		          .each(row);

		      row.append("line")
		          .attr("x2", this.options.innerWidth);

		      row.append("text")
		          .attr("x", -6)
		          .attr("y", x.rangeBand() / 2)
		          .attr("dy", ".32em")
		          .attr("text-anchor", "end")
		          .text(function(d, i) {
		        	  return nodes[i].id; 
		        	  });

		      var column = this.svg.selectAll(".column")
		          .data(matrix)
		        .enter().append("g")
		          .attr("class", "column")
		          .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

		      column.append("line")
		          .attr("x1", -this.options.innerWidth);

		      column.append("text")
		          .attr("x", 4)
		          .attr("y", x.rangeBand() / 2)
		          .attr("text-anchor", "start")
		          .text(function(d, i) { 
		        	  return nodes[i].id; 
		        	  });
		      
		      var legend = this.svg.selectAll('.legend')
		    	.data(c.domain())
		    	.enter()
		    	.append('g')
		    	.attr('class', 'legend')
		    	.attr('transform', function(d, i) {
				    var height = legendRectSize + legendSpacing;
				    var offset = 0;
				    var horz = -2 * legendRectSize + dim;
				    var vert = i * height - offset;
				    return 'translate(' + horz + ',' + vert + ')';
				  });
		    
		    legend.append('rect')
		    .attr('width', legendRectSize)
		    .attr('height', legendRectSize)
		    .style('fill', function(d) {return c(d); })
		    .style('stroke', function(d) {return c(d); });
		    
		    legend.append('text')
		    .attr('x', legendRectSize + legendSpacing)
		    .attr('y', legendRectSize - legendSpacing)
		    .text(function(d) { return d; });

		      function row(row) {
		        var cell = d3.select(this).selectAll(".cell")
		            .data(row.filter(function(d) { return d.z;})) //only paint conns
		          .enter().append("rect")
		            .attr("class", "cell")
		            .attr("x", function(d) { return x(d.x); })
		            .attr("width", x.rangeBand())
		            .attr("height", x.rangeBand())
		            .attr("title", function(d) { return d.id;})
		            .style("fill-opacity", function(d) { return z(d.z); })
		            .style("fill", function(d) {return c(d.z); });
		            //.on("mouseover", mouseover)
		            //.on("mouseout", mouseout);
		            
		      }

		       function mouseover(p) {
		         d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
		         d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
		        }

		       function mouseout() {
		         d3.selectAll("text").classed("active", false);
		       }

		      d3.select("#order").on("change", function() {
		        order(this.value);
		      });

		      function order(value) {
		        x.domain(orders[value]);

		        var t = this.svg.transition().duration(2500);

		        t.selectAll(".row")
		            .delay(function(d, i) { return x(i) * 4; })
		            .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
		          .selectAll(".cell")
		            .delay(function(d) { return x(d.x) * 4; })
		            .attr("x", function(d) { return x(d.x); });

		        t.selectAll(".column")
		            .delay(function(d, i) { return x(i) * 4; })
		            .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
		      }
		},
		
		createNode: function(nodeId) {
			if (!(nodeId in this.mapping)){
				var nodeItem = {};
				nodeItem["id"] = nodeId;
				this.dataset["nodes"].push(nodeItem);
				
				this.mapping[nodeItem["id"]] = this.mappingSize;
				this.mappingSize++;
			}
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