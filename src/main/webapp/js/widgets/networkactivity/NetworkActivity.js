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
		datasetsMap: {},
		
		defaultNetworkActivityOptions:  {
			width: 660,
			height: 500,
			networkActivityLayout: "list",//[matrix, hive, force]
			smallHorizonHeight:10,
			bigHorizonHeight:40,
			percentWidthHorizon:0.6,
			limit:400,
		},

		
		initialize : function(options){
			this.options = options;
			
			Widget.View.prototype.initialize.call(this,options);
			this.setOptions(this.defaultNetworkActivityOptions);
			this.options.colors = ["rgba(155,155,155,.5)","#00F","#0FF","#0F0","#FF0", "#F00"];
			this.options.horizonXPosition = 60;

			this.widgetMargin = 20;
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
		
		/**
		 * Takes data series and plots them. To plot array(s) , use it as
		 * horizonData([[1,2],[2,3]]) To plot a geppetto simulation variable , use it as
		 * horizonData(object) Multiples arrays can be specified at once in
		 * this method, but only one object at a time.
		 *
		 * @command plotData(state, options)
		 * @param {Object} state - series to plot, can be array of data or an geppetto simulation variable
		 * @param {Object} options - options for the networkActivity widget, if null uses default
		 */
		horizonData : function(state, options){
			//this.setOptions(options);
			
			var strValues ="";
			if (state!= null) {					
				if(state instanceof Array){
					
					this.datasets.push({
							label:"manual",
							values : state,
							selected : 0
							});
					this.datasetsMap["manual"]={
							pos : this.datasets.length,
							};
				}
                else if(state._metaType == "EntityNode" || "AspectNode"){
                	strValues += "Ent{ " + this.scanAndInsertVariableNodes(state) + "}";
                }
				else if(state._metaType == "VariableNode"){
					strValues += "Var{" + this.insertVariableNode(state) + "}";
				}
				//reorder and update yPosition of all nodes (Crappy PATCH)
				this.updatePosition();
				this.createDataFromConnections(state);
			}
			
			this.createLayout();
			
			return "Dataseries added :" + strValues;
		},
        /**
         *  Read node recursively to get all variableNodes
         */
        scanAndInsertVariableNodes: function(node,entityNode){
        	var strVal = "";
        	if(node._metaType != null){
        		if(node._metaType == "EntityNode"){
        			var entityNode = node;
        		}
	        	strVal += "[" + node._metaType +" "+ node.name + ":";
	            if(node._metaType == "VariableNode"){
	            	strVal += ",Var2 " + this.insertVariableNode(node,entityNode);
	            }else{
	            	if(node.getChildren != null || undefined){
	            		
		                var childrens = node.getChildren();
		                strVal += "\"" + childrens.length + "\"";
		                if(childrens.length > 0){
			                for(var childIndex in childrens){
			                	strVal += ",child " 
			                		+ childrens[childIndex]._metaType + ":" 
			                		+ this.scanAndInsertVariableNodes(childrens[childIndex],entityNode); //RECURSIONS
			                }
		                }else{
		                	strVal += " noChild";
		                }
	            	}else{
	            		strVal += " noChild";
	            	}
	            }
        	}else{
        		strVal += "null";
        	}
        	return strVal + "]";
        },
        /**
         * Insert variableNode into datasets
         */
        insertVariableNode: function(varnode, entityNode){
            var value = varnode.getValue();
            if (!(entityNode.getInstancePath() in this.datasetsMap)){
	            this.datasets.push({
	            	id: entityNode.getInstancePath(),
	            	entity: entityNode,
	            	yPosition : this.datasets.length,
	                label : varnode.getInstancePath(), 
	                variable : varnode,
	                values : [ [0,value] ],
	                selected : 0,
	                targets: []
	            });
	        	this.datasetsMap[entityNode.getInstancePath()]={
						pos : this.datasets.length,
						};
            }
            return entityNode.getInstancePath();
        },
        
        //todo:add links info
        /**
         * Insert Links information in dataSet
         */
		setNodeLinksInfo: function(node) {
			var id = node.source;
			// check if the source and the target are in our watch list and dont add twice the same link (target not in targets
			if (id in this.datasetsMap && node.target in this.datasetsMap){
				var sourcePos = this.datasetsMap[id].pos;
				var targetPos = this.datasetsMap[node.target].pos;
				this.datasets[sourcePos].targets.push(this.datasets[targetPos]);
				this.datasets[sourcePos].weight = node.weight;
				this.datasets[sourcePos].synapse_type = node.synapse_type;
			}
			else{
				
				
			}
		},
        
		/**
		 * Updates a data set, use for time series
		 */
		updateDataSet: function() {

			for(var key in this.datasets) {

				if(this.datasets[key].label != 'manual'){
					var newValue = this.datasets[key].variable.getValue();
	
					var oldata = this.datasets[key].values;
					var reIndex = false;
	
					if(oldata.length > this.options.limit) {
						oldata.splice(0, 1);
						reIndex = true;
					}
	
					oldata.push([ oldata.length, newValue]);
	
					if(reIndex) {
						// re-index data
						var indexedData = [];
						for(var index = 0, len = oldata.length; index < len; index++) {
							var value = oldata[index][1];
							indexedData.push([ index, value ]);
						}

	
						this.datasets[key].values = indexedData;
					}
					else {
						this.datasets[key].values = oldata;
					}
				}

			}

			this.createLayout();
		},
		
		createLayout: function(){
			//$("svg").remove();
			
			this.options.innerWidth = this.networkActivityContainer.innerWidth() - this.widgetMargin;
			this.options.innerHeight = this.networkActivityContainer.innerHeight() - this.widgetMargin;
			
			var networkActivityForSort = this;
			//console.log("Test : " + this.options.innerWidth);
			if(this.datasets != []){
				if(this.d3Select == null || undefined){
					var sortButton = $('<button type="button" class="btn btn-info horizonButton">Sort</button>');
					sortButton.on("click",function(){
						networkActivityForSort.datasets.reverse();
					});
					this.networkActivityContainer
						.append(sortButton);
					this.d3Select = d3.select("#"+this.id).append("svg").attr("class","networkActivityParentSVG");
				}
				var legend = d3.select("#"+this.id).select(".legend");
				if(legend.empty()) {
					legend = d3.select("#"+this.id).append("div").attr("class","legend");
				}
				
				legend.selectAll(".legendItem").data(this.options.colors)
					.enter().append("div").attr("class","legendItem").style("background-color",function(d){return d;});
				this.createListLayout();
			}
			
		},
		
		updatePosition: function(){
			
			var nextYPosition = 0;
			for(var sortedKey in this.datasets){
				this.datasets[sortedKey].yPosition = nextYPosition;
				nextYPosition += this.datasets[sortedKey].selected ? 
						this.options.bigHorizonHeight : 
							this.options.smallHorizonHeight ;
			}
			
			
		},
		
		updateHeights: function(selection){
			this.updatePosition();
			var width = this.options.innerWidth * this.options.percentWidthHorizon,
			smallHeight = this.options.smallHorizonHeight,bigHeight = this.options.bigHorizonHeight;
			
			//console.log("Creating Chart");
			var heightHorizonFunction = function(d){return d.selected? +bigHeight : +smallHeight ;};
			selection.style("height",heightHorizonFunction)
				.style("width",width).attr("x",this.options.horizonXPosition)
	  			.attr("y",function(d){return d.yPosition;});
			
			selection.selectAll(".horizonText").remove();
			selection.each(function(d) {
		            var header = d3.select(this);
		            // loop through the keys - this assumes no extra data
		            if(d.selected){
		                
		                header.append("text")
						    .attr("class","horizonText")
						    .attr("x",5).attr("y",20)
						    .text(function(d){return d.selected ? d.label + " " :"";});
		            }
		        });
	        selection.selectAll(".horizonContour").remove();
	        
			var chart = d3.horizon()
			    .width(width)
			    .height(heightHorizonFunction)
			    .mode("offset")
			    .interpolate("linear")
			    .dataValues(function(d){return d.values;})
			    .colors(this.options.colors);
			
			selection.call(chart);
			
			selection.append("rect").attr("class","horizonContour").attr("height",heightHorizonFunction)
				.attr("width",width);
			
		},
		
		drawLinksUI: function(){
//			var arc = d3.svg.arc();
//			arc.source(function(d){
//				return {x:d.sourceX, y:d.sourceY};
//			});
//			arc.target(function(d){
//				return {x:d.targetX, y:d.targetY};
//			});
//			arc.innerRadius(function(d) { return 20; });
//			arc.outerRadius(function(d) { return 22; });
//			arc.startAngle(function(d) {return Math.PI;});
//			arc.endAngle(function(d) {return 0;});
//			arc.padAngle(function(d) {return 0;});
			var horizonX = this.options.horizonXPosition;
			var bigHeight = this.options.bigHorizonHeight;
			var smallHeight = this.options.smallHorizonHeight;
			var path = function(d){ 
				var sourceYlinkPos, targetYlinkPos;
				sourceYlinkPos = d.source.selected ? (bigHeight/2)+d.source.yPosition : (smallHeight/2)+d.source.yPosition;
				targetYlinkPos = d.target.selected ? (bigHeight/2)+d.target.yPosition : (smallHeight/2)+d.target.yPosition;
				//                                                                distance between the 2
				return "M " + horizonX + " " + (sourceYlinkPos) + " Q " + 0 + " " + ((d.source.yPosition-d.target.yPosition)/2 + d.target.yPosition) + " " + horizonX + " " + targetYlinkPos;
			};
			var daLinks= this.getLinks();
			  var link = this.d3Select.selectAll(".link")
				  .data(daLinks);

			  // Enter the links.
			  link.enter().append("path")
				  .attr("class", "link");
				  link.attr("d", path).style("stroke", function(d){
					  if(d.source.selected){
						  return "#FC6520";
					  }
					  else{
						  if(d.target.selected){
							  return "#FEE3CE";
						  }
						  
						  return "rgba(42,168,232,.5)";
					  }
				  });
			link.exit().remove();
		},
		getLinks: function(){
			var links = [];
			for (var source in this.datasets){
				for (var target in this.datasets[source].targets){
					links.push({
						source:this.datasets[source],
						target:this.datasets[source].targets[target]
					});
				}
			}
			return links;
		},
		
		createListLayout: function(){


			var dataselection = this.d3Select.selectAll(".horizon")
		    	.data(this.datasets);
		    var resultingSVG = dataselection.enter().append("svg").attr("class","horizon")
		  			.on("click",function(){
			  			var sel =d3.select(this).datum().selected; 
			  			sel=(sel)?0:1;
				        d3.select(this).datum().selected = sel;
		  		});
		        
		    dataselection.exit().remove();
			this.updateHeights(dataselection);
			this.drawLinksUI();
			
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
		
		reset : function () {
			this.datasets = [];
			this.datasetsMap = {};
			
			$(this.dialog).children().remove();

			this.initialize();
		},
		
		/**
		 * 
		 * Go through all nodes and build our datasource
		 * 
		 */
		createDataFromConnections: function(state){
			if (state._metaType == "EntityNode"){
				var subEntities = state.getEntities();

				// go through all entities 
				for (var subEntityIndex in subEntities){
					var connections = subEntities[subEntityIndex].getConnections();
					for (var connectionIndex in connections){
						var connectionItem = connections[connectionIndex];
						// only monitor connection starting "from" the current node (would be redudant to keep them all)
						if (connectionItem.getType() == "FROM"){
							var source = connectionItem.getParent().getInstancePath();
							var target = connectionItem.getEntityInstancePath();
							
							var linkItem = {};
							linkItem["source"] = source;
							linkItem["target"] = target;
							
							var customNodes = connectionItem.getCustomNodes();
							for (var customNodeIndex in connectionItem.getCustomNodes()){
								if ('getChildren' in customNodes[customNodeIndex]){
									var customNodesChildren = customNodes[customNodeIndex].getChildren();
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
							
							this.setNodeLinksInfo(linkItem);
						}
						
					}
				}
			}
		},		
	});
});
