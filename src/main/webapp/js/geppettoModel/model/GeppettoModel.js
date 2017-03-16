

/**
 * Client class use to represent top level Geppetto model.
 *
 * @module model/GeppettoModel
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('./ObjectWrapper');


    function GeppettoModel(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.variables = (options.variables != undefined) ? options.variables : [];
        this.libraries = (options.libraries != undefined) ? options.libraries : [];
        this.datasources = (options.datasources != undefined) ? options.datasources : [];
        this.queries = (options.queries != undefined) ? options.queries : [];
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
     * Get top level queries
     *
     * @command GeppettoModel.getQueries()
     *
     * @returns {List<Query>} - List of query objects
     *
     */
    GeppettoModel.prototype.getQueries = function () {
        return this.queries;
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
        return this.variables.concat(this.libraries.concat(this.datasources.concat(this.queries)));
    };

    return GeppettoModel;
});