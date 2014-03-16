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

	return Widget.View
		.extend({

			plot: null,
			datasets: [],
			limit: 20,
			updateGrid: false,
			options: null,
			xaxisLabel: null,
			yaxisLabel: null,
			labelsUpdated: false,

			/**
			 * Default options for plot widget, used if none specified when plot
			 * is created
			 */
			defaultPlotOptions: {
				series: {
					shadowSize: 0
				},
				yaxis: {
					min: -.1,
					max: 1
				},
				xaxis: {
					min: 0,
					max: 20,
					show: true
				},
				grid: {
					margin: {
						left: 15,
						bottom: 15
					}
				}
			},

			/**
			 * Initializes the plot widget
			 */
			initialize: function() {
				this.datasets = [];
				this.options = this.defaultPlotOptions;
				this.render();
				this.dialog.append("<div class='plot' id='" + this.id
					+ "'></div>");
			},

			/**
			 * Takes data series and plots them. To plot array(s) , use it as
			 * plotData([[1,2],[2,3]]) To plot an object , use it as
			 * plotData(objectName) Multiples arrays can be specified at once in
			 * this method, but only one object at a time.
			 *
			 * @name plotData(data, options)
			 * @param newData -
			 *            series to plot, can be array or an object
			 * @param options -
			 *            options for the plotting widget, if null uses default
			 */
			plotData: function(newData, options) {
				// If no options specify by user, use default options
				if(options != null) {
					this.options = options;
					if(options.xaxis.max > this.limit) {
						this.limit = options.xaxis.max;
					}
				}

				if(newData.name != null) {
					for(var set in this.datasets) {
						if(newData.name == this.datasets[set].label) {
							return this.name
								+ " widget is already plotting object "
								+ newData.name;
						}
					}
					this.datasets.push({
						label: newData.name,
						data: [
							[ 0, newData.value ]
						]
					});
				}
				else {
					this.datasets.push({
						label: "",
						data: newData
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
			 * Takes the name of a simulation state to plot.
			 *
			 * @name plotData(state, options)
			 * @param state -
			 *           name of state to plot
			 * @param options -
			 *            options for the plotting widget, if null uses default
			 */
			plotState : function(state, options) {
				// If no options specify by user, use default options
				if (options != null) {
					this.options = options;
					if (options.xaxis.max > this.limit) {
						this.limit = options.xaxis.max;
					}
				}

				if (state!= null) {
					this.datasets.push({
						label : state,
						data : [ [ 0, 0] ]
					});
				}

				var plotHolder = $("#" + this.id);
				if (this.plot == null) {
					this.plot = $.plot(plotHolder, this.datasets, this.options);
					plotHolder.resize();
				} else {
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
					if(options.xaxis.max > this.limit) {
						this.limit = options.xaxis.max;
					}
				}

				if(newDataX.name != null && newDataY.name != null) {
					for(var set in this.datasets) {
						if(newDataX.name + "/" + newDataY.name == this.datasets[set].label) {
							return this.name
								+ " widget is already plotting object "
								+ newDataX.name + "/" + newDataY.name;
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
						if(set.name == this.datasets[key].label) {
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
			 *
			 * @param label -
			 *            Name of data set
			 * @param newValue -
			 *            Updated value for data set
			 */
			updateDataSet: function(newValues) {
				for(var i = 0; i < newValues.length; i++) {
					var label = newValues[i].label;
					var newValue = newValues[i].data;

					if(!this.labelsUpdated) {
						var unit = newValues[i].unit;
						if(unit != null) {
							var labelY = "Measure ( " + unit + " )";
							var labelX = "Response time (ms) " + Simulation.step;
							this.setAxisLabel(labelY, labelX);
						}
						this.labelsUpdated = true;
					}

					if(label != null) {
						var newData = null;
						var matchedKey = 0;
						var reIndex = false;

						// update corresponding data set
						for(var key in this.datasets) {
							if(label == this.datasets[key].label) {
								newData = this.datasets[key].data;
								matchedKey = key;
							}
						}

						if(newValue[0].length == 1) {
							if(newData.length > this.limit) {
								newData.splice(0, 1);
								reIndex = true;
							}

							newData.push([ newData.length, newValue[0] ]);

							if(reIndex) {
								// re-index data
								var indexedData = [];
								for(var index = 0, len = newData.length; index < len; index++) {
									var value = newData[index][1];
									indexedData.push([ index, value ]);
								}

								this.datasets[matchedKey].data = indexedData;
							}
							else {
								this.datasets[matchedKey].data = newData;
							}
						}
						else if(newValue[0].length == 2) {
							newData.push([ newValue[0][0], newValue[0][1] ]);
							this.datasets[matchedKey].data = newData;
						}
					}
				}

				this.plot.setData(this.datasets);
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
				if(options.xaxis != null) {
					if(options.xaxis.max > this.limit) {
						this.limit = options.xaxis.max;
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
			 * Sets a label next to the Y Axis
			 *
			 * @param label - Label to use for Y Axis
			 */
			setAxisLabel: function(labelY, labelX) {
				if(this.yaxisLabel != null) {
					$("#YLabel").remove();
				}
				if(this.xaxisLabel != null) {
					$("#XLabel").remove();
				}

				//update grid
				this.options.grid = {margin: {left: 15, bottom: 15}};
				this.plot = $.plot($("#" + this.id), this.datasets, this.options);

				this.yaxisLabel = $("<div class='axisLabel yaxisLabel' id='YLabel'></div>")
					.text(labelY)
					.appendTo($("#" + this.id));

				this.xaxisLabel = $("<div class='axisLabel xaxisLabel' id='XLabel'></div>")
					.text(labelX)
					.appendTo($("#" + this.id));
			}
		});
});
