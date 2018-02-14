

/**
 * Client class use to represent a library that contains a set of types.
 *
 * @module model/Datasource
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('./ObjectWrapper');

    function Datasource(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.queries = (options.queries != undefined) ? options.queries : [];
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
        return this.queries;
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
        GEPPETTO.Manager.fetchVariable(variableId, this.getId(), callback);
    };

    return Datasource;
});