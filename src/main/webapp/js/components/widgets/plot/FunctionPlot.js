define(function (require) {
    var Plot = require('./Plot');
    
    function FunctionPlot(options) {

    }
    FunctionPlot.prototype = Object.create(Plot.prototype);
    FunctionPlot.prototype.constructor = Plot;
    
    return FunctionPlot;
})
