

/**
 * Client class use to represent a variable.
 *
 * @module model/Value
 * @author Nitesh Thali
 */
define(function (require) {
	
    var ObjectWrapper = require('./ObjectWrapper');

    function Value(options) {
    	ObjectWrapper.prototype.constructor.call(this, options);
    	this.pointerValue=  options.pointerValue;
    	this.capabilities= [];
    }
    
    Value.prototype = Object.create(ObjectWrapper.prototype);
    Value.prototype.constructor = Value;

    return Value;
    
});
