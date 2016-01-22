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
 * The parent node from where all other nodes extend
 *
 * @module model/Node
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(['jquery', 'underscore', 'backbone',

// Add requirement for Backbone-associations module

], function (require) {
    return {
        Model: Backbone.Model.extend({
            name: "",
            instancePath: "",
            id: "",
            domainType: "",
            _metaType: "",
            aspectNode: null,
            parent: null,
            tags: null,

            /**
             * Gets the instance path of the node
             *
             * @command Node.getInstancePath()
             * @returns {String} Instance path of this node
             *
             */
            getInstancePath: function () {
                return this.instancePath;
            },

            /**
             * Gets the name of the node
             *
             * @command Node.getName()
             * @returns {String} Name of the node
             *
             */
            getName: function () {
                return this.name;
            },

            getAspectNode: function () {
                return this.aspectNode;
            },

            /**
             * Sets the name of the node
             *
             * @command Node.setName()
             *
             */
            setName: function (newname) {
                this.name = newname;
            },

            /**
             * Get the id associated with node
             *
             * @command Node.getId()
             * @returns {String} ID of node
             */
            getId: function () {
                return this.id;
            },

            getDomainType: function () {
                return this.domainType;
            },

            setDomainType: function (newDomainType) {
                this.domainType = newDomainType;
            },

            setParent: function (parent) {
                this.parent = parent;
            },

            getParent: function () {
                return this.parent;
            },

            _all: function (predicate, matches) {
                if (typeof matches === 'undefined') {
                    var matches = [];
                }

                if (predicate(this)) {
                    matches.push(this)
                }

                if (typeof this.getChildren === "function") {
                    var children = this.getChildren();
                    for (ci in children) {
                        this._all.call(children[ci], predicate, matches);
                    }
                }

                return matches;
            },

            /**
             * Search inside a node for all the nodes of a specific domain type.
             *
             * @param {String}
             *            domainType - Domain type
             * @returns {Array} List of Nodes
             *
             */
            getSubNodesOfDomainType: function (domainType) {
                return this._all(function (n) {
                    return n.domainType === domainType
                })
            },

            /**
             * Search inside a node for all the nodes of a specific meta type.
             *
             * @param {String}
             *            metaType - Meta Type
             * @returns {Array} List of Nodes
             *
             */
            getSubNodesOfMetaType: function (metaType) {
                return this._all(function (n) {
                    return n._metaType === metaType
                })
            }
        })
    };
});
