/**
 * Controller class for plotting widget. Use to make calls to widget from inside Geppetto.
 *
 * @author Jesus R Martinez (jesus@metacell.us)
 */
define(function(require) {

    var AWidgetController = require('../../AWidgetController');
    

    /**
     * @exports Widgets/Plotly/PlotlyController
     */
    return AWidgetController.View.extend({

        initialize: function() {
            this.widgets = [];
            var widgets = this.widgets;
        },

        /**
         * Creates plotting widget
         */
        addWidget: function (isStateless) {
            if(isStateless == undefined){
                isStateless = false;
            }
            var that=this;
            
            
            return new Promise(resolve => {
            	require.ensure([],function(require){
                	var Plot = require('../Plot');
                    
                    //look for a name and id for the new widget
                    var id = that.getAvailableWidgetId("Plot", that.widgets);
                    var name = id;

                    //create plotting widget
                    var p = window[name] = new Plot({
                        id: id, name: name, visible: true,
                        widgetType: GEPPETTO.Widgets.PLOT,
                        stateless: isStateless
                    });
                    p.setController(that);
                    p.setSize(p.defaultSize().height, p.defaultSize().width);
                    
                    //create help command for plot
                    p.help = function() {
                        return GEPPETTO.CommandController.getObjectCommands(id);
                    };

                    //store in local stack
                    that.widgets.push(p);

                    GEPPETTO.WidgetsListener.subscribe(that, id);

                    //add commands to console autocomplete and help option
                    GEPPETTO.CommandController.updateHelpCommand(p, id, that.getFileComments("geppetto/js/components/widgets/plot/Plot.js"));
                    //update tags for autocompletion
                    GEPPETTO.CommandController.updateTags(p.getId(), p);

                    resolve(p);
                });
            
            
            	
            	
            });
            
        },

        isColorbar: function(plot) {
            return (plot.datasets[0] != undefined && plot.datasets[0].type == "heatmap");
        },

        /**
         * Receives updates from widget listener class to update plotting widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function(event, parameters) {
            //delete plot widget(s)
            if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE) {
                this.removeWidgets();
            }

            //reset plot's datasets
            else if (event == GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA) {
                for (var i = 0; i < this.widgets.length; i++) {
                    var plot = this.widgets[i];

                    plot.cleanDataSets();
                }
            }

            //update plotting widgets
            else if (event == GEPPETTO.Events.Experiment_play) {
                for (var i = 0; i < this.widgets.length; i++) {
                    var plot = this.widgets[i];
                    if (!this.isColorbar(plot) && plot.datasets.length > 0)
                    plot.clean(parameters.playAll);
                }

            }

            //update plotting widgets
            else if (event == GEPPETTO.Events.Experiment_over) {
            }

            //update plotting widgets
            else if (event == GEPPETTO.Events.Experiment_update) {

                //loop through all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var plot = this.widgets[i];
                    //we need the playAll parameter here because the plot might be coming up after the play
                    //event was triggered and in that case we need to catch up knowing what kind of play
                    //it's happening
                    if (!this.isColorbar(plot) && plot.datasets.length > 0)
                    plot.updateDataSet(parameters.step, parameters.playAll);
                }

            }
            else if (event == GEPPETTO.Events.Lit_entities_changed) {
                for (var i = 0; i < this.widgets.length; i++) {
                    var plot = this.widgets[i];
                    if (this.isColorbar(plot) &&
                        // prevent plots from being destroyed when views are loading
                        !GEPPETTO.Spinner.visible) {
                        plot.destroy();
                    }
                }
            }
        },

        /**
         * Retrieve commands for a specific variable node
         *
         * @param {Node} node - Geppetto Node used for extracting commands
         * @returns {Array} Set of commands associated with this node
         */
        getCommands: function(node) {
            var groups = [];

            if (node.getWrappedObj().getType().getMetaType() == GEPPETTO.Resources.DYNAMICS_TYPE) {
                if (node.getWrappedObj().getInitialValues()[0].value.dynamics.functionPlot != undefined) {
                    var group1 = [{
                        label: "Plot Function",
                        action: ["G.addWidget(Widgets.PLOT).then(w=>{w.plotFunctionNode(" + node.getPath() + "); w.setSize(200,450);});"],
                    }];

                    var availableWidgets = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets();
                    if (availableWidgets.length > 0) {
                        var group1Add = {
                            label: "Add to Plot Widget",
                            position: 0
                        };

                        var subgroups1Add = [];
                        for (var availableWidgetIndex in availableWidgets) {
                            var availableWidget = availableWidgets[availableWidgetIndex];
                            subgroups1Add = subgroups1Add.concat([{
                                label: "Add to " + availableWidget.name,
                                action: [availableWidget.id + ".plotFunctionNode(" + node.getPath() + ")"],
                                position: availableWidgetIndex
                            }]);
                        }
                        group1Add["groups"] = [subgroups1Add];

                        group1.push(group1Add);
                    }

                    groups.push(group1);

                }
            }

            return groups;
        },

        /**
         * Plot a state variable given project/experiment and path + optional plot widget
         *
         * @param projectId
         * @param experimentId
         * @param path
         * @param plotWidget - optional, if not provided a new widget will be created
         * @param xPath - optional, if plotting xy data a path for the x axis
         */
        plotStateVariable: async function(projectId, experimentId, path, plotWidget, xPath){
            var self = this;
            
            if(
                window.Project.getId() == projectId &&
                window.Project.getActiveExperiment() != undefined &&
                window.Project.getActiveExperiment().getId() == experimentId
            ){
                var inst = undefined;
                try {
                    inst = window.Instances.getInstance(path);
                } catch (e) {}

                // check if we already have data
                if (inst != undefined && inst.getTimeSeries() != undefined) {
                    // plot, we have data
                    if (plotWidget != undefined) {
                        plotWidget.plotData(inst);
                        plotWidget.updateAxis(inst.getInstancePath());
                    } else {
                        var widget = await G.addWidget(0);
                        widget.plotData(inst).setName(path);
                        widget.updateAxis(path);
                    }
                } else {
                    var cb = async function(){
                    	var i = window.Instances.getInstance(path);
                    	if(plotWidget != undefined){
                    		plotWidget.plotData(i);
                    		plotWidget.updateAxis(i.getInstancePath());
                    	} else {
                    		var plot = await G.addWidget(0);
                            plot.plotData(i).setName(path);
                            plot.updateAxis(path);
                    	}
                    };
                    // trigger get experiment data with projectId, experimentId and path, and callback to plot
                    GEPPETTO.ExperimentsController.getExperimentState(projectId, experimentId, [path], cb);
                }
            } else {
                // we are dealing with external instances, define re-usable callback for plotting external instances
                var plotExternalCallback = async function() {
                    var i = GEPPETTO.ExperimentsController.getExternalInstance(projectId, experimentId, path);
                    // if xPath is not specified, assume time
                    if(xPath == undefined){ xPath = 'time(StateVariable)'; }
                    var t = GEPPETTO.ExperimentsController.getExternalInstance(projectId, experimentId, xPath);
                    if (plotWidget != undefined) {
                        plotWidget.plotXYData(i, t);
                    } else {
                    	var plot = await G.addWidget(0);
                        plot.plotXYData(i, t).setName(path);
                    }
                };

                var externalInstance = GEPPETTO.ExperimentsController.getExternalInstance(projectId, experimentId, path);
                if (externalInstance != undefined) {
                    // if not undefined, plot
                    plotExternalCallback();
                } else {
                    // if undefined trigger get experiment state
                    GEPPETTO.ExperimentsController.getExperimentState(projectId, experimentId, [path], plotExternalCallback);
                }
            }
        },

        //Returns legend with appropriate project and experiment name in brackets
        getLegendName: function(projectId, experimentId, instance, sameProject) {
            var legend = null;
            //the variable's experiment belong to same project but it's not the active one
            if (sameProject) {
                for (var key in window.Project.getExperiments()) {
                    if (window.Project.getExperiments()[key].id == experimentId) {
                        //create legend with experiment name
                        legend = instance.getInstancePath() + " [" + window.Project.getExperiments()[key].name + "]";
                    }
                }
            }
            //The variable's experiment and projects aren't the one that is active
            else {
                //get user projects
                var projects = GEPPETTO.ProjectsController.getUserProjects();

                for (var i = 0; i < projects.length; i++) {
                    //match variable project id
                    if ((projects[i].id == projectId)) {
                        //match variable experiment id
                        for (var key in projects[i].experiments) {
                            if (projects[i].experiments[key].id == experimentId) {
                                //create legend with project name and experiment
                                legend = instance.getInstancePath() + " [" + projects[i].name + " - " + projects[i].experiments[key].name + "]";
                            }
                        }
                    }
                }
            }

            return legend;
        }
    });
});
