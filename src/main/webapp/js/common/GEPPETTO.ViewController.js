/**
 * Manages view-state behaviour
 *
 */
define(function(require)
{
    return function(GEPPETTO) {
        GEPPETTO.ViewController = {
            /**
             * Applies initial view state for project / experiment and sets up monitor
             */
            applyView: function(projectView, experimentView){
                // TODO: apply project view
                // TODO: apply experirment view
                // TODO: foreach view item
                    // TODO: create widget if it doesn't exist
                    // TODO: apply properties using setView API
                // TODO: setup monitor loop to track changes every 1000ms
            },

            /**
             * Monitors changes in the view
             */
            monitorView: function(){
                // TODO: retrieve list of widgets (components in future)
                // TODO: foreach widget/component in the list
                    // TODO: call getView API
                // TODO: build view json with view state for all the widgets/components
                // TODO: call a new setExperimentView method on the *new* web socket api
            }
        };
    };
});
