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

        /**
         * Get value of quantity
         *
         * @command VariableNode.getTimeSeries()
         * @returns {String} Value of quantity
         */
        getTimeSeries: function () {
            // TODO: adapt to type / variable

            return this.timeSeries;
        },


        /**
         * Set the time series for the state variable
         *
         * @command VariableNode.setTimeSeries()
         * @returns {Object} The state variable
         */
        setTimeSeries: function (timeSeries) {
            this.timeSeries = timeSeries;
            return this;
        },

        /**
         * Get the initial value for the state variable
         *
         * @command VariableNode.getInitialValue()
         * @returns {Object} The initial value of the state variable
         */
        getInitialValue: function () {

            return this.getVariable().getWrappedObj().initialValues;
        },


        /**
         * Set the unit for the state variable
         *
         * @command VariableNode.setUnit()
         * @returns {Object} The state variable
         */
        setUnit: function (unit) {
            this.unit = unit;
            return this;
        },

        /**
         * Get the type of tree this is
         *
         * @command VariableNode.getUnit()
         * @returns {String} Unit for quantity
         */
        getUnit: function () {
            // TODO: adapt to type / variable

            if (!this.unit) {
                //returns the unit associated with the initial value
                var unit = undefined;
                var initialValues = this.getVariable().getWrappedObj().initialValues;

                for (var i = 0; i < initialValues.length; i++) {
                    if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                        unit = initialValues[i].value.unit.unit
                    }
                }
                return unit;
            }
            return this.unit;
        },

        /**
         * Get watched
         *
         * @command VariableNode.getWatched()
         * @returns {boolean} true if this variable is being watched
         */
        isWatched: function () {
            // NOTE: this.watched is a flag added by this API / Capability
            return this.watched;
        },

        /**
         * Set watched
         *
         * @command VariableNode.setWatched()
         * @param {Boolean} watched - Object with options attributes to initialize node
         */
        setWatched: function (isWatched) {
            if (isWatched != this.watched) {
                // TODO: FIX below
                Project.getActiveExperiment().watchVariables([this]);

                // NOTE: this.watched is a flag added by this API / Capability
                this.watched = isWatched;
            }
            return this;
        }
    }
});
