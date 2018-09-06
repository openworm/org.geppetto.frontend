define(function (require) {

    var Plot = require('./Plot');
    var React = require('react');
    //var ReactPlotly = require('react-plotly.js');

    return class RasterPlot extends Plot {
        constructor(props) {
            super(props);
        }

        layout() {
            this.setState({layout: {xaxis: {title: 'Time (s)'}}});
        }

        componentWillMount() {
            this.layout();
        }

        dataAtStep(data) {
            return 1+1;
        }
    } 
});
