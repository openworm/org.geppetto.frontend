

/**
 * Client class use to represent a composite type.
 *
 * @module model/CompositeType
 * @author Giovanni Idili
 */
define(function (require) {
    var Type = require('./Type');

    function CompositeType(options) {
        Type.prototype.constructor.call(this, options);
        this.variables = (options.variables != 'undefined') ? options.variables : [];
    };

    CompositeType.prototype = Object.create(Type.prototype);
    CompositeType.prototype.constructor = CompositeType;


    /**
     * Get variables
     *
     * @command CompositeType.getChildren()
     *
     * @returns {List<Variable>} - List of variables
     *
     */
    CompositeType.prototype.getVariables = function () {
        return this.variables;
    };

    /**
     * Check if the composite contains a given variable
     *
     * @param varId
     * @returns {boolean}
     */
    CompositeType.prototype.hasVariable = function (varId) {
        var vars = this.getVariables();

        var match = false;
        for (var i = 0; i < vars.length; i++) {
            if (vars[i].getId() == varId) {
                match = true;
            }
        }

        return match;
    };

    /**
     * Get combined children
     *
     * @command CompositeType.getChildren()
     *
     * @returns {List<Object>} - List of children
     *
     */
    CompositeType.prototype.getChildren = function () {
        return this.variables;
    };

    /**
     * Return connections
     *
     * @command CompositeType.getConnections()
     *
     * @returns {Boolean}
     *
     */
    CompositeType.prototype.getConnections = function () {
        var connectionVariables = [];

        for (var v in this.getVariables()) {
            var variable = this.getVariables()[v];
            if (variable.getType().getMetaType() == GEPPETTO.Resources.CONNECTION_TYPE) {
                connectionVariables.push(variable);
            }
        }

        return connectionVariables;
    };

    return CompositeType;
});
