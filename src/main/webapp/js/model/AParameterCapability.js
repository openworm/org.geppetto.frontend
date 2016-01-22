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
 */

define(['jquery'], function (require) {
    return {
        capabilityId: 'ParameterCapability',

        /**
         * Get the type of tree this is
         *
         * @command ParameterSpecificationNode.getUnit()
         * @returns {String} Unit for quantity
         */
        getUnit: function () {
            // TODO: adapt to Type / Variable

            var unit = undefined;
            var initialValues = this.getVariable().getWrappedObj().initialValues;

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
         * @command ParameterSpecificationNode.getValue()
         * @returns {String} Value of quantity
         */
        getValue: function () {
            // TODO: adapt to Type / Variable

            var value = undefined;
            var initialValues = this.getVariable().getWrappedObj().initialValues;

            for (var i = 0; i < initialValues.length; i++) {
                if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                    // this is ugly
                    value = initialValues[i].value.value;
                }
            }

            return value;
        },

        /**
         * Get scaling factor
         *
         * @command ParameterSpecificationNode.getScalingFactor()
         * @returns {String} Scaling Factor for value and unit
         */
        getScalingFactor: function () {
            // TODO: adapt to Type / Variable

            var scalingFactor = undefined;
            var initialValues = this.getVariable().getWrappedObj().initialValues;

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
        setValue: function (value) {
            // TODO: adapt to Type / Variable
            var initialValues = this.getVariable().getWrappedObj().initialValues;

            for (var i = 0; i < initialValues.length; i++) {
                if (initialValues[i].value.eClass === 'PhysicalQuantity') {
                    // setting value on wrapped object... this is ugly
                    initialValues[i].value.value = value;
                }
            }

            // TODO: FIX below
            //Project.getActiveExperiment().setParameters(this.getAspectNode().getInstancePath(), [ this ]);

            return this;
        }
    }
});
