

/**
 * Client class use to represent a pointer element.
 *
 * @module model/PointerElement
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function () {

    function PointerElement(options) {

        this.wrappedObj = options.wrappedObj;
        this.variable = options.variable;
        this.type = options.type;
        this.index = options.index;
    }

    PointerElement.prototype = {

        constructor: PointerElement,

        /**
         * Gets the variable
         *
         * @command PointerElement.getVariable()
         *
         * @returns {Variable} - variable
         *
         */
        getVariable: function () {
            return this.variable;
        }

        ,

        /**
         * Gets the type
         *
         * @command PointerElement.getType()
         *
         * @returns {Type} - type
         *
         */
        getType: function () {
            return this.type;
        }
        ,

        /**
         * Get the wrapped obj
         *
         * @command Node.getWrappedObj()
         * @returns {Object} - Wrapped object
         */
        getWrappedObj: function () {
            return this.wrappedObj;
        }
        ,

        /**
         * Gets the index if it's pointing to an array element
         *
         * @command PointerElement.getIndex()
         *
         * @returns {Integer} - index in a given array
         *
         */
        getIndex: function () {
            return this.index;
        }
        ,

        /**
         * Get the path for this pointer element
         *
         * @command PointerElement.getPath()
         *
         * @returns {String} - path
         */
        getPath: function (types) {
            if (types === undefined) {
                types = false;
            }

            var path = '';

            var element = this;
            var resolvedVar = element.getVariable();
            var resolvedType = element.getType();
            path += resolvedVar.getId();
            if (types) {
                path += "(" + resolvedType.getId() + ")";
            }
            if (element.getIndex() > -1) {
                path += "[" + element.getIndex() + "]";
            }

            return path;
        }
    };

    return PointerElement;
});
