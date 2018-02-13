/**
 * Client class use to represent an array type.
 *
 * @module model/ImportType
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {
    var Type = require('./Type');


    function ImportType(options) {
        Type.prototype.constructor.call(this, options);
        this.visualType = options.visualType;
        this.superType = (options.superType != 'undefined') ? options.superType : [];
        this.capabilities = [];
        this.variableReferences = [];
    };

    ImportType.prototype = Object.create(Type.prototype);
    ImportType.prototype.constructor = ImportType;


    /**
     * Get type for array type
     *
     * @command ImportType.getUrl()
     *
     * @returns {String}
     *
     */
    ImportType.prototype.getUrl = function () {
        return this.getWrappedObj().url;
    };

    /**
     * Get type for array type
     *
     * @command ImportType.getReferenceUrl()
     *
     * @returns {String}
     *
     */
    ImportType.prototype.getReferenceUrl = function () {
        return this.getWrappedObj().referenceURL;
    };

    /**
     * Get type for array type
     *
     * @command ImportType.getModelInterpreterId()
     *
     * @returns {String}
     *
     */
    ImportType.prototype.getModelInterpreterId = function () {
        return this.getWrappedObj().modelInterpreterId;
    };

    /**
     * Trigger import type resolution - will cause this import type to get swapped with an actual type
     *
     * @command ImportType.resolve()
     */
    ImportType.prototype.resolve = function (callback) {
        GEPPETTO.Manager.resolveImportType(this.getPath(), callback);
    };

    return ImportType;
});
