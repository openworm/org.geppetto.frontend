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
 * Client class use to represent top level Geppetto model.
 *
 * @module model/GeppettoModel
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');

    return ObjectWrapper.Model.extend({
        variables: [],
        libraries: [],
        datasources: [],
        id: '',

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.set({"variables": (options.variables != undefined) ? options.variables : []});
            this.set({"libraries": (options.libraries != undefined) ? options.libraries : []});
            this.set({"datasources": (options.datasources != undefined) ? options.datasources : []});
            this.set({"id": options.id});
            this.set({"parent": options.parent});
            this.set({"wrappedObj": options.wrappedObj});
            this.set({"_metaType": options._metaType});
        },

        /**
         * Get the id associated with node
         *
         * @command Node.getId()
         * @returns {String} ID of node
         */
        getId: function () {
            return this.get('id');
        },

        /**
         * Get variables
         *
         * @command GeppettoModel.getVariables()
         *
         * @returns {List<Variable>} - List of Variable objects
         *
         */
        getVariables: function () {
            return this.get('variables');
        },

        /**
         * Get libraries
         *
         * @command GeppettoModel.getLibraries()
         *
         * @returns {List<Library>} - List of library objects
         *
         */
        getLibraries: function () {
            return this.get('libraries');
        },

        /**
         * Get datasources
         *
         * @command GeppettoModel.getDatasources()
         *
         * @returns {List<Datasource>} - List of datasource objects
         *
         */
        getDatasources: function () {
            return this.get('datasources');
        },

        /**
         * Get combined list of all children
         *
         * @command GeppettoModel.getChildren()
         *
         * @returns {List<Object>} - List of children
         *
         */
        getChildren: function () {
            return this.get("variables").concat(this.get("libraries").concat(this.get("datasources")));
        },
    });
});