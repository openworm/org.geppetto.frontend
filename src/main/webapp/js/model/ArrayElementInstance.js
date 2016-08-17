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

    function ArrayElementInstance(options) {
        Instance.prototype.constructor.call(this, options);
        this.index = options.index;
    };


    ArrayElementInstance.prototype = Object.create(Instance.prototype);
    ArrayElementInstance.prototype.constructor = ArrayElementInstance;

    ArrayElementInstance.prototype.getIndex = function () {
        return this.index;
    };

    ArrayElementInstance.prototype.delete = function () {
        var children = [].concat(this.getChildren());
        for (var c = 0; c < children.length; c++) {
            children[c].delete();
        }

        GEPPETTO.ModelFactory.deleteInstance(this);
    };


    ArrayElementInstance.prototype.getInstancePath = function () {
        var parent = this.getParent();
        var parentPath = "";
        var parentId = "";

        if (parent != null && parent != undefined) {
            parentPath = parent.getInstancePath();
            parentId = parent.getId();
        }

        var path = parentPath.replace(parentId, this.getId());

        return (parentPath != "") ? path : this.getId();
    };

    ArrayElementInstance.prototype.getPosition = function () {

        if ((this.getVariable().getType().getDefaultValue().elements != undefined) &&
            (this.getVariable().getType().getDefaultValue().elements[this.getIndex()] != undefined)) {
            return this.getVariable().getType().getDefaultValue().elements[this.getIndex()].position;
        }

    };

    ArrayElementInstance.prototype.getTypes = function () {
        return [this.getVariable().getType().getType()];
    };

    ArrayElementInstance.prototype.getType = function () {
        var types = this.getTypes();
        if (types.length == 1) {
            return types[0];
        }
        else return types;
    };

    return ArrayElementInstance;
});

