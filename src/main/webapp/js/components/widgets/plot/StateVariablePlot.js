define(function (require) {
    return {
        // return appropriate slice of the datasets for Plotly.animate
        dataAtStep: function (dataset, step, plot) {
            /*Clears the data of the plot widget if the initialized flag
	     *has not be set to true, which means arrays are populated but not yet plot*/
	    /*if(!this.initialized){
	      this.clean(playAll);
	      this.initialized = true;
	      }*/
            var timeSeries = plot.getTimeSeriesData(
                plot.variables[plot.getLegendInstancePath(dataset.name)], plot.xVariable, step
            );
            dataset.x = timeSeries.x;
            dataset.y = timeSeries.y;
            return dataset;

	    /*var set, reIndex, newValue;
	    var oldDataX = [];
	    var oldDataY = [];
	    var timeSeries = [];
	    for (var key = 0; key < this.datasets.length; key++) {
		set = this.datasets[key];
		if (this.plotOptions.playAll) {
		    //we simply set the whole time series
		    timeSeries = this.getTimeSeriesData(this.variables[this.getLegendInstancePath(set.name)],this.xVariable, step);
		    this.datasets[key].x = timeSeries["x"];
		    this.datasets[key].y = timeSeries["y"];
		    this.datasets[key].hoverinfo = 'all';
		    this.plotOptions.xaxis.showticklabels = true;
		    this.plotOptions.xaxis.range = [];
		    this.reIndexUpdate = 0;
		    this.plotOptions.xaxis.autorange = true;
		    this.xaxisAutoRange = true;
		}
		else {
		    if(this.xVariable.id != "time"){
			//we simply set the whole time series
			timeSeries = this.getTimeSeriesData(this.variables[this.getLegendInstancePath(set.name)],this.xVariable, step);
			this.datasets[key].x = timeSeries["x"];
			this.datasets[key].y = timeSeries["y"];
			// x axis range depends only on Xvariable. It does not depend on limit or time.
			this.plotOptions.xaxis.range = [0, this.xVariable.length -1];
			this.plotOptions.xaxis.autorange = false;
			this.xaxisAutoRange = false;
		    }
		    else{
                        if (typeof set.name === 'undefined') {
                            newValue = [];
                            var variables = Object.values(this.variables);
                            for (var j=0; j<variables.length; ++j)
                                newValue.push(variables[j].getTimeSeries()[step])
                        }
                        else if (set.name)
                            newValue = this.variables[this.getLegendInstancePath(set.name)].getTimeSeries()[step];
                        else
                            newValue = this.variables[this.getLegendInstancePath(set.name)].getTimeSeries()[step];
			//newValue = this.dependent//this.variables[this.getLegendInstancePath(set.name)].getTimeSeries()[step];

			oldDataX = this.datasets[key].x;
                        oldDataDependent = this.datasets[key][this.dependent];

			reIndex = false;

			if (oldDataX.length >= this.limit) {
			    //this happens when we reach the end of the width of the plot
			    //i.e. when we have already put all the points that it can contain
			    oldDataX.splice(0, 1);
                            if ($.isArray(oldDataDependent[0]))
                                for (var i=0; i<oldDataDependent.length; ++i)
				    oldDataDependent[i].splice(0,1);
                            else
                                oldDataDependent.splice(0,1);
			    reIndex = true;
			}

			oldDataX.push(oldDataX.length);
                        if (typeof set.name === 'undefined') {
                            if ($.isEmptyObject(oldDataDependent))
                                for (var j=0; j<Object.keys(this.variables).length; ++j)
                                    oldDataDependent.push([]);
                            for (var j=0; j<newValue.length; ++j)
                                oldDataDependent[j].push(newValue[j]);
                        }
                        else
			    oldDataDependent.push(newValue);

			if (reIndex) {
			    // re-index data
			    var indexedDataX = [];
			    var indexedDataDependent = [];
			    for (var index = 0, len = oldDataX.length; index < len; index++) {
				var valueDependent = oldDataDependent[index];
                                if ($.isArray(valueDependent))
                                    //for (var i=0; i<oldDataDependent
				    indexedDataDependent.push(valueDependent);
                                else
                                    indexedDataDependent.push(valueDependent);
                                indexedDataX.push(index);
			    }

			    this.datasets[key].x = indexedDataX;
			    this.datasets[key][this.dependent] = indexedDataDependent;
			}
			else {
			    this.datasets[key].x = oldDataX;
			    this.datasets[key][this.dependent] = oldDataDependent;
			}
		    }
		}

		this.plotDiv.data[key].x = this.datasets[key].x;
		this.plotDiv.data[key].y = this.datasets[key].y;
	    }


	    if(this.reIndexUpdate%this.updateRedraw==0){

		if(this.plotOptions.xaxis.range[1]<this.limit){
		    this.plotOptions.xaxis.range = [0, this.limit];
		    this.plotOptions.xaxis.autorange = false;
		}

		//animate graph if it requires an update that is not play all
		if(this.plotOptions.playAll){
		    //redraws graph for play all mode
		    Plotly.relayout(this.plotDiv, this.plotOptions);
		}else{
		    this.plotOptions.xaxis.showticklabels = false;
		    if(this.plotOptions.yaxis.range==null || undefined){
			this.plotOptions.yaxis.range =[this.plotOptions.yaxis.min,this.plotOptions.yaxis.max];

		    }
		    Plotly.animate(this.plotDiv, {
			data: this.datasets
		    },this.plotOptions);
		}
	    }

	    if(this.firstStep==0){
		for(var key =0; key<this.datasets.length;key++){
                    if (typeof set.name !== 'undefined') {
			this.updateYAxisRange(window.time,this.variables[this.getLegendInstancePath(this.datasets[key].name)].getTimeSeries());
			this.updateAxis(this.datasets[key].name);
                    }
		}
		//redraws graph for play all mode
		this.resize();
	    }

	    this.firstStep++;
	    this.reIndexUpdate = this.reIndexUpdate + 1;*/

	}
    }
});
