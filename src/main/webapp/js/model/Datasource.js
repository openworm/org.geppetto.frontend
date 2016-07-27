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
 * Client class use to represent a library that contains a set of types.
 *
 * @module model/Datasource
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');

    function Datasource(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
    };

    Datasource.prototype = Object.create(ObjectWrapper.prototype);
    Datasource.prototype.constructor = Datasource;


    /**
     * Get url for this datasource
     *
     * @command Datasource.getUrl()
     *
     * @returns {String} - datasource url as string
     *
     */
    Datasource.prototype.getUrl = function () {
        return this.getWrappedObj().url;
    };

    /**
     * Get datasource service for this datasource
     *
     * @command Datasource.getDatasourceService()
     *
     * @returns {String} - datasource service id as string
     *
     */
    Datasource.prototype.getDatasourceService = function () {
        return this.getWrappedObj().dataSourceService;
    };

    /**
     * Get library configurations for this datasource
     *
     * @command Datasource.getLibraryConfigurations()
     *
     * @returns {List<Object>} - datasource service id as string
     *
     */
    Datasource.prototype.getLibraryConfigurations = function () {
        return this.getWrappedObj().libraryConfigurations;
    };

    /**
     * Get queries for this datasource
     *
     * @command Datasource.getQueries()
     *
     * @returns {List<Object>} - datasource service id as string
     *
     */
    Datasource.prototype.getQueries = function () {
        return this.getWrappedObj().queries;
    };

    /**
     * Get dependencies library
     *
     * @command Datasource.getDependenciesLibrary()
     *
     * @returns {Object} - dependency library object
     *
     */
    Datasource.prototype.getDependenciesLibrary = function () {
        return this.getWrappedObj().dependenciesLibrary;
    };

    /**
     * Get target library
     *
     * @command Datasource.getTargetLibrary()
     *
     * @returns {Object} - target library object
     *
     */
    Datasource.prototype.getTargetLibrary = function () {
        return this.getWrappedObj().targetLibrary;
    };

    /**
     * Get fetch variable query
     *
     * @command Datasource.getFetchVariableQuery()
     *
     * @returns {Object} - fetch variable query
     *
     */
    Datasource.prototype.getFetchVariableQuery = function () {
        return this.getWrappedObj().fetchVariableQuery;
    };

    /**
     * Get combined children
     *
     * @command Datasource.getChildren()
     *
     * @returns {List<Object>} - List of children
     *
     */
    Datasource.prototype.getChildren = function () {
        // TODO: return contained children once they are model objects (lib config / queries)
        //return this.getWrappedObj().libraryConfigurations.concat(this.getWrappedObj().queries.concat([this.getWrappedObj().fetchVariableQuery]));
    };

    /**
     * Fetch variable and add to Geppetto model given variable id
     *
     * @param variableId
     */
    Datasource.prototype.fetchVariable = function (variableId, callback) {
        GEPPETTO.SimulationHandler.fetchVariable(variableId, this.getId(), callback);
    }
    return Datasource;
});