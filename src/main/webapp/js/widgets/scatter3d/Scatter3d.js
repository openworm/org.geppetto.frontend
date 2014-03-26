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
		options: null,

		scene : null,
		renderer:null,
		camera:null,
		controls:null,

		/**
		 * Default options for scatter3d widget, used if none specified when scatter3d
		 * is created
		 */
		defaultScatter3dOptions:  {
			octants: true
		},

		initialize: function(options) {
			this.id = options.id;
			this.name = options.name;
			this.visible = options.visible;
			this.datasets = [];
			this.options = this.defaultScatter3dOptions;

			this.dialog.append("<div class='scatter3d' id='" + this.id + "'></div>");

			var plotHolder = $("#"+this.id);
			this.renderer = new THREE.WebGLRenderer({antialias:false});
			this.renderer.setSize(plotHolder.width(), plotHolder.height());
			plotHolder.append(this.renderer.domElement);

			this.renderer.clear();
			var fov = 45; // camera field-of-view in degrees
			var width = this.renderer.domElement.width;
			var height = this.renderer.domElement.height;
			var aspect = width / height; // view aspect ratio
			var near = 1; // near clip plane
			var far = 10000; // far clip plane
			this.camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
			this.camera.position.z = 300;

			this.renderer.setClearColor(0xEEEEEE, 0);

			this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
			this.controls.parentWidget = this;
			this.controls.addEventListener( 'change', function(){
				if(this.parentWidget)
				{
					this.parentWidget.render3DPlot();
				}});

			this.scene = new THREE.Scene();
			
			//eso sale de aqui 
			var scatterPlot = new THREE.Object3D();
			this.scene.add(scatterPlot);
			scatterPlot.add(this.octants());
			this.controls.update();
			this.render3DPlot();
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
		},

		render3DPlot:function () {
			this.renderer.render(this.scene, this.camera);
		},
	});
});
