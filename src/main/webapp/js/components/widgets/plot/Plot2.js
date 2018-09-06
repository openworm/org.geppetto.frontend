define(function (require) {
    var React = require('react');
    var Plot = require('react-plotly.js');

    var PlotComponent = React.createClass({
        render: function () {
            return (
              <Plot
                data={[
                    {
                        x: [1, 2, 3],
                        y: [2, 6, 3],
                        type: 'scatter',
                        mode: 'lines+points',
                        marker: {color: 'red'},
                    },
                    {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
                ]}
                layout={{width: 320, height: 240, title: 'A Fancy Plot'}}
               />
            );
        }
    });

    return PlotComponent;
});
