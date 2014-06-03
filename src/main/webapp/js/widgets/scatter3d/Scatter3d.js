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
		
		numberPoints: 0,

		scene : null,
		renderer:null,
		camera:null,
		controls:null,
		
		xaxisLabel: null,
		yaxisLabel: null,
		zaxisLabel: null,
		labelsUpdated: false,

		/**
		 * Default options for scatter3d widget, used if none specified when scatter3d
		 * is created
		 */
		defaultScatter3dOptions:  {
			octants: false,
			axis: true,
			octantsColor: 0x808080,
			clearColor: 0xEEEEEE,
			nearClipPlane: 1,
			farClipPlane: 10000,
			fov: 45,
			cameraPositionZ: 10,
			colors: [0xedc240, 0xafd8f8, 0xcb4b4b, 0x4da74d, 0x9440ed],
			limit: 400,
			plotEachN: 10,
			normalizeData: false
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
			//plotHolder.addEventListener( 'resize', this.onWindowResize, false );
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

			//PAINTING OCTANTS		
			if (this.options.octants){
				var scatterPlot = new THREE.Object3D();
				scatterPlot.add(this.paintOctants());
				this.scene.add(scatterPlot);
			}	
			
			//PAINTING AXIS
			if (this.options.axis){
				var axisHelper = new THREE.AxisHelper(50);
				this.scene.add(axisHelper);
			}
			
			//REFRESHIN CONTROLS AND RENDERING
			this.controls.update();
			this.render3DPlot();
			//THREEx.WindowResize(this.renderer, this.camera);
		},
		
