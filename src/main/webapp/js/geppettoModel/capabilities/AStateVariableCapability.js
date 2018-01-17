

/**
 * Client class use to augment a model with state variable capabilities
 *
 * @module model/AStateVariableCapability
 * @author Matteo Cantarelli
 */

define(['jquery'], function (require) {
    return {
        capabilityId: 'StateVariableCapability',
        watched: false,
        timeSeries: null,
        unit: null,

        /**
         * Get value of quantity
         *
         * @command Variable.getTimeSeries()
         * @returns {String} Value of quantity
         */
        getTimeSeries: function () {
            if (!this.timeSeries) {
                var timeSeries = undefined;
                var initialValues = this.getVariable().getWrappedObj().initialValues;

                if(initialValues != undefined) {
                    for (var i = 0; i < initialValues.length; i++) {
                        if (initialValues[i].value.eClass === 'TimeSeries') {
                            timeSeries = initialValues[i].value.value
                        }
                    }
                }

                return timeSeries;
            }
            return this.timeSeries;
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
         * Set unit value
         *
         * @param unit
         */
        setUnit: function(unit){
          this.unit = unit;
        },

        /**
         * Get the type of tree this is
         *
         * @command Variable.getUnit()
         * @returns {String} Unit for quantity
         */
        getUnit: function () {
        	return (this.unit == null) ? this.extractUnit() : this.unit;
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
