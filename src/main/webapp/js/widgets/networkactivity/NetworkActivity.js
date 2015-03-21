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
			this.limit = 100;
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
				}
                else if(state._metaType == "EntityNode" || "AspectNode"){
                	strValues += "Ent{ " + this.scanAndInsertVariableNodes(state) + "}";
                }
				else if(state._metaType == "VariableNode"){
					strValues += "Var{" + this.insertVariableNode(state) + "}";
				}
			}
			
			this.createLayout();
			
			return "Dataseries added :" + strValues;
		},
        /**
         *  Read node recursively to get all variableNodes
         */
        scanAndInsertVariableNodes: function(node){
        	var strVal = "";
        	if(node._metaType != null){
	        	
	        	strVal += "[" + node._metaType +" "+ node.name + ":";
	            if(node._metaType == "VariableNode"){
	            	strVal += ",Var2 " + this.insertVariableNode(node);
	            }else{
	            	if(node.getChildren != null || undefined){
	            		
		                var childrens = node.getChildren();
		                strVal += "\"" + childrens.length + "\"";
		                if(childrens.length > 0){
			                for(var childIndex in childrens){
			                	strVal += ",child " 
			                		+ childrens[childIndex]._metaType + ":" 
			                		+ this.scanAndInsertVariableNodes(childrens[childIndex]);
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
        insertVariableNode: function(varnode){
            var value = varnode.getValue();
            var id = varnode.getInstancePath();
            this.datasets.push({
            	yPosition : this.datasets.length,
                label : id,
                variable : varnode,
                values : [ [0,value] ],
                selected : 0
            });
            return id;
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
	
					if(oldata.length > this.limit) {
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
			
			
			//console.log("Test : " + this.options.innerWidth);
			if(this.datasets != []){
				if(this.d3Select == null || undefined){
					this.networkActivityContainer
						.append("<button type=\"button\" class=\"btn btn-info horizonButton\">Sort</button>")
						.on("click",function(){
							d3.select("#"+this.id).sort(function(a,b){
									return a.yPosition>b.yPosition?1:a.yPostion<b.yPosition?-1:0;
								});
							});
					this.d3Select = d3.select("#"+this.id);
				}
				this.createListLayout();
			}
		},
		
		createListLayout: function(){

			var width = this.options.innerWidth,
		    height = 10,bigHeight = 40;
			//console.log("Creating Chart");
			
			var chart = d3.horizon()
			    .width(width)
			    .height(function(d){return d.selected? +bigHeight : +height ;})
			    .bands(10)
			    .mode("offset")
			    .interpolate("linear")
			    .dataValues(function(d){return d.values;});
			
			//d3.select("#"+this.id).selectAll(".horizon").remove();
			var dataselection = this.d3Select.selectAll(".horizon")
		    	.data(this.datasets);
		    dataselection.enter().append("svg")
		  		.attr("height",height).attr("class","horizon")
		  		.on("click",function(){
		  			var sel =d3.select(this).datum().selected; 
		  			sel=(sel)?0:1;
			        d3.select(this).transition().style("height",(sel)?bigHeight:height).duration(300)
			        	.call(chart);
			        d3.select(this).datum().selected = sel;
			        if(sel){
			        	d3.select(this).append("text")
					    .attr("class","horizonText")
					    .attr("x",10).attr("y",20)
					    .text(function(d){return d.selected? d.label + " " :"";});
			        }else{
			        	d3.select(this).select(".horizonText").remove();
			        }
		  		});
		    
		    dataselection.exit().remove();
			dataselection.call(chart);
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
			
			$(this.dialog).children().remove();

			this.initialize();
		},
	});
});
