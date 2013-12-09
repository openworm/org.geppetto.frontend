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
	limit : 100,
	
	/**
	 * Initializes the plot widget
	 */
	initialize : function(){
		this.data = [];
		this.render();
		this.dialog.append("<div class='plot' id='" + this.name + "'></div>");
	},

	/**
	 * Default options for plot widget, used if none specified 
	 * when plot is created
	 */
	defaultPlotOptions: {
		yaxis: { min : 0,max : 1},
		xaxis: {min : 0, max : 100},
		xaxis : { show : false},
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
	 * 
	 * @name plotData(data, options)
	 * @param data - series to plot
	 * @param options - options for the plotting widget
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
				this.datasets.push({label : newData.name, data : [[newData.value]]});
				$("#"+this.getId()).trigger("subscribe", [newData.name]);		
		}
		else{
			this.datasets.push({label : "", data : newData.value});
			
		}
		
		var updatedData = [];
		
		for(var i =0; i<this.datasets.length ; i++){
			updatedData.push(this.datasets[i]); 
		}
		
		if(this.plot == null){
			var plotHolder = $("#"+this.name);
			this.plot = $.plot(plotHolder,updatedData,options);
			plotHolder.resize();	
		}
		else{
			this.plot.setData(updatedData);	
			this.plot.draw();	
		}
		
		return "Line plot added to widget";
	},
	
	
	updateDataSet : function(label,newValue){
		if(label != null){
			var newData = null;
			
			for(var key in this.datasets){
				if(label ==  this.datasets[key].label){
					newData = this.datasets[key].data;
				}
			}
			
			for(var d =0; d < newValue.length ; d++){
				if(newData.length > this.limit){
					newData.splice(0,1);
				}
				
				newData.push(newValue[d]);
			}
		}
		
		var data = [];
		
		for(var i =0; i<data.length ; i++){
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
		
		$.plot($("#"+this.name), this.data,this.defaultPlotOptions);
	}
});