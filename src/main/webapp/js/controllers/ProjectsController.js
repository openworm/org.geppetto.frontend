/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
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

            getUserProjects: function(){
            	return this.userProjects;
            },

            getProjectStateVariables: function(projectId){
                return this.getProjectData(projectId, GEPPETTO.Resources.STATE_VARIABLE_TYPE);
            },

            getGlobalStateVariables: function(projectId, includeProject){
                return this.getProjectData(projectId, GEPPETTO.Resources.STATE_VARIABLE_TYPE, true, includeProject);
            },

            getProjectParameters: function(projectId){
                return this.getProjectData(projectId, GEPPETTO.Resources.PARAMETER_TYPE);
            },

            getGlobalParameters: function(projectId, includeProject){
                return this.getProjectData(projectId, GEPPETTO.Resources.PARAMETER_TYPE, true, includeProject);
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
                    if (experiments[j].status == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                        var dataSource = (dataType == GEPPETTO.Resources.STATE_VARIABLE_TYPE) ?
                            experiments[j].aspectConfigurations[0].watchedVariables :
                            experiments[j].aspectConfigurations[0].modelParameter;
                        data = data.concat(dataSource.map(
                            function (item) {
                                return {
                                    path: item,
                                    name: item,
                                    type: ['Model.common.' + (dataType == GEPPETTO.Resources.STATE_VARIABLE_TYPE) ? 'StateVariable' : 'Parameter'],
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

                return data;
            }
        };

        //We execute an asynchronous call to fetch all the projects for the current user
        $.ajax({
	        url: window.location.origin + window.location.pathname + "projects"
	    }).then(function(data) {
	    	GEPPETTO.ProjectsController.userProjects=data;
	    });
        
    }
});
