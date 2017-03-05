

/**
 * Client class use to represent an array of instances.
 *
 * @module model/ArrayInstance
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */

define(function (require) {

    var Instance = require('./Instance');

    function ArrayInstance(options) {
        Instance.prototype.constructor.call(this, options);
        this.size = options.size;
        this.length = options.size;
    };

    ArrayInstance.prototype = Object.create(Instance.prototype);
    ArrayInstance.prototype.constructor = ArrayInstance;


    ArrayInstance.prototype.getConnections = function () {
        //We don't currently support connections for arrays
        return [];
    };

    ArrayInstance.prototype.getChildren = function () {
        var children = [];
        for (var i = 0; i < this.getSize(); i++) {
            children.push(this[i]);
        }
        return children;
    };

    /**
     * Get the size of the array instance
     *
     * @command ArrayInstance.getSize()
     *
     * @returns {Integer} - size of the array
     *
     */
    ArrayInstance.prototype.getSize = function () {
        return this.size;
    };


    return ArrayInstance;

});

