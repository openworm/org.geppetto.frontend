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
 * Client class use to represent a variable.
 *
 * @module model/Variable
 * @author Giovanni Idili
 */
define(function (require) {

    var ObjectWrapper = require('model/ObjectWrapper');

    function Variable(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.anonymousTypes = (options.anonymousTypes != undefined) ? options.anonymousTypes : [];
        this.types = (options.types != undefined) ? options.types : [];
        this.pointerValue = options.pointerValue;
        this.capabilities = [];
    };

    Variable.prototype = Object.create(ObjectWrapper.prototype);
    Variable.prototype.constructor = Variable;


    /**
     * Get the list of types for this variable
     *
     * @command Variable.getTypes()
     *
     * @returns {List<Type>} - array of types
     *
     */
    Variable.prototype.getTypes = function () {
        var types = (this.types != undefined) ? this.types : [];
        var anonTypes = (this.anonymousTypes != undefined) ? this.anonymousTypes : [];
        var allTypes = types.concat(anonTypes);
        return allTypes;
    };

    /**
     * Get the list of the anonymous types for this variable
     *
     * @command Variable.getAnonymousTypes()
     *
     * @returns {List<Type>} - array of types
     *
     */
    Variable.prototype.getAnonymousTypes = function () {
        return this.anonymousTypes;
    };


    /**
     * Get the type of this variable, return a list if it has more than one
     *
     * @command Variable.getType()
     *
     * @returns List<Type>} - array of types
     *
     */
    Variable.prototype.getType = function () {
        var types = this.getTypes();
        if (types.length == 1) {
            return types[0];
        }
        else return types;
    };


    /**
     * Get the list of values for this variable
     *
     * @command Variable.getInitialValues()
     *
     * @returns {List<Value>} - array of values
     *
     */
    Variable.prototype.getInitialValues = function () {
        var pointerValue = this.pointerValue;
        var values = this.getWrappedObj().initialValues;

        if (values == undefined) {
            values = [];
        }

        // if there is a pointer value just return that
        if (pointerValue != undefined && pointerValue != null) {
            values = [pointerValue];
        }

        return values;
    };

    /**
     * Get the initial value for this variable, or a list if more than one
     *
     * @command Variable.getInitialValue()
     *
     * @returns {Value} - array of values
     *
     */
    Variable.prototype.getInitialValue = function () {
        var pointerValue = this.pointerValue;
        var values = this.getWrappedObj().initialValues;

        if (values == undefined) {
            values = [];
        }

        // if there is a pointer value just return that
        if (pointerValue != undefined && pointerValue != null) {
            values = [pointerValue];
        }

        if (values.length == 1) {
            return values[0];
        } else {
            return values;
        }
    };

    /**
     * Check if the variable is static
     *
     * @command Variable.isStatic()
     *
     * @returns {bool} - Boolean
     *
     */
    Variable.prototype.isStatic = function () {
        return this.getWrappedObj().static;
    };

    /**
     * Gets position for the variable
     *
     * @command Variable.isStatic()
     *
     * @returns {Object} - position for the variable
     *
     */
    Variable.prototype.getPosition = function () {
        return this.getWrappedObj().position;
    };

    /**
     * Get combined children
     *
     * @command Variable.getChildren()
     *
     * @returns {List<Object>} - List of children
     *
     */
    Variable.prototype.getChildren = function () {
        // only anonymousTypes as containment == true in the model (they are not references)
        return this.anonymousTypes;
    };

    /**
     * Extends with methods from another object
     *
     * @command Variable.extendApi(extensionObj)
     */
    Variable.prototype.extendApi = function (extensionObj) {
        $.extend(this, extensionObj);
        this.capabilities.push(extensionObj.capabilityId);
    };

    /**
     * Checks if the instance has a given capability
     *
     * @command Variable.hasCapability(capabilityId)
     *
     * @returns {Boolean}
     */
    Variable.prototype.hasCapability = function (capabilityId) {
        var hasCapability = false;
        var capabilities = this.capabilities;

        for (var i = 0; i < capabilities.length; i++) {
            if (capabilities[i] === capabilityId) {
                hasCapability = true;
            }
        }

        return hasCapability;
    };

    // Overriding set
    Variable.prototype.setTypes = function (types) {
        this.types = types;
        for (var i = 0; i < types.length; i++) {
            if (types[i].addVariableReference != undefined) {
                types[i].addVariableReference(this);
            }
        }
        return this;
    };


    return Variable;
});
