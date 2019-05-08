import React, { Component } from 'react';
import ReactPlotly from 'react-plotly.js';
import WidgetCapability from '../../../../js/components/widgets/WidgetCapability';
import update from 'immutability-helper';

var Plotly = require('plotly.js/lib/core');
var AbstractComponent = require('../../../../js/components/AComponent');

export default class Plot extends AbstractComponent {
    constructor(props) {
        super(props);
        this.state = { data: [], layout: {
	    autosize: true,
	    showgrid: false,
	    showlegend: true,
	    xaxis: { autorange: true, showgrid: false, showline: true, zeroline: false, mirror: true, ticklen: 0, tickcolor: 'rgb(255, 255, 255)', linecolor: 'rgb(255, 255, 255)', tickfont: { family: 'Helvetica Neue, Helvetica, sans-serif', size: 11, color: 'rgb(255, 255, 255)'}, titlefont: { family: 'Helvetica Neue, Helevtica, sans-serif', size: 12, color: 'rgb(255, 255, 255)'}, ticks: 'outside' },
	    yaxis: { autorange: true, showgrid: false, showline: true, zeroline: false, mirror: true, ticklen: 0, tickcolor: 'rgb(255, 255, 255)', linecolor: 'rgb(255, 255, 255)', tickfont: { family: 'Helvetica Neue, Helevtica, sans-serif', size : 11, color: 'rgb(255, 255, 255)'}, titlefont: { family: 'Helvetica Neue, Helevtica, sans-serif', size: 12, color: 'rgb(255, 255, 255)'}, ticks: 'outside'},
	    margin: { l: 50, r: 0, b: 40, t: 10 },
	    legend : {
	        xanchor : "auto",
	        yanchor : "auto",
	        font: {
		    family: 'Helvetica Neue, Helevtica, sans-serif',
		    size: 12,
		    color : '#fff'
	        },
	        x : 1,
	    },
	    transition: {
	        duration: 0
	    },
	    frame: {
	        duration: 0,
	        redraw: false
	    },
            paper_bgcolor: 'rgb(66, 59, 59, 0.9)',
	    plot_bgcolor: 'transparent',
	    playAll : false,
	    hovermode : 'none'
        }, frames: [], config: {}, variables: {}, revision: 0 };
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
	}

	return unitLabel;
    }

    updateAxis(key) {
        var unit = this.state.variables[key].getUnit();
        if (unit != null) {
            try {
                var labelY = this.inhomogeneousUnits ? "SI Units" : this.getUnitLabel(unit);
            } catch (e) {
                labelY = ""
            }
            try {
                var labelX = this.getUnitLabel(window.time.getUnit());
            }catch (e) {
                labelX = ""
            }

            let newLayout = update(this.state.layout, {
                yaxis: {title: {text: {$set: labelY}}},
                xaxis: {title: {text: {$set: labelX}}}
            });
            this.setState({layout: newLayout, revision: this.state.revision+1});

            /*if(labelY == null || labelY == ""){
                this.plotOptions.margin.l = 30;
            }*/
            //Plotly.relayout(this.plotDiv, this.plotOptions);
        }
    }

    resize(width, height) {
        Plotly.relayout($("#" + this.refs.plotWidget.props.id + "> .js-plotly-plot")[0], {width: width, height: height});
    }


    plotInstance(instance, lineOptions) {
        /*
          for (var i = 0; i < data.length; i++) {
          this.controller.addToHistory("Plot "+data[i].getInstancePath(),"plotData",[data[i]],this.getId());
          }
        */

	var legendName = instance.getInstancePath();
        /*if(instance instanceof ExternalInstance){
	    legendName = this.controller.getLegendName(
	        instance.projectId,
	        instance.experimentId,
	        instance,
	        window.Project.getId() == instance.projectId
	    );
        }*/

	var trace = {
	    x: window.time.getTimeSeries(), //timeSeriesData["x"],
	    y: instance.getTimeSeries(), //timeSeriesData["y"],
	    mode: "lines",
	    path: instance.getInstancePath(),
	    name: legendName,
	    line: $.extend({
		dash: 'solid',
		width: '2'
	    }, lineOptions),
	    hoverinfo: 'all',
	    type: 'scatter'
	};

        this.setState({variables: Object.assign(this.state.variables, {[legendName]: instance})});
        this.addDatasetToPlot(trace);

	/*if (this.datasets.length > 0) {
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
        }*/

	/*this.xVariable = window.time;
	if(plotable){
	    this.plotGeneric();
	}

	// track change in state of the widget
	this.dirtyView = true;*/

	return this;
    }

    addDatasetToPlot(dataset) {
        // FIXME: this can't be right… but nothing else changes the data
        this.state.data.push(dataset);
        /*this.setState(state => {
            //let data = state.data.concat(dataset);
            return {data: data, revision: state.revision+1};
        });*/
    }

    render() {
        return (
                <ReactPlotly
            revision={this.state.revision}
            data={this.state.data}
            useResizeHandler={true}
            style={{width: "100%", height: "100%"}}
            onUpdate={(figure) => this.setState(figure)}
            layout={this.state.layout}
                />
        )
    }
}
