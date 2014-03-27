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
 * Plot Widget class
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
			plot: null,
			datasets: [],
			limit: 20,
			options: null,
			xaxisLabel: null,
			yaxisLabel: null,
			labelsUpdated: false,

			/**
			 * Default options for plot widget, used if none specified when plot
			 * is created
			 */
			defaultPlotOptions:  {
				series: {
					shadowSize: 0
				},
				yaxis: {
					min: -0.1,
					max: 1
				},
				xaxis: {
					min: 0,
					max: 20,
					show: false
				},
				grid: {
					margin: {
						left: 15,
						bottom: 15
					}
				}
			},

			initialize: function(options) {
				this.id = options.id;
				this.name = options.name;
				this.visible = options.visible;
				this.datasets = [];
				this.options = this.defaultPlotOptions;
				this.render();
				this.dialog.append("<div class='plot' id='" + this.id + "'></div>");
			},

			/**
			 * Takes data series and plots them. To plot array(s) , use it as
			 * plotData([[1,2],[2,3]]) To plot a geppetto simulation variable , use it as
			 * plotData("objectName") Multiples arrays can be specified at once in
			 * this method, but only one object at a time.
			 *
			 * @name plotData(state, options)
			 * @param state -
			 *            series to plot, can be array of data or an geppetto simulation variable
			 * @param options -
			 *            options for the plotting widget, if null uses default
			 */
			plotData: function(state, options) {

				// If no options specify by user, use default options
				if(options != null) {
					this.options = options;
					if(this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}

				if (state!= null) {					
					if(state instanceof Array){
						this.datasets.push({
							data : state
						});
					}
					
					else{
						this.datasets.push({
							label : state,
							data : [ [] ]
						});
					}
				}

				var plotHolder = $("#" + this.id);
				if(this.plot == null) {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
					plotHolder.resize();
				}
				else {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
				}

				return "Line plot added to widget";
			},

			/**
			 * Takes two time series and plots one against the other. To plot
			 * array(s) , use it as plotData([[1,2],[2,3]]) To plot an object ,
			 * use it as plotData(objectNameX,objectNameY)
			 *
			 * @name plotData(dataX,dataY, options)
			 * @param newDataX -
			 *            series to plot on X axis, can be array or an object
			 * @param newDataY -
			 *            series to plot on Y axis, can be array or an object
			 * @param options -
			 *            options for the plotting widget, if null uses default
			 */
			plotXYData: function(newDataX, newDataY, options) {

				// If no options specify by user, use default options
				if(options != null) {
					this.options = options;
					if(this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}

				if(newDataX.name != null && newDataY.name != null) {
					for(var dataset in this.datasets) {
						if(newDataX.name + "/" + newDataY.name == this.datasets[dataset].label) {
							return this.name + " widget is already plotting object " + newDataX.name + "/" + newDataY.name;
						}
					}
					this.datasets.push({
						label: newDataX.name + "/" + newDataY.name,
						data: [
							[ newDataX.value, newDataY.value ]
						]
					});
				}
				else {
					this.datasets.push({
						label: "",
						data: newDataX
					});
					this.datasets.push({
						label: "",
						data: newDataY
					});
				}

				var plotHolder = $("#" + this.id);
				if(this.plot == null) {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
					plotHolder.resize();
				}
				else {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
				}

				return "Line plot added to widget";
			},
			/**
			 * Removes the data set from the plot. EX:
			 * removeDataSet(dummyDouble)
			 *
			 * @param set -
			 *            Data set to be removed from the plot
			 */
			removeDataSet: function(set) {
				if(set != null) {
					for(var key in this.datasets) {
						if(set == this.datasets[key].label) {
							this.datasets.splice(key, 1);
						}
					}

					var data = [];

					for(var i = 0; i < this.datasets.length; i++) {
						data.push(this.datasets[i]);
					}

					this.plot.setData(data);
					this.plot.setupGrid();
					this.plot.draw();
				}

				if(this.datasets.length == 0) {
					this.resetPlot();
				}
			},

			/**
			 * Updates a data set, use for time series
			 */
			updateDataSet: function() {
				for(var key in this.datasets) {
					var label = this.datasets[key].label;
					var newValue = this.getState(GEPPETTO.Simulation.watchTree, label);

					if(!this.labelsUpdated) {
						var unit = newValue.unit;
						if(unit != null) {
							var labelY = unit;
							//Matteo: commented until this can move as it doesn't make sense for it to be static.
							//also ms should not be harcoded but should come from the simulator as the timescale could
							//be different
							var labelX = "";
							//Simulation timestep (ms) " + Simulation.timestep;
							this.setAxisLabel(labelY, labelX);
							this.labelsUpdated = true;
						}
					}

					var oldata = this.datasets[key].data;;
					var reIndex = false;

					if(oldata.length > this.limit) {
						oldata.splice(0, 1);
						reIndex = true;
					}

					oldata.push([ oldata.length, newValue.value]);

					if(reIndex) {
						// re-index data
						var indexedData = [];
						for(var index = 0, len = oldata.length; index < len; index++) {
							var value = oldata[index][1];
							indexedData.push([ index, value ]);
						}

						this.datasets[key].data = indexedData;
					}
					else {
						this.datasets[key].data = oldata;
					}

				}

				if(this.plot != null){
					this.plot.setData(this.datasets);
					this.plot.draw();
				}
			},

			/**
			 * Plots a function against a data series
			 *
			 * @name dataFunction(func, data, options)
			 * @param func - function to plot vs data
			 * @param data - data series to plot against function
			 * @param options - options for plotting widget
			 */
			plotDataFunction: function(func, data, options) {

			},

			/**
			 * Resets the plot widget, deletes all the data series but does not
			 * destroy the widget window.
			 *
			 * @name resetPlot()
			 */
			resetPlot: function() {
				if(this.plot != null) {
					this.datasets = [];
					this.options = this.defaultPlotOptions;
					var plotHolder = $("#" + this.id);
					this.plot = $.plot(plotHolder, this.datasets, this.options);
				}
			},

			/**
			 *
			 * Set the options for the plotting widget
			 *
			 * @name setOptions(options)
			 * @param options
			 */
			setOptions: function(options) {
				this.options = options;
				if(this.options.xaxis != null) {
					if(this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}
				this.plot = $.plot($("#" + this.id), this.datasets, this.options);
			},

			/**
			 * Retrieve the data sets for the plot
			 * @returns {Array}
			 */
			getDataSets: function() {
				return this.datasets;
			},

			/**
			 * Resets the datasets for the plot
			 */
			cleanDataSets: function() {
				// update corresponding data set
				for(var key in this.datasets) {
					this.datasets[key].data = [[]];
				}
			},
			
			/**
			 * Sets a label next to the Y Axis
			 *
			 * @param label - Label to use for Y Axis
			 */
			setAxisLabel: function(labelY, labelX) {
				this.options.yaxis.axisLabel = labelY;
				this.plot = $.plot($("#" + this.id), this.datasets,this.options);
			}

			});
});
