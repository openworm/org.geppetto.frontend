define(function (require) {

	var _ = require('underscore');
	
    return {
    	
    	eventHash: [],
    	
    	/**
    	 * Clean up listeners
    	 */
    	componentWillUnmount:function() {
        	_.each(this.eventHash, function(listener){
        		listener.target.off(listener.event, listener.callback);
        	});
        },
        
        /**
         * Listen for events on a target object
         */        
        listenTo: function(target, event, callback) {
        	
        	target.on(event, callback);
        	
        	this.eventHash.push({target:target, event:event, callback:callback});
        }
    };
});