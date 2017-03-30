/**
 * Manages view-state behaviour
 *
 */
define(function(require)
{
    return function(GEPPETTO) {
        GEPPETTO.ViewController = {
            monitorInterval: undefined,

            resolveViews: function(){
                // apply persisted views if any for both project and experiment
                var projectView = window.Project.getView();
                var experimentView = null;
                if(window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined){
                    experimentView = window.Project.getActiveExperiment().getView();
                }
                this.applyView(projectView, experimentView);

                // local storage views
                if(!Project.persisted && GEPPETTO.Main.localStorageEnabled && (typeof(Storage) !== "undefined")){
                    // get project and experiment view from local storage if project is not persisted
                    var localProjectView = JSON.parse(localStorage.getItem("{0}_view".format(Project.getId())));
                    var localExperimentView = null;
                    if(window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined) {
                        localExperimentView = JSON.parse(localStorage.getItem("{0}_{1}_view".format(Project.getId(), window.Project.getActiveExperiment().getId())));
                    }
                    // apply local experiment view
                    this.applyView(localProjectView, localExperimentView);
                }
            },

            /**
             * Applies initial view state for project / experiment and sets up monitor
             */
            applyView: function(projectView, experimentView){
                // stop monitor timer loop if there is already one active
                if(this.monitorInterval != undefined){
                    clearInterval(this.monitorInterval);
                }

                // if we have an experiment view for the active experiment with something, apply that and ignore the project view
                if(experimentView != undefined && experimentView.views != undefined && Object.keys(experimentView.views).length > 0) {
                    this.applyViewToComponentOrCreate(experimentView.views);
                } else if(projectView != undefined && projectView.views != undefined){
                    // if the experiment view is not there or is empty, apply project view (default)
                    // NOTE: this will effectively propagate the view from project to experiment in the next monitor cycle
                    this.applyViewToComponentOrCreate(projectView.views);
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

                // set view on experiment or project
                if(window.Project.getActiveExperiment()!=null && window.Project.getActiveExperiment()!=undefined){
                    window.Project.getActiveExperiment().setView(viewState);
                } else {
                    window.Project.setView(viewState);
                }
            }
        };
    };
});
