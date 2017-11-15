

/**
 * Client class use to represent an array type.
 *
 * @module model/ImportValue
 * @author nitesh thali
 */
define(function (require) {
    var Value = require('./Value');
    

    function ImportValue(options) {
        Value.prototype.constructor.call(this, options);
    }
    
    ImportValue.prototype = Object.create(Value.prototype);
    ImportValue.prototype.constructor = ImportValue;
    
    ImportValue.prototype.resolve = function(callback) {
            GEPPETTO.Manager.resolveImportValue(this.getPath(), callback);
    };
    
    
    /**
     * Get path
     *
     * @command Type.getPath()
     *
     * @returns {String} - path
     *
     */
    ImportValue.prototype.getPath = function () {
        if (this.parent) {
            return this.parent.getPath();
        }
        else {
            throw "A value should always have a parent!";
        }

    };
    
    return ImportValue;
});
