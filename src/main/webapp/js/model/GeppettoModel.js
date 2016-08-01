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
 * Client class use to represent top level Geppetto model.
 *
 * @module model/GeppettoModel
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');


    function GeppettoModel(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.variables = (options.variables != undefined) ? options.variables : [];
        this.libraries = (options.libraries != undefined) ? options.libraries : [];
        this.datasources = (options.datasources != undefined) ? options.datasources : [];
    };

    GeppettoModel.prototype = Object.create(ObjectWrapper.prototype);
    GeppettoModel.prototype.constructor = GeppettoModel;

    /**
     * Get variables
     *
     * @command GeppettoModel.getVariables()
     *
     * @returns {List<Variable>} - List of Variable objects
     *
     */
    GeppettoModel.prototype.getVariables = function () {
        return this.variables;
    };
    
    /**
     * Get the id
     *
     * @command GeppettoModel.getId()
     *
     * @returns {String} - The id of the model, a constant
     *
     */
    GeppettoModel.prototype.getId = function () {
        return GEPPETTO.Resources.MODEL_PREFIX_CLIENT;
    };

    /**
     * Get libraries
     *
     * @command GeppettoModel.getLibraries()
     *
     * @returns {List<Library>} - List of library objects
     *
     */
    GeppettoModel.prototype.getLibraries = function () {
        return this.libraries;
    };

    /**
     * Get datasources
     *
     * @command GeppettoModel.getDatasources()
     *
     * @returns {List<Datasource>} - List of datasource objects
     *
     */
    GeppettoModel.prototype.getDatasources = function () {
        return this.datasources;
    };

    /**
     * Get combined list of all children
     *
     * @command GeppettoModel.getChildren()
     *
     * @returns {List<Object>} - List of children
     *
     */
    GeppettoModel.prototype.getChildren = function () {
        return this.variables.concat(this.libraries.concat(this.datasources));
    };

    return GeppettoModel;
});