
/**
 * Plot Widget class using plotly javascript library
 *
 * @module Widgets/Plot
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

	var Widget = require('../Widget');
	var $ = require('jquery');
	var math = require('mathjs');
    var Plotly = require('plotly.js/lib/core');
    var AStateVariableCapability = require('../../../geppettoModel/capabilities/AStateVariableCapability');

	Plotly.register([
		require('plotly.js/lib/heatmap'),
	]);

	
	var FileSaver = require('file-saver');
	var pako = require('pako');
	var JSZip = require("jszip");

	require("./Plot.less");

	var ExternalInstance = require('../../../geppettoModel/model/ExternalInstance');

	return Widget.View.extend({
		plotly: null,
		plotDiv : null,
		datasets: [],
		variables : [],
		limit: 400,
		options: null,
		labelsMap: {},
		labelsUpdated: false,
		initialized:null,
		inhomogeneousUnits: false,
		updateRange : false,
		plotOptions : null,
		reIndexUpdate : 0,
		updateRedraw : 3,
        isFunctionNode: false,
		functionNodeData: null,
		hasXYData: false,
		xyData: [],
	    hasStandardPlotData: false,
        xaxisAutoRange : false,
        yaxisAutoRange : false,
        plotElement : null,
        xVariable : null,
        firstStep : 0,
        updateLegendsState : false,
	    legendVisible : true,
            imageMenu: [{
                "label": "Save as PNG",
                "method": "downloadImage",
                "arguments": ["png"],
            },{
                "label": "Save as JPEG",
                "method": "downloadImage",
                "arguments": ["jpeg"],
            },{
                "label": "Save as SVG",
                "method": "downloadImage",
                "arguments": ["svg"]
            }],
            analysisMenu: [{
                "label": "Plot average of traces",
                "method": "plotAverage",
                "arguments": []
            },{
                "label": "Remove analysis",
                "method": "resetAnalysis",
                "arguments": []
            }],


		/**
		 * Default options for plotly widget, used if none specified when plot
		 * is created.
		 */
		defaultOptions : function(){
			return {
				autosize : true,
				width : '100%',
				height : '100%',
				showgrid : false,
				showlegend : true,
				xaxis: {                  // all "layout.xaxis" attributes: #layout-xaxis
					autorange :false,
					showgrid: false,
					showline: true,
					zeroline : false,
					mirror : true,
					ticklen : 0,
					tickcolor : 'rgb(255, 255, 255)',
					linecolor: 'rgb(255, 255, 255)',
					tickfont: {
						family: 'Helvetica Neue, Helvetica, sans-serif',
						size : 11,
						color: 'rgb(255, 255, 255)'
					},
					titlefont : {
						family: 'Helvetica Neue, Helevtica, sans-serif',
						size : 12,
						color: 'rgb(255, 255, 255)'
					},
					ticks: 'outside',
					max: -9999999,
					min: 9999999,
					range : []
				},
				yaxis : {
					autorange : false,
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
						family: 'Helvetica Neue, Helevtica, sans-serif',
						size : 11,
						color: 'rgb(255, 255, 255)'
					},
					titlefont : {
						family: 'Helvetica Neue, Helevtica, sans-serif',
						size : 12,
						color: 'rgb(255, 255, 255)'
					},
					ticks: 'outside',
				},
				margin: {
					l: 50,
					r: 0,
					b: 40,
					t: 10,
				},
				legend : {
					xanchor : "auto",
					yanchor : "auto",
					font: {
						family: 'Helvetica Neue, Helevtica, sans-serif',
						size: 12,
						color : '#fff'
					},
					x : 1,

					//bgcolor : 'rgba(66, 59, 59, 0.90)'
                    //bgcolor : 'rgba(0, 0, 0, 0)'
				},
				transition: {
				      duration: 0
				},
				frame: {
				      duration: 0,
				      redraw: false
				},
				//paper_bgcolor: 'rgba(66, 59, 59, 0.90)',
                //paper_bgcolor: 'rgba(0, 0, 0, 0)',
                //opacity:0.9,
				plot_bgcolor: 'transparent',
				playAll : false,
				hovermode : 'none'
			};
		},

		/**
		 * Initializes the plotly widget given a set of options
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
			this.xyData = [];
			this.plotOptions = this.defaultOptions();
			this.labelsMap = {};
		    this.legendVisible = true;
                    //Merge passed options into existing defaultOptions object
			$.extend( this.plotOptions, options);
			this.render();
			this.dialog.append("<div id='" + this.id + "'></div>");
			this.plotDiv = document.getElementById(this.id);
			this.plotOptions.xaxis.range =[0,this.limit];

		    var that = this;

                    this.addButtonToTitleBar($("<div class='gpt-analysis' title='Analysis'></div>").on('click', function(event) {
			that.showMenu(that.analysisMenu, "analysisMenu", event);
                        event.stopPropagation();
		    }));

			this.addButtonToTitleBar($("<div class='fa fa-download' title='Download plot data'></div>").on('click', function(event) {
				that.downloadPlotData();
			}));

			this.addButtonToTitleBar($("<div class='fa fa-picture-o' title='Save as image'></div>").on('click', function(event) {
			    that.showMenu(that.imageMenu, "imageMenu", event);
                event.stopPropagation();
			}));

			this.addButtonToTitleBar($("<div class='fa fa-list' title='Toggle legend'></div>").on('click', function(event) {
				that.showLegend(!that.legendVisible);
				event.stopPropagation();
			}));

			//adding functionality icon buttons on the left of the widget
			this.addButtonToTitleBar($("<div class='fa fa-home' title='Reset plot zoom'></div>").on('click', function(event) {
				that.resetAxes();
			}));

			this.plotElement = $("#"+this.id);

			//resize handlers
			this.plotElement.dialog({
				resize: function(event, ui) {
					that.resize(true);
				}
			});

			this.plotElement.bind('resizeEnd', function() {
				that.resize();
			});

		},

		getVariables : function(){
			return this.variables;
		},

            plotAverage: function() {
                var result = [];
                var arrays = this.datasets.map(data => data.y);
                for (let i in arrays[0]) {
                    let total = 0;
                    for (let arr of arrays) {
                        total += +arr[i]
                    }
                    result.push(total / arrays.length);
                }
                for (let dataset of this.datasets)
                    dataset.opacity = 0.4;
                var averageStateVar = GEPPETTO.ModelFactory.createInstance({name: "Average", id: "Average"});
                averageStateVar.extendApi(AStateVariableCapability);
                averageStateVar.setTimeSeries(result);
                if (typeof this.variables.Average == 'undefined') {
                    this.variables.Average = averageStateVar;
                    this.plotGeneric({x: this.datasets[0].x, y: result, mode: "lines", name: "Average", type: "scatter"});
                }
            },

            resetAnalysis: function() {
                for (let dataset of this.datasets)
                    dataset.opacity = 1;
                this.removeDataSet(Plot1.variables.Average);
                delete Plot1.variables.Average;
            },

		plotGeneric: function(dataset) {
		    if (typeof dataset !== 'undefined' && !$.isArray(dataset))
			this.datasets.push(dataset);
                    else if (typeof dataset !== 'undefined')
                        this.datasets = this.datasets.concat(dataset)

			if(this.plotly==null){
				this.plotOptions.xaxis.autorange = true;
				this.xaxisAutoRange = true;
				//Creates new plot using datasets and default options
				this.plotly = Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions,{displayModeBar: false, doubleClick : false});
				var that = this;
				this.plotDiv.on('plotly_doubleclick', function() {
					that.resize();
				});
				this.plotDiv.on('plotly_click', function() {
					that.resize();
				});
			}else{
				Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions,{doubleClick : false});
			}
			this.resize(false);
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
			var validVariable = eval(data);
			if(validVariable == null || undefined){
				return "Can't plot undefined variable";
			}

			if (!$.isArray(data)) {
				data = [data];
			}

			//don't allow duplicates
			for (var i = 0; i < this.datasets.length; i++) {
            	variable = this.variables[this.getLegendInstancePath(this.datasets[i].name)];
            	for (var j = 0; j < data.length; j++) {
                    if (variable.getInstancePath() == data[j].getInstancePath()) {
                        return;
                    }
                }
            }
			// set flags for function node and xy both to false
			this.isFunctionNode = false;
			this.hasStandardPlotData = true;

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
					if (instance.getTimeSeries() != null && instance.getTimeSeries() != undefined) {
						timeSeriesData = this.getTimeSeriesData(instance,window.time);
					}
					else{
						timeSeriesData["x"] = [];
						timeSeriesData["y"] = [0];
						for (var i = 0; i< this.limit; i++){
							timeSeriesData["x"].push([i]);
						}
					}

					var legendName = instance.getInstancePath();
					if(instance instanceof ExternalInstance){
						legendName = this.controller.getLegendName(
							instance.projectId,
							instance.experimentId,
							instance,
							window.Project.getId() == instance.projectId
						);
					}

					//We stored the variable objects in its own array, using the instance path
					//as index. Can't be put on this.datasets since plotly will reject it
					this.variables[legendName] = instance;

					/*
					 * Create object with x, y data, and graph information.
					 * Object is used to plot on plotly library
					 */
					var newLine = {
							x : timeSeriesData["x"],
							y : timeSeriesData["y"],
							mode : "lines",
							path: instance.getInstancePath(),
							name: legendName,
							line: {
								dash: 'solid',
								width: 2
							},
							hoverinfo : 'all',
							type : 'scatter'
					};

					this.datasets.push(newLine);
				}else{
					plotable = false;
				}
			}

			if (this.datasets.length > 0) {
                // check for inhomogeneousUnits and set flag
                var refUnit = undefined;
                var variable;
                for (var i = 0; i < this.datasets.length; i++) {
                	variable = this.variables[this.getLegendInstancePath(this.datasets[i].name)];
                    if (i == 0) {
                        refUnit = variable.getUnit();
                    } else if (refUnit != variable.getUnit()) {
                        this.inhomogeneousUnits = true;
                        this.labelsUpdated = false;
                        break;
                    }
                }
            }

			this.xVariable = window.time;
			if(plotable){
			    this.plotGeneric();
			}

			// track change in state of the widget
			this.dirtyView = true;

			return this;
		},

		resize : function(resizeHeight){
			//sets the width and height on the plotOptions which is given to plotly on relayout
			if(this.datasets.length>0){
				//for some reason, height is different when first plotted, 10 pixels makes the change
				if(resizeHeight){
					this.plotOptions.height = this.plotElement.height() + 10;
					this.plotOptions.width = this.plotElement.width()+ 10;
				}else{
					this.plotOptions.height = this.plotElement.height();
					this.plotOptions.width = this.plotElement.width();
				}
				//resizes plot right after creation, needed for d3 to resize to parent's width and height
				Plotly.relayout(this.plotDiv,this.plotOptions);
			}
		},

		showLegend: function(show){
			this.legendVisible = (show === true);
			Plotly.update(this.plotDiv, {showlegend: (show === true)},
				{
					margin: {
						l: this.plotOptions.margin.l,
						r: (show === true) ? this.plotOptions.margin.r - 12 : this.plotOptions.margin.r + 12,
						b: this.plotOptions.margin.b,
						t: this.plotOptions.margin.t,
					}
				});
		},

	    showMenu: function (menu, menuName, event) {
                var that = this;
                var menuView = new GEPPETTO.ContextMenuView();

                if (menu.length > 0) {
                    menuView.show({
                        top: event.pageY,
                        left: event.pageX + 1,
                        groups: that.getItems(menu, menuName),
                        data: that
                    });
                }

                if (event != null) {
                    event.preventDefault();
                }
                return false;
            },

		/**
		 * Downloads a screenshot of the graphing plots
		 */
		downloadImage: function (imageType) {
			var self = this;

			// play around with settings to make background temporarily white and margins wider
			this.plotOptions.paper_bgcolor = "rgb(255,255,255)";
			this.plotOptions.xaxis.linecolor = "rgb(0,0,0)";
			this.plotOptions.yaxis.linecolor = "rgb(0,0,0)";
			this.plotOptions.xaxis.tickfont.color = "rgb(0,0,0)";
			this.plotOptions.yaxis.tickfont.color = "rgb(0,0,0)";
			this.plotOptions.yaxis.titlefont.color = "rgb(0,0,0)";
			this.plotOptions.xaxis.titlefont.color = "rgb(0,0,0)";
			this.plotOptions.xaxis.tickfont.size = 18;
			this.plotOptions.yaxis.tickfont.size = 18;
			this.plotOptions.xaxis.titlefont.size = 18;
			this.plotOptions.yaxis.titlefont.size = 18;
			this.plotOptions.legend.font.size = 18;
			this.plotOptions.legend.font.family = 'Helvetica Neue, Helvetica, sans-serif';
			this.plotOptions.legend.font.color = "rgb(0,0,0)";
			this.plotOptions.legend.bgcolor = "rgb(255,255,255)";
			var oldMarginRight = this.plotOptions.margin.r;
			this.plotOptions.margin.r= 40;
			var oldMarginLeft = this.plotOptions.margin.l;
			this.plotOptions.margin.l= 70;
			Plotly.relayout(this.plotDiv,this.plotOptions);

			var height =  this.getSize().height;
			var width = this.getSize().width;

			//double the size if the width and height is very small
			if(height <500 || width <500){
				height =  height*2;
				width = width *2;
			}

			Plotly.downloadImage(
					this.plotDiv, {
						format: imageType,
						height: height,
						width: width
					});

			//reset background and margin to defaults
            var reset = function(){
                var defaultOptions = self.defaultOptions();
                self.plotOptions.paper_bgcolor = defaultOptions.paper_bgcolor;
                self.plotOptions.xaxis.linecolor =defaultOptions.xaxis.linecolor;
                self.plotOptions.yaxis.linecolor = defaultOptions.xaxis.linecolor;
                self.plotOptions.xaxis.tickfont.color =  defaultOptions.xaxis.tickfont.color;
                self.plotOptions.yaxis.tickfont.color =  defaultOptions.yaxis.tickfont.color;
                self.plotOptions.yaxis.titlefont.color =  defaultOptions.yaxis.titlefont.color;
                self.plotOptions.xaxis.titlefont.color = defaultOptions.xaxis.titlefont.color;
                self.plotOptions.xaxis.tickfont.size =  defaultOptions.xaxis.tickfont.size;
                self.plotOptions.yaxis.tickfont.size =  defaultOptions.yaxis.tickfont.size;
                self.plotOptions.xaxis.titlefont.size =  defaultOptions.xaxis.titlefont.size;
                self.plotOptions.yaxis.titlefont.size =  defaultOptions.yaxis.titlefont.size;
                self.plotOptions.legend.font.size =  defaultOptions.legend.font.size;
                self.plotOptions.legend.font.color =  defaultOptions.legend.font.color;
                self.plotOptions.legend.bgcolor =  defaultOptions.legend.bgcolor;
                self.plotOptions.margin.l =  oldMarginLeft;
                self.plotOptions.margin.r = oldMarginRight;
                Plotly.relayout(self.plotDiv,self.plotOptions);
            };
			setTimeout(reset, 10);
		},

		/**
		 * Downloads a zip with the plotting data
		 */
		downloadPlotData : function(){
			if(!this.isFunctionNode){
				var data = new Array();
				var xCopied = false;

				//stores path of file name containing data results for plot and names of variables
				var text = this.xVariable.getInstancePath();
				for (var key=0; key<this.datasets.length; key++) {
					var x = this.datasets[key].x;
					var y = this.datasets[key].y;
					if(!xCopied){
						data.push(x);
						xCopied = true;
					}
					data.push(y);
					text = text + " " + this.variables[this.getLegendInstancePath(this.datasets[key].name)].getInstancePath();
				}

				//convert string containing variables names into bytes
				var bytesNames = new Uint8Array(text.length);
				for (var i=0; i<text.length; i++) {
					bytesNames[i] = text.charCodeAt(i);
				}

				//store data array into table like formatted string
				var content = "";
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

				var that = this;
				zip.generateAsync({type:"blob"})
				.then(function (blob) {
					var d = new Date();
				    var n = d.getTime();
				    FileSaver.saveAs(blob, that.id+"-"+n.toString()+".zip");
				});
			}
		},

		/**
		 * Resets the axes of the graphs to defaults
		 */
		resetAxes : function(){
			if(!this.plotOptions.xaxis.autorange){
			    this.plotOptions.xaxis.range =[0,this.limit];
			}
			this.plotOptions.xaxis.autorange = this.xaxisAutoRange;
			this.plotOptions.yaxis.autorange = this.yaxisAutoRange;
			if(!this.plotOptions.yaxis.autorange){
				this.plotOptions.yaxis.range =[this.plotOptions.yaxis.min,this.plotOptions.yaxis.max];
			}
			Plotly.relayout(this.plotDiv, this.plotOptions);
		},

		/**
		 * Retrieve the x and y arrays for the time series
		 */
		getTimeSeriesData: function (instanceY, instanceX, step) {
			var timeSeriesX = instanceX.getTimeSeries(step);
			var timeSeriesY = instanceY.getTimeSeries(step);
			var timeSeriesData = {};
			var xData = [];
			var yData = [];

			if (timeSeriesY && timeSeriesY.length > 0 && timeSeriesX && timeSeriesX.length > 0) {
				for (var step = 0; step < timeSeriesX.length; step++) {
					xData.push(timeSeriesX[step]);
					yData.push(timeSeriesY[step]);
				}
			}

			timeSeriesData["x"] = xData;
			timeSeriesData["y"] = yData;

			this.updateYAxisRange(timeSeriesX,timeSeriesY);
			return timeSeriesData;
		},

            updateXAxisRange : function(timeSeriesX) {
                var localxmin = Math.min.apply(null, timeSeriesX);
	        var localxmax = Math.max.apply(null, timeSeriesX);

                if (this.plotOptions.xaxis.min == undefined ||
                    isNaN(this.plotOptions.xaxis.min)) {
                    this.plotOptions.xaxis.min = Number.MAX_SAFE_INTEGER;
                }
                if (this.plotOptions.xaxis.max == undefined ||
                    this.plotOptions.xaxis.max == window.Instances.time.getTimeSeries().slice(-1)[0] ||
                    isNaN(this.plotOptions.xaxis.max))

                    this.plotOptions.xaxis.max = Number.MIN_SAFE_INTEGER;

	        this.plotOptions.xaxis.min = Math.min(this.plotOptions.xaxis.min, localxmin);
	        this.plotOptions.xaxis.max = Math.max(this.plotOptions.xaxis.max, localxmax);

	        this.plotOptions.xaxis.range = [this.plotOptions.xaxis.min, this.plotOptions.xaxis.max];
            },


		updateYAxisRange : function(timeSeriesX, timeSeriesY){
			var localxmin = Math.min.apply(null, timeSeriesX);
			var localymin = Math.min.apply(null, timeSeriesY);
			localymin = localymin - Math.abs(localymin * 0.1);
			var localxmax = Math.max.apply(null, timeSeriesX);
			var localymax = Math.max.apply(null, timeSeriesY);
			localymax = localymax + Math.abs(localymax * 0.1);

			this.plotOptions.xaxis.min = Math.min(this.plotOptions.xaxis.min, localxmin);
			this.plotOptions.yaxis.min = Math.min(this.plotOptions.yaxis.min, localymin);
			this.plotOptions.xaxis.max = Math.max(this.limit, localxmax);
			this.plotOptions.yaxis.max = Math.max(this.plotOptions.yaxis.max, localymax);

			this.plotOptions.yaxis.range =[this.plotOptions.yaxis.min,this.plotOptions.yaxis.max];
		},

		/**
		 * Removes the data set from the plot.
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
					Plotly.relayout(this.plotDiv,this.plotOptions);
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
			if(!this.isFunctionNode){
				/*Clears the data of the plot widget if the initialized flag
				 *has not be set to true, which means arrays are populated but not yet plot*/
				if(!this.initialized){
					this.clean(playAll);
					this.initialized = true;
				}

				var set, reIndex, newValue;
				var oldDataX = [];
				var oldDataY = [];
				var timeSeries = [];
				for (var key = 0; key < this.datasets.length; key++) {
					set = this.datasets[key];
					if (this.plotOptions.playAll) {
						//we simply set the whole time series
						timeSeries = this.getTimeSeriesData(this.variables[this.getLegendInstancePath(set.name)],this.xVariable, step);
						this.datasets[key].x = timeSeries["x"];
						this.datasets[key].y = timeSeries["y"];
						this.datasets[key].hoverinfo = 'all';
						this.plotOptions.xaxis.showticklabels = true;
						this.plotOptions.xaxis.range = [];
						this.reIndexUpdate = 0;
						this.plotOptions.xaxis.autorange = true;
						this.xaxisAutoRange = true;
					}
					else {
						if(this.xVariable.id != "time"){
							//we simply set the whole time series
							timeSeries = this.getTimeSeriesData(this.variables[this.getLegendInstancePath(set.name)],this.xVariable, step);
							this.datasets[key].x = timeSeries["x"];
							this.datasets[key].y = timeSeries["y"];
							// x axis range depends only on Xvariable. It does not depend on limit or time.
							this.plotOptions.xaxis.range = [0, this.xVariable.length -1];
							this.plotOptions.xaxis.autorange = false;
							this.xaxisAutoRange = false;
						}
						else{
							newValue = this.variables[this.getLegendInstancePath(set.name)].getTimeSeries()[step];

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
					}

					this.plotDiv.data[key].x = this.datasets[key].x;
					this.plotDiv.data[key].y = this.datasets[key].y;
				}


				if(this.reIndexUpdate%this.updateRedraw==0){

					if(this.plotOptions.xaxis.range[1]<this.limit){
						this.plotOptions.xaxis.range = [0, this.limit];
						this.plotOptions.xaxis.autorange = false;
					}

					//animate graph if it requires an update that is not play all
					if(this.plotOptions.playAll){
						//redraws graph for play all mode
						Plotly.relayout(this.plotDiv, this.plotOptions);
					}else{
						this.plotOptions.xaxis.showticklabels = false;
						if(this.plotOptions.yaxis.range==null || undefined){
							this.plotOptions.yaxis.range =[this.plotOptions.yaxis.min,this.plotOptions.yaxis.max];

						}
						Plotly.animate(this.plotDiv, {
							data: this.datasets
						},this.plotOptions);
					}
				}

				if(this.firstStep==0){
					for(var key =0; key<this.datasets.length;key++){
						this.updateYAxisRange(window.time,this.variables[this.getLegendInstancePath(this.datasets[key].name)].getTimeSeries());
						this.updateAxis(this.datasets[key].name);
					}
					//redraws graph for play all mode
					this.resize();
				}

				this.firstStep++;
				this.reIndexUpdate = this.reIndexUpdate + 1;

			}
		},

        /*
         * Retrieves X and Y axis labels from the variables being plotted
         */
        updateAxis: function (key) {
            if (!this.labelsUpdated) {
                var unit = this.variables[this.getLegendInstancePath(key)].getUnit();
                if (unit != null) {
                    try {
                        var labelY = this.inhomogeneousUnits ? "SI Units" : this.getUnitLabel(unit);
                    }catch (e) {
                        labelY = ""
                    }
                    try {
                        var labelX = this.getUnitLabel(this.xVariable.getUnit());
                    }catch (e) {
                        labelX = ""
                    }
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
			if(unitSymbol!= null || unitSymbol != undefined){
				unitSymbol = unitSymbol.replace(/_per_/gi, " / ");
			}else{
				unitSymbol = "";
			}

			var unitLabel = unitSymbol;

			if (unitSymbol != undefined && unitSymbol != null && unitSymbol != "") {
				var formattedUnitName = "";
				if(GEPPETTO.UnitsController.hasUnit(unitSymbol)){
					formattedUnitName =GEPPETTO.UnitsController.getUnitLabel(unitSymbol);
				}else{
					var mathUnit = math.unit(1, unitSymbol);

					formattedUnitName = (mathUnit.units.length > 0) ? mathUnit.units[0].unit.base.key : "";
					(mathUnit.units.length > 1) ? formattedUnitName += " OVER " + mathUnit.units[1].unit.base.key : "";
				}

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
		resetPlot: function (softReset) {
			this.datasets = [];
			this.firstStep=0;
			if (softReset === undefined || softReset == false){
				this.plotOptions = this.defaultOptions();
			}
			if (this.plotly != null) {
				Plotly.newPlot(this.id, this.datasets, this.plotOptions,{displayModeBar: false,doubleClick : false});
				this.resize();
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
			this.plotOptions = $.extend(true,{}, this.plotOptions, options);
			Plotly.relayout(this.id, this.plotOptions);
			return this;
		},

		clean: function (playAll) {
			if(!this.isFunctionNode){
				this.plotOptions.playAll = playAll;
				this.plotOptions.margin.r = 10;
				this.cleanDataSets();
				this.plotOptions.xaxis.showticklabels = false;
				if (!playAll) {
					this.plotOptions.xaxis.max = this.limit;
				}
				else {
					this.plotOptions.xaxis.max = window.Instances.time.getTimeSeries()[window.Instances.time.getTimeSeries().length - 1];
				}
				this.plotly = Plotly.newPlot(this.id, this.datasets, this.plotOptions,{displayModeBar: false,doubleClick : false});
				this.resize();
				this.initialized=true;
				this.firstStep = 0;
				this.reIndexUpdate = 0;
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
			this.firstStep = 0;
		},

		/**
		 * Takes a FunctionNode and plots the expression and set the attributes from the plot metadata information
		 *
		 * @command plotFunctionNode(functionNode)
		 * @param {Node} functionNode - Function Node to be displayed
		 */
		plotFunctionNode: function (functionNode) {
			// set flags and keep track of state
            this.isFunctionNode = true;
			this.hasStandardPlotData = false;
			this.hasXYData = false;
			this.functionNodeData = functionNode.getPath();

			//Check there is metada information to plot
			if (functionNode.getInitialValues()[0].value.dynamics.functionPlot != null) {

				//Read the information to plot
				var expression = functionNode.getInitialValues()[0].value.dynamics.expression.expression;
				var args = functionNode.getInitialValues()[0].value.dynamics.arguments;
				var plotMetadata = functionNode.getInitialValues()[0].value.dynamics.functionPlot;

				var finalValue = parseFloat(plotMetadata["finalValue"]);
				var initialValue = parseFloat(plotMetadata["initialValue"]);
				var stepValue = parseFloat(plotMetadata["stepValue"]);

				//Create data series for plot
				//TODO: What are we going to do if we have two arguments?
				var values = [];
				for (var i = initialValue; i < finalValue; i = i + stepValue) {
				    values.push(i);
				}

				var plotTitle = plotMetadata["title"];
				var XAxisLabel = plotMetadata["xAxisLabel"];
				var YAxisLabel = plotMetadata["yAxisLabel"];

				//Generate options from metadata information
				var options = {
						xaxis: {min: initialValue, max: finalValue, show: true, axisLabel: XAxisLabel},
						yaxis: {axisLabel: YAxisLabel},
						legendText: plotTitle
				};

				//Convert from single expresion to parametired expresion (2x -> f(x)=2x)
				var parameterizedExpression = "f(";
				for (var argumentIndex in args) {
					parameterizedExpression += args[argumentIndex].argument + ",";
				}
				parameterizedExpression = parameterizedExpression.substring(0, parameterizedExpression.length - 1);
				parameterizedExpression += ") =" + expression;

				//Plot data function
				this.plotDataFunction(parameterizedExpression, values, options);

				//Set title to widget
				this.setName(plotTitle);
			}

			// track change in state of the widget
			this.dirtyView = true;

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
			for (var i in data_x) {
                            data.data["x"].push(data_x[i]);
                            var data_y = mathFunc(data_x[i]);
			    data.data["y"].push($.isArray(data_y) ? data_y[0] : data_y);
			}

			this.plotOptions.yaxis.title = options.yaxis.axisLabel;
			this.plotOptions.xaxis.title = options.xaxis.axisLabel;
			this.plotOptions.xaxis.showticklabels = true;
			this.plotOptions.xaxis.autorange = true;
			this.plotOptions.yaxis.autorange = true;
			this.xaxisAutoRange = true;
			this.yaxisAutoRange = true;
			this.labelsMap[options.legendText] = data.data.name;
			var newLine = {
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

			// track change in state of the widget
			this.dirtyView = true;

			return this;
		},

		getLegendInstancePath : function(legend){
			var originalInstancePath = legend;
			for(var key in this.labelsMap){
    			if(this.labelsMap[key] == legend){
    				originalInstancePath = key;
    			}
    		}

			return originalInstancePath;
		},

		plotXYData: function (dataY, dataX, options) {
			// set flags
			this.hasXYData = true;
			this.isFunctionNode = false;
			var xyDataEntry = { dataY : dataY.getPath(), dataX: dataX.getPath() };
			if(dataY instanceof ExternalInstance){
				xyDataEntry.projectId = dataY.projectId;
				xyDataEntry.experimentId = dataY.experimentId;
			}
			this.xyData.push(xyDataEntry);

			this.controller.addToHistory("Plot "+dataY.getInstancePath()+"/"+dataX.getInstancePath(),"plotXYData",[dataY,dataX,options],this.getId());

			var timeSeriesData = this.getTimeSeriesData(dataY, dataX);

			var legendName = dataY.getInstancePath();
			if(dataY instanceof ExternalInstance){
				legendName = this.controller.getLegendName(
					dataY.projectId,
					dataY.experimentId,
					dataY,
					window.Project.getId() == dataY.projectId
				);
			}
			var newLine = {
					x : timeSeriesData["x"],
					y : timeSeriesData["y"],
					mode : "lines",
					path: dataY.getInstancePath(),
					name: legendName,
					line: {
						dash: 'solid',
						width: 2
					},
					hoverinfo : 'all'
			};

			this.variables[legendName] = dataY;
			this.variables[this.getLegendInstancePath(dataX.getInstancePath())] = dataX;

			this.datasets.push(newLine);
			this.xVariable = dataX;
			if (this.datasets.length > 0) {
                // check for inhomogeneousUnits and set flag
                var refUnit = undefined;
                var legend;
                for (var i = 0; i < this.datasets.length; i++) {
                	legend = this.getLegendInstancePath(this.datasets[i].name);
                    if (i == 0) {
						if(this.variables[legend]!= undefined){
							refUnit = this.variables[legend].getUnit();
						}
                    } else if (this.variables[legend] == undefined || refUnit != this.variables[legend].getUnit()) {
                        this.inhomogeneousUnits = true;
                        this.labelsUpdated = false;
                        break;
                    }
                }
            }

			this.plotOptions.xaxis.autorange = true;
			this.xaxisAutoRange = true;
			this.plotly = Plotly.newPlot(this.plotDiv, this.datasets, this.plotOptions,{displayModeBar: false,doubleClick : false});
            this.updateAxis(legendName);
            this.resize();

			// track change in state of the widget
			this.dirtyView = true;

			return this;
		},

		getView: function(){
			var baseView = Widget.View.prototype.getView.call(this);

			// handle case of function node, data function and x,y data
			if(this.isFunctionNode){
				baseView.dataType = 'function';
				baseView.data = this.functionNodeData;
			} else if (this.controller.isColorbar(this)) {
                            baseView.dataType = 'colorbar';
                            baseView.options = this.plotOptions;
                            baseView.data = this.datasets[0];
                        } else {

				if (this.hasXYData){
					baseView.dataType = 'object';
					baseView.xyData = this.xyData.slice(0);
				}

				if (this.hasStandardPlotData) {
					// simple plot with non external instances
					baseView.dataType = 'object';
					baseView.data = [];
					for(var item in this.variables){
						// only add non external instances
						if(!(this.variables[item] instanceof ExternalInstance)){
							baseView.data.push(item)
						}
					}
				}
			}

			return baseView;
		},

		setView: function(view){
			// set base properties
			Widget.View.prototype.setView.call(this, view);

			if(view.dataType == 'function'){
				var functionNode = eval(view.data);
				this.plotFunctionNode(functionNode);
			} else if (view.dataType == 'colorbar') {
                            this.plotGeneric(view.data);
                            this.setOptions(view.options);
                        } else if (view.dataType == 'object') {
				// if any xy data loop through it
				if(view.xyData != undefined){
					for(var i=0; i<view.xyData.length; i++) {
						var yPath = view.xyData[i].dataY;
						var xPath = view.xyData[i].dataX;
						// project and experiment id could be any project and any experiment
						var projectId = view.xyData[i].projectId != undefined ? view.xyData[i].projectId : Project.getId();
						var experimentId = view.xyData[i].projectId != undefined ? view.xyData[i].experimentId : Project.getActiveExperiment().getId();
						this.controller.plotStateVariable(
							projectId,
							experimentId,
							yPath,
							this,
							xPath
						);
					}
				}

				// if any data, loop through it
				if(view.data != undefined){
					for (var index in view.data) {
						var path = view.data[index];
						this.controller.plotStateVariable(
							Project.getId(),
							Project.getActiveExperiment().getId(),
							path,
							this
						);
					}
				}
			}

			// after setting view through setView, reset dirty flag
			this.dirtyView = false;
		}

	});
});
