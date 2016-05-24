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
 * Client class use to represent an array of instances.
 *
 * @module model/ArrayInstance
 * @author Giovanni Idili
 */

define(function (require) {
    return Backbone.Model.extend({
        id: "",
        name: "",
        _metaType: "",
        variable: null,
        parent: null,
        size: 0,
        capabilities: [],

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize instance
         */
        initialize: function (options) {
            this.set({"variable": options.variable});
            this.set({"parent": options.parent});
            this.set({"size": options.size});
            this.length = options.size; //we want this object to be used like an array
            this.set({"id": options.id});
            this.set({"name": options.name});
            this.set({"_metaType": options._metaType});

            // capability list is for private use
            this.set({"capabilities": []});
        },

        /**
         * Get id
         *
         * @command ArrayInstance.getId()
         *
         * @returns {String} - Id
         *
         */
        getId: function () {
            return this.get("id");
        },

        /**
         * Get name
         *
         * @command ArrayInstance.getConnections()
         *
         * @returns {Array}
         *
         */
        getConnections: function () {
            //We don't currently support connections for arrays
            return [];
        },

        /**
         * Get name
         *
         * @command ArrayInstance.getName()
         *
         * @returns {String} - Name
         *
         */
        getName: function () {
            return this.get("name");
        },

        /**
         * Get meta type
         *
         * @command ArrayInstance.getMetaType()
         *
         * @returns {String} - meta type
         *
         */
        getMetaType: function () {
            return this.get("_metaType");
        },

        /**
         * Get parent
         *
         * @command ArrayInstance.getParent()
         *
         * @returns {Instance} - Parent instance
         *
         */
        getParent: function () {
            return this.get("parent");
        },

        /**
         *
         * @returns {*|Object}
         */
        getPosition: function () {
            return this.getVariable().getPosition();
        },

        /**
         * Get the type for this instance
         *
         * @command ArrayInstance.getTypes()
         *
         * @returns {List<Type>} - array of types
         *
         */
        getTypes: function () {
            return this.getVariable().getTypes();
        },

        /**
         * Get the type of this instance, return a list if it has more than one
         *
         * @command ArrayInstance.getType()
         *
         * @returns List<Type>} - array of types
         *
         */
        getType: function () {
            var types = this.get("variable").getTypes();
            if (types.length == 1) {
                return types[0];
            }
            else return types;
        },

        /**
         * Get the children for the array instance
         *
         * @command ArrayInstance.getChildren()
         *
         * @returns {List<Instance>} - array of instances
         *
         */
        getChildren: function () {
            var children = [];
            for (var i = 0; i < this.getSize(); i++) {
                children.push(this[i]);
            }
            return children;
        },

        /**
         * Checks if this instance has a visual type
         *
         * @command ArrayInstance.hasVisualType()
         *
         * @returns {Boolean}
         *
         */
        hasVisualType: function () {
            var hasVisual = false;
            var types = this.getTypes();

            // check if any visual types
            for (var i = 0; i < types.length; i++) {
                // make sure it's the array type (this is an array instance so should always be the case)
                if (types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                    // check it the array is of visual type or has a visual type
                    if (types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE ||
                        types[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE ||
                        types[i].getType().getVisualType() != null) {
                        hasVisual = true;
                        break;
                    }
                }
            }

            return hasVisual;
        },

        /**
         * Gets visual types for the instance if any
         *
         * @command ArrayInstance.getVisualType()
         *
         * @returns {Type}
         *
         */
        getVisualType: function () {
            var visualTypes = [];

            var types = this.getTypes();
            // check if any of types is VISUAL_TYPE_NODE or if types HAVE .visualType
            for (var i = 0; i < types.length; i++) {
                // make sure it's array type
                if (types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                    // check it if is a visual type or has a visual type
                    if (types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE ||
                        types[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                        visualTypes.push(types[i].getType());
                    } else if (types[i].getType().getVisualType() != null) {
                        visualTypes.push(types[i].getType().getVisualType());
                    }
                }
            }

            if (visualTypes.length == 1) {
                return visualTypes[0];
            } else {
                return visualTypes;
            }
        },

        /**
         * Get the variable for this instance
         *
         * @command ArrayInstance.getVariable()
         *
         * @returns {Variable} - Variable object for this instance
         *
         */
        getVariable: function () {
            return this.get("variable");
        },

        /**
         * Get instance path
         *
         * @command ArrayInstance.getInstancePath()
         *
         * @returns {String} - Instance path
         *
         */
        getInstancePath: function () {
            var parent = this.get("parent");
            var parentPath = "";

            if (parent != null && parent != undefined) {
                parentPath = parent.getInstancePath();
            }

            return (parentPath != "") ? (parentPath + "." + this.getId()) : this.getId();
        },

        /**
         * Synonym of get instance path
         *
         * @command ArrayInstance.getPath()
         *
         * @returns {String} - Instance path
         *
         */
        getPath: function () {
            return this.getInstancePath();
        },

        /**
         * Get raw instance path (without array shortening)
         *
         * @command ArrayInstance.getRawInstancePath()
         *
         * @returns {String} - Raw instance path
         *
         */
        getRawInstancePath: function () {
            return this.getInstancePath();
        },

        /**
         * Get the size of the array instance
         *
         * @command ArrayInstance.getSize()
         *
         * @returns {Integer} - size of the array
         *
         */
        getSize: function () {
            return this.get("size");
        },

        /**
         * Extends with methods from another object
         *
         * @command ArrayInstance.extendApi(extensionObj)
         */
        extendApi: function (extensionObj) {
            $.extend(this, extensionObj);
            this.get("capabilities").push(extensionObj.capabilityId);
        },

        /**
         * Checks if the instance has a given capability
         *
         * @command ArrayInstance.hasCapability(capabilityId)
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

        /**
         * Deletes instance
         */
        delete: function(){
            var children = [].concat(this.getChildren());
            for(var c=0; c < children.length; c++){
                children[c].delete();
            }

            GEPPETTO.ModelFactory.deleteInstance(this);
        }
    })
});
