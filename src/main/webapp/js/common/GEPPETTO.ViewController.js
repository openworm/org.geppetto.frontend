/**
 * Manages view-state behaviour
 *
 */
define(function(require)
{
    return function(GEPPETTO) {
        GEPPETTO.ViewController = {
            monitorInterval: undefined,

            /**
             * Applies initial view state for project / experiment and sets up monitor
             */
            applyView: function(projectView, experimentView){
                // stop monitor timer loop if there is already one active
                if(this.monitorInterval != undefined){
                    clearInterval(this.monitorInterval);
                }

                // apply project and experiment view
                this.applyViewToComponentOrCreate(projectView.views);
                this.applyViewToComponentOrCreate(experimentView.views);

                // setup monitor loop to track changes every 1000ms
                this.monitorInterval = setInterval(this.monitorView, 1000);
            },

            applyViewToComponentOrCreate: function(componentViews){
                if(componentViews != undefined){
                    for(var cv in componentViews){
                        // TODO: check if exists and create widget/component if not
                        var component = GEPPETTO.ComponentFactory.getComponents()[cv];
                        if(component != undefined && typeof component.setView == 'function'){
                            component.setView(componentViews[cv]);
                        }
                    }
                }
            },

            /**
             * Monitors changes in the view
             */
            monitorView: function(){
                // retrieve list of widgets (components in future)
                var components = GEPPETTO.ComponentFactory.getComponents();
                var viewState = { views: {} };

                for(var c in components){
                    // call getView API if the method is exposed
                    if(typeof components[c].getView == 'function'){
                        // build object literal with view state for all the widgets/components
                        viewState.views[c] = components[c].getView();
                    }
                }

                // persist view
                GEPPETTO.ExperimentsController.setView(viewState);
            }
        };
    };
});
