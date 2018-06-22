
/**
 * Controller responsible to manage the projects
 * @author Matteo Cantarelli
 * @author Giovanni Idili
 */
define(function (require) {
    return function (GEPPETTO) {
        /**
         * @class GEPPETTO.ProjectsController
         */
        GEPPETTO.ProjectsController =
        {
            userProjects: null,

            refreshUserProjects: function(callback){
                var that = this;
                //We execute an asynchronous call to fetch all the projects for the current user
                $.ajax({
                    url: window.location.origin + window.location.pathname + "projects"
                }).then(function(data) {
                    that.userProjects=data;
                    if(callback!=undefined){
                        callback();
                    }
                });
            },

            getUserProjects: function(){
            	return this.userProjects;
            },

            getProjectStateVariables: function(projectId){
                return this.getProjectData(projectId, GEPPETTO.Resources.STATE_VARIABLE);
            },

            getGlobalStateVariables: function(projectId, includeProject){
                return this.getProjectData(projectId, GEPPETTO.Resources.STATE_VARIABLE, true, includeProject);
            },

            getProjectParameters: function(projectId){
                return this.getProjectData(projectId, GEPPETTO.Resources.PARAMETER);
            },

            getGlobalParameters: function(projectId, includeProject){
                return this.getProjectData(projectId, GEPPETTO.Resources.PARAMETER, true, includeProject);
            },

            getProjectData: function (projectId, dataType, globalScope, includeProject) {
                if(globalScope == undefined){
                    globalScope = false;
                }
                if(includeProject == undefined){
                    includeProject = true;
                }

                var data = [];

                var projects = this.getUserProjects();

                // get all experiments from current project
                for (var i = 0; i < projects.length; i++) {
                    // include projectId only if include flag is true / inlcude other projects only if global flag is true
                    if ((projects[i].id == projectId) && includeProject) {
                        data = data.concat(this.getData(projects[i], dataType));
                    } else if ((projects[i].id != projectId) && globalScope){
                        data = data.concat(this.getData(projects[i], dataType));
                    }
                }

                return data;
            },

            getData: function (project, dataType) {
                var data = [];

                // get all state variables for completed experiments
                var experiments = project.experiments;
                for (var j = 0; j < experiments.length; j++) {
                    var dataSource = [];

                    // only get results from COMPLETED experiment for state variables, get everything for parameters
                    if(
                        dataType == GEPPETTO.Resources.STATE_VARIABLE && experiments[j].status == GEPPETTO.Resources.ExperimentStatus.COMPLETED
                        || dataType == GEPPETTO.Resources.PARAMETER
                    ){
                        if (experiments[j].aspectConfigurations != null ? (experiments[j].aspectConfigurations[0] != undefined ? true : false) : false) {
                            dataSource = (dataType == GEPPETTO.Resources.STATE_VARIABLE) ?
                                experiments[j].aspectConfigurations[0].watchedVariables :
                                experiments[j].aspectConfigurations[0].modelParameter;
                        }

                        if(dataSource!= undefined && dataSource!= null) {
                            data = data.concat(dataSource.map(
                                function (item) {
                                    return {
                                        path: (dataType == GEPPETTO.Resources.STATE_VARIABLE) ? item : item.variable,
                                        name: (dataType == GEPPETTO.Resources.STATE_VARIABLE) ? item : item.variable,
                                        fetched_value: (dataType == GEPPETTO.Resources.PARAMETER) ? item.value : undefined,
                                        unit: (dataType == GEPPETTO.Resources.PARAMETER) ? item.unit : undefined,
                                        type: ['Model.common.' + dataType],
                                        projectId: project.id,
                                        projectName: project.name,
                                        experimentId: experiments[j].id,
                                        experimentName: experiments[j].name,
                                        getPath: function () {
                                            return this.path;
                                        }
                                    }
                                })
                            );
                        }
                    }
                }

                return data;
            }
        };

        GEPPETTO.on(GEPPETTO.Events.Experiment_loaded, function() {
            // fetch at least every time and experiment is loaded
            GEPPETTO.ProjectsController.refreshUserProjects();
        });
    }
});
