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
 * @module Widgets/Plot
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');
    var math = require('mathjs');

    return Widget.View.extend({
        plot: null,
        functionNode: false,
        datasets: [],
        limit: 400,
        options: null,
        xaxisLabel: null,
        yaxisLabel: null,
        labelsUpdated: false,
        labelsMap: {},
        yMix: 0,
        yMax: 0,
        updateLegendTimeout: null,
        latestPosition: null,
        initialized: null,
        inhomogeneousUnits: false,

        /**
         * Default options for plot widget, used if none specified when plot
         * is created
         */
        defaultPlotOptions: {
            yaxis: {
                max: -9999999,
                min: 9999999,
            },
            xaxis: {
                max: -9999999,
                min: 9999999,
                show: true,
                font: {
                    size: 10
                },
                labelWidth: 30,
                axisLabelPadding: 5,
                color: "#FFFFFF"
            },
            series: {
                lines: {
                    show: true
                }
            },
            legend: {
                backgroundOpacity: 0
            },
            crosshair: {
                mode: "x"
            },
            grid: {
                hoverable: true,
                autoHighlight: false,
                margin: {
                    left: 10,
                    bottom: 10
                }
            },
            playAll: false
        },

        /**
         * Initializes the plot given a set of options
         *
         * @param {Object} options - Object with options for the plot widget
         */
        initialize: function (options) {
        	Widget.View.prototype.initialize.call(this, options);
            this.datasets = [];
            this.options = jQuery.extend(true, {}, this.defaultPlotOptions);
            this.render();
            this.dialog.append("<div id='" + this.id + "'></div>");
            $("#" + this.id).addClass("plot");

            //fix conflict between jquery and bootstrap tooltips
            $.widget.bridge('uitooltip', $.ui.tooltip);

            $("#" + this.id).bind("plothover", {plot: this}, function (event, pos, item) {
                event.data.plot.latestPosition = pos;
                //Enable to change cursor on hover, couldnt find anything that felt better than the default pointer
                //$("#" + event.data.plot.id).css("cursor", "ew-resize");
                if (!event.data.plot.updateLegendTimeout) {
                    event.data.plot.updateLegendTimeout = setTimeout(function () {
                        event.data.plot.updateLegend();
                    }, 50);
                }
            });

            $("#" + this.id).bind("mouseout", {plot: this}, function (event) {
                //$("#" + event.data.plot.id).css("cursor", "default");
                event.data.plot.latestPosition = null;
            });
        },


        updateLegend: function () {

            this.updateLegendTimeout = null;

            var pos = this.latestPosition;
            var dataSet = this.plot.getData();
            if (pos) {


                var axes = this.plot.getAxes();
                if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                    pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                    return;
                }

                var i, j;
                for (i = 0; i < dataSet.length; ++i) {

                    var series = dataSet[i];

                    // Find the nearest points, x-wise

                    for (j = 0; j < series.data.length; ++j) {
                        if (series.data[j][0] > pos.x) {
                            break;
                        }
                    }

                    // Now Interpolate

                    var y,
                        p1 = series.data[j - 1],
                        p2 = series.data[j];

                    if (p1 == null) {
                        y = p2[1];
                    } else if (p2 == null) {
                        y = p1[1];
                    } else {
                        y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
                    }
                    var shortLabel = $("#" + this.id + " div.legendLabel[id='" + dataSet[i].label + "']").attr("shortLabel");
                    $("#" + this.id + " div.legendLabel[id='" + dataSet[i].label + "']").text(shortLabel + " = " + y.toFixed(3) + " @(" + pos.x.toFixed(3) + ")");
                }
            }
            else {
                for (i = 0; i < dataSet.length; ++i) {
                    var shortLabel = $("#" + this.id + " div.legendLabel[id='" + dataSet[i].label + "']").attr("shortLabel");
                    $("#" + this.id + " div.legendLabel[id='" + dataSet[i].label + "']").text(shortLabel);
                }
            }
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
            this.controller.addToHistory("Plot "+data.getInstancePath(),"plotData",[data]);

            if (!$.isArray(data)) {
                data = [data];
            }

            // If no options specify by user, use default options
            if (options != null) {
                for (var e in options) {
                    if (options[e] != null || options[e] != undefined) {
                        if (this.options.hasOwnProperty(e)) {
                            this.options[e] = options[e];
                        }
                    }
                }
            }


            var labelsMap = this.labelsMap;
            this.initializeLegend(function (label, series) {
                var shortLabel = label;
                if (labelsMap[label] != undefined && labelsMap[label] != label) {
                    //a legend was set
                    shortLabel = labelsMap[label];
                }
                else {

                    var split = label.split(".");

                    if (split.length > 5) {
                        shortLabel = split[0] + "." + split[1] + "..." + split[split.length - 3] + "." + split[split.length - 2] + "." + split[split.length - 1];
                    }
                }
                return '<div class="legendLabel" id="' + label + '" title="' + label + '" shortLabel="' + shortLabel + '">' + shortLabel + '</div>';
            });

            var isPlotable = true;
            for (var i = 0; i < data.length; i++) {
                var instance = data[i];
                if (instance != null) {

                    for (var key = 0; key < this.datasets.length; key++) {
                        if (instance.getInstancePath() == this.datasets[key].label) {
                            continue;
                        }
                    }

                    var timeSeriesData;
                    if (instance.getTimeSeries() != null && instance.getTimeSeries() != undefined) {
                        timeSeriesData = this.getTimeSeriesData(instance, window.time);
                    }
                    else {
                        isPlotable = false;
                    }
                    this.datasets.push({
                        label: instance.getInstancePath(),
                        variable: instance,
                        data: timeSeriesData
                    });
                }
            }

            if (this.datasets.length > 0) {

                // check for inhomogeneousUnits and set flag
                var refUnit = undefined;
                for (var i = 0; i < this.datasets.length; i++) {
                    if (i == 0) {
                        refUnit = this.datasets[i].variable.getUnit();
                    } else if (refUnit != this.datasets[i].variable.getUnit()) {
                        this.inhomogeneousUnits = true;
                        this.labelsUpdated = false;
                        break;
                    }
                }

                this.updateAxis(this.datasets.length - 1);
            }

            if (isPlotable) {
                var plotHolder = $("#" + this.id);
                this.plot = $.plot(plotHolder, this.datasets, this.options);
            }

            return this;
        },


        getTimeSeriesData: function (instanceY, instanceX) {
            var yTimeSeries = instanceY.getTimeSeries();
            var xTimeSeries = instanceX.getTimeSeries();
            var timeSeriesData = [];

            if (yTimeSeries && yTimeSeries.length > 1) {
                for (var step = 0; step < yTimeSeries.length; step++) {
                    timeSeriesData.push([xTimeSeries[step], yTimeSeries[step]]);
                }
            }

            var localxmin = this.arrayMin(xTimeSeries);
            var localymin = this.arrayMin(yTimeSeries);
            localymin = localymin - Math.abs(localymin * 0.1);
            var localxmax = this.arrayMax(xTimeSeries);
            var localymax = this.arrayMax(yTimeSeries);
            localymax = localymax + Math.abs(localymax * 0.1);

            this.options.xaxis.min = Math.min(this.options.xaxis.min, localxmin);
            this.options.yaxis.min = Math.min(this.options.yaxis.min, localymin);
            this.options.xaxis.max = Math.max(this.options.xaxis.max, localxmax);
            this.options.yaxis.max = Math.max(this.options.yaxis.max, localymax);

            return timeSeriesData;
        },

        arrayMin: function (arr) {
            var len = arr.length, min = Infinity;
            while (len--) {
                if (arr[len] < min) {
                    min = arr[len];
                }
            }
            return min;
        },

        arrayMax: function (arr) {
            var len = arr.length, max = -Infinity;
            while (len--) {
                if (arr[len] > max) {
                    max = arr[len];
                }
            }
            return max;
        },

        plotXYData: function (dataY, dataX, options) {
            this.controller.addToHistory("Plot "+dataY.getId()+"/"+dataX.getId(),"plotXYData",[dataY,dataX,options]);

            // If no options specify by user, use default options
            if (options != null) {
                this.options = options;
                if (this.options.xaxis.max > this.limit) {
                    this.limit = this.options.xaxis.max;
                }
            }

            var timeSeriesData = this.getTimeSeriesData(dataY, dataX);

            this.datasets.push({
                label: dataY.getInstancePath(),
                variable: dataY,
                data: timeSeriesData
            });


            if (this.datasets.length > 0) {

                // check for inhomogeneousUnits and set flag
                var refUnit = undefined;
                for (var i = 0; i < this.datasets.length; i++) {
                    if (i == 0) {
                        refUnit = this.datasets[i].variable.getUnit();
                    } else if (refUnit != this.datasets[i].variable.getUnit()) {
                        this.inhomogeneousUnits = true;
                        this.labelsUpdated = false;
                        break;
                    }
                }

                this.updateAxis(this.datasets.length - 1);
            }

            var plotHolder = $("#" + this.id);

            this.plot = $.plot(plotHolder, this.datasets, this.options);


            return this;
        }
        ,
        /**
         * Removes the data set from the plot. EX:
         *
         * @command removeDataSet(state)
         *
         * @param {Object} state -Data set to be removed from the plot
         */
        removeDataSet: function (state) {
            if (state != null) {
                for (var key = 0; key < this.datasets.length; key++) {
                    if (state.getInstancePath() == this.datasets[key].label) {
                        this.datasets.splice(key, 1);
                    }
                }

                var data = [];

                for (var i = 0; i < this.datasets.length; i++) {
                    data.push(this.datasets[i]);
                }

                this.plot.setData(data);
                this.plot.setupGrid();
                this.plot.draw();
            }

            if (this.datasets.length == 0) {
                this.resetPlot();
            }
            return this;
        }
        ,

        /**
         * Updates a data set, use for time series
         */
        updateDataSet: function (step, playAll) {
            var plotHolder = $("#" + this.id);
            if (!this.functionNode) {
                if (!this.initialized) {
                    this.clean(playAll);
                }
                for (var key in this.datasets) {

                    if (this.options.playAll) {
                        //we simply set the whole time series
                        this.datasets[key].data = this.getTimeSeriesData(this.datasets[key].variable, window.time);
                    }
                    else {
                        var newValue = this.datasets[key].variable.getTimeSeries()[step];

                        var oldData = this.datasets[key].data;
                        var reIndex = false;

                        if (oldData.length >= this.limit) {
                            //this happens when we reach the end of the width of the plot
                            //i.e. when we have already put all the points that it can contain
                            oldData.splice(0, 1);
                            reIndex = true;
                        }

                        oldData.push([oldData.length, newValue]);

                        if (reIndex) {
                            // re-index data
                            var indexedData = [];
                            for (var index = 0, len = oldData.length; index < len; index++) {
                                var value = oldData[index][1];
                                indexedData.push([index, value]);
                            }

                            this.datasets[key].data = indexedData;
                        }
                        else {
                            this.datasets[key].data = oldData;
                        }
                    }

                    this.updateAxis(key);
                }


                if (this.plot != null) {
                    if (this.plot.getOptions().yaxes[0].max == -9999999) {
                        //we had no data the first time plotdata was called so we create the plot
                        this.plot = $.plot(plotHolder, this.datasets, this.options);
                    }
                    else {
                        this.plot.setData(this.datasets);
                        this.plot.draw();
                    }
                }
                else {
                    this.plot = $.plot(plotHolder, this.datasets, this.options);
                }
            }
        }
        ,

        updateAxis: function (key) {
            if (!this.labelsUpdated) {
                var unit = this.datasets[key].variable.getUnit();
                if (unit != null) {
                    var labelY = this.inhomogeneousUnits ? "SI Units" : this.getUnitLabel(unit);
                    var labelX = this.getUnitLabel(window.Instances.time.getUnit());
                    this.setAxisLabel(labelY, labelX);
                    this.labelsUpdated = true;
                }
            }
        }
        ,

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
        }
        ,


        /**
         * Resets the plot widget, deletes all the data series but does not
         * destroy the widget window.
         *
         * @command resetPlot()
         */
        resetPlot: function () {
            if (this.plot != null) {
                this.datasets = [];
                this.options = jQuery.extend(true, {}, this.defaultPlotOptions);
                var plotHolder = $("#" + this.id);
                this.plot = $.plot(plotHolder, this.datasets, this.options);
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
            jQuery.extend(true, this.options, this.defaultPlotOptions, options);
            if (options.xaxis && options.xaxis.max) {
                this.limit = options.xaxis.max;
            }

            this.plot = $.plot($("#" + this.id), this.datasets, this.options);
            return this;
        },

        clean: function (playAll) {
            if (!this.functionNode) {
                this.options.playAll = playAll;
                this.cleanDataSets();
                if (!playAll) {
                    this.options.xaxis.show = false;
                    this.options.xaxis.max = this.limit;
                    this.options.crosshair = {};
                    if (this.options.grid) {
                        this.options.grid.hoverable = false;
                        this.options.grid.autoHighlight = true;
                    }
                    $("#" + this.id).addClass("plot-without-xaxis");
                }
                else {
                    this.options.xaxis.show = true;
                    this.options.xaxis.max = window.Instances.time.getTimeSeries()[window.Instances.time.getTimeSeries().length - 1];
                    if (this.options.crosshair) {
                        this.options.crosshair.mode = "x";
                    }
                    if (this.options.grid) {
                        this.options.grid.hoverable = true;
                        this.options.grid.autoHighlight = false;
                    }
                    $("#" + this.id).removeClass("plot-without-xaxis");
                    //enables updating the legend on mouse hover, still few bugs

                }
                this.plot = $.plot($("#" + this.id), this.datasets, this.options);
            }
            this.initialized = true;
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
                this.datasets[key].data = [[]];
            }
        },

        /**
         * Initialize legend
         */
        initializeLegend: function (labelFormatterFunction) {

            //set label legends to shorter label
            this.options.legend = {backgroundOpacity: 0, labelFormatter: labelFormatterFunction};

            //fix conflict between jquery and bootstrap tooltips
            $.widget.bridge('uitooltip', $.ui.tooltip);

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

            this.labelsMap[instancePath] = legend;
            return this;
        },

        /**
         * Sets a label next to the Y Axis
         *
         * @command setAxisLabel(labelY, labelX)
         * @param {String} labelY - Label to use for Y Axis
         * @param {String} labelX - Label to use for X Axis
         */
        setAxisLabel: function (labelY, labelX) {
            if (this.options.yaxis == undefined) {
                this.options["yaxis"] = {};
            }
            this.options.yaxis.axisLabel = labelY;
            if (this.options.xaxis == undefined) {
                this.options["xaxis"] = {};
            }
            this.options.xaxis.axisLabel = labelX;

            return this;
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
                var options = {
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

            var labelsMap = this.labelsMap;
            this.initializeLegend(function (label, series) {
                var shortLabel = label;
                //FIXME: Adhoc solution for org.neuroml.export
                var split = label.split(/-(.+)?/);
                if (split.length > 1) shortLabel = split[1];
                labelsMap[label] = shortLabel;
                return '<div class="legendLabel" id="' + label + '" title="' + label + '" shortLabel="' + shortLabel + '">' + shortLabel + '</div>';
            });

            //Parse func as a mathjs object
            var parser = math.parser();
            var mathFunc = parser.eval(func);
            var data = [];
            data.name = options.legendText;
            data.data = [];
            for (var data_xIndex in data_x) {
                var dataElementString = data_x[data_xIndex].valueOf();
                data_y = mathFunc(dataElementString);
                //TODO: Understand why sometimes it returns an array and not a value
                if (typeof value == 'object') {
                    data.data.push([data_x[data_xIndex][0], data_y[0]]);
                }
                else {
                    data.data.push([data_x[data_xIndex][0], data_y]);
                }
            }

            //Plot values
            if (options != null) {
                this.options = options;
                if (this.options.xaxis.max > this.limit) {
                    this.limit = this.options.xaxis.max;
                }
            }

            this.datasets.push({
                label: data.name,
                data: data.data
            });

            var plotHolder = $("#" + this.id);

            this.plot = $.plot(plotHolder, this.datasets, this.options);
            return this;
        }

    });
})
;
