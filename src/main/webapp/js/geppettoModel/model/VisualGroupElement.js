

/**
 * Client class use to represent a VisualGroupElement Node, used for visualization tree
 * properties.
 *
 * @module model/VisualGroupElement
 * @author Jesus R. Martinez (jesus@metacell.us)
 * @author Giovanni Idili
 */
define(function (require) {

    var ObjectWrapper = require('./ObjectWrapper');

    function VisualGroupElement(options) {
        ObjectWrapper.prototype.constructor.call(this, options);
    };

    VisualGroupElement.prototype = Object.create(ObjectWrapper.prototype);
    VisualGroupElement.prototype.constructor = VisualGroupElement;

    /**
     * Get value of quantity
     *
     * @command VisualGroupElement.getValue()
     * @returns {String} Value of quantity
     */
    VisualGroupElement.prototype.getValue = function () {
        var param = this.wrappedObj.parameter;

        if (param == "" || param == undefined) {
            return null;
        }

        return param.value;
    };

    /**
     * Get unit of quantity
     *
     * @command VisualGroupElement.getUnit()
     * @returns {String} Unit of quantity
     */
    VisualGroupElement.prototype.getUnit = function () {
        var param = this.wrappedObj.parameter;

        if (param == "" || param == undefined) {
            return null;
        }

        return param.unit.unit;
    };
    
    /**
     * Get color of element
     *
     * @command VisualGroupElement.getValue()
     * @returns {String} Color of VisualGroupElement
     */
    VisualGroupElement.prototype.getColor = function () {
        return this.wrappedObj.defaultColor;
    };


    /**
     * Print out formatted node
     */
    VisualGroupElement.prototype.print = function () {
        return "Name : " + this.getName() + "\n" + "    Id: " + this.getId() + "\n";
    };

    VisualGroupElement.prototype.show = function (mode, instances) {

        if (instances == undefined) {
            instances = GEPPETTO.ModelFactory.getAllInstancesOf(this.getParent().getParent());
        }
        
        for (var i = 0; i < instances.length; i++) {
            GEPPETTO.SceneController.showVisualGroupsForInstance(instances[i], this);

        }
    };

    return VisualGroupElement;
});