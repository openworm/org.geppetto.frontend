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
 * Client class use to represent an array element instance.
 *
 * @module model/ArrayElementInstance
 * @author Giovanni Idili
 */
define(function (require) {
    var Instance = require('model/Instance');

    return Instance.extend({
        index: null,

        /**
         * Initializes this node with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize node
         */
        initialize: function (options) {
            this.set({"index": options.index});

            // inherited
            this.set({"variable": options.variable});
            this.set({"parent": options.parent});
            this.set({"children": (options.children != undefined) ? options.children : []});
            this.set({"id": options.id});
            this.set({"name": options.name});
            this.set({"_metaType": options._metaType});

            // capability list is for private use
            this.set({"capabilities": []});
            this.set({"connections": []});
        },

        /**
         * Get index of this instance element in its parent array
         *
         * @command ArrayElementInstance.getIndex()
         *
         * @returns {Integer} - integer index of the element in the parent array
         *
         */
        getIndex: function () {
            return this.get('index');
        },

        /**
         * Get instance path
         *
         * @command ArrayElementInstance.getInstancePath()
         *
         * @returns {String} - Instance path
         *
         */
        getInstancePath: function () {
            var parent = this.get("parent");
            var parentPath = "";
            var parentId = "";

            if (parent != null && parent != undefined) {
                parentPath = parent.getInstancePath();
                parentId = parent.getId();
            }

            var path = parentPath.replace(parentId, this.getId());

            return (parentPath != "") ? path : this.getId();
        },

        /**
         *
         * @returns {*}
         */
        getPosition: function () {

            if ((this.getVariable().getType().getDefaultValue().elements != undefined) &&
                (this.getVariable().getType().getDefaultValue().elements[this.getIndex()] != undefined)) {
                return this.getVariable().getType().getDefaultValue().elements[this.getIndex()].position;
            }

        },

        /**
         * Synonym of get instance path
         *
         * @command ArrayElementInstance.getPath()
         *
         * @returns {String} - Instance path
         *
         */
        getPath: function () {
            return this.getInstancePath();
        },

        /**
         * Get the type for this instance
         *
         * @command ArrayElementInstance.getTypes()
         *
         * @returns {List<Type>} - array of types
         *
         */
        getTypes: function () {
            return [this.getVariable().getType().getType()];
        },

        /**
         * Get the type of this variable, return a list if it has more than one
         *
         * @command ArrayElementInstance.getType()
         *
         * @returns List<Type>} - array of types
         *
         */
        getType: function () {
            var types = this.getTypes();
            if (types.length == 1) {
                return types[0];
            }
            else return types;
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
    });
});