//		onWindowResize: function(){
//
//			camera.aspect = window.innerWidth / window.innerHeight;
//			camera.updateProjectionMatrix();
//
//			renderer.setSize( window.innerWidth, window.innerHeight );
//
//			},
		
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
		
		/**
		 * Takes data series and 3d plots them. To plot array(s) , use it as
		 * plotData([[1,2],[2,3],[3,4]]) To plot a geppetto simulation variable , use it as
		 * plotData(["objectName","objectName2","objectName3"]) Multiples arrays can be specified at once in
		 * this method, but only one object at a time.
		 *
		 * @name plotData(state, options)
		 * @param state -
		 *            series to plot, can be array of data or an array of geppetto simulation variables
		 * @param options -
		 *            options for the scatter3d widget, if null uses default
		 */
		plotData: function(state, options) {

			// If no options specify by user, use default options
			if(options != null) {
				this.options = options;
			}

			if (state!= null) {					
				if(state instanceof Array){
					if ((typeof(state[0]) === 'string' || state[0] instanceof String) && (typeof(state[1]) === 'string' || state[1] instanceof String) && (typeof(state[2]) === 'string' || state[2] instanceof String)){
						dataset = {curves: [], data: [], lineBasicMaterial: new THREE.LineBasicMaterial( { color: 0xcc0000 } )};
						
						for (var key in state){
							dataset.data.push({
								label: state[key],
								values: []
							});
						}
						this.datasets.push(dataset);
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

			return "Lines or variables to scatter added to widget";
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
		 */
		updateDataSet: function() {
			if (this.options.plotEachN == null || !(this.numberPoints++ % this.options.plotEachN)){
				for(var key in this.datasets) {
					var reIndex = false;
					var data = this.datasets[key].data;
					
					var newValues = new Array(3);
					var currentLabel = '';
					var olddata = new Array(3);
					for(var dataKey in data) {
						currentLabel = data[dataKey].label;
						newValues[dataKey] = this.getState(GEPPETTO.Simulation.watchTree, currentLabel);
						
						olddata = data[dataKey].values;
						if(olddata.length > this.options.limit) {
							olddata.splice(0, 1);
							reIndex = true;
						}
						
						olddata.push(newValues[dataKey].value);
						this.datasets[key].data[dataKey].values = olddata;
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
					
					if(this.scene != null && this.datasets[key].data[0].values.length>1){
						//TODO: This solution adds a new line for each new vertex until a limit. When this limit is reached
						// it behaves as a FIFO (deleting first line and adding a new one).
						// I also tried to have just one single line and remove/add vertex (which I think will have a better performance/elegance)
						// but I can not make renderer to refresh the line 
						//this.datasets[key].curve.geometry.computeLineDistances();
						//this.datasets[key].curve.geometry.dynamic = true;
						//this.datasets[key].curve.geometry.verticesNeedUpdate = true;
						//this.datasets[key].curve.geometry.__dirtyVertices = true;
						
						if (reIndex){
							this.scene.remove(this.datasets[key].curves[0]);
							this.datasets[key].curves.splice(0, 1);
						}
						
						var avg = [];
						var line = {};
						if (this.options.normalizeData){
							for (var i=0; i < 3; i++){
								var sum = this.datasets[key].data[i].values.reduce(function(a, b) { return a + b });
								avg[i] = sum / this.datasets[key].data[i].values.length;
							}
						
							line = this.paintThreeLine(
									[(this.datasets[key].data[0].values[this.datasets[key].data[0].values.length-2] -avg[0])/this.datasets[key].data[0].values.length, (this.datasets[key].data[0].values[this.datasets[key].data[0].values.length-1] -avg[0])/this.datasets[key].data[0].values.length],
									[(this.datasets[key].data[1].values[this.datasets[key].data[1].values.length-2] -avg[1])/this.datasets[key].data[1].values.length, (this.datasets[key].data[1].values[this.datasets[key].data[1].values.length-1] -avg[1])/this.datasets[key].data[1].values.length],
									[(this.datasets[key].data[2].values[this.datasets[key].data[2].values.length-2] -avg[2])/this.datasets[key].data[2].values.length, (this.datasets[key].data[2].values[this.datasets[key].data[2].values.length-1] -avg[2])/this.datasets[key].data[2].values.length],
									this.datasets[key].lineBasicMaterial
							);
						}
						else{
							 line = this.paintThreeLine(
									[this.datasets[key].data[0].values[this.datasets[key].data[0].values.length-2], this.datasets[key].data[0].values[this.datasets[key].data[0].values.length-1]],
									[this.datasets[key].data[1].values[this.datasets[key].data[1].values.length-2], this.datasets[key].data[1].values[this.datasets[key].data[1].values.length-1]],
									[this.datasets[key].data[2].values[this.datasets[key].data[2].values.length-2], this.datasets[key].data[2].values[this.datasets[key].data[2].values.length-1]],
									this.datasets[key].lineBasicMaterial
							);
						}
						
						this.datasets[key].curves.push(line);
						this.scene.add(line);
						this.render3DPlot();
					}	
				}	
			}

			
		},
		
		paintThreeLine: function(dataX, dataY, dataZ, lineBasicMaterial){
			var lineGeometry = new THREE.Geometry();
			var vertArray = lineGeometry.vertices;
			for (var key in dataX){
				vertArray.push(new THREE.Vector3(dataX[key], dataY[key], dataZ[key]));
			}
			var line = new THREE.Line( lineGeometry, lineBasicMaterial);
			return line;
		},
		
		/**
		 * Takes data series and 3d plots them. To plot array(s) , use it as
		 * plotData([[1,2],[2,3],[3,4]]) 
		 *
		 * @name plotData(state, options)
		 * @param newDataX, newDataY, newDataZ
		 *            series to plot, each of them can be an array of data or 
		 *            an object containing a name(label) and array of data
		 * @param options -
		 *            options for the scatter3d widget, if null uses default
		 */
		plotXYZData: function(newDataX, newDataY, newDataZ, options) {
			// If no options specify by user, use default options
			if(options != null) {
				this.options = options;
			}
			
			dataset = {curves: [], data: [], lineBasicMaterial: new THREE.LineBasicMaterial( { color: 0xcc0000 } )};
			if(newDataX.name != null && newDataY.name != null && newDataZ.name != null) {
				dataset.data.push(
						{label: newDataX.name, values: newDataX.value},
						{label: newDataY.name, values: newDataY.value},
						{label: newDataZ.name, values: newDataZ.value}
						);
			}
			else {
				dataset.data.push(
						{label: "", values: newDataX},
						{label: "", values: newDataY},
						{label: "", values: newDataZ}
						);
			}
			this.datasets.push(dataset);
			
			this.paintThreeLine(dataset.data[0].values, dataset.data[1].values, dataset.data[2].values, dataset.lineBasicMaterial);

			dataset.curves.push(line);
			this.scene.add(line);
			this.render3DPlot();
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
