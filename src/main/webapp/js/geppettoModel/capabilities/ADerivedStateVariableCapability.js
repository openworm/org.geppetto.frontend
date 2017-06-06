/**
 * Client class use to augment a model with state variable capabilities
 *
 * @module model/ADerivedStateVariableCapability
 * @author Adrian Quintana
 */

define(['jquery'], function (require) {
    return {
        capabilityId: 'DerivedStateVariableCapability',
        watched: false,
        timeSeries: null,
        inputs: null,

        /**
         * Get value of quantity
         *
         * @command Variable.getTimeSeries()
         * @returns {String} Value of quantity
         */
        getTimeSeries: function (step) {
            if (this.getVariable().getWrappedObj().normalizationFunction == 'SPACEPLOT'){
                return this.getTimeSeriesFromInput(step);
            }
            if (this.getVariable().getWrappedObj().normalizationFunction == 'CONSTANT'){
                return this.getVariable().getWrappedObj().timeSeries;
            }
        },

        getTimeSeriesFromInput: function(step) {
            var timeSeries = []
            // FIXME: Remove this once we pass pointers instead of ids
            if (!this.inputs){
                this.inputs = []
                for (var inputIndex in this.getVariable().getWrappedObj().inputs){
                    var inputId = this.getVariable().getWrappedObj().inputs[inputIndex]
                    this.inputs.push(GEPPETTO.ModelFactory.findMatchingInstanceByID(inputId, window.Instances[0].getChildren()))
                }
                
            }
            
            for (var inputIndex in this.inputs){
                var inputTimeSeries = this.inputs[inputIndex].getTimeSeries();
                if (inputTimeSeries != undefined){
                    var sampleIndex = step
                    if (step == undefined){
                        sampleIndex = inputTimeSeries.length-1
                    }
                    timeSeries.push(inputTimeSeries[sampleIndex]);
                }
                else{
                    timeSeries.push([])
                }
            }
            return timeSeries;
        },


        /**
         * Set the time series for the state variable
         *
         * @command Variable.setTimeSeries()
         * @returns {Object} The state variable
         */
        setTimeSeries: function (timeSeries) {
            this.timeSeries = timeSeries;
            return this;
        },

        /**
         * Get the initial value for the state variable
         *
         * @command Variable.getInitialValue()
         * @returns {Object} The initial value of the state variable
         */
        getInitialValue: function () {
            return this.getVariable().getWrappedObj().initialValues;
        },

        /**
         * Get the type of tree this is
         *
         * @command Variable.getUnit()
         * @returns {String} Unit for quantity
         */
        getUnit: function () {
        	if (!this.timeSeries) {
        		return this.extractUnit();
        	}
        	else {
        		if(this.timeSeries.unit== null || this.timeSeries.unit== undefined){
        			if(this.getVariable()!= undefined || this.getVariable()!=null){	
        		        return this.extractUnit();
        			}
        		}else{
        			return this.timeSeries.unit;
        		}
        	}
        },
        
        extractUnit : function(){
        	var unit = undefined;
        	var initialValues = this.getVariable().getWrappedObj().initialValues;

        	for (var i = 0; i < initialValues.length; i++) {
        		if (initialValues[i].value.eClass === 'PhysicalQuantity' || initialValues[i].value.eClass === 'TimeSeries') {
        			unit = initialValues[i].value.unit.unit
        		}
        	}
        	return unit;
        },

        /**
         * Get watched
         *
         * @command Variable.getWatched()
         * @returns {boolean} true if this variable is being watched
         */
        isWatched: function () {
            // NOTE: this.watched is a flag added by this API / Capability
            return this.watched;
        },

        /**
         * Set watched
         *
         * @command Variable.setWatched()
         * @param {Boolean} watched - Object with options attributes to initialize node
         */
        setWatched: function (isWatched, updateServer) {
            if (updateServer == undefined) {
                updateServer = true;
            }
            if (updateServer && isWatched != this.watched) {
                GEPPETTO.ExperimentsController.watchVariables([this], isWatched);
            }
            this.watched = isWatched;
            return this;
        }


    }
});
