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
 * Client class use to represent a composite type.
 *
 * @module model/CompositeType
 * @author Giovanni Idili
 */
define(function (require) {
    var Type = require('model/Type');

    return Type.extend({
        variables: [],

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object}
         *            options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.set({"variables": (options.variables != 'undefined') ? options.variables : []});
            this.set({"parent": options.parent});
            this.set({"wrappedObj": options.wrappedObj});

            // capability list is for private use
            this.set({"capabilities": []});
        },

        /**
         * Get variables
         *
         * @command CompositeType.getChildren()
         *
         * @returns {List<Variable>} - List of variables
         *
         */
        getVariables: function () {
            return this.get("variables");
        },

        /**
         * Check if the composite contains a given variable
         *
         * @param varId
         * @returns {boolean}
         */
        hasVariable: function(varId){
           var vars = this.getVariables();

            var match = false;
            for(var i=0; i<vars.length; i++){
                if(vars[i].getId() == varId){
                    match = true;
                }
            }

            return match;
        },

        /**
         * Get combined children
         *
         * @command CompositeType.getChildren()
         *
         * @returns {List<Object>} - List of children
         *
         */
        getChildren: function () {
            return this.get("variables");
        },

        /**
         * Return connections
         *
         * @command CompositeType.getConnections()
         *
         * @returns {Boolean}
         *
         */
        getConnections: function () {
            var connectionVariables = [];

            for (var v in this.getVariables()) {
                var variable = this.getVariables()[v];
                if (variable.getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                    connectionVariables.push(variable);
                }
            }

            return connectionVariables;
        },
    });
});
