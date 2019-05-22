var defaultTrace = {
    mode: "lines",
    line: {
	dash: 'solid',
	width: '2'
    },
    hoverinfo: 'all',
    type: 'scatter'
}

var defaultFont = 'Helvetica Neue, Helevtica, sans-serif';
var defaultAxisLayout = {
    autorange: false,
    showgrid: false,
    showline: true,
    zeroline: false,
    mirror: true,
    ticklen: 0,
    tickcolor: 'rgb(255, 255, 255)',
    linecolor: 'rgb(255, 255, 255)',
    tickfont: { family: defaultFont, size: 11, color: 'rgb(255, 255, 255)' },
    titlefont: { family: defaultFont, size: 12, color: 'rgb(255, 255, 255)'},
    ticks: 'outside'
};
var defaultLayout = {
    autosize: true,
    showgrid: false,
    showlegend: true,
    xaxis: defaultAxisLayout,
    yaxis: defaultAxisLayout,
    margin: { l: 50, r: 0, b: 40, t: 10 },
    legend : {
	xanchor : "auto",
	yanchor : "auto",
	font: {
	    family: defaultFont,
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
    paper_bgcolor: 'rgba(50, 50, 53, 0)',
    plot_bgcolor: 'transparent',
    playAll : false,
    hovermode : 'none'
};

module.exports = {
    defaultLayout, defaultTrace
}
