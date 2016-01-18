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
 * furnished t do so, subject to the following conditions:
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
 * Base class that provides wrapping functionality for a generic underlying object (with id and name).
 *
 * @module widgets/treevisualiser/TreeVisualiserNode.js
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */

define(['jquery', 'underscore', 'backbone'], function (require) {
    return Backbone.Model.extend({
        wrappedObj: null,
        children: [],

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {

            this.set({"wrappedObj": options.wrappedObj});
            this.set({"children": (options.children != undefined) ? options.children : []});
        },

        /**
         * Gets the name of the node
         *
         * @command Node.getName()
         * @returns {String} Name of the node
         *
         */
        getName: function () {
            return this.get('wrappedObj').getName();
        },

        /**
         * Get the id associated with node
         *
         * @command Node.getId()
         * @returns {String} ID of node
         */
        getId: function () {
            return this.get('wrappedObj').getId();
        },

        /**
         * Get the metatype associated with node
         *
         * @command Node.getMetaType()
         * @returns {String} ID of node
         */
        getMetaType: function () {
            return this.get('wrappedObj').getMetaType();
        },

        /**
         * Get the metatype associated with node
         *
         * @command Node.getMetaType()
         * @returns {String} ID of node
         */
        getValue: function () {
            var formattedValue = null;
//				console.log('Getting value for ' + this.getId());
            if (this.get('wrappedObj').getInitialValues() != undefined) {
                var value = this.get('wrappedObj').getInitialValues()[0].value;
                if (value.eClass == 'Text') {
                    formattedValue = value.text;
                }
                else if (value.eClass == 'Connection') {
                    //AQP: To be fixed once this part is solved
                    formattedValue = 'Connection';
                }
                else if (value.eClass == 'HTML') {
                    formattedValue = value.html;
                }
                else if (value.eClass == 'Dynamics') {
                    //AQP: Let's try to beautify this thing
                    formattedValue = value.dynamics.expression.expression;
                }
                else if (value.eClass == 'PhysicalQuantity') {
                    formattedValue = value.value + " " + value.unit.unit;
                }
                else {
                    //AQP: In here, it should only go the size of the population
                    formattedValue = value.value;
                }
            }
            return formattedValue;
        },

        /**
         * Get the children of the node
         *
         * @command getChildren()
         * @returns {Object} Children of node
         */
        getChildren: function () {
            return this.get('children');
        },

        /**
         * Get the wrapped obj
         *
         * @command Node.getWrappedObj()
         * @returns {Object} - Wrapped object
         */
        getWrappedObj: function () {
            return this.get('wrappedObj');
        },

    });
});
