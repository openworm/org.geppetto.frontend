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
 * Client class use to represent a parameter node, used for model tree
 * properties.
 *
 * @module model/ParameterNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Adrian Quintana (adrian.perez@ucl.ac.uk)
 */
define(function (require) {

    var Node = require('model/Node');

    return Node.Model.extend({
        timeSeries: [],
        unit: "",

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize
         *                           node
         */
        initialize: function (options) {
            this.name = options.name;
            this.id = options.id;
            this.unit = options.unit;
            this.timeSeries = [];
            this.aspectNode = options.aspectNode;
            this.instancePath = options.instancePath;
            this.domainType = options.domainType;
            this._metaType = options._metaType;
            this.watched = options.watched;
        },

        /**
         * Get value of quantity
         *
         * @command ParameterNode.getTimeSeries()
         * @returns {String} Value of quantity
         */
        getTimeSeries: function () {
            return this.timeSeries;
        },

        /**
         * Get the type of tree this is
         *
         * @command ParameterNode.getUnit()
         * @returns {String} Unit for quantity
         */
        getUnit: function () {
            return this.unit;
        },

        /**
         * Get watched
         *
         * @command ParameterNode.isWatched()
         * @returns {boolean} true if this variable is being watched
         */
        isWatched: function () {
            return this.watched;
        },

        /**
         * Set watched
         *
         * @command ParameterNode.setWatched()
         * @param {Boolean} watched - Object with options attributes to initialize node
         */
        setWatched: function (isWatched) {
            if (isWatched != this.watched) {
                Project.getActiveExperiment().watchVariables([this]);
            }
        },

        /**
         * Print out formatted node
         */
        print: function () {
            return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
                + "    InstancePath : " + this.instancePath + "\n"
                + "    Value : " + this.value + "\n" + "    Unit : "
                + this.unit + "\n" + "    ScalingFactor : "
                + this.scalingFactor + "\n" + +"    Watched : " + this.watched + "\n";
        }
    });
});
