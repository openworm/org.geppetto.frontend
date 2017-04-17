

/**
 * Client class use to augment a model with parameter capabilities
 *
 * @module model/AParameterCapability
 * @author Matteo Cantarelli
 * @author Giovanni Idili
 */

define(function (require) {

    var Instance = require('../model/Instance');
    var Variable = require('../model/Variable');

    return {
        capabilityId: 'ParameterCapability',
        value: null,

        /**
         * Get the type of tree this is
         *
         * @command Parameter.getUnit()
         * @returns {String} Unit for quantity
         */
        getUnit: function () {
            var unit = undefined;
            var initialValues = null;

            if(this instanceof Instance) {
                initialValues = this.getVariable().getWrappedObj().initialValues;
            } else if(this instanceof Variable){
                initialValues = this.getWrappedObj().initialValues;
            }

            for (var i = 0; i < initialValues.length; i++) {
                if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                    unit = initialValues[i].value.unit.unit
                }
            }

            return unit;
        },

        /**
         * Get initial value of parameter
         * @command Parameter.getInitialValue()
         * @returns {String} Value of quantity
         */
        getInitialValue: function () {
            var initVal = null;

            var initialValues = null;

            if(this instanceof Instance) {
                initialValues = this.getVariable().getWrappedObj().initialValues;
            } else if(this instanceof Variable){
                initialValues = this.getWrappedObj().initialValues;
            }

            for (var i = 0; i < initialValues.length; i++) {
                if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                    // this is ugly
                    initVal = initialValues[i].value.value;
                }
            }

            return initVal;
        },

        /**
         * Get value of quantity
         *
         * @command Parameter.getValue()
         * @returns {String} Value of quantity
         */
        getValue: function () {
            var value = null;

            if((this instanceof Instance) && this.getVariable().isStatic()){
                value = this.getVariable().getValue();
            } else {
                value = this.value;
            }

            if (value == null || value == undefined) {
                // if value is empty fetch from initial values
                value = this.getInitialValue();
            }

            return value;
        },

        /**
         * Get scaling factor
         *
         * @command Parameter.getScalingFactor()
         * @returns {String} Scaling Factor for value and unit
         */
        getScalingFactor: function () {
            var scalingFactor = undefined;
            var initialValues = null;

            if(this instanceof Instance) {
                initialValues = this.getVariable().getWrappedObj().initialValues;
            } else if(this instanceof Variable){
                initialValues = this.getWrappedObj().initialValues;
            }

            for (var i = 0; i < initialValues.length; i++) {
                if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                    scalingFactor = initialValues[i].value.scalingFactor;
                }
            }

            return scalingFactor;
        },

        /**
         * Sets Value for parameter node.
         */
        setValue: function (value, updateServer) {
            if (updateServer == undefined) {
                updateServer = true;
            }

            // always set this regardless of variable vs instance (so the value will be in the call below)
            this.value = value;
            
            if (updateServer) {
                GEPPETTO.ExperimentsController.setParameters([this]);
            }


            return this;
        }
    }
});
