/**
 * Connectivity Widget
 *
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 * @author borismarin
 */

define(function (require) {

    var Widget = require('../Widget');
    var $ = require('jquery');
    var _ = require('underscore');
    var Instance = require('../../../geppettoModel/model/Instance');
    require('../../controls/mixins/bootstrap/modal.js')

    var Plotly = require('plotly.js/lib/core');

	Plotly.register([
		require('plotly.js/lib/heatmap'),
	]);

    require("./Connectivity.less");

    return Widget.View.extend({

        initialize: function (options) {
            Widget.View.prototype.initialize.call(this, options);
            this.plotDiv = document.getElementById(this.id);
            this.render();
            var that = this;
            this.addButtonToTitleBar($("<div class='fa fa-gear'></div>").on('click', function(event) {
                that.configViaGUI();
            }));

            /*this.options = options;

            Widget.View.prototype.initialize.call(this, options);
            this.setOptions(this.defaultConnectivityOptions);
            this.render();
            this.setSize(options.height, options.width);

            this.connectivityContainer = $("#" + this.id);

            var that=this;
           
            //resizes connectivity widget when maximizing/restoring using buttons on top
            $(".ui-dialog-titlebar-maximize, .ui-dialog-titlebar-restore").on("click",function(){
            	var height = $("#"+that.id).parent().height();
                var width = $("#"+that.id).parent().width();

                GEPPETTO.CommandController.execute(that.id + ".setSize(" + height + "," + width + ")", true);

                var left = $("#"+that.id).parent().offset().left;
                var top = $("#"+that.id).parent().offset().top;

                window[that.id].setPosition(left, top);
            });*/
        },

        plotAllContinuous: function() {
            GEPPETTO.ExperimentsController.getExperimentState(Project.id, Project.activeExperiment.id, null, function() {
                var data = {colorbar: {autotick: true, tickfont: {color: '#FFFFFF'}, xaxis: {title: 'Value'}},
                            showlegend: false, showscale: true, type: 'heatmap'};
                var variables = Project.getActiveExperiment().getWatchedVariables(true);
                data.x = window.time.getTimeSeries();
                data.z = variables.map(x => x.getTimeSeries());
                data.y = variables.map(x => x.getPath().split('.')[1]);
                GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then(plot => {
                    plot.plotGeneric(data);
                    plot.setOptions({margin: {l: 100, r: 10}});
                    plot.setOptions({yaxis: {min: -0.5, max: data.y.length-0.5}});
                    plot.resetAxes();
                });
            });
        },

        // Spiking
        // Plot1.datasets[0].z[1].map((x,i) => {if(i>0 && x>=0 && Plot1.datasets[0].z[1][i-1] < 0) { return 1; } else { return 0; }}).filter(x => x ==1)
        plotAllSpikes: function() {
            GEPPETTO.ExperimentsController.getExperimentState(Project.id, Project.activeExperiment.id, null, function() {
                GEPPETTO.WidgetFactory.addWidget(GEPPETTO.Widgets.PLOT).then(plot => {
                    var variables = Project.getActiveExperiment().getWatchedVariables(true);
                    for (var i=0; i<variables.length; ++i) {
                        var trace = {mode: 'markers', type: 'scatter', marker: {size: 5}};
                        var timeSeries = variables[i].getTimeSeries();
                        trace.x = timeSeries.map((x, i) => {
                            if(i>0 && x>=0 && timeSeries[i-1] < 0) { return 1; } else { return 0; }
                        }).map((x,i) => {if(x==1) { return i }})
                            .filter(x => x!==undefined)
                            .map(x => time.getTimeSeries()[x]);
                        // FIXME: getting pop needs to be more generic
                        trace.marker.color = eval(variables[i].getPath().split('.').splice(0,2).join('.')).getColor();
                        trace.y = trace.x.slice().fill(variables[i].getPath().split('.')[1]);
                        plot.plotGeneric(trace);
                        plot.resetAxes();
                    }
                    plot.setOptions({showlegend: false});
                    plot.yaxisAutoRange = true;
                    plot.xaxisAutoRange = false;
                    plot.setOptions({margin: {l: 100, r: 10}});
                    plot.limit = window.time.getTimeSeries()[window.time.getTimeSeries().length-1];
                    plot.resetAxes();
                });
            });
        },

        setSize: function (h, w) {
            Widget.View.prototype.setSize.call(this, h, w);
            if (this.svg != null) {
                //TODO: To subtract 20px is horrible and has to be replaced but I have no idea about how to calculate it
                var width = this.size.width - 20;
                var height = this.size.height - 20;
                if (this.options.layout == 'matrix') {
                    $('#' + this.id + '-ordering').remove();
                }
                this.createLayout();
            }
        },

        setData: function (root, options, nodeColormap) {
            /*this.setOptions(options);
            this.dataset = {};
            this.mapping = {};
            this.mappingSize = 0;
            this.dataset["root"] = root;
            this.setNodeColormap(nodeColormap);
            this.widgetMargin = 20;

            if(this.createDataFromConnections()){
            	this.createLayout();
            }

            // track change in state of the widget
            this.dirtyView = true;

            GEPPETTO.on(GEPPETTO.Events.Color_set, this.onColorChange(this));*/

            return this;
        },

            configViaGUI: function() {
                return null;
            },

        /**
         *
         * Set the options for the connectivity widget
         *
         * @command setOptions(options)
         * @param {Object} options - options to modify the plot widget
         */
        setOptions: function (options) {

            this.connectivityOptions = options;

            function strToFunc(body){
                return new Function('x', 'return ' + body + ';');
            }
            if (options != null) {
                if(typeof options.linkType === 'string')
                    options.linkType = strToFunc(options.linkType);
                if(typeof options.nodeType === 'string')
                    options.nodeType = strToFunc(options.nodeType);
                if(typeof options.linkWeight === 'string')
                    options.linkWeight = strToFunc(options.linkWeight);
                if(typeof options.colorMapFunction === 'string')
                    options.colorMapFunction = strToFunc(options.colorMapFunction);
                if(typeof options.library === 'string')
                    options.library = eval(options.library);
                $.extend(this.options, options);
            }
        },

        getView: function(){
            var baseView = Widget.View.prototype.getView.call(this);

            // add connectivity specific options - contains logic, iterate and serialize
            var serializedOptions = {};
            for(var item in this.connectivityOptions){
                var serializedItem = {};
                if (typeof this.connectivityOptions[item] === "function") {
                    serializedItem.value = this.connectivityOptions[item].toString();
                    serializedItem.type = 'function';
                } else if (item === "library") {
                    serializedItem.value = this.connectivityOptions[item].getPath();
                    serializedItem.type = 'library';
                } else {
                    serializedItem.value = this.connectivityOptions[item];
                    serializedItem.type = 'primitive';
                }
                serializedOptions[item] = serializedItem;
            }
            baseView.options = serializedOptions;

            // add data
            baseView.dataType = 'object';
            if(this.dataset["root"]!=undefined){
                baseView.data = this.dataset["root"].getPath();
            }

            if (typeof this.nodeColormap.domain === 'function')
                baseView.nodeColormap = {domain: this.nodeColormap.domain(),
                                         range: this.nodeColormap.range()};

            return baseView;
        },

        setView: function(view){
            // set base properties
            Widget.View.prototype.setView.call(this, view);

            if(view.dataType == 'object' && view.data != undefined && view.data != ''){
                var obj = eval(view.data);
                var deserializedOptions = {};
                for(var item in view.options){
                    if(view.options[item].type == "function" || view.options[item].type == "library"){
                        deserializedOptions[item] = eval('(' + view.options[item].value + ')');
                    } else {
                        deserializedOptions[item] = view.options[item].value;
                    }
                }

                var colorScale;
                if (typeof view.nodeColormap !== 'undefined')
                    colorScale = d3.scaleOrdinal(view.nodeColormap.range).domain(view.nodeColormap.domain);

                var that = this;
                // resolve connections and pass the line below as a callback
                Model.neuroml.resolveAllImportTypes(function(){
                    that.setData(obj, deserializedOptions, colorScale);
                });
            }

            // after setting view through setView, reset dirty flag
            this.dirtyView = false;
        }
    });
});
