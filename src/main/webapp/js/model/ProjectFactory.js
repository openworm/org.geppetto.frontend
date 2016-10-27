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
 * Factory class with node creation methods. Used by RuntimeTreeFactory class
 * while population of run time tree using json object.
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {
        var ProjectNode = require('model/ProjectNode');
        var ExperimentNode = require('model/ExperimentNode');
        var SimulatorConfiguration = require('model/SimulatorConfiguration');

        /**
         * @class GEPPETTO.RuntimeTreeFactory
         */
        GEPPETTO.ProjectFactory =
        {
            /** Creates and populates client project nodes */
            createProjectNode: function (project, persisted) {
                var p = new ProjectNode(
                    {
                        name: project.name,
                        type: project.type,
                        id: project.id,
                        _metaType: GEPPETTO.Resources.PROJECT_NODE,
                    });

                p.persisted = persisted;
                
                for (var key in project.experiments) {
                    var experiment = project.experiments[key];
                    var e = this.createExperimentNode(experiment);

                    // add experiment to project
                    p[key] = e;
                    e.setParent(p);
                    // add experiment node to project
                    p.getExperiments().push(e);

                }

                GEPPETTO.Console.updateTags("Project", p, true);
                return p;
            },

            /** Creates and populates client aspect nodes for first time */
            createExperimentNode: function (node) {
                var e = new ExperimentNode(
                    {
                        name: node.name,
                        type: node.type,
                        id: node.id,
                        description: node.description,
                        lastModified: node.lastModified,
                        status: node.status,
                        script: node.script,
                        _metaType: GEPPETTO.Resources.EXPERIMENT_NODE,
                    });
                

                // create visualization subtree only at first
                for (var key in node.aspectConfigurations) {
                    var aC = node.aspectConfigurations[key];

                    var variables = aC.watchedVariables;
                    if (variables != null || variables != undefined) {
                        for (var key in variables) {
                            e.getWatchedVariables().push(variables[key]);
                        }
                    }
                    
                    var parameters = aC.modelParameters;
                    if (parameters != null || parameters != undefined) {
	                    for(var i=0;i<parameters.length;i++){
	                    	e.getSetParameters()[parameters[i].variable]=parameters[i].value;
	                    }
                    }

                    if (aC.simulatorConfiguration != null) {
                        var aspect = aC.instance;
                        var sC = this.createSimulatorConfigurationNode(aC.simulatorConfiguration, aspect);
                        sC.setParent(e);
                        // add simulator configuration node to experiment
                        e.addSimulatorConfiguration(aspect, sC);
                    }
                }

                return e;
            },

            /** Creates and populates client aspect nodes for first time */
            createSimulatorConfigurationNode: function (node, aspectInstancePath) {
                var sC = new SimulatorConfiguration(
                    {
                        parameters: node.parameters,
                        simulatorId: node.simulatorId,
                        conversionId: node.conversionServiceId,
                        aspectInstancePath: aspectInstancePath,
                        timeStep: node.timestep,
                        length: node.length,
                        _metaType: GEPPETTO.Resources.SIMULATOR_CONFIGURATION_NODE
                    });

                return sC;
            },
        };
    };
});
