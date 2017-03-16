

/**
 * Client class use to represent a simple type.
 *
 * @module model/Query
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {
    var ObjectWrapper = require('./ObjectWrapper');

    function Query(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.matchingCriteria = (options.matchingCriteria != undefined) ? options.matchingCriteria : [];
    };

    Query.prototype = Object.create(ObjectWrapper.prototype);
    Query.prototype.constructor = Query;

    /**
     * Gets the default value for this query
     *
     * @command Query.getDefaultValue()
     *
     * @returns {Object} - Default value
     *
     */
    Query.prototype.getLabel = function () {
        return this.wrappedObj.label;
    };

    /**
     * Gets the super type for this query
     *
     * @command Query.getDescription()
     *
     * @returns {List<Type>} - Super type
     *
     */
    Query.prototype.getDescription = function () {
        return this.wrappedObj.description;
    };

    /**
     * Gets the result type for this query
     *
     * @command Query.getResultType()
     *
     * @returns {Object} - Result type
     *
     */
    Query.prototype.getResultType = function () {
        return this.wrappedObj.resultType;
    };

    /**
     * Gets matching criteria (types) for this query
     *
     * @returns {Array}
     */
    Query.prototype.getMatchingCriteria = function () {
        return this.matchingCriteria;
    };

    /**
     * Checks if query matches given criteria (type)
     *
     * @param type
     * @returns {boolean}
     */
    Query.prototype.matchesCriteria = function (type) {
        var match = false;

        // loop criteria
        for(var i=0; i<this.matchingCriteria.length; i++){

            var criteriaMatch = false;
            for(var j=0; j<this.matchingCriteria[i].length; j++){
                // all types must match to satisfy a criteria
                criteriaMatch = this.matchingCriteria[i][j].typeOf(type);

                if(!criteriaMatch){
                    // if one element of the criteria doesn't match skip out
                    break;
                }
            }

            // satisfying one criteria is enough - if it matches skip out
            if(criteriaMatch){
                match = true;
                break;
            }
        }

        return match;
    };

    return Query;
});
