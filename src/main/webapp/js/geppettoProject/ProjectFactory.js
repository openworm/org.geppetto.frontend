
/**
 * Factory class with node creation methods. Used by RuntimeTreeFactory class
 * while population of run time tree using json object.
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {
        var ProjectNode = require('./model/ProjectNode');
        var ExperimentNode = require('./model/ExperimentNode');
        var SimulatorConfiguration = require('./model/SimulatorConfiguration');

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
                        view: (project.view != undefined) ? project.view.viewStates : undefined,
                        _metaType: GEPPETTO.Resources.PROJECT_NODE
                    });

                p.persisted = persisted;
                p.isPublicProject = project.isPublic;
                
                for (var key in project.experiments) {
                    var experiment = project.experiments[key];
                    var e = this.createExperimentNode(experiment);

                    // add experiment to project
                    p[key] = e;
                    e.setParent(p);
                    // add experiment node to project
                    p.getExperiments().push(e);

                }

                GEPPETTO.CommandController.updateTags("Project", p, true);
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
                        view: (node.view != undefined) ? node.view.viewStates: undefined,
                        _metaType: GEPPETTO.Resources.EXPERIMENT_NODE,
                    });

                if(node.details!=null || undefined){
                    var details =  JSON.parse(node.details);
                    e.setDetails(details);
                }
                
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
