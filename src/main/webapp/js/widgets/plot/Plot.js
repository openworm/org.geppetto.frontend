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
	var Plotly = require('plotly');
	var FileSaver = require('file-saver');
	var pako = require('pako');
	var JSZip = require("jszip");

	return Widget.View.extend({
		plotly: null,
		plotDiv : null,
		datasets: [],
		variables : [],
		limit: 400,
		options: null,
		labelsUpdated: false,
		initialized:null,
		inhomogeneousUnits: false,
		updateRange : false,
		plotOptions : null,
		reIndexUpdate : 0,
		updateRedraw : 3,
        functionNode: false,
        xaxisAutoRange : false,
        
		/**
		 * Default options for plot widget, used if none specified when plot
		 * is created
		 */
		defaultOptions : function(){	
			return {
				autosize : true,
				width : '100%',
				height : '100%',
				showgrid : false,
				showlegend : true,
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
					min: 9999999
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
					l: 50,
					r: 10,
					b: 50,
					t: 10,
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
				playAll : false,
				hovermode : 'none'
			};
		},
		
		removeHoverBarButtons : {
			modeBarButtonsToRemove: ['sendDataToCloud','hoverCompareCartesian','hoverClosestCartesian']
		},

		/**
		 * Initializes the plot given a set of options
		 *
		 * @param {Object} options - Object with options for the plot widget
		 */
		initialize: function (options) {
        	Widget.View.prototype.initialize.call(this, options);
			this.id = options.id;
			this.name = options.name;
			this.visible = options.visible;
			this.datasets = [];
			this.variables = [];
			this.plotOptions = this.defaultOptions();
			//Merge passed options into existing defaultOptions object
			$.extend( this.plotOptions, options);
			this.render();
			this.dialog.append("<div id='" + this.id + "'></div>");			

			this.plotDiv = document.getElementById(this.id);
			this.plotOptions.xaxis.range =[0,this.limit]
			var that = this;

			this.addButtonToTitleBar($("<div class='fa fa-home' title='Reset Graphs'></div>").on('click', function(event) {
				that.resetAxes();
			}));
			
			this.addButtonToTitleBar($("<div class='fa fa-picture-o' title='Take Widget Screenshot'></div>").on('click', function(event) {
				that.downloadPNG();
			}));
			
			this.addButtonToTitleBar($("<div class='fa fa-download' title='Download Plot Data'></div>").on('click', function(event) {
				that.downloadPlotData();
			}));
			
			$("#"+this.id).dialog({
				resize: function(event, ui) { 
					that.resize(true); 
				}
			});

			$("#"+this.id).resize(function(){
				that.resize();
			});	
			
			$("#"+this.id).bind('resizeEnd', function() {
				that.resize();
			});
		},

        /**
         * Sets the legend for a variable
         *
         * @command setLegend(variable, legend)
         * @param {Object} instance - variable to change display label in legends
         * @param {String} legend - new legend name
         */
        setLegend: function (instance, legend) {
            //Check if it is a string or a geppetto object
            var instancePath = instance;
            if ((typeof instance) != "string") {
                instancePath = instance.getInstancePath();
            }

            for(var i =0; i< this.datasets.length; i++){
            	if(this.datasets[i].name == instancePath){
            		this.datasets[i].name = legend;
            		for(var key in this.variables){
            			if(key==instancePath){
            				this.variables[legend] = this.variables[key];
            				delete this.variables[key];
            			}
            		}
            	}
            }
            
            Plotly.relayout(this.plotDiv, this.plotOptions);
            
            return this;
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
			var that = this;
			if (!$.isArray(data)) {
				data = [data];
			}
			
        	for (var i = 0; i < data.length; i++) {
        		this.controller.addToHistory("Plot "+data[i].getInstancePath(),"plotData",[data[i]],this.getId());
        	}
        	
			// If no options specify by user, use default options
			if (options != null) {	
				// Merge object2 into object1
				$.extend( this.plotOptions, options );
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
							name: instance.getInstancePath(),
							line: {
								dash: 'solid',
								width: 2
							},
							hoverinfo : 'all'
					};

					this.datasets.push(newLine);

					//We stored the variable objects in its own array, using the instance path
					//as index. Can't be put on this.datasets since plotly will reject it
					this.variables[instance.getInstancePath()] = instance;
				}else{
					plotable = false;
				}
			}

			if (this.datasets.length > 0) {
                // check for inhomogeneousUnits and set flag
                var refUnit = undefined;
                for (var i = 0; i < this.datasets.length; i++) {
                    if (i == 0) {
                        refUnit = this.variables[this.datasets[i].name].getUnit();
                    } else if (refUnit != this.variables[this.datasets[i].name].getUnit()) {
                        this.inhomogeneousUnits = true;
                        this.labelsUpdated = false;
                        break;
                    }
                }
            }
			
			if(plotable){
				if(this.plotly==null){
					this.plotOptions.xaxis.autorange = true;
					this.xaxisAutoRange = true;
					//Creates new plot using datasets and default options
					this.plotly = Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions,{displayModeBar: false, doubleClick : false});
					this.initialized = true;
					this.plotDiv.on('plotly_doubleclick', function() {
						that.resize();
					});
					this.plotDiv.on('plotly_click', function() {
						that.resize();
					});
				}else{
					Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions);
				}				
			}
			
			this.updateAxis(instance.getInstancePath());
			this.resize();
			return this;
		},

		resize : function(draggedResize){
			var divheight = $("#"+this.id).height();
			var divwidth = $("#"+this.id).width();

			if(draggedResize){
				divheighth = divheight -5;
				this.plotOptions.margin.b = 50;
			}else{
				divheight= divheight+5;
				divwidth = divwidth +5;
				this.plotOptions.margin.b = 50;
			}
			
			this.plotOptions.width = divwidth;
			this.plotOptions.height = divheight;
			//resizes plot right after creation, needed for d3 to resize 
			//to parent's widht and height
			Plotly.relayout(this.plotDiv,this.plotOptions);
		},
		
		downloadPNG : function(){
			Plotly.downloadImage(
					this.plotDiv,{
					  format:'png',
					  height:1280,
					  width:1280,
					});
		},
		
		downloadPlotData : function(){
			if(!this.functionNode){
				var data = new Array();
				var xCopied = false;
				
				//stores path of file name containing data results for plot and names of variables
				var text = "output/results.dat\r\ntime(StateVariable)";
				for (var key in this.datasets) {
					var x = this.datasets[key].x;
					var y = this.datasets[key].y;
					if(!xCopied){
						data.push(x);
						xCopied = true;
					}
					data.push(y);
					text = text + " " + this.variables[this.datasets[key].name].getInstancePath();
				}

				//convert string containing variables names into bytes
				var bytesNames = new Uint8Array(text.length);
				for (var i=0; i<text.length; i++) {
					bytesNames[i] = text.charCodeAt(i);
				}

				//store data array into table like formatted string
				var content = "";
				var space = "";
				for (var i = 0; i < data[0].length; i++) {

					for(var j=0; j< data.length; j++){
						var size = data[j][i].toString().length;
						var space = "";
						for(var l=25; l>size; l--){
							space += " ";
						}
						content += data[j][i] + space;
					}
					content += "\r\n";
				}

				//convert string with data array to bytes
				var bytesResults = new Uint8Array(content.length);
				for (var i=0; i<content.length; i++) {
					bytesResults[i] = content.charCodeAt(i);
				}

				//create zip with two files using bytes
				var zip = new JSZip();
				zip.file("outputMapping.dat", bytesNames);
				zip.file("results.dat", bytesResults);

				zip.generateAsync({type:"blob"})
				.then(function (blob) {
    				saveAs(blob, "output.zip");
				});
			}
		},
		
		resetAxes : function(){
			this.plotOptions.xaxis.autorange = this.xaxisAutoRange;
			this.plotOptions.yaxis.autorange = true;
			this.plotOptions.xaxis.range = [];
			this.plotOptions.xaxis.range =[0,this.limit];
			Plotly.relayout(this.plotDiv, this.plotOptions);
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

			this.plotOptions.xaxis.min = Math.min(this.plotOptions.xaxis.min, localxmin);
			this.plotOptions.yaxis.min = Math.min(this.plotOptions.yaxis.min, localymin);
			this.plotOptions.xaxis.max = Math.max(this.limit, localxmax);
			this.plotOptions.yaxis.max = Math.max(this.plotOptions.yaxis.max, localymax);

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
					Plotly.deleteTraces(this.id, matchKey);
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

			if(!this.functionNode){
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
					if (this.plotOptions.playAll) {
						//we simply set the whole time series
						timeSeries = this.getTimeSeriesData(this.variables[set.name]);
						this.datasets[key].x = timeSeries["x"];
						this.datasets[key].y = timeSeries["y"];
						this.datasets[key].hoverinfo = 'all';
						this.plotOptions.xaxis.showticklabels = true;
						this.plotOptions.xaxis.range = [];
						this.plotOptions.margin.b = 60;
						this.reIndexUpdate = 0;
						this.plotOptions.xaxis.autorange = true;
						this.xaxisAutoRange = true;
					}
					else {
						if(this.datasets[key].hoverinfo == 'all'){
							this.datasets[key].hoverinfo = 'none';
						}
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

				if(this.reIndexUpdate%this.updateRedraw==0){
					if(this.plotOptions.xaxis.range[1]<this.limit){
						this.plotOptions.xaxis.range = [0, this.limit];
						this.plotOptions.xaxis.autorange = false;
					}
					Plotly.relayout(this.plotDiv, this.plotOptions);
				}
				
				this.reIndexUpdate = this.reIndexUpdate + 1;
			}
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
					this.plotOptions.yaxis.title = labelY;
					this.plotOptions.xaxis.title = labelX;
					
					if(labelY == null || labelY == ""){
						this.plotOptions.margin.l = 30;
					}
					//update the axia labels for the plot
					Plotly.relayout(this.plotDiv, this.plotOptions);
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
		 * Resets the plot widget, deletes all the data series but does not
		 * destroy the widget window.
		 *
		 * @command resetPlot()
		 */
		resetPlot: function () {
			if (this.plotly != null) {
				this.datasets = [];
				this.plotOptions = this.defaultOptions();
				Plotly.newPlot(this.id, this.datasets, this.plotOptions,{displayModeBar: false});
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
			jQuery.extend(true, this.plotOptions, this.defaultPlotOptions, options);
			Plotly.relayout(this.id, update);
			return this;
		},

		clean: function (playAll) {
			if(!this.functionNode){
				this.plotOptions.playAll = playAll;
				this.cleanDataSets();
				this.plotOptions.xaxis.showticklabels = false;
				if (!playAll) {
					this.plotOptions.xaxis.max = this.limit;
				}
				else {
					this.plotOptions.xaxis.max = window.Instances.time.getTimeSeries()[window.Instances.time.getTimeSeries().length - 1];
				}
				this.plotly = Plotly.newPlot(this.id, this.datasets, this.plotOptions,{displayModeBar: false});
				this.resize();
				this.initialized=true;
			}
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

            this.functionNode = true;

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
				this.options = options;
				if (this.options.xaxis.max > this.limit) {
					this.limit = this.options.xaxis.max;
				}
			}

			//Parse func as a mathjs object
			var parser = math.parser();
			var mathFunc = parser.eval(func);
			var data = [];
			data.name = options.legendText;
			data.data = {};
			data.data["x"] = [];
			data.data["y"] = [];
			for (var data_xIndex in data_x) {
				var dataElementString = data_x[data_xIndex].valueOf();
				data_y = mathFunc(dataElementString);
				//TODO: Understand why sometimes it returns an array and not a value
				if (typeof value == 'object') {
					data.data["x"].push(data_x[data_xIndex][0]);
					data.data["y"].push(data_y[0]);
				}
				else {
					data.data["x"].push(data_x[data_xIndex][0]);
					data.data["y"].push(data_y[0]);
				}
			}

			this.plotOptions.yaxis.title = options.yaxis.axisLabel;
			this.plotOptions.xaxis.title = options.xaxis.axisLabel;
			this.plotOptions.xaxis.showticklabels = true;
			this.plotOptions.xaxis.autorange = true;
			this.xaxisAutoRange = true;
			
			newLine = {
					x : data.data["x"],
					y : data.data["y"],
					modes : "lines",
					name: options.legendText,
					line: {
						dash: 'solid',
						width: 2
					}
			};

			this.datasets.push(newLine);
			
			//Creates new plot using datasets and default options
			this.plotly = Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions,{displayModeBar: false, doubleClick : false});
			this.initialized = true;
			this.resize();
			return this;
		},

		plotXYData: function (dataY, dataX, options) {
			this.controller.addToHistory("Plot "+dataY.getInstancePath()+"/"+dataX.getInstancePath(),"plotXYData",[dataY,dataX,options],this.getId());

			var timeSeriesData = this.getTimeSeriesData(dataY, dataX);

			newLine = {
					x : timeSeriesData["x"],
					y : timeSeriesData["y"],
					modes : "lines",
					name: dataY.getInstancePath(),
					line: {
						dash: 'solid',
						width: 2
					}
			};

			this.variables[dataY.getInstancePath()] = dataY;
			this.variables[dataX.getInstancePath()] = dataX;

			this.datasets.push(newLine);
			
			if (this.datasets.length > 0) {
                // check for inhomogeneousUnits and set flag
                var refUnit = undefined;
                for (var i = 0; i < this.datasets.length; i++) {
                    if (i == 0) {
                        refUnit = this.variables[this.datasets[i].name].getUnit();
                    } else if (refUnit != this.variables[this.datasets[i].name].getUnit()) {
                        this.inhomogeneousUnits = true;
                        this.labelsUpdated = false;
                        break;
                    }
                }
            }
			
			this.plotOptions.xaxis.autorange = true;
			this.plotly = Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions,{displayModeBar: false,doubleClick : false});
			this.initialized = true;
            this.updateAxis(dataY.getInstancePath());
            this.resize();
			return this;
		}

	});
});
