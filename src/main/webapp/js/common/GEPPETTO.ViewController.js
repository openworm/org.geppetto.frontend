/**
 * Manages view-state behaviour
 *
 */
define(function(require)
{
    return function(GEPPETTO) {
    	require('babel-polyfill');

        GEPPETTO.ViewController = {
            monitorInterval: undefined,
            anyComponentsDestroyed: false,

            resolveViews: function(){
                var useLocalStorage = GEPPETTO.Main.localStorageEnabled && (typeof(Storage) !== "undefined");
                var projectView = null;
                var experimentView = null;
                
                if (
                    (!Project.persisted && GEPPETTO.UserController.persistence && useLocalStorage) ||
                    (!GEPPETTO.UserController.persistence && useLocalStorage)
                ){
                    // get project and experiment view from local storage if project is not persisted
                    projectView = JSON.parse(localStorage.getItem("{0}_{1}_view".format(window.location.origin, Project.getId())));
                    if (window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined) {
                        experimentView = JSON.parse(localStorage.getItem("{0}_{1}_{2}_view".format(window.location.origin, Project.getId(), window.Project.getActiveExperiment().getId())));
                    }
                 }

                 if(projectView == undefined || projectView == null){
                	 //We have nothing in the local storage for the project
                	 projectView = window.Project.getView();
                 }
                 
                 if(experimentView == undefined || experimentView == null){
                	 //We have nothing in the local storage for the experiment
                     if(window.Project.getActiveExperiment() != null && window.Project.getActiveExperiment() != undefined){
                         experimentView = window.Project.getActiveExperiment().getView();
                     }
                 }

                this.applyView(projectView, experimentView);
            },

            /**
             * Applies initial view state for project / experiment and sets up monitor
             */
            applyView: function(projectView, experimentView){
                // stop monitor timer loop if there is already one active
                this.clearViewMonitor();

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

            applyViewToComponentOrCreate: async function(componentViews){
                if(componentViews != undefined){
                    for(var cv in componentViews){
                        // retrieve widget / component from factory
                        var componentsMap = GEPPETTO.ComponentFactory.getComponents()[componentViews[cv].widgetType];
                        var component = undefined;
                        for (var c in componentsMap){
                            if (cv === componentsMap[c].getId()){
                                component = componentsMap[c];
                                break;
                            }
                        }
                        
                        // widget / component not found, need to create it
                        if(component === undefined) {
                            // NOTE: this bit needs to be refactored once widgets/components are consolidated
                            if(componentViews[cv].widgetType != undefined && componentViews[cv].isWidget){
                                component = await GEPPETTO.ComponentFactory.addWidget(componentViews[cv].widgetType, {});
                                component.setView(componentViews[cv]);
                            } else if(componentViews[cv].componentType != undefined) {
                                // TODO: create component with component factory
                            }
                        }

                        else if(component !== undefined && component !== null && typeof component.setView == 'function'){
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
                var componentsMap = GEPPETTO.ComponentFactory.getComponents();
                var viewState = { views: {} };

                var anyChanges = false;

                for(var cm in componentsMap){
                    var components = componentsMap[cm];
                    for(var c in components){
                        // call getView API if the method is exposed and the component is not stateless
                        if(
                            // check if state-view API is implemented by the component
                            typeof components[c].getView == 'function' &&
                            // check that component is not stateless
                            components[c].isStateLess != undefined && !components[c].isStateLess()
                        ) {
                            anyChanges = !anyChanges ? components[c].isDirty() : anyChanges;
                            // build object literal with view state for all the widgets/components
                            viewState.views[components[c].getId()] = components[c].getView();
                            // reset view as clean so we don't keep retrieving the same view if nothing changed
                            components[c].setDirty(false);
                        }
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
            },

            clearViewMonitor: function(){
                // stop monitor timer loop if there is already one active
                if(this.monitorInterval != undefined){
                    clearInterval(this.monitorInterval);
                }
            }
        };
    };
});
