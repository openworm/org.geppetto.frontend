define(function (require) {
    /**@lends Events*/
    var _ = require('underscore');

    /**
     * Events used as part of GEPPETTO Components
     *
     * @mixin Events
     */
    return {

        eventHash: [],

        /**
         * Clean up listeners
         */
        componentWillUnmount: function () {
            _.each(this.eventHash, function (listener) {
                listener.target.off(listener.event, listener.callback);
            });
        },

        /**
         * Listen for events on a target object
         */
        listenTo: function (target, event, callback) {

            target.on(event, callback);

            this.eventHash.push({target: target, event: event, callback: callback});
        }
    };
});