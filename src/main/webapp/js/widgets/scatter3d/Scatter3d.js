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
			this.render();
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
			
			var scatterPlot = new THREE.Object3D();
			
			//PAINTING AXIS			
			scatterPlot.add(this.paintOctants());
			
			//PAINTING A CURVE JUST FOR FUN
			var mat = new THREE.ParticleBasicMaterial({vertexColors: true, size: 1.5});

			var pointCount = 10000;
			var pointGeo = new THREE.Geometry();
			for (var i=0; i<pointCount; i++) {
			  var x = Math.random() * 100 - 50;
			  var y = x*0.8+Math.random() * 20 - 10;
			  var z = x*0.7+Math.random() * 30 - 15;
			  pointGeo.vertices.push(new THREE.Vertex(new THREE.Vector3(x,y,z)));
			  //pointGeo.colors.push(new THREE.Color().setHSV((x+50)/100, (z+50)/100, (y+50)/100));
			}
			var points = new THREE.ParticleSystem(pointGeo, mat);
			
			//ADDING POINTS 
			scatterPlot.add(points);
			this.scene.add(scatterPlot);
			
			//REFRESHIN CONTROLS AND RENDERING
			this.controls.update();
			this.render3DPlot();
		},

		
		
		paintOctants: function() {
			function v(x,y,z){ return new THREE.Vertex(new THREE.Vector3(x,y,z)); }  
			var lineGeo = new THREE.Geometry();
		      lineGeo.vertices.push(
		        v(-50, 0, 0), v(50, 0, 0),
		        v(0, -50, 0), v(0, 50, 0),
		        v(0, 0, -50), v(0, 0, 50),

		        v(-50, 50, -50), v(50, 50, -50),
		        v(-50, -50, -50), v(50, -50, -50),
		        v(-50, 50, 50), v(50, 50, 50),
		        v(-50, -50, 50), v(50, -50, 50),

		        v(-50, 0, 50), v(50, 0, 50),
		        v(-50, 0, -50), v(50, 0, -50),
		        v(-50, 50, 0), v(50, 50, 0),
		        v(-50, -50, 0), v(50, -50, 0),

		        v(50, -50, -50), v(50, 50, -50),
		        v(-50, -50, -50), v(-50, 50, -50),
		        v(50, -50, 50), v(50, 50, 50),
		        v(-50, -50, 50), v(-50, 50, 50),

		        v(0, -50, 50), v(0, 50, 50),
		        v(0, -50, -50), v(0, 50, -50),
		        v(50, -50, 0), v(50, 50, 0),
		        v(-50, -50, 0), v(-50, 50, 0),

		        v(50, 50, -50), v(50, 50, 50),
		        v(50, -50, -50), v(50, -50, 50),
		        v(-50, 50, -50), v(-50, 50, 50),
		        v(-50, -50, -50), v(-50, -50, 50),

		        v(-50, 0, -50), v(-50, 0, 50),
		        v(50, 0, -50), v(50, 0, 50),
		        v(0, 50, -50), v(0, 50, 50),
		        v(0, -50, -50), v(0, -50, 50)
		      );
		      var lineMat = new THREE.LineBasicMaterial({color: 0x808080, lineWidth: 1});
		      var line = new THREE.Line(lineGeo, lineMat);
		      line.type = THREE.Lines;
		      return line;
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

		plotXYZData: function(newDataX, newDataY, newDataZ, options) {
			
			
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
