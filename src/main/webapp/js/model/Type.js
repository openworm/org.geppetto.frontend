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
 * Client class use to represent a simple type.
 *
 * @module model/Type
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');

    return ObjectWrapper.Model.extend({
        visualType: null,
        superType: [],
        capabilities: [],

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.set({"wrappedObj": options.wrappedObj});
            this.set({"visualType": options.visualType});
            this.set({"superType": (options.superType != 'undefined') ? options.superType : []});
            this.set({"parent": options.parent});

            // capability list is for private use
            this.set({"capabilities": []});
        },

        /**
         * Gets the default value for this type
         *
         * @command Type.getDefaultValue()
         *
         * @returns {Object} - Default value
         *
         */
        getDefaultValue: function () {
            return this.get('wrappedObj').defaultValue;
        },

        /**
         * Gets the super type for this type
         *
         * @command Type.getSuperType()
         *
         * @returns {List<Type>} - Super type
         *
         */
        getSuperType: function () {
            var superType = this.get('superType');

            if(superType != undefined && this.get('superType').length == 1){
                superType = superType[0];
            }

            return superType;
        },

        /**
         * Check if the type is abstract
         *
         * @command Type.isAbstract()
         *
         * @returns {Boolean} - Boolean indicating if the type is abstract
         *
         */
        isAbstract: function () {
            return this.get('wrappedObj').abstract;
        },

        /**
         * Gets the visual type for this type if any
         *
         * @command Type.getVisualType()
         *
         * @returns {Type} - Super type
         *
         */
        getVisualType: function () {
            return this.get('visualType');
        },


        /**
         * Gets the list of referenced variables
         *
         * @command Type.getReferencedVariables()
         *
         * @returns {List<Variables>} - list of referenced variables
         *
         */
        getReferencedVariables: function () {
            // TODO: fetch from the right place
            return this.get('wrappedObj').referencedVariables;
        },

        /**
         * Extends with methods from another object
         *
         * @command Type.extendApi(extensionObj)
         */
        extendApi: function (extensionObj) {
            $.extend(this, extensionObj);
            this.get("capabilities").push(extensionObj.capabilityId);
        },

        /**
         * Checks if the instance has a given capability
         *
         * @command Type.hasCapability(capabilityId)
         *
         * @returns {Boolean}
         */
        hasCapability: function (capabilityId) {
            var hasCapability = false;
            var capabilities = this.get('capabilities');

            for (var i = 0; i < capabilities.length; i++) {
                if (capabilities[i] === capabilityId) {
                    hasCapability = true;
                }
            }

            return hasCapability;
        },
    });
});
