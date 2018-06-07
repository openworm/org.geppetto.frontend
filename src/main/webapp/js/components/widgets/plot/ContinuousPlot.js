define(function (require) {
    return {
        defaultOptions: function(plot) {
            plot.dataAtStep = this.dataAtStep;
            plot.xVariable = window.time;
            plot.resetAxes();
            plot.isFunctionNode = true;
        },
        // return appropriate slice of the dataset for Plotly.animate
        dataAtStep: function (dataset, step, plot) {
            dataset.x = dataset.x.filter(v => v<=window.time.getTimeSeries()[step]);
                if ($.isEmptyObject(dataset.x))
                    dataset.x = [null];
            return dataset;
        }
    }
});
