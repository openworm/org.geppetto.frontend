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
 * Plot Widget class using plotly javascript library
 * 
 * @module Widgets/Plot
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');
	var math = require('mathjs');
	var Plot;

	return Widget.View.extend({
		plot: null,
		plotDiv : null,
		datasets: [],
		variables : [],
		limit: 400,
		options: null,
		xaxisLabel: null,
		yaxisLabel: null,
		labelsUpdated: false,
		initialized:null,
		inhomogeneousUnits: false,
		updateRange : false,

		/**
		 * Default options for plot widget, used if none specified when plot
		 * is created
		 */
		defaultOptions : {
			autosize : true,
			width : '100%',
			height : '100%',
			showgrid : false,
			xaxis: {                  // all "layout.xaxis" attributes: #layout-xaxis
				showgrid: false,
				showline: true,
				showticklabels : false,
				zeroline : false,
				mirror : true,
				ticklen : 0,
				tickcolor : 'rgb(255, 255, 255)',
				linecolor: 'rgb(255, 255, 255)',
				tickfont: {
					color: 'rgb(255, 255, 255)'
				},
				titlefont : {
					color: 'rgb(255, 255, 255)'
				},
				ticks: 'outside',
				tickcolor: 'rgb(255, 255, 255)',
				max: -9999999,
				min: 9999999,
			},
			yaxis : {
				max: -9999999,
				min: 9999999,
				showgrid: false,
				showline : true,
				zeroline : false,
				mirror : true,
				ticklen : 0,
				tickcolor : 'rgb(255, 255, 255)',
				linecolor: 'rgb(255, 255, 255)',
				tickfont: {
					color: 'rgb(255, 255, 255)'
				},
				titlefont : {
					color: 'rgb(255, 255, 255)'
				},
				ticks: 'outside',
				tickcolor: 'rgb(102, 102, 102)'
			},
			margin: {
				l: 60,
				r: 10,
				b: 40,
				t: 30,
			},
			legend : {
				xanchor : "auto",
				yanchor : "auto",
				font: {
					size: 11,
					color : '#fff'
				},
				x : 1,
				bgcolor : 'rgba(66, 59, 59, 0.90)'
			},
			paper_bgcolor: 'rgba(66, 59, 59, 0.90)',
			plot_bgcolor: 'rgba(66, 59, 59, 0.90)',
			hovermode: 'closest',
			playAll : false,
		},

		/**
		 * Initializes the plot given a set of options
		 *
		 * @param {Object} options - Object with options for the plot widget
		 */
		initialize: function (options) {
			this.id = options.id;
			this.name = options.name;
			this.visible = options.visible;
			this.datasets = [];
			this.variables = [];
			//Merge passed options into existing defaultOptions object
			$.extend( this.defaultOptions, options);
			this.render();
			this.dialog.append("<div id='" + this.id + "'></div>");			
			Plot = require('plotly');
			
			this.plotDiv = this.getD3Node();
			var gd = this.getD3Node();
			//resizes d3 component of plotly once widget resizes
			window.onresize = function() {
				Plot.Plots.resize(gd);
			};
		},

		/**
		 * Retrieve the the D3 node (Div element) for the Plot, use to pass 
		 * as a parameter to resize event
		 */
		getD3Node : function(){
			var d3 = Plot.d3;
			var gd3 = d3.select("#" + this.id);
			var gd = gd3.node();

			return gd;
		},

		/**
		 * Takes data series and plots them. To plot array(s) , use it as
		 * plotData([[1,2],[2,3]]) To plot a geppetto simulation variable , use it as
		 * plotData(object) Multiples arrays can be specified at once in
		 * this method, but only one object at a time.
		 *
		 * @command plotData(state, options)
		 * @param {Object} state - series to plot, can be array of data or an geppetto simulation variable
		 * @param {Object} options - options for the plotting widget, if null uses default
		 */
		plotData: function (data, options) {
			if (!$.isArray(data)) {
				data = [data];
			}
			// If no options specify by user, use default options
			if (options != null) {	
				// Merge object2 into object1
				$.extend( this.defaultOptions, options );
			}
			var instance =  null;
			var timeSeriesData = {};
			var plotable = true;
			for (var i = 0; i < data.length; i++) {
				instance = data[i];
				if (instance != null && instance != undefined){                	
					for (var key = 0; key < this.datasets.length; key++) {
						if (instance.getInstancePath() == this.datasets[key].label) {
							continue;
						}
					}
					if (instance.getTimeSeries() != null && instance.getTimeSeries() != undefined) {
						timeSeriesData = this.getTimeSeriesData(instance);
					}else{
						plotable = false;
					}
					
					/*
					 * Create object with x, y data, and graph information. 
					 * Object is used to plot on plotly library
					 */
					newLine = {
							x : timeSeriesData["x"],
							y : timeSeriesData["y"],
							modes : "lines",
							type : "scatter",
							name: instance.getInstancePath(),
							line: {
							    dash: 'solid',
							    width: 2
							}
					};

					this.datasets.push(newLine);
					
					//We stored the variable objects in its own array, using the instance path
					//as index. Can't be put on this.datasets since plotly will reject it
					this.variables[instance.getInstancePath()] = instance;
				}else{
					plotable = false;
				}
			}
			
			if(plotable){
				if(this.plot==null){
					//Creates new plot using datasets and default options
					this.plot = Plot.plot(this.id, this.datasets, this.defaultOptions);
					this.initialized = true;
				}else{
					Plot.newPlot(this.id, this.datasets, this.defaultOptions);					
				}
				
				//Update the axis of the plot 
				this.updateAxis(instance.getInstancePath());

				//resizes plot right after creation, needed for d3 to resize 
				//to parent's widht and height
				Plot.Plots.resize(this.getD3Node());
			}
			return this;
		},
		
		resize : function(){
			Plot.Plots.resize(this.getD3Node());
		},

		/**
		 * Retrieve the x and y arrays for the time series
		 */
		getTimeSeriesData: function (instance) {
			var timeSeries = instance.getTimeSeries();
			var timeTimeSeries = window.time.getTimeSeries();
			var timeSeriesData = {};
			var xData = [];
			var yData = [];

			if (timeSeries && timeSeries.length > 1) {
				for (var step = 0; step < timeSeries.length; step++) {
					xData.push(timeTimeSeries[step]);
					yData.push(timeSeries[step]);
				}
			}

			var localxmin = Math.min.apply(null, timeTimeSeries);
			var localymin = Math.min.apply(null, timeSeries);
			localymin = localymin - Math.abs(localymin * 0.1);
			var localxmax = Math.max.apply(null, timeTimeSeries);
			var localymax = Math.max.apply(null, timeSeries);
			localymax = localymax + Math.abs(localymax * 0.1);

			this.defaultOptions.xaxis.min = Math.min(this.defaultOptions.xaxis.min, localxmin);
			this.defaultOptions.yaxis.min = Math.min(this.defaultOptions.yaxis.min, localymin);
			this.defaultOptions.xaxis.max = Math.max(this.limit, localxmax);
			this.defaultOptions.yaxis.max = Math.max(this.defaultOptions.yaxis.max, localymax);

			timeSeriesData["x"] = xData;
			timeSeriesData["y"] = yData;

			return timeSeriesData;
		},

		/**
		 * Removes the data set from the plot. EX:
		 *
		 * @command removeDataSet(state)
		 * @param {Object} state -Data set to be removed from the plot
		 */
		removeDataSet: function (state) {
			if (state != null) {
				var matchKey = null;
				for (var key = 0; key < this.datasets.length; key++) {
					if (state.getInstancePath() == this.datasets[key].name) {
						matchKey = key;
						this.datasets.splice(key, 1);
					}
				}
				
				/*if variable to be removed is on the plot, call the plotly
				library method to remove*/
				if(matchKey != null){
					Plot.deleteTraces(this.id, matchKey);
				}
			}

			if (this.datasets.length == 0) {
				this.resetPlot();
			}
			return this;
		},

		/**
		 * Updates the plot widget with new data
		 */
		 updateDataSet: function (step, playAll) {
			 if(!this.defaultOptions.playAll&&!this.updateRange){
				 var update = {
						 'xaxis.range' : [0,this.limit],
				 }
				 GEPPETTO.Console.log("update limit");
				 //update the axia labels for the plot
				 Plot.relayout(this.id, update);
				 this.updateRange = true;
			 }
			 
			 /*Clears the data of the plot widget if the initialized flag 
			  *has not be set to true, which means arrays are populated but not yet plot*/
			 if(!this.initialized){
				 this.clean(playAll);
			 }

			 var set, reIndex, newValue;
			 var oldDataX = [];
			 var oldDataY = [];
			 var timeSeries = [];
			 var update = {};
			 for (var key in this.datasets) {
				 set = this.datasets[key];
				 if (this.defaultOptions.playAll) {
					 //we simply set the whole time series
					 timeSeries = this.getTimeSeriesData(this.variables[set.name]);
					 this.datasets[key].x = timeSeries["x"];
					 this.datasets[key].y = timeSeries["y"];
				 }
				 else {
					 newValue = this.variables[set.name].getTimeSeries()[step];

					 oldDataX = this.datasets[key].x;
					 oldDataY = this.datasets[key].y;

					 reIndex = false;

					 if (oldDataX.length >= this.limit) {
						 //this happens when we reach the end of the width of the plot
						 //i.e. when we have already put all the points that it can contain
						 oldDataX.splice(0, 1);
						 oldDataY.splice(0,1);
						 reIndex = true;
					 }

					 oldDataX.push(oldDataX.length);
					 oldDataY.push(newValue);

					 if (reIndex) {
						 // re-index data
						 var indexedDataX = [];
						 var indexedDataY = [];
						 for (var index = 0, len = oldDataX.length; index < len; index++) {
							 var valueY = oldDataY[index];
							 indexedDataX.push(index);
							 indexedDataY.push(valueY);
						 }

						 this.datasets[key].x = indexedDataX;
						 this.datasets[key].y = indexedDataY;
					 }
					 else {
						 this.datasets[key].x = oldDataX;
						 this.datasets[key].y = oldDataY;
					 }
				 }

				 this.plotDiv.data[key].x = this.datasets[key].x;
				 this.plotDiv.data[key].y = this.datasets[key].y;
			 }
			 if(set!=null){
				 this.updateAxis(set.name);
			 }
			 Plot.redraw(this.id);
		 },

		 /*
		  * Retrieves X and Y axis labels from the variables being plotted
		  */
		 updateAxis: function (key) {
			 var update = {};
			 if (!this.labelsUpdated) {
				 var unit = this.variables[key].getUnit();
				 if (unit != null) {
					 var labelY = this.inhomogeneousUnits ? "SI Units" : this.getUnitLabel(unit);
					 var labelX = this.getUnitLabel(window.Instances.time.getUnit());
					 this.labelsUpdated = true;
					 update = {
							 'yaxis.title' : labelY,
							 'xaxis.title' : labelX
					 }
					 //update the axia labels for the plot
					 Plot.relayout(this.plotDiv, update);
				 }
			 }            
		 },

		 /**
		  * Utility function to get unit label given raw unit symbol string
		  *
		  * @param unitSymbol - string representing unit symbol
		  */
		 getUnitLabel: function (unitSymbol) {

			 unitSymbol = unitSymbol.replace(/_per_/gi, " / ");

			 var unitLabel = unitSymbol;

			 if (unitSymbol != undefined && unitSymbol != null && unitSymbol != "") {
				 var mathUnit = math.unit(1, unitSymbol);

				 var formattedUnitName = (mathUnit.units.length > 0) ? mathUnit.units[0].unit.base.key : "";

				 if (formattedUnitName != "") {
					 formattedUnitName = formattedUnitName.replace(/_/g, " ");
					 formattedUnitName = formattedUnitName.charAt(0).toUpperCase() + formattedUnitName.slice(1).toLowerCase();
					 unitLabel = formattedUnitName + " (" + unitSymbol.replace(/-?[0-9]/g, function (letter) {
						 return letter.sup();
					 }) + ")";
				 }
			 }

			 return unitLabel;
		 },

		 /**
		  * Plots a function against a data series
		  *
		  * @command dataFunction(func, data, options)
		  * @param func - function to plot vs data
		  * @param data - data series to plot against function
		  * @param options - options for plotting widget
		  */
		 plotDataFunction: function (func, data_x, options) {
			 // If no options specify by user, use default options
			 if (options != null) {
				 this.defaultOptions = options;
				 if (this.defaultOptions.xaxis.max > this.limit) {
					 this.limit = this.defaultOptions.xaxis.max;
				 }
			 }

			 //Parse func as a mathjs object
			 var parser = math.parser();
			 var mathFunc = parser.eval(func);
			 var data = [];
			 data.name = options.legendText;
			 data.data = [];
			 for (var data_xIndex in data_x) {
				 var dataElementString = data_x[data_xIndex].valueOf();
				 data_y = mathFunc(dataElementString);
				 //TODO: Understand why sometimes it returns an array and not a value
				 if (typeof value == 'object') {
					 data.data.push([data_x[data_xIndex][0], data_y[0]]);
				 }
				 else {
					 data.data.push([data_x[data_xIndex][0], data_y]);
				 }
			 }

			 //Plot values
			 this.plotXYData(data);
			 return this;
		 },

		 /**
		  * Resets the plot widget, deletes all the data series but does not
		  * destroy the widget window.
		  *
		  * @command resetPlot()
		  */
		 resetPlot: function () {
			 if (this.plot != null) {
				 this.datasets = [];
				 this.defaultOptions = jQuery.extend(true, {}, this.defaultPlotOptions);
				 Plot.newPlot(this.id, this.datasets, this.defaultOptions);
			 }
			 return this;
		 },

		 /**
		  *
		  * Set the options for the plotting widget
		  *
		  * @command setOptions(options)
		  * @param {Object} options - options to modify the plot widget
		  */
		 setOptions: function (options) {
			 jQuery.extend(true, this.defaultOptions, this.defaultPlotOptions, options);
			 if (options.xaxis && options.xaxis.max) {
				 this.limit = options.xaxis.max;
			 }

			 Plot.relayout(this.id, update);
			 return this;
		 },

		 clean: function (playAll) {
			 this.defaultOptions.playAll = playAll;
			 this.cleanDataSets();
			 if (!playAll) {
				 //this.defaultOptions.xaxis.show = false;
				 this.defaultOptions.xaxis.max = this.limit;
				 //this.defaultOptions.crosshair = {};
				 //$("#" + this.id).addClass("plot-without-xaxis");
			 }
			 else {
				 //thisl.defaultOptions.xaxis.show = true;
				 this.defaultOptions.xaxis.max = window.Instances.time.getTimeSeries()[window.Instances.time.getTimeSeries().length - 1];
				 //this.defaultOptions.crosshair.mode = "x";
				 //$("#" + this.id).removeClass("plot-without-xaxis");
				 //enables updating the legend on mouse hover, still few bugs
			 }
			 this.plot = Plot.newPlot(this.id, this.datasets, this.defaultOptions);
			 Plot.Plots.resize(this.getD3Node());
			 this.initialized=true;

		 },

		 /**
		  * Retrieve the data sets for the plot
		  * @returns {Array}
		  */
		 getDataSets: function () {
			 return this.datasets;
		 },

		 /**
		  * Resets the datasets for the plot
		  */
		 cleanDataSets: function () {
			 // update corresponding data set
			 for (var key = 0; key < this.datasets.length; key++) {
				 this.datasets[key].x = [];
				 this.datasets[key].y = [];
			 }
		 },

		 /**
		  * Takes a FunctionNode and plots the expression and set the attributes from the plot metadata information
		  *
		  * @command plotFunctionNode(functionNode)
		  * @param {Node} functionNode - Function Node to be displayed
		  */
		 plotFunctionNode: function (functionNode) {

//			 node.getInitialValues()[0].value.arguments
//			 node.getInitialValues()[0].value.expression.expression

			 //Check there is metada information to plot
			 if (functionNode.getInitialValues()[0].value.dynamics.functionPlot != null) {

				 //Read the information to plot
				 var expression = functionNode.getInitialValues()[0].value.dynamics.expression.expression;
				 var arguments = functionNode.getInitialValues()[0].value.dynamics.arguments;
				 var plotMetadata = functionNode.getInitialValues()[0].value.dynamics.functionPlot;

				 var finalValue = parseFloat(plotMetadata["finalValue"]);
				 var initialValue = parseFloat(plotMetadata["initialValue"]);
				 var stepValue = parseFloat(plotMetadata["stepValue"]);

				 //Create data series for plot
				 //TODO: What are we going to do if we have two arguments?
				 var values = [];
				 for (var i = initialValue; i < finalValue; i = i + stepValue) {
					 values.push([i]);
				 }

				 var plotTitle = plotMetadata["title"];
				 var XAxisLabel = plotMetadata["xAxisLabel"];
				 var YAxisLabel = plotMetadata["yAxisLabel"];
				 //Generate options from metadata information
				 options = {
						 xaxis: {min: initialValue, max: finalValue, show: true, axisLabel: XAxisLabel},
						 yaxis: {axisLabel: YAxisLabel},
						 legendText: plotTitle
				 };

				 //Convert from single expresion to parametired expresion (2x -> f(x)=2x)
				 var parameterizedExpression = "f(";
				 for (var argumentIndex in arguments) {
					 parameterizedExpression += arguments[argumentIndex].argument + ",";
				 }
				 parameterizedExpression = parameterizedExpression.substring(0, parameterizedExpression.length - 1);
				 parameterizedExpression += ") =" + expression;

				 //Plot data function
				 this.plotDataFunction(parameterizedExpression, values, options);

				 //Set title to widget
				 this.setName(plotTitle);
			 }
			 return this;
		 },

	});
});
