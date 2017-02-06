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
 * Controller class for plotting widget. Use to make calls to widget from inside Geppetto.
 *
 * @author Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {

    var AWidgetController = require('widgets/AWidgetController');
    var Plot = require('widgets/plot/Plot');

    /**
     * @exports Widgets/Plotly/PlotlyController
     */
    return AWidgetController.View.extend({

        initialize: function () {
            this.widgets = [];
            var widgets = this.widgets;
        },

        /**
         * Creates plotting widget
         */
        addPlotWidget: function () {

            //look for a name and id for the new widget
            var id = this.getAvailableWidgetId("Plot", this.widgets);
            var name = id;

            //create plotting widget
            var p = window[name] = new Plot({id: id, name: name, visible: true});
            p.setController(this);

            //create help command for plot
            p.help = function () {
                return GEPPETTO.Console.getObjectCommands(id);
            };

            //store in local stack
            this.widgets.push(p);

            GEPPETTO.WidgetsListener.subscribe(this, id);

            //add commands to console autocomplete and help option
            GEPPETTO.Console.updateHelpCommand(p, id, this.getFileComments("geppetto/js/widgets/plot/Plot.js"));
            //update tags for autocompletion
            GEPPETTO.Console.updateTags(p.getId(), p);            
            return p;
        },

        /**
         * Receives updates from widget listener class to update plotting widget(s)
         *
         * @param {WIDGET_EVENT_TYPE} event - Event that tells widgets what to do
         */
        update: function (event, parameters) {
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
            else if (event == Events.Experiment_play) {
                for (var i = 0; i < this.widgets.length; i++) {
                    var plot = this.widgets[i];
                    plot.clean(parameters.playAll);
                }

            }

            //update plotting widgets
            else if (event == Events.Experiment_over) {
            }

            //update plotting widgets
            else if (event == Events.Experiment_update) {

                //loop through all existing widgets
                for (var i = 0; i < this.widgets.length; i++) {
                    var plot = this.widgets[i];
                    //we need the playAll parameter here because the plot might be coming up after the play
                    //event was triggered and in that case we need to catch up knowing what kind of play
                    //it's happening
                    plot.updateDataSet(parameters.step, parameters.playAll);
                }
            }
        },

        /**
         * Retrieve commands for a specific variable node
         *
         * @param {Node} node - Geppetto Node used for extracting commands
         * @returns {Array} Set of commands associated with this node
         */
        getCommands: function (node) {
            var groups = [];

            if (node.getWrappedObj().getType().getMetaType() == GEPPETTO.Resources.DYNAMICS_TYPE) {
                if (node.getWrappedObj().getInitialValues()[0].value.dynamics.functionPlot != undefined) {
                    var group1 = [{
                        label: "Plot Function",
                        action: ["var p = G.addWidget(Widgets.PLOT).plotFunctionNode(" + node.getPath() + ")", "p.setSize(200,450)"],
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
         * @param plotWidget - options, if not provided a new widget will be created
         */
        plotStateVariable: function(projectId, experimentId, path, plotWidget){
            if(window.Project.getId() === projectId && window.Project.getActiveExperiment().getId() === experimentId){
                // try to resolve path
                var inst = undefined;
                try {
                    inst = window.Instances.getInstance(path);
                } catch (e) {}

                // check if we already have data
                if (inst != undefined && inst.getTimeSeries() != undefined) {
                    // plot, we have data
                	if(plotWidget != undefined){
                		plotWidget.plotData(inst);
                		this.updateLegend(plotWidget,inst,projectId,experimentId);
                	} else {
                		var widget = G.addWidget(0);
                		widget.plotData(inst).setName(path);
                		this.updateLegend(widget,inst,projectId,experimentId);
                    }
                } else {
                    var cb = function(){
                    	var i = window.Instances.getInstance(path);
                    	if(plotWidget != undefined){
                    		plotWidget.plotData(i);
                    		this.updateLegend(plotWidget,i,projectId,experimentId);
                    	} else {
                    		G.addWidget(0).plotData(i).setName(path);
                    	}
                    };
                    // trigger get experiment data with projectId, experimentId and path, and callback to plot
                    GEPPETTO.ExperimentsController.getExperimentState(projectId, experimentId, [path], cb);
                }
            } else {
            	var self = this;
                // we are dealing with external instances, define re-usable callback for plotting external instances
                var plotExternalCallback = function(){
                    var i = GEPPETTO.ExperimentsController.getExternalInstance(projectId, experimentId, path);
                    var t = GEPPETTO.ExperimentsController.getExternalInstance(projectId, experimentId, 'time(StateVariable)');
                    
                    if(plotWidget != undefined){
                    	plotWidget.plotXYData(i,t);
                    	self.updateLegend(plotWidget,i,projectId,experimentId);
                    } else {
                    	G.addWidget(0).plotXYData(i,t).setName(path);
                    }
                };

                var externalInstance = GEPPETTO.ExperimentsController.getExternalInstance(projectId, experimentId, path);
                if(externalInstance != undefined){
                    // if not undefined, plot
                    plotExternalCallback();
                } else {
                    // if undefined trigger get experiment state
                    GEPPETTO.ExperimentsController.getExperimentState(projectId, experimentId, [path], plotExternalCallback);
                }
            }
        },
        
        //Updates the legend for a given instance, and updates it in widget
        updateLegend : function(widget,instance,projectId, experimentId){
            var legend=null;
            var experimentName, projectName;
            if(window.Project.getId() == projectId){
            	if(window.Project.getActiveExperiment()!= null || undefined){
            		//variable belongs to same project,but different experiment
            		if(window.Project.getActiveExperiment.getId()!= experimentId){
            			legend = this.getLegendName(projectId,experimentId,instance,true);
            		}
            	}
            }else{
            	//variablel belongs to different project and different experiment
            	var experimentPath = projectName + " - " + experimentName;
    			legend = this.getLegendName(projectId,experimentId,instance,false);
            }
            
            //set legend if it needs to be updated, only null if variable belong to active experiment
            if(legend!=null){
            	widget.setLegend(instance,legend);
            }
        },
        
        //Returns legend with appropriate project and experiment name in brackets
        getLegendName : function(projectId, experimentId, instance,sameProject){
        	var legend=null;
        	//the variable's experiment belong to same project but it's not the active one
        	if(sameProject){
        		for(var key in window.Project.getExperiments()){
        			if( window.Project.getExperiments()[key].id == experimentId){
        				//create legend with experiment name
        				legend = instance.getInstancePath()+" ["+window.Project.getExperiments()[key].name+"]";
        			}
        		}
        	}
        	//The variable's experiment and projects aren't the one that is active
        	else{
        		//get user projects
        		var projects = GEPPETTO.ProjectsController.getUserProjects();

        		for (var i = 0; i < projects.length; i++) {
        			//match variable project id
        			if ((projects[i].id == projectId)) {
        				//match variable experiment id
        				for(var key in projects[i].experiments){
                			if(projects[i].experiments[key].id == experimentId){
                				//create legend with project name and experiment
                				legend = instance.getInstancePath()+" ["+projects[i].name + " - " + projects[i].experiments[key].name+"]";
                			}
                		}
        			}
        		}
        	}
        	
        	return legend;
        }
    });
});
