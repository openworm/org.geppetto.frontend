

/**
 * Client class use to represent an array element instance.
 *
 * @module model/ArrayElementInstance
 * @author Giovanni Idili
 */
define(function (require) {

    var Instance = require('./Instance');

    function ArrayElementInstance(options) {
        Instance.prototype.constructor.call(this, options);
        this.index = options.index;
    };


    ArrayElementInstance.prototype = Object.create(Instance.prototype);
    ArrayElementInstance.prototype.constructor = ArrayElementInstance;

    ArrayElementInstance.prototype.getIndex = function () {
        return this.index;
    };

    ArrayElementInstance.prototype.delete = function () {
        var children = [].concat(this.getChildren());
        for (var c = 0; c < children.length; c++) {
            children[c].delete();
        }

        GEPPETTO.ModelFactory.deleteInstance(this);
    };


    ArrayElementInstance.prototype.getInstancePath = function () {
        var parent = this.getParent();
        var parentPath = "";
        var parentId = "";

        if (parent != null && parent != undefined) {
            parentPath = parent.getInstancePath();
            parentId = parent.getId();
        }

        var path = parentPath.replace(parentId, this.getId());

        return (parentPath != "") ? path : this.getId();
    };

    ArrayElementInstance.prototype.getPosition = function () {

        if ((this.getVariable().getType().getDefaultValue().elements != undefined) &&
            (this.getVariable().getType().getDefaultValue().elements[this.getIndex()] != undefined)) {
            return this.getVariable().getType().getDefaultValue().elements[this.getIndex()].position;
        }

    };

    ArrayElementInstance.prototype.getTypes = function () {
        return [this.getVariable().getType().getType()];
    };

    ArrayElementInstance.prototype.getType = function () {
        var types = this.getTypes();
        if (types.length == 1) {
            return types[0];
        }
        else return types;
    };

    return ArrayElementInstance;
});

