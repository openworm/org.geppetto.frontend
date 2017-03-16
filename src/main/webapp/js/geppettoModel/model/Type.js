

/**
 * Client class use to represent a simple type.
 *
 * @module model/Type
 * @author Giovanni Idili
 * @author Matteo Cantarelli
 */
define(function (require) {
    var ObjectWrapper = require('./ObjectWrapper');
    var Variable = require('./Variable');

    function Type(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
        this.visualType = options.visualType;
        this.superType = (options.superType != undefined) ? options.superType : [];
        this.capabilities = [];
        this.variableReferences = [];
    };

    Type.prototype = Object.create(ObjectWrapper.prototype);
    Type.prototype.constructor = Type;

    /**
     * Gets the default value for this type
     *
     * @command Type.getDefaultValue()
     *
     * @returns {Object} - Default value
     *
     */
    Type.prototype.getDefaultValue = function () {
        return this.wrappedObj.defaultValue;
    };

    /**
     * Gets the super type for this type
     *
     * @command Type.getSuperType()
     *
     * @returns {List<Type>} - Super type
     *
     */
    Type.prototype.getSuperType = function () {
        var superType = this.superType;

        if (superType != undefined && this.superType.length == 1) {
            superType = superType[0];
        }

        return superType;
    };

    /**
     * Check if the type is abstract
     *
     * @command Type.isAbstract()
     *
     * @returns {Boolean} - Boolean indicating if the type is abstract
     *
     */
    Type.prototype.isAbstract = function () {
        return this.wrappedObj.abstract;
    };

    /**
     * Gets the visual type for this type if any
     *
     * @command Type.getVisualType()
     *
     * @returns {Type} - Super type
     *
     */
    Type.prototype.getVisualType = function () {
        return this.visualType;
    };


    /**
     * Extends with methods from another object
     *
     * @command Type.extendApi(extensionObj)
     */
    Type.prototype.extendApi = function (extensionObj) {
        $.extend(this, extensionObj);
        this.capabilities.push(extensionObj.capabilityId);
    };

    /**
     * Checks if the instance has a given capability
     *
     * @command Type.hasCapability(capabilityId)
     *
     * @returns {Boolean}
     */
    Type.prototype.hasCapability = function (capabilityId) {
        var hasCapability = false;
        var capabilities = this.capabilities;

        for (var i = 0; i < capabilities.length; i++) {
            if (capabilities[i] === capabilityId) {
                hasCapability = true;
            }
        }

        return hasCapability;
    };

    /**
     *
     * @param v
     */
    Type.prototype.addVariableReference = function (v) {
        this.variableReferences.push(v);
    };

    /**
     *
     * @returns {Array}
     */
    Type.prototype.getVariableReferences = function () {
        return this.variableReferences;
    };
    
    Type.prototype.getPath = function () {
       if (this.parent!=undefined & this.parent instanceof Variable) {
    	   //if this is an anonymous type it doesn't have an id, hence we skip it
    	   return this.parent.getPath();
       }
       else{
    	   return ObjectWrapper.prototype.getPath.call(this);
       }
   };

    Type.prototype.typeOf = function (type){
        var match = false;

        if(type.getPath() == this.getPath()){
            // check if it's the same type
            match = true;
        } else {
            // recurse on parents and figure out if there is a type in the inheritance chain
            var superTypes = type.superType;

            for(var i=0; i<superTypes.length; i++) {
                match = this.typeOf(superTypes[i]);
                if(match){
                    break;
                }
            }
        }

        return match;
    };
    
    return Type;
});
