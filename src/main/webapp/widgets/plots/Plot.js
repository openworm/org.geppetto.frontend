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
	data : [],
	
	/**
	 * Initializes the plot widget
	 */
	initialize : function(){
		this.render();
		this.dialog.append("<div class='plot' id='" + this.name + "'></div>");
	},

	/**
	 * Default options for plot widget, used if none specified 
	 * when plot is created
	 */
	defaultPlotOptions: {
		yaxis: { min : 0,max : 15},
		xaxis: {min : 0, max : 15},
		series: {
	        lines: { show: true },
	        points: { show: true }
	    }, 
	    legend: { show: true},
	    grid: { hoverable: true, clickable: true, autoHighlight: true },	    
	}, 
	
	/**
	 * Takes data series and plots them. 
	 * 
	 * @name plotData(data, options)
	 * @param data - series to plot
	 * @param options - options for the plotting widget
	 */
	plotData : function(data, options){	
		//If no options specify by user, use default options
		if(options == null){options = this.defaultPlotOptions;}
		
		//plot  reference not yet created, make it for first time
		if(this.plot ==null){
			this.data = data;
			
			var plotHolder = $("#"+this.name);
			
			this.plot = $.plot(plotHolder, this.data,options);
			
			$('.flot-x-axis').css('color','white');
			$('.flot-y-axis').css('color','white');
			
			plotHolder.resize();			
		}
		
		//plot exists, get existing plot series before adding new one
		else{
			for(var d = 0; d < data.length ; d++){
				this.data.push(data[d]);
			}
			this.plot.setData(this.data);	
			this.plot.draw();
		}
		
		return "Line plot added to widget";
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
			this.plot.setData(this.data);
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