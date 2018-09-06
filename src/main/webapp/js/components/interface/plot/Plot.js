define(function (require) {
    var React = require('react');
    var ReactPlotly = require('react-plotly.js');
    var AbstractComponent = require('../../AComponent');

    class Plot extends AbstractComponent {

        constructor(props) {
            super(props);
            this.state = { data: [
                {
                    x: [1, 2, 3],
                    y: [2, 6, 3],
                    type: 'scatter',
                    mode: 'lines+points',
                    marker: {color: 'red'},
                },
                {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
            ], layout: {
	        autosize : true,
	        width : '100%',
	        height : '100%',
	        showgrid : false,
	        showlegend : true,
	        xaxis: {
	            autorange :false,
	            showgrid: false,
	            showline: true,
	            zeroline : false,
	            mirror : true,
	            ticklen : 0,
	            tickcolor : 'rgb(255, 255, 255)',
	            linecolor: 'rgb(255, 255, 255)',
	            tickfont: {
		        family: 'Helvetica Neue, Helvetica, sans-serif',
		        size : 11,
		        color: 'rgb(255, 255, 255)'
	            },
	            titlefont : {
		        family: 'Helvetica Neue, Helevtica, sans-serif',
		        size : 12,
		        color: 'rgb(255, 255, 255)'
	            },
	            ticks: 'outside',
	            max: -9999999,
	            min: 9999999,
	            range : []
	        },
	        yaxis : {
	            autorange : false,
	            max: -9999999,
	            min: 9999999,
	            showgrid: false,
	            showline : true,
	            zeroline : false,
	            mirror : true,
	            ticklen : 0,
	            tickcolor : 'rgb(255, 255, 255)',
	            linecolor: 'rgb(255, 255, 255)',
	            tickfont: {
		        family: 'Helvetica Neue, Helevtica, sans-serif',
		        size : 11,
		        color: 'rgb(255, 255, 255)'
	            },
	            titlefont : {
		        family: 'Helvetica Neue, Helevtica, sans-serif',
		        size : 12,
		        color: 'rgb(255, 255, 255)'
	            },
	            ticks: 'outside',
	        },
	        margin: {
	            l: 50,
	            r: 0,
	            b: 40,
	            t: 10,
	        },
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
	        plot_bgcolor: 'transparent',
	        playAll : false,
	        hovermode : 'none'
            }, frames: [], config: {} };
        }

        componentDidMount() {
            /* $(this.getContainer()).parent().on("resizeEnd", function (event, ui) {
	       Plotly.Plots.resize()
	       }); */
        }

        addDataset(dataset) {
            this.setState({data: this.state.data.concat([dataset])});
        }

        removeDataset(dataset) {

        }

        render() {
            return <ReactPlotly
            data={this.state.data}
            layout={this.state.layout}
            onInitialized={(figure) => this.setState(figure)}
            onUpdate={(figure) => this.setState(figure)}
            style={{width: "100%", height: "100%"}}
            useResizeHandler={true}/>
        }
    };

    return Plot;
});
