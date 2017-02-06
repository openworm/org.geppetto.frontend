/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * Client class use to augment a model with parameter capabilities
 *
 * @module model/AParameterCapability
 * @author Matteo Cantarelli
 * @author Giovanni Idili
 */

define(function (require) {

    var Instance = require('model/Instance');
    var Variable = require('model/Variable');

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
                var initialValues = null;

                if(this instanceof Instance) {
                    initialValues = this.getVariable().getWrappedObj().initialValues;
                } else if(this instanceof Variable){
                    initialValues = this.getWrappedObj().initialValues;
                }

                for (var i = 0; i < initialValues.length; i++) {
                    if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                        // this is ugly
                        value = initialValues[i].value.value;
                    }
                }
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

            if((this instanceof Instance) && this.getVariable().isStatic()) {
                this.getVariable().value = value;
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
