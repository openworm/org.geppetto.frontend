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
                    autotick: true,
                    ticks: 'outside',
                    //tick0: 0,
                    //dtick: 0.02,
                    ticklen: 8,
                    tickcolor: '#000'
		},
		yaxis: {
                    ticks: '',
                    showticklabels: false,
		}
	    };
	},

        genColorscale: function(min, max, n, f) {
            var colorscale = [];
            var step = (max-min)/n;
            var x = min;
            var rgb = [];
            
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
            this.setName("Colour scale");
            this.setSize(125, 300);
            this.setPosition(window.innerWidth - 325, window.innerHeight - 150);

            // number of sub-divisions of color scale
            this.nbars = 100;

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
        },

        // set instances for which we are giving the scale
        setVariables: function(instances) {
            if (Project.getActiveExperiment().status == "COMPLETED") {
                for (var i=0; i<instances.length; ++i) {
                    if (instances[i].getTimeSeries() == undefined) {
                        GEPPETTO.ExperimentsController.getExperimentState(Project.getId(), Project.getActiveExperiment().getId(), [instances[i]], null);
                    }
                }
            } else {
                GEPPETTO.FE.infoDialog(GEPPETTO.Resources.CANT_PLAY_EXPERIMENT, "Experiment " + experiment.name + " with id " + experiment.id + " isn't completed.");
            }

            this.min = Number.MAX_SAFE_INTEGER;
            this.max = Number.MIN_SAFE_INTEGER;

            for (var i=0; i<instances.length; ++i) {
                var localMin = Math.min.apply(null, instances[i].getTimeSeries());
                var localMax = Math.max.apply(null, instances[i].getTimeSeries());
                if (localMin < this.min) {
                    this.min = localMin;
                }
                if (localMax > this.max) {
                    this.max = localMax;
                }
            }
        },

        setScale: function(scalefn){
            var scalefn_255 = function(x){
                var r,g,b;
                [r,g,b] = scalefn(x).map(function(y){ return y*255; });
                return "rgb(" + r + "," + g + "," + b + ")";
            };
            this.colorscale = this.genColorscale(this.min, this.max, this.nbars, scalefn_255);
        },

        draw: function() {
            if (this.plotDiv.data == undefined) {
                
                var xdata = [];
                for (var i=0; i<this.nbars; ++i){
                    xdata.push(this.min+(i*(this.max-this.min)/this.nbars));
                }

                this.data = [
                    {
                        x: xdata,
                        z: [[...Array(this.nbars).keys()]],
                        colorscale: this.colorscale,
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

        setTitle: function(title) {
            this.layout["xaxis"].title = title;
            this.resize();
        },

        resize: function(resizeHeight){
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
	}
    });
});
