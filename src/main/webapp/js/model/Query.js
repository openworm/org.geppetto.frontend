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
 * @module model/Query
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');

    function Query(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.matchingCriteria = (options.matchingCriteria != undefined) ? options.matchingCriteria : [];
    };

    Query.prototype = Object.create(ObjectWrapper.prototype);
    Query.prototype.constructor = Query;

    /**
     * Gets the default value for this type
     *
     * @command Type.getDefaultValue()
     *
     * @returns {Object} - Default value
     *
     */
    Query.prototype.getLabel = function () {
        return this.wrappedObj.label;
    };

    /**
     * Gets the super type for this type
     *
     * @command Type.getSuperType()
     *
     * @returns {List<Type>} - Super type
     *
     */
    Query.prototype.getDescription = function () {
        return this.wrappedObj.description;
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
