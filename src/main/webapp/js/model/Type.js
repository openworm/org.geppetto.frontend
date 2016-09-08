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
 * @author Matteo Cantarelli
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');

    function Type(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.visualType = options.visualType;
        this.superType = (options.superType != undefined) ? options.superType : [];
        this.capabilities = [];
        this.variableReferences = [];
    };

    Type.prototype = Object.create(ObjectWrapper.prototype);
    Type.prototype.constructor = Type;

    /**
     * Gets the default value for this type
     *
     * @command Type.getDefaultValue()
     *
     * @returns {Object} - Default value
     *
     */
    Type.prototype.getDefaultValue = function () {
        return this.wrappedObj.defaultValue;
    };

    /**
     * Gets the super type for this type
     *
     * @command Type.getSuperType()
     *
     * @returns {List<Type>} - Super type
     *
     */
    Type.prototype.getSuperType = function () {
        var superType = this.superType;

        if (superType != undefined && this.superType.length == 1) {
            superType = superType[0];
        }

        return superType;
    };

    /**
     * Check if the type is abstract
     *
     * @command Type.isAbstract()
     *
     * @returns {Boolean} - Boolean indicating if the type is abstract
     *
     */
    Type.prototype.isAbstract = function () {
        return this.wrappedObj.abstract;
    };

    /**
     * Gets the visual type for this type if any
     *
     * @command Type.getVisualType()
     *
     * @returns {Type} - Super type
     *
     */
    Type.prototype.getVisualType = function () {
        return this.visualType;
    };


    /**
     * Extends with methods from another object
     *
     * @command Type.extendApi(extensionObj)
     */
    Type.prototype.extendApi = function (extensionObj) {
        $.extend(this, extensionObj);
        this.capabilities.push(extensionObj.capabilityId);
    };

    /**
     * Checks if the instance has a given capability
     *
     * @command Type.hasCapability(capabilityId)
     *
     * @returns {Boolean}
     */
    Type.prototype.hasCapability = function (capabilityId) {
        var hasCapability = false;
        var capabilities = this.capabilities;

        for (var i = 0; i < capabilities.length; i++) {
            if (capabilities[i] === capabilityId) {
                hasCapability = true;
            }
        }

        return hasCapability;
    };

    /**
     *
     * @param v
     */
    Type.prototype.addVariableReference = function (v) {
        this.variableReferences.push(v);
    };

    /**
     *
     * @returns {Array}
     */
    Type.prototype.getVariableReferences = function () {
        return this.variableReferences;
    };

    Type.prototype.typeOf = function (type){
        var match = false;

        if(type.getPath() == this.getPath()){
            // check if it's the same type
            match = true;
        } else {
            // recurse on parents and figure out if there is a type in the inheritance chain
            var superTypes = type.superType;

            for(var i=0; i<superTypes.length; i++) {
                match = this.typeOf(superTypes[i]);
                if(match){
                    break;
                }
            }
        }

        return match;
    };
    
    return Type;
})
;
