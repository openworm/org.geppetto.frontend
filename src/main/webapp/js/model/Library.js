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
 * Client class use to represent a library that contains a set of types.
 *
 * @module model/Library
 * @author Giovanni Idili
 */
define(function (require) {
    var ObjectWrapper = require('model/ObjectWrapper');
    var ImportType = require('model/ImportType');


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
        	GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.RESOLVING_TYPES);
        	var b=[];
        	const BATCH = 50;
        	for(var i=0;i<this.importTypes.length;i++){
    			b.push(this.importTypes[i].getPath());
    		} 
        	while(b.length>BATCH){
        		GEPPETTO.SimulationHandler.resolveImportType(b.splice(0,BATCH));
    		}
        	GEPPETTO.SimulationHandler.resolveImportType(b, function(){
        		if(callback!=undefined){
        			callback();
        		} 
        		GEPPETTO.trigger("hide:spinner");
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