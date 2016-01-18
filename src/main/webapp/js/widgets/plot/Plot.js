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
        datasets: [],
        limit: 400,
        options: null,
        xaxisLabel: null,
        yaxisLabel: null,
        labelsUpdated: false,
        labelsMap: {},
        yMix: 0,
        yMax: 0,

        /**
         * Default options for plot widget, used if none specified when plot
         * is created
         */
        defaultPlotOptions: {
//				series: {
//					shadowSize: 0,
//					downsample: {
//					    threshold: 1000 
//					  }
//				},
            yaxis: {
                max: 1,
                min: -.1
            },
            xaxis: {
                min: 0,
                max: 400,
                show: false,
                tickLength: 0,
                ticks: [],
                font: {
                    size: 11
                },
                labelWidth: 30,
                axisLabelPadding: 5,
                color: "#FFFFFF",
                alignTicksWithAxis: true,
            },
            grid: {
                margin: {
                    left: 15,
                    bottom: 15
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
            this.id = options.id;
            this.name = options.name;
            this.visible = options.visible;
            this.datasets = [];
            this.options = jQuery.extend({}, this.defaultPlotOptions);
            this.render();
            this.dialog.append("<div id='" + this.id + "'></div>");
            $("#" + this.id).addClass("plot");

            //fix conflict between jquery and bootstrap tooltips
            $.widget.bridge('uitooltip', $.ui.tooltip);

            //show tooltip for legends
            $(".legendLabel").tooltip();
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
        plotData: function (state, options) {

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
                var split = label.split(".");
                var shortLabel = split[0] + "." + split[1] + "....." + split[split.length - 1];
                labelsMap[label] = {label: shortLabel};
                return '<div class="legendLabel" id="' + label + '" title="' + label + '">' + shortLabel + '</div>';
            });

            if (state != null) {
                if (state instanceof Array) {
                    this.datasets.push({
                        data: state
                    });
                }

                else {
                    for (var key = 0; key < this.datasets.length; key++) {
                        if (state.getInstancePath() == this.datasets[key].label) {
                            return "Dataset " + state.getInstancePath() + " is " + "already being plotted.";
                        }
                    }

                    var timeSeriesData = this.getTimeSeriesData(state);

                    this.datasets.push({
                        label: state.getInstancePath(),
                        variable: state,
                        data: timeSeriesData
                    });
                }
            }

            var plotHolder = $("#" + this.id);
            if (this.plot == null) {
                this.plot = $.plot(plotHolder, this.datasets, this.options);
                plotHolder.resize();
            }
            else {
                this.plot = $.plot(plotHolder, this.datasets, this.options);
            }

            return "Line plot added to widget";
        },

        getTimeSeriesData: function (state) {
            var timeSeries = state.getTimeSeries();
            var timeSeriesData = [];
            var id = state.getInstancePath();
            var i = 0;

            if (timeSeries.length > 1) {
                if (this.options.playAll == true) {
                    for (var step=0; step<timeSeries.length;step++) {
                        var value = timeSeries[step];
                        timeSeriesData.push([i, value]);
                        i++;
                        if (value < this.yMin) {
                            this.yMin = value;
                        }
                        if (value > this.yMax) {
                            this.yMax = value;
                        }
                    }
                    this.options.yaxis.max = this.yMax;
                    this.options.yaxis.min = this.yMin;
                    this.limit = timeSeries.length;
                    this.options.xaxis.max = this.limit;
                    this.options.xaxis.show = true;
                    if (window.Project.getActiveExperiment().time != null || undefined) {
                        var timeSeries = window.time.getTimeSeries();
                        var divideLength = Math.ceil(timeSeries.length / 10);
                        var ticks = [];

                        ticks[0] = [0, timeSeries[0].toFixed(4)];

                        var index = divideLength;
                        var i = 1;
                        while (index < timeSeries.length) {
                            var newTick = [];
                            ticks[i] = [index, timeSeries[index].toFixed(4)];
                            index = Math.ceil(index + divideLength);
                            i++;
                        }
                        index = timeSeries.length - 1;
                        ticks[i] = [index, timeSeries[index].toFixed(4)];
                        this.options.xaxis.ticks = ticks;
                    }
                }
            }

            return timeSeriesData;
        },
        /**
         * Takes two time series and plots one against the other. To plot
         * array(s) , use it as plotData([[1,2],[2,3]]) To plot an object ,
         * use it as plotData(objectNameX,objectNameY)
         *
         * @command plotData(dataX,dataY, options)
         * @param {Object} dataX - series to plot on X axis, can be array or an object
         * @param {Object} dataY - series to plot on Y axis, can be array or an object
         * @param options - options for the plotting widget, if null uses default
         */
        plotXYData: function (dataX, dataY, options) {

            // If no options specify by user, use default options
            if (options != null) {
                this.options = options;
                if (this.options.xaxis.max > this.limit) {
                    this.limit = this.options.xaxis.max;
                }
            }

            this.datasets.push({
                label: dataX.name,
                data: dataX.data
            });

            if (dataY != undefined) {
                this.datasets.push({
                    label: dataY.name,
                    data: dataY.data
                });
            }

            var plotHolder = $("#" + this.id);
            if (this.plot == null) {
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
        },

        /**
         * Updates a data set, use for time series
         */
        updateDataSet: function (step) {
            var plotholder = $("#" + this.id);

            if (this.options.playAll) {
                for (var key in this.datasets) {
                    var timeSeriesData = this.getTimeSeriesData(this.datasets[key].variable);

                    this.datasets[key].data = timeSeriesData;
                }

                if (!this.labelsUpdated) {
                    var unit = this.datasets[key].variable.getUnit();
                    if (unit != null) {
                        var labelY = this.getUnitLabel(unit);
                        var labelX = this.getUnitLabel(window.Project.getActiveExperiment().time.getUnit());
                        this.setAxisLabel(labelY, labelX);
                        this.labelsUpdated = true;
                    }
                }

                this.plot = $.plot(plotholder, this.datasets, this.options);
            }
            else {
                // if not plotAll we are in step-by-step replay mode - check axis visibility and add margin
                if (this.options.xaxis.show === false) {
                    // if we are not showing xaxis (dynamic plots), add margin at the bottom
                    $("#" + this.id).addClass("plot-without-xaxis");
                }

                for (var key in this.datasets) {
                    var newValue = this.datasets[key].variable.getTimeSeries()[step].getValue();

                    if (!this.labelsUpdated) {
                        var unit = this.datasets[key].variable.getUnit();
                        if (unit != null) {
                            var labelY = this.getUnitLabel(unit);
                            var labelX = this.getUnitLabel(window.Project.getActiveExperiment().time.getUnit());
                            this.setAxisLabel(labelY, labelX);
                            this.labelsUpdated = true;
                        }
                    }

                    var oldata = this.datasets[key].data;
                    var reIndex = false;

                    if (oldata.length > this.limit) {
                        oldata.splice(0, 1);
                        reIndex = true;
                    }

                    oldata.push([oldata.length, newValue]);

                    if (reIndex) {
                        // re-index data
                        var indexedData = [];
                        for (var index = 0, len = oldata.length; index < len; index++) {
                            var value = oldata[index][1];
                            indexedData.push([index, value]);
                        }

                        this.datasets[key].data = indexedData;
                    }
                    else {
                        this.datasets[key].data = oldata;
                    }
                }
                if (this.plot != null) {
                    this.plot.setData(this.datasets);
                    this.plot.draw();
                }
            }
        },

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
                labelsMap[label] = {label: shortLabel};
                return '<div class="legendLabel" id="' + label + '" title="' + label + '">' + shortLabel + '</div>';
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
            this.plotXYData(data);
        },

        /**
         * Resets the plot widget, deletes all the data series but does not
         * destroy the widget window.
         *
         * @command resetPlot()
         */
        resetPlot: function () {
            if (this.plot != null) {
                this.datasets = [];
                this.options = jQuery.extend({}, this.defaultPlotOptions);
                var plotHolder = $("#" + this.id);
                this.plot = $.plot(plotHolder, this.datasets, this.options);
            }
        },

        /**
         *
         * Set the options for the plotting widget
         *
         * @command setOptions(options)
         * @param {Object} options - options to modify the plot widget
         */
        setOptions: function (options) {
            this.options = options;
            this.limit = this.options.xaxis.max;
            this.plot = $.plot($("#" + this.id), this.datasets, this.options);
            return this;
        },

        /**
         * Sets the legend for a variable
         *
         * @command setLegend(variable, legend)
         * @param {Object} variable - variable to change display label in legends
         * @param {String} legend - new legend name
         */
        setLegend: function (variable, legend) {
            //Check if it is a string or a geppetto object
            var plotId = variable;
            if ((typeof variable) != "string")    plotId = variable.getInstancePath();

            var labelsMap = this.labelsMap;
            this.initializeLegend(function (label, series) {
                var shortLabel;

                if (plotId != label) {
                    shortLabel = labelsMap[label].label;
                }
                else {
                    shortLabel = legend;
                    labelsMap[label].label = shortLabel;
                }
                return '<div class="legendLabel" id="' + label + '" title="' + label + '">' + shortLabel + '</div>';
            });

            this.plot = $.plot($("#" + this.id), this.datasets, this.options);
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
            this.options.legend = {labelFormatter: labelFormatterFunction};

            //fix conflict between jquery and bootstrap tooltips
            $.widget.bridge('uitooltip', $.ui.tooltip);

            //show tooltip for legends
            $(".legendLabel").tooltip();
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
            this.plot = $.plot($("#" + this.id), this.datasets, this.options);
        },

        /**
         * Takes a FunctionNode and plots the expression and set the attributes from the plot metadata information
         *
         * @command plotFunctionNode(functionNode)
         * @param {Node} functionNode - Function Node to be displayed
         */
        plotFunctionNode: function (functionNode) {
            //Check there is metada information to plot
            if (functionNode.plotMetadata != null) {

                //Read the information to plot
                var expression = functionNode.getExpression();
                var arguments = functionNode.getArguments();

                var finalValue = parseFloat(functionNode.plotMetadata["FinalValue"]);
                var initialValue = parseFloat(functionNode.plotMetadata["InitialValue"]);
                var stepValue = parseFloat(functionNode.plotMetadata["StepValue"]);

                //Create data series for plot
                //TODO: What are we going to do if we have two arguments?
                var values = [];
                for (var i = initialValue; i < finalValue; i = i + stepValue) {
                    values.push([i]);
                }

                var plotTitle = functionNode.plotMetadata["PlotTitle"];
                var XAxisLabel = functionNode.plotMetadata["XAxisLabel"];
                var YAxisLabel = functionNode.plotMetadata["YAxisLabel"];
                //Generate options from metadata information
                options = {
                    xaxis: {min: initialValue, max: finalValue, show: true, axisLabel: XAxisLabel},
                    yaxis: {axisLabel: YAxisLabel},
                    legendText: plotTitle
                };

                //Convert from single expresion to parametired expresion (2x -> f(x)=2x)
                var parameterizedExpression = "f(";
                for (var argumentIndex in arguments) {
                    parameterizedExpression += arguments[argumentIndex] + ",";
                }
                parameterizedExpression = parameterizedExpression.substring(0, parameterizedExpression.length - 1);
                parameterizedExpression += ") =" + expression;

                //Plot data function
                this.plotDataFunction(parameterizedExpression, values, options);

                //Set title to widget
                this.setName(plotTitle);
            }
        },

    });
});
