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
			this.options.colors = ["rgba(0,0,0,0)","#F00","#FF0","#0F0","#0FF", "#00F","#FFF"];
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
				this.createDataFromConnections(state);
			}
			
			this.createLayout();
			
			return "Dataseries added :" + strValues;
		},
        /**
         *  Read node recursively to get all variableNodes
         */
        scanAndInsertVariableNodes: function(node,entityInstancePath){
        	var strVal = "";
        	if(node._metaType != null){
        		if(node._metaType == "EntityNode"){
        			var entityInstancePath = node.getInstancePath();
        		}
	        	strVal += "[" + node._metaType +" "+ node.name + ":";
	            if(node._metaType == "VariableNode"){
	            	strVal += ",Var2 " + this.insertVariableNode(node,entityInstancePath);
	            }else{
	            	if(node.getChildren != null || undefined){
	            		
		                var childrens = node.getChildren();
		                strVal += "\"" + childrens.length + "\"";
		                if(childrens.length > 0){
			                for(var childIndex in childrens){
			                	strVal += ",child " 
			                		+ childrens[childIndex]._metaType + ":" 
			                		+ this.scanAndInsertVariableNodes(childrens[childIndex],entityInstancePath); //RECURSIONS
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
        insertVariableNode: function(varnode, entityInstancePath){
            var value = varnode.getValue();
            if (!(entityInstancePath in this.datasetsMap)){
	            this.datasets.push({
	            	id: entityInstancePath,
	            	yPosition : this.datasets.length,
	                label : varnode.getInstancePath(), 
	                variable : varnode,
	                values : [ [0,value] ],
	                selected : 0
	            });
	        	this.datasetsMap[entityInstancePath]={
						pos : this.datasets.length,
						};
            }
            return entityInstancePath;
        },
        
        //todo:add links info
        /**
         * Insert Links information in dataSet
         */
		setNodeLinksInfo: function(node) {
			var id = node.source;
			if (!(id in this.datasetsMap)){
				var sourcePos = this.datasetsMap[id].pos;
				var targetPos = this.datasetsMap[node.target].pos;
				if (!node.target in this.datasets[sourcePos].targets)
					this.datasets[sourcePos].targets[node.target] ={
						dx: 20,
						dy: this.datasets[targetPos].yPosition,
					};
				this.datasets[sourcePos].weight = node.weight;
				this.datasets[sourcePos].synapse_type = node.synapse_type;
				this.datasets[sourcePos].source.dx= 20;
				this.datasets[sourcePos].source.dy= this.datasets[sourcePos].yPosition;
				
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
			//var dataselection = this.d3Select.selectAll(".horizon");
			
			//this.updateHeights(dataselection);
			
		},
		
		updateHeights: function(selection){
			this.updatePosition();
			var width = this.options.innerWidth * this.options.percentWidthHorizon,
			smallHeight = this.options.smallHorizonHeight,bigHeight = this.options.bigHorizonHeight,
			horizonXPosition = 60;
			//console.log("Creating Chart");
			var heightHorizonFunction = function(d){return d.selected? +bigHeight : +smallHeight ;};
			selection.style("height",heightHorizonFunction)
				.style("width",width).attr("x",horizonXPosition)
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
	        
			var chart = d3.horizon()
			    .width(width)
			    .height(heightHorizonFunction)
			    .mode("offset")
			    .interpolate("linear")
			    .dataValues(function(d){return d.values;})
			    .colors(this.options.colors);
			
			selection.call(chart);
			
		},
		
		
		createListLayout: function(){
			// To let some space for diagonals
			
			
			//d3.select("#"+this.id).selectAll(".horizon").remove();
			var dataselection = this.d3Select.selectAll(".horizon")
		    	.data(this.datasets);
		    var resultingSVG = dataselection.enter().append("svg").attr("class","horizon")
		  			.on("click",function(){
			  			var sel =d3.select(this).datum().selected; 
			  			sel=(sel)?0:1;
				        d3.select(this).datum().selected = sel;
		  		});
		    resultingSVG;
		    
		    dataselection.exit().remove();
			this.updateHeights(dataselection);
//			var cur_selection = this.svg.selectAll(".horizon")
//		    .data(this.datasets)
//		  .enter().append("div")
//		  .attr("class", "horizon")
//		  .call(chart);
			
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
							//TODO: validate this (does it on remove the root)
							var target = connectionItem.getEntityInstancePath().substring(connectionItem.getEntityInstancePath().indexOf('.') + 1);
							
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
