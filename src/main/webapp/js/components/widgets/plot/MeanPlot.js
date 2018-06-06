define(function (require) {
    return {
        defaultOptions: function(plot) {
            plot.dataAtStep = this.dataAtStep;
            plot.xaxisAutoRange = false;
            plot.xVariable = window.time;
            plot.setOptions({margin: {l: 50, r: 10}});
            plot.setOptions({showlegend: true});
            plot.setOptions({xaxis: {title: 'Time (s)'}});
            plot.setOptions({yaxis: {title: 'Firing rate  (Hz)', tickmode: 'auto', type: 'number'}});
            plot.limit = time[time.length-1];
            plot.resetAxes();
            plot.setName("Mean firing - " + Project.getActiveExperiment().getName());
            plot.isFunctionNode = true;
        },

        dataAtStep: function (plot, step) {
            
        }
    }
});
