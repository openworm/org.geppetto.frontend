

/**
 * Client class use to augment a model with visual group capabilities
 *
 * @module model/AVisualGroupCapability
 * @author Giovanni Idili
 */

define(['jquery'], function (require) {
    return {
        capabilityId: 'VisualGroupCapability',
        visualGroups: [],

        /**
         * Get VisualGroups
         */
        getVisualGroups: function () {
            return this.visualGroups;
        },


        applyVisualGroup: function (visualGroup, mode) {
            visualGroup.show(mode, [this]);
        },

        /**
         * Get VisualGroups
         */
        setVisualGroups: function (visualGroups) {
            this.visualGroups = visualGroups;
        },
    }
});
