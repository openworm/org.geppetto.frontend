define(function (require) {

    var Plot = require('./Plot');
    var React = require('react');
    //var ReactPlotly = require('react-plotly.js');

    return class RasterPlot extends Plot {
        constructor(props) {
            super(props);
        }

        defaultLayout() {
            return {xaxis: {title: 'Time (s)'}};
        }

        dataAtStep(data) {
            return 1+1;
        }
    }
    
});
