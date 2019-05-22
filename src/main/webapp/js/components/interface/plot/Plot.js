import React, { Component } from 'react';
import ReactPlotly from 'react-plotly.js';
import WidgetCapability from '../../../../js/components/widgets/WidgetCapability';
import update from 'immutability-helper';

var $ = require('jquery');
var math = require('mathjs');
var Plotly = require('plotly.js/lib/core');
var AbstractComponent = require('../../../../js/components/AComponent');
var PlotConfig = require('./configuration/plotConfiguration');
var ExternalInstance = require('../../../geppettoModel/model/ExternalInstance');

export default class Plot extends AbstractComponent {
    constructor(props) {
        super(props);
        this.state = {
            layout: PlotConfig.defaultLayout,
            data: [],
            frames: [],
            variables: {}
        };
    }

    componentDidMount() {
        //FIXME: this jquery should be retired
        this.addButtonToTitleBar($("<div class='fa fa-home' title='Reset plot zoom'></div>").on('click', function(event) {
	    this.resetAxes();
	}.bind(this)));
        this.dialog.dialog({
            resize: function (event, ui) {
                this.resize(true);
            }.bind(this)
        });
    }

    getUnitLabel(unitSymbol) {
	if(unitSymbol!= null || unitSymbol != undefined){
	    unitSymbol = unitSymbol.replace(/_per_/gi, " / ");
	}else{
	    unitSymbol = "";
	}

	var unitLabel = unitSymbol;

	if (unitSymbol != undefined && unitSymbol != null && unitSymbol != "") {
	    var formattedUnitName = "";
	    if(GEPPETTO.UnitsController.hasUnit(unitSymbol)){
		formattedUnitName = GEPPETTO.UnitsController.getUnitLabel(unitSymbol);
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

	return unitLabel;
        }
    }

    resize() {
        // pass resize trigger from WidgetCapability to plotly component
        this.refs.plotly.resizeHandler();
    }

    updateAxisTitles(xInstance, yInstance) {
        var inhomogeneousUnits = new Set(Object.values(this.state.variables).map(v => v.getUnit())).size > 1;
        var labelY = inhomogeneousUnits ? "SI Units" : this.getUnitLabel(yInstance.getUnit());
        let newLayout = update(this.state.layout, {
            yaxis: {title: {text: {$set: labelY}}},
            xaxis: {title: {text: {$set: this.getUnitLabel(xInstance.getUnit())}}},
            margin: {l: {$set: (labelY == null || labelY == "") ? 30 : 50}}
        });
        this.setState({layout: newLayout});
    }

    updateAxisRanges(xData, yData) {
        // required to avoid stack overflow on big data
        let arrayMin = function(arr) {
            var len = arr.length, min = Infinity;
            while (len--) {
                if (Number(arr[len]) < min) {
                    min = Number(arr[len]);
                }
            }
            return min;
        };

        let arrayMax = function (arr) {
            var len = arr.length, max = -Infinity;
            while (len--) {
                if (Number(arr[len]) > max) {
                    max = Number(arr[len]);
                }
            }
            return max;
        };
        var xmin = arrayMin(xData), xmax = arrayMax(xData);
        var ymin = arrayMin(yData), ymax = arrayMax(yData);
        var newLayout = update(this.state.layout, {
            xaxis: {min: {$set: xmin}, max: {$set: xmax}},
            yaxis: {min: {$set: ymin}, max: {$set: ymax}},
        });
        this.setState({layout: newLayout});
    }

    getLegendName(projectId, experimentId, instance, sameProject) {
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

    plotInstance(instanceY, lineOptions, instanceX = window.time) {
	var legendName = instanceY.getInstancePath();
        if(instanceY instanceof ExternalInstance){
	    legendName = this.getLegendName(
	        instanceY.projectId,
	        instanceY.experimentId,
	        instanceY,
	        window.Project.getId() == instanceY.projectId
	    );
        }

	var trace = update(PlotConfig.defaultTrace, {
	    x: {$set: instanceX.getTimeSeries()},
	    y: {$set: instanceY.getTimeSeries()},
	    path: {$set: instanceY.getInstancePath()},
            name: {$set: legendName},
            line: {$merge: lineOptions ? lineOptions : {}}
	});
        this.addDatasetToPlot(trace);
        
        var newVariables = update(this.state.variables, {
            $merge: {[legendName]: instanceY}
        });
        this.setState({variables: newVariables});

        this.updateAxisRanges(instanceX.getTimeSeries(), instanceY.getTimeSeries());
        this.updateAxisTitles(instanceX, instanceY);
	
	/*
	// track change in state of the widget
	this.dirtyView = true;
        */

	return this;
    }

    resetAxes() {
        this.setState({layout: update(this.state.layout, {
            xaxis: {range: {$set: [this.state.layout.xaxis.min, this.state.layout.xaxis.max]}},
            yaxis: {range: {$set: [this.state.layout.yaxis.min, this.state.layout.yaxis.max]}},
        })});
    }

    addDatasetToPlot(dataset) {
        this.setState(state => {
            let data = state.data.concat(dataset);
            return {data};
        });
    }

    render() {
        return (
            <ReactPlotly
              ref="plotly"
              data={this.state.data}
              layout={this.state.layout}
              useResizeHandler={true}
              style={{width: "100%", height: "100%"}}
              onUpdate={(figure) => this.setState(figure)}
              />
        )
    }
}
