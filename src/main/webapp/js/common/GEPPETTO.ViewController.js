/**
 * Manages view-state behaviour
 *
 */
define(function(require)
{
    return function(GEPPETTO) {
        GEPPETTO.ViewController = {
            monitorInterval: undefined,
            anyComponentsDestroyed: false,

            resolveViews: function(){
                // apply persisted views if any for both project and experiment
                var projectView = window.Project.getView();
                var experimentView = null;
                if(window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined){
                    experimentView = window.Project.getActiveExperiment().getView();
                }
                this.applyView(projectView, experimentView);

                // local storage views
                var useLocalStorage = GEPPETTO.Main.localStorageEnabled && (typeof(Storage) !== "undefined");
                if (
                    (!Project.persisted && GEPPETTO.UserController.persistence && useLocalStorage) ||
                    (!GEPPETTO.UserController.persistence && useLocalStorage)
                ) {
                    // get project and experiment view from local storage if project is not persisted
                    var localProjectView = JSON.parse(localStorage.getItem("{0}_view".format(Project.getId())));
                    var localExperimentView = null;
                    if (window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined) {
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
                var that = this;
                this.monitorInterval = setInterval(function(){
                    that.monitorView()
                }, 1000);
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
                // retrieve list of widgets (components too in the future)
                var components = GEPPETTO.ComponentFactory.getComponents();
                var viewState = { views: {} };

                var anyChanges = false;

                for(var c in components){
                    // call getView API if the method is exposed and the component is not stateless
                    if(
                        // check if state-view API is implemented by the component
                        typeof components[c].getView == 'function' &&
                        // check that component is not stateless
                        components[c].stateless != undefined & !components[c].stateless
                    ) {
                        anyChanges = !anyChanges ? components[c].isDirty() : anyChanges;
                        // build object literal with view state for all the widgets/components
                        viewState.views[c] = components[c].getView();
                        // reset view as clean so we don't keep retrieving the same view if nothing changed
                        components[c].setDirty(false);
                    }
                }

                // set view on experiment or project
                if(
                    window.Project.getActiveExperiment()!=null &&
                    window.Project.getActiveExperiment()!=undefined &&
                    // check if any views were added or any components were destroyed
                    (anyChanges || this.anyComponentsDestroyed)
                ){
                    window.Project.getActiveExperiment().setView(viewState);
                    this.anyComponentsDestroyed = false;
                } else if (
                    // check if any views were added or any components were destroyed
                    anyChanges || this.anyComponentsDestroyed
                ){
                    window.Project.setView(viewState);
                    this.anyComponentsDestroyed = false;
                }
            }
        };
    };
});
