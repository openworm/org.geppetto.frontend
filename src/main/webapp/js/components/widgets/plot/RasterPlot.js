define(function (require) {
    return {
        // return appropriate slice of the datasets for Plotly.animate
        dataAtStep: function (plot, step) {
            var dataAtStep = [];
            for (var dataset of plot.totalDatasets) {
                var newDataset = Object.assign({}, dataset);
                newDataset.x = newDataset.x.filter(v => v<=window.time.getTimeSeries()[step]);
                if ($.isEmptyObject(newDataset.x))
                    newDataset.x = [null];
                dataAtStep.push(newDataset);
            }
            return dataAtStep;
        }
    }
});
