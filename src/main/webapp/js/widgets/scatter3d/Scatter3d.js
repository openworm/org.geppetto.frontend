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
 * Scatter3d Widget class
 *
 * @author Boris Marin
 * @author Adrian Quintana
 */

define(function(require) {

	var Widget = require('widgets/Widget');
	var $ = require('jquery');

	return Widget.View.extend({
		datasets: [],
		options: null,
		
		numberPoints: 0,

		scene : null,
		renderer:null,
		camera:null,
		controls:null,
		
		axisHelper: {},
		scatter3dHolder: {},

		/**
		 * Default options for scatter3d widget, used if none specified when scatter3d
		 * is created
		 */
		defaultScatter3dOptions:  {
			axis: true, //Axis Helper
			axisColours: [{ r:248, g:102, b:8}, { r:177, g:255, b:86}, { r:134, g:197, b:255}],   
			grid: false, //Grid Helper //Not working properly
			legend: true, //Legend
			clearColor: 0x3b3535,
			nearClipPlane: 1,
			farClipPlane: 10000,
			fov: 45,
			cameraPositionZ: 10,
			colours: [0xedc240, 0xafd8f8, 0xcb4b4b, 0x4da74d, 0x9440ed], //Colours range for the lines
			limit: 400, //Maximum number of samples to be displayed in the Scatter 3d
			plotEachN: null, // If define it will behave as a sampling factor
			normalizeData: false //Not working properly
		},

		initialize: function(options) {
			this.id = options.id;
			this.name = options.name;
			this.visible = options.visible;
			this.datasets = [];
			this.options = this.defaultScatter3dOptions;
			this.render();

			this.scatter3dHolder = $("#"+this.id);
			this.renderer = new THREE.WebGLRenderer({antialias:false});
			this.renderer.setSize(this.scatter3dHolder.width(), this.scatter3dHolder.height());
			this.scatter3dHolder.append(this.renderer.domElement);

			this.renderer.clear();
			this.initializeCamera();
			this.renderer.setClearColor(this.options.clearColor, 1);

			this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
			this.controls.parentWidget = this;
			this.controls.addEventListener( 'change', function(){
			if(this.parentWidget)
			{
				this.parentWidget.render3DPlot();
			}});

			this.scene = new THREE.Scene();
			
			//PAINTING HELPERS (AXIS AND GRID)
			this.helpers();
			
			//ADDING RESIZE EVENT
			this.scatter3dHolder.on('resize', this, function (e) {
				WIDTH = e.data.scatter3dHolder.width(),
				HEIGHT = e.data.scatter3dHolder.height();
				e.data.renderer.setSize(WIDTH, HEIGHT);
				e.data.camera.aspect = WIDTH / HEIGHT;
				e.data.camera.updateProjectionMatrix();
				e.stopPropagation();
		    });
			
			//REFRESHIN CONTROLS AND RENDERING
			this.controls.update();
			this.render3DPlot();
		},
		
		/**
		 * Initializing Camera Aspects
		 *
		 * @name initializeCamera()
		 */
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
		 * Paint Axis Helper and/or Grid Helper
		 *
		 * @name helpers()
		 */
		helpers: function(){
			//PAINTING AXIS
			if (this.options.axis){
							
				var colorX = new THREE.Color("rgb(" + this.options.axisColours[0].r + "," + this.options.axisColours[0].g + "," + this.options.axisColours[0].b + ")");
				var colorY = new THREE.Color("rgb(" + this.options.axisColours[1].r + "," + this.options.axisColours[1].g + "," + this.options.axisColours[1].b + ")");
				var colorZ = new THREE.Color("rgb(" + this.options.axisColours[2].r + "," + this.options.axisColours[2].g + "," + this.options.axisColours[2].b + ")");
				
				this.axisHelper = new THREE.AxisHelper(50,colorX,colorY,colorZ);
				this.scene.add(this.axisHelper);
			}
			
			//PAINTING GRID
			if (this.options.grid){
				var gridXZ = new THREE.GridHelper(50, 10);
				gridXZ.position.set( 50,0,50 );
				this.scene.add(gridXZ);
				
				var gridXY = new THREE.GridHelper(50, 10);
				gridXY.position.set( 50,50,0 );
				gridXY.rotation.x = Math.PI/2;
				this.scene.add(gridXY);

				var gridYZ = new THREE.GridHelper(50, 10);
				gridYZ.position.set( 0,50,50 );
				gridYZ.rotation.z = Math.PI/2;
				this.scene.add(gridYZ);
			}
		},
		
		/**
		 * Display legend from dataset labels
		 *
		 * @name paintLegend()
		 */
		paintLegend: function(){
			if ($('#legendBox').length > 0){
				$("#legendBox").empty();
			}
			else{
				this.scatter3dHolder.append("<div id='legendBox' title='Legend Box'></div>");
			}	
			for(var key in this.datasets) {
				var data = this.datasets[key].data;
				$("#legendBox").append("<div id='datasetLegend" + key + "' class='datasetLegend'><div class='legendColor' style='background: #" + (this.options.colours[key]).toString(16) + ";'></div></div>");
				$("#datasetLegend" + key).append("<div id='datasetLegendText" + key + "' class='datasetLegendText'></div>");
				for(var dataKey in data) {
					$("#datasetLegendText" + key).append("<span style='color:RGB(" + this.options.axisColours[dataKey].r + "," + this.options.axisColours[dataKey].g + "," + this.options.axisColours[dataKey].b + ")'>" + data[dataKey].label +"</span>");
					if (dataKey != data.length -1){
						$("#datasetLegendText" + key).append("<br>");
					}
				}
			}
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
				$.extend(this.options, options);
			}

			if (state!= null) {					
				if(state instanceof Array){
					if ((typeof(state[0]) === 'string' || state[0] instanceof String) && (typeof(state[1]) === 'string' || state[1] instanceof String) && (typeof(state[2]) === 'string' || state[2] instanceof String)){
						
						dataset = {curves: [], data: [], lineBasicMaterial: new THREE.LineBasicMaterial({linewidth: 4, color: this.options.colours[this.datasets.length]})};
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
					//Painting legend
					if (this.options.axis && this.options.legend === true){this.paintLegend();}
				}
			}

			return "Lines or variables to scatter added to widget";
		},
		
		/**
		 * Removes the data set from the scatter3d. EX:
		 * removeDataSet(0)
		 *
		 * @param set -
		 *            Data set to be removed from the scatter3d
		 */
		removeDataSet: function(key) {
			if(key != null) {
				for (var curve in this.datasets[key].curves){
					this.scene.remove(this.datasets[key].curves[curve]);
//					TODO: Something like this needs to be done in order to make a proper memory management				
//					this.datasets[key].curves[curve].deallocate();
//					this.renderer.deallocateObject(this.datasets[key].curves[curve]);
				}
				this.datasets.splice(key, 1);
			}

			if(this.datasets.length == 0) {
				this.resetScatter3d();
			}
			else{
				this.render3DPlot();
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
			
			dataset = {curves: [], data: [], lineBasicMaterial: new THREE.LineBasicMaterial( { color: this.options.colours[this.datasets.length] } )};
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
			
			line = this.paintThreeLine(dataset.data[0].values, dataset.data[1].values, dataset.data[2].values, dataset.lineBasicMaterial);

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
			this.datasets = [];
			this.options = this.defaultScatter3dOptions;
			this.paintLegend();
			this.renderer.clear();
			this.scene = new THREE.Scene();
			this.helpers();
			this.render3DPlot();
		},

		/**
		 * Retrieve the data sets for the scatter3d
		 * @returns {Array}
		 */
		getDataSets: function() {
			return this.datasets;
		},

		/**
		 * Sets labels and the legend
		 * @name setAxisLabel(labelX, labelY, labelZ, datasetsIndex)
		 * @param labelX, labelY, labelZ - labels for each axis
		 * @param datasetsIndex - 0 by default
		 *
		 */
		setAxisLabel: function(labelX, labelY, labelZ, datasetsIndex) {
			if (typeof(datasetsIndex) === "undefined"){
				datasetsIndex = 0;
			}
			
			this.datasets[datasetsIndex].data[0].label = labelX;
			this.datasets[datasetsIndex].data[1].label = labelY;
			this.datasets[datasetsIndex].data[2].label = labelZ;
			
			this.paintLegend();
		},

		render3DPlot:function () {
			this.renderer.render(this.scene, this.camera);
		},
	});
});
