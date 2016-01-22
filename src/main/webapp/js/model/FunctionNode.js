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
 * Client class use to represent a function. Used to store properties of model
 * tree
 *
 * @module model/FunctionNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

    var Node = require('model/Node');

    return Node.Model.extend({
        arguments: "",
        expression: "",
        _metaType: "FunctionNode",

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.name = options.name;
            this.id = options.id;
            this.instancePath = options.instancePath;
            this.arguments = options.arguments;
            this.aspectNode = options.aspectNode;
            this.expression = options.expression;
            this._metaType = options._metaType;
            this.domainType = options.domainType;
            this.plotMetadata = options.plotMetadata;
        },

        /**
         * Get arguments for function
         *
         * @command FunctionNode.getArguments()
         * @returns {String} Arguments for function
         */
        getArguments: function () {
            return this.arguments;
        },

        /**
         * Get function's expression
         *
         * @command FunctionNode.getExpression()
         * @returns {String} Expression for function
         */
        getExpression: function () {
            return this.expression;
        },

        /**
         * Get plot metadata information for function
         *
         * @command FunctionNode.getPlotMetadata()
         * @returns {Dict} Plot Metadata Dictionary containing info about how to plot
         */
        getPlotMetadata: function () {
            return this.plotMetadata;
        },

        /**
         * Print out formatted node
         */
        print: function () {
            return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
                + "    InstancePath : " + this.instancePath + "\n"
                + "    Arguments : " + this.arguments + "\n"
                + "    Expression : " + this.expression + "\n"
                + "    PlotMetadata : " + this.plotMetadata + "\n";
        }
    });
});
