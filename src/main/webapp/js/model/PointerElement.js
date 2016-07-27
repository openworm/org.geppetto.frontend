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
 * Client class use to represent a pointer element.
 *
 * @module model/PointerElement
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function () {

    function PointerElement(options) {

        this.wrappedObj = options.wrappedObj;
        this.variable = options.variable;
        this.type = options.type;
        this.index = options.index;
    }

    PointerElement.prototype = {

        constructor: PointerElement,

        /**
         * Gets the variable
         *
         * @command PointerElement.getVariable()
         *
         * @returns {Variable} - variable
         *
         */
        getVariable: function () {
            return this.variable;
        }

        ,

        /**
         * Gets the type
         *
         * @command PointerElement.getType()
         *
         * @returns {Type} - type
         *
         */
        getType: function () {
            return this.type;
        }
        ,

        /**
         * Get the wrapped obj
         *
         * @command Node.getWrappedObj()
         * @returns {Object} - Wrapped object
         */
        getWrappedObj: function () {
            return this.wrappedObj;
        }
        ,

        /**
         * Gets the index if it's pointing to an array element
         *
         * @command PointerElement.getIndex()
         *
         * @returns {Integer} - index in a given array
         *
         */
        getIndex: function () {
            return this.index;
        }
        ,

        /**
         * Get the path for this pointer element
         *
         * @command PointerElement.getPath()
         *
         * @returns {String} - path
         */
        getPath: function (types) {
            if (types === undefined) {
                types = false;
            }

            var path = '';

            var element = this;
            var resolvedVar = element.getVariable();
            var resolvedType = element.getType();
            path += resolvedVar.getId();
            if (types) {
                path += "(" + resolvedType.getId() + ")";
            }
            if (element.getIndex() > -1) {
                path += "[" + element.getIndex() + "]";
            }

            return path;
        }
    };

    return PointerElement;
});
