/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2014 OpenWorm.
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
 *
 * @module Widgets/WIDGETNAME
 * @author yourname
 */
define(function (require) {

    var Widget = require('widgets/Widget');
    var $ = require('jquery');
    var Plotly = require('widgets/plot/vendor/plotly-latest.min');

    return Widget.View.extend({
        variable: null,
        options: null,

        defaultLayout : function(){	
	    return {
		autosize : true,
		width : '100%',
		height : '100%',
                margin: {
                    l: 0,
                    r: 0,
                    b: 40,
                    t: 0,
                    pad: 4
                },
		xaxis: {
                    title: "Electric potential (V)",
                    autotick: false,
                    ticks: 'outside',
                    tick0: 0,
                    dtick: 0.02,
                    ticklen: 8,
                    tickcolor: '#000'
		},
		yaxis: {
                    ticks: '',
                    showticklabels: false,
		}
	    };
	},


        genColorscale: function(min, max, n) {
            var colorscale = [];
            var step = (max-min)/n;
            var x = min;
            var rgb = [];

            // following lightUpEntity rainbow in GEPPETTO.SceneController
            var f = function(x) {
                x = (x+0.07)/0.1; // normalization
                if (x < 0) { x = 0; }
                if (x > 1) { x = 1; }
                var r,g,b;
                if (x < 0.25) {
                    [r,g,b] = [0, x*4*255, 255];
                } else if (x < 0.5) {
                    [r,g,b] = [0, 255, (1-(x-0.25)*4)*255];
                } else if (x < 0.75) {
                    [r,g,b] = [(x-0.5)*4*255, 255, 0];
                } else {
                    [r,g,b] = [255, (1-(x-0.75)*4)*255, 0];
                }
                return "rgb(" + r + "," + g + "," + b + ")";
            };
            
            for (var i=0; i<n; ++i) {
                colorscale.push([i/n, f(x)]);
                colorscale.push([(i+1)/n, f(x)]);
                x += step;
            }

            return colorscale;
        },
        
        /**
         * Initialises button bar
         *
         * @param {Object}
         *            options - Object with options for the widget
         */
        /**
         * Initialize the popup widget
         */
        initialize: function (options) {
            Widget.View.prototype.initialize.call(this, options);
            this.id = options.id;
            this.render();
            
            this.customHandlers = [];

            this.dialog.append("<div id='" + this.id + "'></div>");			
	    this.plotDiv = document.getElementById(this.id);
            this.setName("Voltage colouring scale");
            this.setSize(125, 300);
            this.setPosition(window.innerWidth - 325, window.innerHeight - 150);

            var that = this;

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

            this.layout = this.defaultLayout();


            this.potentials = window.getRecordedMembranePotentials();

            if (this.potentials.length != 0 && this.potentials[0].getTimeSeries() == undefined) {
                if (Project.getActiveExperiment().status == "COMPLETED") {
                    GEPPETTO.ExperimentsController.getExperimentState(Project.getId(), Project.getActiveExperiment().getId(), Project.getActiveExperiment().variables, null);
                } else {
                    GEPPETTO.FE.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + experiment.name + " with id " + experiment.id + " isn't completed.");
                }
                return;
            }

            if (this.potentials.length == 0) {
                this.dialog.append("<h2>no membrane potentials recorded</h2>");
            } else {
                this.draw();
            }
        },

        draw: function() {
            if (this.plotDiv.data == undefined) {
                // number of sub-divisions of color scale
                this.nbars = 100;

                this.min = Number.MAX_SAFE_INTEGER;
                this.max = Number.MIN_SAFE_INTEGER;

                this.potentials = window.getRecordedMembranePotentials();
                
                for (var i=0; i<this.potentials.length; ++i) {
                    var localMin = Math.min.apply(null, this.potentials[i].getTimeSeries());
                    var localMax = Math.max.apply(null, this.potentials[i].getTimeSeries());
                    if (localMin < this.min) {
                        this.min = localMin;
                    }
                    if (localMax > this.max) {
                        this.max = localMax;
                    }
                }


                var xdata = [];
                for (var i=0; i<100; ++i){
                    xdata.push(this.min+(i*(this.max-this.min)/100));
                }

                this.data = [
                    {
                        x: xdata,
                        z: [[...Array(this.nbars).keys()]],
                        colorscale: this.genColorscale(this.min, this.max, this.nbars),
                        type: 'heatmap',
                        showscale: false
                    }
                ];

                
                Plotly.newPlot(this.id, this.data, this.layout, {displayModeBar: false});
                this.resize();
            } else {
                this.resize();
            }

        },

        resize : function(resizeHeight){
	    //sets the width and height on the plotOptions which is given to plotly on relayout
	    //for some reason, height is different when first plotted, 10 pixels makes the change
	    if(resizeHeight){
		this.layout.height = this.plotElement.height() + 10;
		this.layout.width = this.plotElement.width() + 10;
	    }else{
		this.layout.height = this.plotElement.height();
		this.layout.width = this.plotElement.width();
	    }
	    //resizes plot right after creation, needed for d3 to resize 
	    //to parent's widht and height
	    Plotly.relayout(this.plotDiv, this.layout);
	},
        /**
         * Sets the content of this widget
         * This is a sample method of the widget's API, in this case the user would use the widget by passing an instance to a setData method
         * Customise/remove/add more depending on what widget you are creating
         *
         * @command setData(anyInstance)
         * @param {Object} anyInstance - An instance of any type
         */
        setData: function (anyInstance) {
            this.controller.addToHistory(anyInstance.getName(),"setData",[anyInstance]);

            return this;
        },

    });
});
