

/**
 * Client class use to represent a library that contains a set of types.
 *
 * @module model/Library
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('./ObjectWrapper');
    var ImportType = require('./ImportType');


    function Library(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.types = (options.types != 'undefined') ? options.types : [];
        this.importTypes = [];
    };

    Library.prototype = Object.create(ObjectWrapper.prototype);
    Library.prototype.constructor = Library;


    /**
     * Get types for this library
     *
     * @command Library.getTypes()
     *
     * @returns {List<Type>} - list of Type objects
     *
     */
    Library.prototype.getTypes = function () {
        return this.types;
    };

    /**
     * Get combined children
     *
     * @command Library.getChildren()
     *
     * @returns {List<Object>} - List of children
     *
     */
    Library.prototype.getChildren = function () {
        return this.types;
    };

    Library.prototype.addImportType = function (importType) {
        this.importTypes.push(importType);
    };

    Library.prototype.removeImportType = function (importType) {
        this.importTypes.remove(importType);
    };
    
    Library.prototype.resolveAllImportTypes = function (callback) {
    	if(this.importTypes.length>0){
        	GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.RESOLVING_TYPES);
        	var b=[];
        	const BATCH = 50;
        	for(var i=0;i<this.importTypes.length;i++){
    			b.push(this.importTypes[i].getPath());
    		} 
        	while(b.length>BATCH){
        		GEPPETTO.Manager.resolveImportType(b.splice(0,BATCH));
    		}
        	GEPPETTO.Manager.resolveImportType(b, function(){
        		if(callback!=undefined){
        			callback();
        		} 
        		GEPPETTO.trigger(GEPPETTO.Events.Hide_spinner);
        	});
    	}

    };

    // Overriding set
    Library.prototype.setTypes = function (types) {

    	this.types=types;
    	
        for (var i = 0; i < types.length; i++) {
            if (types[i] instanceof ImportType) {
                this.addImportType(types[i]);
            }
        }
        
        return this;
    }
    
    // Overriding set
    Library.prototype.addType = function (type) {

    	type.setParent(this);
    	
    	// add to library in geppetto object model
    	this.types.push(type);
    	
        if (type instanceof ImportType) {
            this.addImportType(type);
        }
        
        return this;
    }

    return Library;
})
;