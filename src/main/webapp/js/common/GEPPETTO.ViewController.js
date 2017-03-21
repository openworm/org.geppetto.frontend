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
                if(projectView != undefined && projectView.views != undefined){
                    this.applyViewToComponentOrCreate(projectView.views);
                }

                if(experimentView != undefined && experimentView.views != undefined) {
                    this.applyViewToComponentOrCreate(experimentView.views);
                }

                // setup monitor loop to track changes every 1000ms
                this.monitorInterval = setInterval(this.monitorView, 1000);
            },

            applyViewToComponentOrCreate: function(componentViews){
                if(componentViews != undefined){
                    for(var cv in componentViews){
                        // retrieve widget / component from factory
                        var component = GEPPETTO.ComponentFactory.getComponents()[cv];
                        // widget / component not found, need to create it
                        if(component == undefined) {
                            // NOTE: this bit needs to be refactored once widgets/components are consolidated
                            if(componentViews[cv].widgetType != undefined){
                                component = GEPPETTO.WidgetFactory.addWidget(componentViews[cv].widgetType);
                            } else if(componentViews[cv].componentType != undefined) {
                                // TODO: create component with component factory
                            }
                        }

                        if(typeof component.setView == 'function'){
                            // if the interface is exposed, set view
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