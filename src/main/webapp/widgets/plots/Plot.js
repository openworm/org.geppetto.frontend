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
 *     	OpenWorm - http://openworm.org/people.html
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
 * Plot Widget class
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
var Plot = Widget.View.extend({

	plot : null,
	datasets : [],
	limit : 20,
	updateGrid : false,
	
	/**
	 * Initializes the plot widget
	 */
	initialize : function(){
		this.data = [];
		this.datasets = [];
		this.render();
		this.dialog.append("<div class='plot' id='" + this.name + "'></div>");
	},

	/**
	 * Default options for plot widget, used if none specified 
	 * when plot is created
	 */
	defaultPlotOptions: {
		yaxis: { min : -.5,max : 1},
		xaxis: {min : 0, max : 20},
		series: {
	        lines: { show: true },
	        points: { show: true },
	    	shadowSize : 0,
	    }, 
	    legend: { show: true},
	    grid: { hoverable: true, clickable: true, autoHighlight: true },	    
	}, 
	
	getPlotData : function(){
		return this.data;
	},
	
	/**
	 * Takes data series and plots them. 
	 * To plot array(s) , use it as plotData([[1,2],[2,3]])
	 * To plot an object , use it as plotData(objectName)
	 * Multiples arrays can be specified at once in this method, but only one object 
	 * at a time.
	 * 
	 * @name plotData(data, options)
	 * @param newData - series to plot, can be array or an object
	 * @param options - options for the plotting widget, if null uses default
	 */
	plotData : function(newData, options){	
		//If no options specify by user, use default options
		if(options == null){options = this.defaultPlotOptions;}
		
		if(newData.name != null){
			for(var set in this.datasets){
				if(newData.name == this.datasets[set].label ){
					return this.name + " widget is already plotting object " + newData.name;
				}
			}
			this.datasets.push({label : newData.name, data : [[0,newData.value]]});
			$("#"+this.getId()).trigger("subscribe", [newData.name]);	
			updateGrid = true;
		}
		else{
			this.datasets.push({label : "", data : newData});
			updateGrid = false;
		}
		if(this.plot == null){
			var plotHolder = $("#"+this.name);
			this.plot = $.plot(plotHolder,this.datasets,options);
			plotHolder.resize();	
		}
		else{
			this.plot.setData(this.datasets);
			if(updateGrid){this.plot.setupGrid();};
			this.plot.draw();	
		}
		
		return "Line plot added to widget";
	},
	
	/**
	 * Removes the data set from the plot. 
	 * EX: removeDataSet(dummyDouble)
	 * 
	 * @param set - Data set to be removed from the plot
	 */
	removeDataSet : function(set){
		if(set !=null){
			for(var key in this.datasets){
				if(set.name == this.datasets[key].label){
					$("#"+this.getId()).trigger("unsubscribe", [set.name]);	
					this.datasets.splice(key, 1);
				}
			}
			
			var data = [];
			
			for(var i =0; i<this.datasets.length ; i++){
				data.push(this.datasets[i]); 
			}
			
			this.plot.setData(data);	
			this.plot.setupGrid();
			this.plot.draw();
		}
	},
	
	/**
	 * Updates a data set, use for time series
	 * 
	 * @param label - Name of new data set
	 * @param newValue - Updated value for data set
	 */
	updateDataSet : function(label,newValue){
		if(label != null){
			var newData = null;
			var matchedKey = 0;
			var reIndex = false;
			
			//update corresponding data set
			for(var key in this.datasets){
				if(label ==  this.datasets[key].label){
					newData = this.datasets[key].data;
					matchedKey = key;
				}
			}
			
			
			for(var d =0; d < newValue.length ; d++){
				if(newData.length > this.limit){
					newData.splice(0,1);
					reIndex = true;
				}

				newData.push([newData.length, newValue[d]]);
			}
			
			this.datasets[matchedKey].data = newData;
			
			if(reIndex){
				//re-index data
				var indexedData = [];
				for(var index =0, len = this.datasets[matchedKey].data.length; index < len; index++){
					var value = this.datasets[matchedKey].data[index][1];
					indexedData.push([index, value]);
				}

				this.datasets[matchedKey].data = indexedData;
			}
		}
		
		var data = [];
		
		for(var i =0; i<this.datasets.length ; i++){
			data.push(this.datasets[i]); 
		}
		
		this.plot.setData(data);	
		this.plot.draw();
	},
	
	/**
	 * Plots a function against a data series
	 * 
	 * @name dataFunction(func, data, options)
	 * @param func - function to plot vs data
	 * @param data - data series to plot against function
	 * @param options - options for plotting widget
	 */
	plotDataFunction : function(func,data,options){
		
	},
	
	/**
	 * Resets the plot widget, deletes all the data series but does not
	 * destroy the widget window.
	 * 
	 * @name resetPlot()
	 */
	resetPlot : function(){
		if(this.plot != null){
			this.data = [];
			this.plot.setData([{label : "" , data: this.data}]);
			this.plot.draw();
		}
	},
	
	/**
	 * 
	 * Set the options for the plotting widget
	 * 
	 * @name setOptions(options)
	 * @param options
	 */
	setOptions : function(options){
		this.defaultPlotOptions = options;
		
		$.plot($("#"+this.name), this.datasets,this.defaultPlotOptions);
	}
});