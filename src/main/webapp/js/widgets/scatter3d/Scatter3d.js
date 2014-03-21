/**
 * Scatter3d Widget class
 *
 * @author Boris Marin
 * @author Adrian Quintana
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
			scatter3d: null,
			datasets: [],
			limit: 20,
			options: null,
			xaxisLabel: null,
			yaxisLabel: null,
			labelsUpdated: false,

			/**
			 * Default options for scatter3d widget, used if none specified when scatter3d
			 * is created
			 */
			defaultScatter3dOptions:  {
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
				this.options = this.defaultScatter3dOptions;
				this.render();
				this.dialog.append("<div class='scatter3d' id='" + this.id + "'></div>");
			},

			/**
			 * Takes data series and scatter3ds them. To scatter3d array(s) , use it as
			 * scatter3dData([[1,2],[2,3]]) To scatter3d an object , use it as
			 * scatter3dData(objectName) Multiples arrays can be specified at once in
			 * this method, but only one object at a time.
			 *
			 * @name scatter3dData(data, options)
			 * @param newData -
			 *            series to scatter3d, can be array or an object
			 * @param options -
			 *            options for the scatter3dting widget, if null uses default
			 */
			scatter3dData: function(newData, newOptions) {

				// If no options specify by user, use default options
				if(newOptions != null) {
					this.options = newOptions;
					if(this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}

				if(newData.name != null) {
					for(var dataset in this.datasets) {
						if(newData.name == this.datasets[dataset].label) {
							return this.name
								+ " widget is already scatter3dting object "
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

				var scatter3dHolder = $("#" + this.id);
				if(this.scatter3d == null) {
					this.scatter3d = $.scatter3d(scatter3dHolder, this.datasets, options);
					scatter3dHolder.resize();
				}
				else {
					this.scatter3d = $.scatter3d(scatter3dHolder, this.datasets, options);
				}

				return "Line scatter3d added to widget";
			},

			/**
			 * Takes the name of a simulation state to scatter3d.
			 *
			 * @name scatter3dData(state, options)
			 * @param state -
			 *           name of state to scatter3d
			 * @param options -
			 *            options for the scatter3dting widget, if null uses default
			 */
			scatter3dState : function(state, options) {
				// If no options specify by user, use default options
				if (options != null) {
					this.options = options;
					if (this.options.xaxis.max > this.limit) {
						this.limit = this.options.xaxis.max;
					}
				}

				if (state!= null) {
					this.datasets.push({
						label : state,
						data : [ [ 0, 0] ]
					});
				}

				var scatter3dHolder = $("#" + this.id);
				if (this.scatter3d == null) {
					this.scatter3d = $.plot(scatter3dHolder, this.datasets, this.options);
					scatter3dHolder.resize();
				} else {
					this.scatter3d = $.plot(scatter3dHolder, this.datasets, this.options);
				}

				return "Line scatter3d added to widget";
			},

			/**
			 * Takes two time series and scatter3ds one against the other. To scatter3d
			 * array(s) , use it as scatter3dData([[1,2],[2,3]]) To scatter3d an object ,
			 * use it as scatter3dData(objectNameX,objectNameY)
			 *
			 * @name scatter3dData(dataX,dataY, options)
			 * @param newDataX -
			 *            series to scatter3d on X axis, can be array or an object
			 * @param newDataY -
			 *            series to scatter3d on Y axis, can be array or an object
			 * @param options -
			 *            options for the scatter3dting widget, if null uses default
			 */
			scatter3dXYData: function(newDataX, newDataY, options) {

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
							return this.name + " widget is already scatter3dting object " + newDataX.name + "/" + newDataY.name;
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

				var scatter3dHolder = $("#" + this.id);
				if(this.scatter3d == null) {
					this.scatter3d = $.scatter3d(scatter3dHolder, this.datasets, this.options);
					scatter3dHolder.resize();
				}
				else {
					this.scatter3d = $.scatter3d(scatter3dHolder, this.datasets, this.options);
				}

				return "Line scatter3d added to widget";
			},
			/**
			 * Removes the data set from the scatter3d. EX:
			 * removeDataSet(dummyDouble)
			 *
			 * @param set -
			 *            Data set to be removed from the scatter3d
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

					this.scatter3d.setData(data);
					this.scatter3d.setupGrid();
					this.scatter3d.draw();
				}

				if(this.datasets.length == 0) {
					this.resetScatter3d();
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

							newData.push([ newData.length, newValue[0][0] ]);

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
							newData.push([ newValue[0][0], newValue[0][1][0] ]);
							this.datasets[matchedKey].data = newData;
						}
					}
				}
				
				if(this.scatter3d != null){
					this.scatter3d.setData(this.datasets);
					this.scatter3d.draw();
				}
			},

			/**
			 * Scatter3ds a function against a data series
			 *
			 * @name dataFunction(func, data, options)
			 * @param func - function to scatter3d vs data
			 * @param data - data series to scatter3d against function
			 * @param options - options for scatter3dting widget
			 */
			scatter3dDataFunction: function(func, data, options) {

			},

			/**
			 * Resets the scatter3d widget, deletes all the data series but does not
			 * destroy the widget window.
			 *
			 * @name resetScatter3d()
			 */
			resetScatter3d: function() {
				if(this.scatter3d != null) {
					this.datasets = [];
					this.options = this.defaultScatter3dOptions;
					var scatter3dHolder = $("#" + this.id);
					this.scatter3d = $.plot(scatter3dHolder, this.datasets, this.options);
				}
			},

			/**
			 *
			 * Set the options for the scatter3dting widget
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
				this.scatter3d = $.plot($("#" + this.id), this.datasets, this.options);
			},

			/**
			 * Retrieve the data sets for the scatter3d
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
				this.options.yaxis.axisLabel = labelY;
				this.scatter3d = $.plot($("#" + this.id), this.datasets,this.options);
			}

			});
});
