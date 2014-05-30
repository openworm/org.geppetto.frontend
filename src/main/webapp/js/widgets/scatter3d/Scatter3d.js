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
		limit: 400,
		datasets: [],
		options: null,

		scene : null,
		renderer:null,
		camera:null,
		controls:null,
		
		labelsUpdated: false,

		/**
		 * Default options for scatter3d widget, used if none specified when scatter3d
		 * is created
		 */
		defaultScatter3dOptions:  {
			octants: true,
			octantsColor: 0x808080,
			clearColor: 0xEEEEEE,
			nearClipPlane: 1,
			farClipPlane: 10000,
			fov: 45,
			cameraPositionZ: 300
			
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
			this.initializeCamera();
			this.renderer.setClearColor(this.options.clearColor, 0);

			this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
			this.controls.parentWidget = this;
			this.controls.addEventListener( 'change', function(){
				if(this.parentWidget)
				{
					this.parentWidget.render3DPlot();
				}});

			this.scene = new THREE.Scene();
			
			//ADDING POINTS CURVE 
			//scatterPlot.add(this.paintTestCurve());
			
			//ADDING PLOT CURVE
			//this.generate_trajectory_data(10000);

			//PAINTING AXIS			
			if (this.options.octants){
				var scatterPlot = new THREE.Object3D();
				scatterPlot.add(this.paintOctants());
				this.scene.add(scatterPlot);
			}	
			
			//REFRESHIN CONTROLS AND RENDERING
			this.controls.update();
			this.render3DPlot();
			THREEx.WindowResize(this.renderer, this.camera);
		},
		
		initializeCamera: function(){
			var fov = this.options.fov; // camera field-of-view in degrees
			var width = this.renderer.domElement.width;
			var height = this.renderer.domElement.height;
			var aspect = width / height; // view aspect ratio
			var near = this.options.nearClipPlane; // near clip plane
			var far = this.options.farClipPlane; // far clip plane
			this.camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
			this.camera.position.z = this.options.cameraPositionZ;
		},

		paintTestCurve: function(){
			//PAINTING A CURVE JUST FOR FUN
			var mat = new THREE.ParticleBasicMaterial({vertexColors: true, size: 1.5});

			var pointCount = 1000;
			var pointGeo = new THREE.Geometry();
			for (var i=0; i<pointCount; i++) {
			  var x = Math.random() * 100 - 50;
			  var y = x*0.8+Math.random() * 20 - 10;
			  var z = x*0.7+Math.random() * 30 - 15;
			  pointGeo.vertices.push(new THREE.Vector3(x,y,z));
			  //pointGeo.colors.push(new THREE.Color().setHSV((x+50)/100, (z+50)/100, (y+50)/100));
			}
			var points = new THREE.ParticleSystem(pointGeo, mat);

			return points;
		},
		
		generate_trajectory_data: function(npt){
			var trajectory_data_x = [];
			var trajectory_data_y = [];
			var trajectory_data_z = [];
			var x = 0.0;
			var y = 0.0;
			var z = 0.5;

			var xx, yy, zz;

			var a = 0.2;
			var b = 0.2;
			var c = 5.7;
			var dt = 0.05;

			for (var i=0; i < npt; i++) {
				//rössler euler
				xx = x + dt * (- y - z);
				yy = y + dt * (x + a * y);
				zz = z + dt * (b + z * (x - c));
	
				trajectory_data_x.push(xx);
				trajectory_data_y.push(yy);
				trajectory_data_z.push(zz);
	
				x = xx;
				y = yy;
				z = zz;
			}
			//this.plotXYZData(trajectory_data_x, trajectory_data_y, trajectory_data_z);
			//xyzData = {'label': 'nombrex', 'value': trajectory_data_x}, trajectory_data_y, trajectory_data_z]};
			this.plotXYZData({'label': 'nombrex', 'value': trajectory_data_x},
					{'label': 'nombrey', 'value': trajectory_data_y},
					{'label': 'nombrez', 'value': trajectory_data_z}
					);
		},
	
		
		paintOctants: function() {
			function v(x,y,z){ return new THREE.Vector3(x,y,z); }  
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
		      var lineMat = new THREE.LineBasicMaterial({color: this.options.octantsColor, lineWidth: 1});
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
		updateDataSet: function() {
			for(var key in this.datasets) {
				var reIndex = false;
				var data = this.datasets[key].data;
				
				var newValues = new Array(3);
				var currentLabel = '';
				var oldata = new Array(3);
				for(var dataKey in data) {
					currentLabel = data[dataKey].label;
					newValues[dataKey] = this.getState(GEPPETTO.Simulation.watchTree, currentLabel);
					
					oldata = data[dataKey].values;
					if(oldata.length > this.limit) {
						oldata.splice(0, 1);
						reIndex = true;
						//this.datasets[key].curve.vertices.splice(0, 1);
					}
					
					oldata.push(newValues[dataKey]);
					this.datasets[key].data[dataKey].values = oldata;
				}
				

				if(!this.labelsUpdated) {
					var unit = newValues[0].unit;
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
			
				
				//Approach painting a line for every two points
//				if (this.datasets[key].data[0].length > 1){
//					var lineGeometry = new THREE.Geometry();
//					var vertArray = lineGeometry.vertices;
//					
//					vertArray.push(new THREE.Vector3(this.datasets[key].data[0][this.datasets[key].data[0].length-2].value*100, this.datasets[key].data[1][this.datasets[key].data[0].length-2].value*100, this.datasets[key].data[2][this.datasets[key].data[0].length-2].value*100));
//					vertArray.push(new THREE.Vector3(newValues[0].value*100, newValues[1].value*100, newValues[2].value*100));
//					
//					lineGeometry.computeLineDistances();
//					var lineMaterial = new THREE.LineBasicMaterial( { color: 0xcc0000 } );
//					var line = new THREE.Line( lineGeometry, lineMaterial );
//					this.scene.add(line);
//					this.render3DPlot();
//				}
				
				if(this.scene != null && this.datasets[key].data[0].values.length>1){
					//var mat = new THREE.ParticleBasicMaterial({vertexColors: true, size: 1.5});
					//var vertArray = this.datasets[key].curve.geometry.vertices;
					//if (vertArray.length == 0){
						//vertArray = new Array(401);
					//} 
						
					//var vertArray = this.datasets[key].curve.vertices;
					var lineGeometry = new THREE.Geometry();
					var vertArray = lineGeometry.vertices;
					//console.log('Tamano')
					//console.log(data[0].values.length);
					//vertArray = [];
					//for (var i=0; i<data[0].values.length;i++){
						//vertArray[i] = new THREE.Vector3(data[0].values[i].value*100, data[1].values[i].value*100, data[2].values[i].value*100);
					//}
					
					if (reIndex){
						this.scene.remove(this.datasets[key].curves[0]);
						this.datasets[key].curves.splice(0, 1);
					}
					
					vertArray.push(new THREE.Vector3(this.datasets[key].data[0].values[this.datasets[key].data[0].values.length-2].value*100, this.datasets[key].data[1].values[this.datasets[key].data[1].values.length-2].value*100, this.datasets[key].data[2].values[this.datasets[key].data[2].values.length-2].value*100));
					vertArray.push(new THREE.Vector3(newValues[0].value*100, newValues[1].value*100, newValues[2].value*100));

					//this.datasets[key].curve.material.attributes.lineDistances.needsUpdate = true;
					
					//this.datasets[key].curve.geometry.computeLineDistances();
					//this.datasets[key].curve.geometry.dynamic = true;
					//this.datasets[key].curve.geometry.verticesNeedUpdate = true;
					//this.datasets[key].curve.geometry.__dirtyVertices = true;
					//this.datasets[key].curve.geometry.lineDistancesNeedUpdate = true;
					var lineMaterial = new THREE.LineBasicMaterial( { color: 0xcc0000 } );
					//var line = new THREE.Line( this.datasets[key].curve, lineMaterial );
					var line = new THREE.Line( lineGeometry, lineMaterial );
					
					this.datasets[key].curves.push(line);
					
					//this.scene.add(this.datasets[key].curve);
					this.scene.add(line);
					this.render3DPlot();
					
				}	
				
			}	
			
			
		},
		

		plotXYZData: function(newDataX, newDataY, newDataZ, options) {
			// If no options specify by user, use default options
			if(options != null) {
				this.options = options;
			}
			
			if(newDataX.name != null && newDataY.name != null && newDataZ.name != null) {
				datasetLabel = [newDataX.name, newDataY.name, newDataZ.name];
				for(var dataset in this.datasets) {
					if(datasetLabel == this.datasets[dataset].label) {
						return this.name + " widget is already plotting object " + datasetLabel;
					}
				}
				this.datasets.push({
					label: datasetLabel,
					data: [newDataX.value, newDataY.value, newDataZ.value ]
				});
			}
			else {
				this.datasets.push({
					label: "",
					data: [newDataX, newDataY, newDataZ]
				});
			}
			
			//vertArray.push( new THREE.Vector3(-150, -100, 0), new THREE.Vector3(-150, 100, 0) );
			
			for(var key in this.datasets) {
				var lineGeometry = new THREE.Geometry();
				var vertArray = lineGeometry.vertices;
				var datasetsValue = this.datasets[key].data;
				for (var index = 0; index < datasetsValue[0].value.length; index++){
					vertArray.push(new THREE.Vector3(datasetsValue[0].value[index], datasetsValue[1].value[index], datasetsValue[2].value[index]));
				}
				lineGeometry.computeLineDistances();
				var lineMaterial = new THREE.LineBasicMaterial( { color: 0xcc0000 } );
				var line = new THREE.Line( lineGeometry, lineMaterial );
				this.scene.add(line);
			}	

			this.render3DPlot();
		},
		
		/**
		 * Takes data series and plots them. To plot array(s) , use it as
		 * plotData([[1,2],[2,3]]) To plot a geppetto simulation variable , use it as
		 * plotData("objectName") Multiples arrays can be specified at once in
		 * this method, but only one object at a time.dataset = {curve: new THREE.Line(new THREE.Geometry(),  lineBasicMaterial), data:[]};
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
//				if(this.options.xaxis.max > this.limit) {
//					this.limit = this.options.xaxis.max;
//				}
			}

			if (state!= null) {					
				if(state instanceof Array){
					if ((typeof(state[0]) === 'string' || state[0] instanceof String) && (typeof(state[1]) === 'string' || state[1] instanceof String) && (typeof(state[2]) === 'string' || state[2] instanceof String)){
						//var line = new THREE.Line( this.datasets[key].curve, lineMaterial );
						//var curveGeometry = new THREE.Geometry();
						var lineBasicMaterial = new THREE.LineBasicMaterial( { color: 0xcc0000 } );
						//curveLine = new THREE.Line(curveGeometry,  lineBasicMaterial);
						//curveGeometry.vertices = new Array(401);
						//dataset = {curve: new THREE.Line(new THREE.Geometry(),  lineBasicMaterial), data:[]};
						dataset = {curves: [], data:[]};
						
						for (var key in state){
							dataset.data.push({
								label: state[key],
								values: []
							});

							this.scene.add(dataset.curve);
						}
						this.datasets.push(dataset);
						//var vertArray = this.datasets[0].curve.geometry.vertices;
						//vertArray.push(new THREE.Vector3(0, 0, 0));
						//vertArray.push(new THREE.Vector3(100, 100, 100));
					}
					else{
						for (var key in state){
							this.datasets.push({
								label: "",
								values: state[key]
							});
						}	
					}
				}
			}

			var plotHolder = $("#" + this.id);
			if(this.plot == null) {
				//this.plot = $.plot(plotHolder, this.datasets, this.options);
				//plotHolder.resize();
			}
			else {
				//this.plot = $.plot(plotHolder, this.datasets, this.options);
			}

			return "Line plot added to widget";
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
		 * Sets labels next to each axis
		 *
		 */
		setAxisLabel: function(labelX, labelY, labelZ) {
			this.options.yaxis.axisLabel = labelY;
			this.scatter3d = $.plot($("#" + this.id), this.datasets,this.options);
		},

		render3DPlot:function () {
			this.renderer.render(this.scene, this.camera);
		},
	});
});
