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
		},
		
		setSize: function(h, w) {
			Widget.View.prototype.setSize.call(this,h,w);
			if (this.svg != null){
				//TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
				var width = this.size.width - 20;
				var height = this.size.height - 20;
				if (this.options.connectivityLayout == 'force'){
					this.svg.attr("width", width).attr("height", height);
					this.force.size([width, height]).resume();
				}
				else if (this.options.connectivityLayout == 'matrix') {
					this.createLayout();
				}
			}
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
			
			//return "Metadata or variables added to connectivity widget";
			return this;
		},
		
		createDataFromConnections: function(){
			if (this.dataset["root"]._metaType == "EntityNode"){
				var subEntities = this.dataset["root"].getEntities();
				this.dataset["nodes"] = [];
				this.dataset["links"] = [];

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
									var customNodesChildren = customNodes[customNodeIndex].getChildren();
									for (var customNodeChildIndex in customNodesChildren){
										if (customNodesChildren[customNodeChildIndex].getId() == "Id"){
											linkItem["linkType"] = customNodesChildren[customNodeChildIndex].getValue();
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
            $('#' + this.id + " svg").remove();
            
            this.options.innerWidth = this.connectivityContainer.innerWidth() - this.widgetMargin;
            this.options.innerHeight = this.connectivityContainer.innerHeight() - this.widgetMargin;
            
            this.svg = d3.select("#"+this.id)
                            .append("svg")
                            .attr("width", this.options.innerWidth)
                            .attr("height", this.options.innerHeight);
            
            if (this.options.connectivityLayout == 'matrix'){
                $("#filters").remove();
                this.createMatrixLayout();
            }
            else if (this.options.connectivityLayout == 'force') {
                this.createForceLayout();
            }
        },
        
        createForceLayout: function(){
            
            //TODO: 20 categories hardcoded in color scales
            var linkTypeScale = d3.scale.category20()
                            .domain(_.pluck(this.dataset.links, 'linkType'));
            var nodeTypeScale = d3.scale.category20()
                            .domain(_.pluck(this.dataset.links, 'nodeType'));
            var weightScale = d3.scale.linear()
                            .domain(d3.extent(_.pluck(this.dataset.links, 'weight').map(parseFloat)))
                            .range([0,4]);
            
            this.force = d3.layout.force()
                .charge(-250)
                .linkDistance(150)
                .size([this.options.innerWidth, this.options.innerHeight]);

            this.force.nodes(this.dataset.nodes)
                .links(this.dataset.links)
                .start();

            var link = this.svg.selectAll(".link")
                .data(this.dataset.links)
                .enter().append("line")
                .attr("class", "link")
                .style("stroke", function(d) {return linkTypeScale(d.linkType)})
                .style("stroke-width", function(d) {return weightScale(d.weight)});

            var node = this.svg.selectAll(".node")
                .data(this.dataset.nodes)
              .enter().append("circle")
                .attr("class", "node")
                .attr("r", 5)  // radius
                .style("fill", function(d) {
                    return nodeTypeScale(d.nodeType);
                    return nodeTypeScale(d.id[0]);
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
            
            var legendWidth = 180;
            var legendPosition = {x:  this.options.innerWidth - legendWidth, y: 0};


            //Nodes
            var legendBottom = this.createLegend('legend', nodeTypeScale, legendPosition, 'Nodes - Cell Types');
           
            legendPosition.y = legendBottom.y + 10
            //Links
            this.createLegend('legend2', linkTypeScale,  legendPosition, 'Links - Synapse Types');
        },


        createLegend: function(id, colorScale, position, title){

        	//TODO: boxes should scale based on number of items 
        	var colorBox = {size : 20, labelSpace : 4};
        	var padding = {x: colorBox.size, y: 2 * colorBox.size}

        	var horz, vert; 

        	var legend = this.svg.selectAll(id)
                        .data(colorScale.domain())
                      .enter().append('g')
                        .attr('class', 'legend')
                        .attr('transform', function(d, i) {
                            var height = colorBox.size + colorBox.labelSpace;
                            horz = colorBox.size + position.x + padding.x;
                            vert = i * height + position.y + padding.y;
                            return 'translate(' + horz + ',' + vert + ')';
                        });
        
        	// coloured squares 
        	legend.append('rect')
        		.attr('width', colorBox.size)
        		.attr('height', colorBox.size)
        		.style('fill', function(d) {return colorScale(d); })
        		.style('stroke', function(d) {return colorScale(d); });
        	
        	// labels
        	legend.append('text')
        		.attr('x', colorBox.size + colorBox.labelSpace)
        		.attr('y', colorBox.size - colorBox.labelSpace)
        		.attr('class', 'legend')
        		.text(function(d) { return d; });

        	// title
        	if(typeof title != 'undefined'){
                    this.svg.append('text')
                        .text(title)
                        .attr('class', 'legendTitle')
                        .attr('x', position.x + 2 * padding.x) 
                        .attr('y', position.y +  0.75 * padding.y);
        	}
        	
        	return {x: horz, y: vert};
        	
        },


        createMatrixLayout: function(){

            var margin = {top: 30, right: 10, bottom: 10, left: 3};

            var legendWidth = 120;

            var matrixDim = (this.options.innerHeight < (this.options.innerWidth - legendWidth))?(this.options.innerHeight):(this.options.innerWidth - legendWidth);
            
            var x = d3.scale.ordinal().rangeBands([0, matrixDim - margin.top]),
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
            var root=this.dataset.root;
            var n = nodes.length;

            // Compute index per node.
            nodes.forEach(function(node, i) {
                node.pre_count = 0;
                node.post_count = 0;
                matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
            });
            
            // Convert links to matrix; count pre / post conns.
            this.dataset.links.forEach(function(link) {
                matrix[link.source][link.target].z = link.weight ? link.linkType : 0;
                nodes[link.source].pre_count += 1;
                nodes[link.target].post_count += 1;
            });

            // Precompute the orders.
            var orders = {
                id: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].id, nodes[b].id); }),
                //community: d3.range(n).sort(function(a, b) { return nodes[b].community - nodes[a].community; }),
                pre_count: d3.range(n).sort(function(a, b) { return nodes[b].pre_count - nodes[a].pre_count; }),
                post_count: d3.range(n).sort(function(a, b) { return nodes[b].post_count - nodes[a].post_count; }),
            };
            
//          TODO: Commented it out until we have Louvain Community detection was implemented
//          var colours = {
//                  id: function(d) {return c(d.z);},
//                  community: function(d) {return nodes[d.x].community == nodes[d.y].community ? c(nodes[d.x].community) : null;},
//          };

            // The default sort order.
            x.domain(orders.id);
            
            var rect = this.svg
                          .append("rect")
                            .attr("class", "background")
                            .attr("width", matrixDim - margin.left)
                            .attr("height", matrixDim - margin.top);

                
            var row = this.svg.selectAll(".row")
                  .data(matrix)
                .enter().append("g")
                  .attr("class", "row")
                  .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
                  .each(row);

            row.append("line")
                  .attr("x2", this.options.innerWidth);

            var column = this.svg.selectAll(".column")
                  .data(matrix)
                .enter().append("g")
                  .attr("class", "column")
                  .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

            column.append("line")
                    .attr("x1", -this.options.innerWidth);
              
            var tooltip = this.svg
                .append("text")
                  .attr("x", 0)
                  .attr("y", -10)
                  .attr('class', 'connectionlabel')
                  .text("Hover the squares to see the connections.");
            
           this.createLegend('legend', c, {x: matrixDim, y:0});
            
            //FILTERS AND EVENTS
		    this.connectivityContainer.append("<div id='filters' style='width:" + legendWidth + "px;left:" + (matrixDim + this.widgetMargin) + "px;top:" + (matrixDim - 32) + "px;'></div>");
		    $('#filters').append("<span class='filtersLabel'>Select the ordering</span><select id='order'><option value='id'>by Entity Name</option><option value='pre_count'>by # pre</option><option value='post_count'>by # post</option></select>");
               
            d3.select('#order').on("change", function(svg) {
                return function() {
                    x.domain(orders[this.value]);
            
                    var t = svg.transition().duration(2500);
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
            }(this.svg));
            
            // UTILITIES
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
                    .style("fill", function(d) {return c(d.z); })
                    .on("click", function(d){
                        Simulation.unSelectAll();
                        //Ideally instead of hiding the connectivity lines we'd show only the ones connecting the two cells, also we could higlight the connection.
                        eval(root.name+"."+nodes[d.x].id).select();
                        eval(root.name+"."+nodes[d.x].id).showConnectionLines(false);
                        eval(root.name+"."+nodes[d.y].id).select();
                        eval(root.name+"."+nodes[d.y].id).showConnectionLines(false);
                        })
                    .on("mouseover", function(d){
                        d3.select(this.parentNode.appendChild(this)).transition().duration(100).style({'stroke-opacity':1,'stroke':'white', 'stroke-width':'2'});
                        d3.select("body").style('cursor','pointer');
                        return tooltip.transition().duration(100).text(nodes[d.x].id + " is connected to " + nodes[d.y].id);
                        })
                    .on("mouseout", function(){
                        d3.select(this).transition().duration(100).style({'stroke-opacity':0,'stroke':'white'});
                        d3.select("body").style('cursor','default');
                        return tooltip.text("");
                        });
            }
            
            
            function mouseover(p) {
                d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
                d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
            }
            
            function mouseout() {
                d3.selectAll("text").classed("active", false);
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
    });
});
