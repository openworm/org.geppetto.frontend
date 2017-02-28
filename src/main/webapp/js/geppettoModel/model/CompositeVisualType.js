

/**
 * Client class use to represent a composite type.
 *
 * @module model/CompositeVisualType
 * @author Giovanni Idili
 */
define(function (require) {
    var CompositeType = require('./CompositeType');

    function CompositeVisualType(options) {
        CompositeType.prototype.constructor.call(this, options);
        this.visualGroups = (options.visualGroups != 'undefined') ? options.visualGroups : [];
    };

    CompositeVisualType.prototype = Object.create(CompositeType.prototype);
    CompositeVisualType.prototype.constructor = CompositeVisualType;

    /**
     * Get the visual groups
     *
     * @command CompositeVisualType.getVisualGroups()
     *
     * @returns {List<VisualGroup>} - List of variables
     *
     */
    CompositeVisualType.prototype.getVisualGroups = function () {
        return this.visualGroups;
    };

    /**
     * Get combined children
     *
     * @command CompositeType.getChildren()
     *
     * @returns {List<Object>} - List of children
     *
     */
    CompositeVisualType.prototype.getChildren = function () {
        var vg = this.visualGroups;
        if (vg) {
            return this.variables.concat(vg);
        }
        else {
            return this.variables;
        }

    };

    return CompositeVisualType;
});
