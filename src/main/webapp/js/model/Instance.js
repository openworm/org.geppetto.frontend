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
 * Client class use to represent an instance object (instantiation of a variable).
 *
 * @module model/Instance
 * @author Giovanni Idili
 */

define(function (require) {

    return Backbone.Model.extend({
        id: "",
        name: "",
        _metaType: "",
        variable: null,
        parent: null,
        children: [],
        capabilities: [],
        connections: [],
        connectionsLoaded: false,


        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize instance
         */
        initialize: function (options) {
            this.set({"variable": options.variable});
            this.set({"parent": options.parent});
            this.set({"children": (options.children != undefined) ? options.children : []});
            this.set({"id": options.id});
            this.set({"name": options.name});
            this.set({"_metaType": options._metaType});

            // capability list is for private use
            this.set({"capabilities": []});
            // connections are set after creation
            this.set({"connections": []});
            this.set({"connectionsLoaded": false});
        },

        /**
         * Get id
         *
         * @command Instance.getId()
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
         * @command Instance.getName()
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
         * @command Instance.getMetaType()
         *
         * @returns {String} - meta type
         *
         */
        getMetaType: function () {
            return this.get("_metaType");
        },

        /**
         * Get the type for this instance
         *
         * @command Instance.getTypes()
         *
         * @returns {List<Type>} - array of types
         *
         */
        getTypes: function () {
            return this.getVariable().getTypes();
        },

        /**
         * Get the type of this variable, return a list if it has more than one
         *
         * @command Variable.getType()
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
         *
         * @returns {*|Object}
         */
        getPosition: function () {
            return this.getVariable().getPosition();
        },

        /**
         * Checks if this instance has a visual type
         *
         * @command Instance.hasVisualType()
         *
         * @returns {Boolean}
         *
         */
        hasVisualType: function () {
            var hasVisual = false;
            var types = this.getTypes();

            // check if any of types is VISUAL_TYPE_NODE or if types HAVE .visualType
            for (var i = 0; i < types.length; i++) {
                // could be pointing to an array variable if it's an exploded instance
                if (types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                    // check it if is a visual type or has a visual type
                    if (types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE ||
                        types[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE ||
                        (types[i].getType().getVisualType() != null)) {
                        hasVisual = true;
                        break;
                    }
                } else if (types[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE ||
                    types[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE ||
                    types[i].getVisualType() != null) {
                    hasVisual = true;
                    break;
                }
            }

            return hasVisual;
        },

        /**
         * Gets visual types for the instance if any
         *
         * @command Instance.getVisualType()
         *
         * @returns {*} - Type or list of Types if more than one is found
         */
        getVisualType: function () {
            var visualTypes = [];

            var types = this.getTypes();
            // check if any of types is VISUAL_TYPE_NODE or if types HAVE .visualType
            for (var i = 0; i < types.length; i++) {
                // could be pointing to an array variable if it's an exploded instance
                if (types[i].getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE) {
                    // check it if is a visual type or has a visual type
                    if (types[i].getType().getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE || types[i].getType().getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                        visualTypes.push(types[i].getType());
                    } else if (types[i].getType().getVisualType() != null) {
                        visualTypes.push(types[i].getType().getVisualType());
                    }
                } else {
                    // check it if is a visual type or has a visual type
                    if (types[i].getMetaType() == GEPPETTO.Resources.VISUAL_TYPE_NODE || types[i].getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                        visualTypes.push(types[i]);
                    } else if (types[i].getVisualType() != null) {
                        visualTypes.push(types[i].getVisualType());
                    }
                }
            }

            if (visualTypes.length == 0) {
                return undefined;
            } else if (visualTypes.length == 1) {
                return visualTypes[0];
            } else {
                return visualTypes;
            }
        },


        /**
         * Get the variable for this instance
         *
         * @command Instance.getVariable()
         *
         * @returns {Variable} - Variable object for this instance
         *
         */
        getVariable: function () {
            return this.get("variable");
        },

        /**
         * Get children instances
         *
         * @command Instance.getChildren()
         *
         * @returns {List<Instance>} - List of instances
         *
         */
        getChildren: function () {
            return this.get("children");
        },

        /**
         * Get instance path
         *
         * @command Instance.getInstancePath()
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
            var path = parentPath + "." + this.getId();

            return (parentPath != "") ? path : this.getId();
        },

        /**
         * Synonym of get instance path
         *
         * @command Instance.getPath()
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
         * @command Instance.getRawInstancePath()
         *
         * @returns {String} - Instance path
         *
         */
        getRawInstancePath: function () {
            var parent = this.get("parent");
            var parentPath = "";

            if (parent != null && parent != undefined) {
                parentPath = parent.getInstancePath();
            }

            return (parentPath != "") ? (parentPath + "." + this.getId()) : this.getId();
        },


        /**
         * Get parent
         *
         * @command Instance.getParent()
         *
         * @returns {Instance} - Parent instance
         *
         */
        getParent: function () {
            return this.get("parent");
        },

        /**
         * Get children instances
         *
         * @command Instance.addChild()
         */
        addChild: function (child) {
            this.get("children").push(child);
        },

        /**
         * Extends with methods from another object
         *
         * @command Instance.extendApi(extensionObj)
         */
        extendApi: function (extensionObj) {
            $.extend(this, extensionObj);
            this.get("capabilities").push(extensionObj.capabilityId);
        },

        /**
         * Checks if the instance has a given capability
         *
         * @command Instance.hasCapability(capabilityId)
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
         * Return connections, user GEPPETTO.Resources.INPUT / OUTPUT / INPUT_OUTPUT to filter
         *
         * @command Instance.getConnections(direction)
         *
         * @returns {List<Instance>}
         *
         */
        getConnections: function (direction) {
            if (!this.get('connectionsLoaded')) {
                GEPPETTO.ModelFactory.createConnectionInstances(this);
            }
            var connections = this.get('connections');

            if (direction === GEPPETTO.Resources.INPUT || direction === GEPPETTO.Resources.OUTPUT || direction === GEPPETTO.Resources.INPUT_OUTPUT) {
                var filteredConnections = [];
                for (var i = 0; i < connections.length; i++) {
                    // get directionality
                    var connectivity = connections[i].getVariable().getInitialValue().value.connectivity;
                    if (connectivity == GEPPETTO.Resources.DIRECTIONAL) {
                        var a = connections[i].getA();
                        var b = connections[i].getB();
                        // if A is this then it's an output connection
                        if (this.getInstancePath() == a.getPath() && direction === GEPPETTO.Resources.OUTPUT) {
                            filteredConnections.push(connections[i]);
                        }
                        // if B is this then it's an input connection
                        if (this.getInstancePath() == b.getPath() && direction === GEPPETTO.Resources.INPUT) {
                            filteredConnections.push(connections[i]);
                        }
                    } else if (connectivity == GEPPETTO.Resources.BIDIRECTIONAL) {
                        filteredConnections.push(connections[i]);
                    }
                }

                // set return variable to filtered list
                connections = filteredConnections;
            }

            return connections;
        },

        /**
         * Get children instances
         *
         * @command Instance.addConnection()
         */
        addConnection: function (connection) {
            this.get("connections").push(connection);
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
