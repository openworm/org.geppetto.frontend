

/**
 * Client class for Project node.
 *
 * @module model/ProjectNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(['backbone'], function (require) {

    return Backbone.Model.extend({
        experiments: null,
        activeExperiment: null,
        initializationTime: null,
        name: "",
        id: "",
        persisted: false,
        runTimeTree: {},
        writePermission :  null,
        runPermission : null,
        downloadPermission : null,
        readOnly : true,
        isPublicProject : false,
        view: {},

        /**
         * Initializes this project with passed attributes
         *
         * @param {Object} options - Object with options attributes to initialize
         *                           node
         */
        initialize: function (options) {
            for (var experiment in this.experiments) {
                GEPPETTO.ExperimentsController.terminateWorker();               
                delete this.experiments[experiment];
            }
            for (var entity in this.runTimeTree) {
                GEPPETTO.CommandController.removeCommands(entity);
            }
            this.experiments = [];
            this.runTimeTree = {};
            if (options) {
                this.name = options.name;
                this.id = options.id;
            }
            
            this.writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
            this.runPermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.RUN_EXPERIMENT);
            this.downloadPermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.DOWNLOAD);
        },

        /**
         * Gets the name of the node
         *
         * @command Node.getName()
         * @returns {String} Name of the node
         *
         */
        getName: function () {
            return this.name;
        },

        /**
         * Sets the name of the node
         *
         * @command Node.setName()
         *
         */
        setName: function (newname) {
        	if(this.writePermission && this.persisted && GEPPETTO.UserController.isLoggedIn()){
                this.saveProjectProperties({"name": newname});
                this.name = newname;
        	}else{
        		return GEPPETTO.Utility.persistedAndWriteMessage(this);
        	}
        },

        /**
         * Get the id associated with node
         *
         * @command Node.getId()
         * @returns {String} ID of node
         */
        getId: function () {
            return this.id;
        },

        /**
         * Get experiments for this project
         *
         * @command ProjectNode.getExperiments()
         * @returns {Array} Array of ExperimentNodes
         */
        getExperiments: function () {
            return this.experiments;
        },

        /**
         * Get experiment by id
         *
         * @command ProjectNode.getExperimentById(id)
         * @returns {Array} Array of ExperimentNodes
         */
        getExperimentById: function (id) {
            var experiment = null;

            for (var i = 0; i < this.experiments.length; i++) {
                if (this.experiments[i].getId() == id) {
                    experiment = this.experiments[i];
                    break;
                }
            }

            return experiment;
        },

        /**
         * Set active experiment for this project
         *
         * @command ProjectNode.setActiveExperiment()
         * @param {ExperimentNode} experiment - Active Experiment
         */
        setActiveExperiment: function (experiment) {
            if(GEPPETTO.UserController.isLoggedIn()){
                this.activeExperiment = experiment;
                GEPPETTO.trigger(GEPPETTO.Events.Experiment_active);
            }else{
    			return GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + GEPPETTO.Resources.USER_NOT_LOGIN;
            }
        },

        /**
         * Get active experiment for this project
         *
         * @command ProjectNode.getActiveExperiment()
         * @returns ExperimentNode
         */
        getActiveExperiment: function () {
            return this.activeExperiment;
        },

        /**
         * Gets an experiment from this project.
         *
         * @command ProjectNode.getExperiment(name)
         * @returns {ExperimentNode} ExperimentNode for given name
         */
        getExperiment: function (name) {
            return this.experiments[name];
        },

        /**
         * Gets an experiment from this project.
         *
         * @command ProjectNode.getExperiment(name)
         * @returns {ExperimentNode} ExperimentNode for given name
         */
        getExperiment: function (name) {
            return this.experiments[name];
        },

        /**
         * Create new experiment for this project.
         *
         * @command ProjectNode.newExperiment()
         * @returns {ExperimentNode} Creates a new ExperimentNode
         */
        newExperiment: function () {
        	if(this.writePermission && this.persisted && GEPPETTO.UserController.isLoggedIn()){
                var parameters = {};
                parameters["projectId"] = this.id;
                GEPPETTO.MessageSocket.send("new_experiment", parameters);
        	}else{
        		return GEPPETTO.Utility.persistedAndWriteMessage(this);
        	}
        },

        /**
         * Create a set of new experiments for this project.
         *
         * @command ProjectNode.newExperiment()
         * @returns {ExperimentNode} Creates a new ExperimentNode
         */
        newExperimentBatch: function (experimentData, callback) {
            if(this.writePermission && this.persisted && GEPPETTO.UserController.isLoggedIn()){
                var parameters = {
                    projectId: this.id,
                    experiments: experimentData
                };
                GEPPETTO.MessageSocket.send("new_experiment_batch", JSON.stringify(parameters), callback);
            }else{
                return GEPPETTO.Utility.persistedAndWriteMessage(this);
            }
        },

        /**
         * Loads a project from content.
         *
         * @command Project.loadFromContent(projectID)
         * @param {URL} projectID - Id of project to load
         * @returns {String}  Status of attempt to load simulation using url.
         */
        loadFromID: function (projectID, experimentID) {

            GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
            GEPPETTO.trigger(GEPPETTO.Events.Project_loading);
            console.time(GEPPETTO.Resources.LOADING_PROJECT);
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_PROJECT);

            var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

            if (projectID != null && projectID != "") {
                var parameters = {};
                parameters["experimentId"] = experimentID;
                parameters["projectId"] = projectID;
                GEPPETTO.MessageSocket.send("load_project_from_id", parameters);
                this.initializationTime = new Date();
                GEPPETTO.CommandController.log("Message sent : " + this.initializationTime.getTime(), true);
                GEPPETTO.CommandController.log(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD, true);
            }

            else {
                loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
            }

            return loadStatus;
        },

        /**
         * Loads a project from url.
         *
         * @command Project.loadFromContent(projectURL)
         * @param {URL} simulationURL - URL of project to be loaded
         * @returns {String}  Status of attempt to load project using url.
         */
        loadFromURL: function (projectURL) {

            GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);

            console.time(GEPPETTO.Resources.LOADING_PROJECT);
            GEPPETTO.trigger(GEPPETTO.Events.Project_loading);
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_PROJECT);

            var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

            if (projectURL != null && projectURL != "") {
                GEPPETTO.MessageSocket.send("load_project_from_url", projectURL);
                this.persisted = false;
                this.initializationTime = new Date();
                GEPPETTO.CommandController.log("Message sent : " + this.initializationTime.getTime(), true);
                GEPPETTO.CommandController.log(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD, true);
                //trigger simulation restart event
                GEPPETTO.trigger(GEPPETTO.Events.Simulation_restarted);
            }

            else {
                loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
            }

            return loadStatus;
        },

        /**
         * Loads a project from content.
         *
         * @command Project.loadFromContent(content)
         * @param {String} content - Content of project to load
         * @returns {String}  Status of attempt to load project
         */
        loadFromContent: function (content) {

        	GEPPETTO.trigger(GEPPETTO.Events.Project_loading);
            GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);

            console.time(GEPPETTO.Resources.LOADING_PROJECT);
            GEPPETTO.trigger(GEPPETTO.Events.Show_spinner, GEPPETTO.Resources.LOADING_PROJECT);

            var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

            if (content != null && content != "") {
                //Updates the simulation controls visibility

                GEPPETTO.MessageSocket.send("load_project_from_content", content);
                this.initializationTime = new Date();
                GEPPETTO.CommandController.log("Message sent : " + this.initializationTime.getTime(), true);
                GEPPETTO.CommandController.log(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD, true);
                //trigger simulation restart event

            }

            else {
                loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
            }
            return loadStatus;
        },

        saveProjectProperties: function (properties) {
        	if(this.writePermission && this.persisted && GEPPETTO.UserController.isLoggedIn()&& !this.isReadOnly()){
        		var parameters = {};
        		parameters["projectId"] = this.getId();
        		parameters["properties"] = properties;
        		GEPPETTO.MessageSocket.send("save_project_properties", parameters);
        	}else{
        		return GEPPETTO.Utility.persistedAndWriteMessage(this);
        	}
        },

        persist: function () {
        	if(this.writePermission && GEPPETTO.UserController.isLoggedIn()){
        		var parameters = {};
        		parameters["projectId"] = this.id;
        		GEPPETTO.MessageSocket.send("persist_project", parameters);
        	}else{
        		return GEPPETTO.Utility.persistedAndWriteMessage(this);
        	}
        },
        
        makePublic : function(mode){
        	if(this.writePermission && GEPPETTO.UserController.isLoggedIn()){
        		var parameters = {};
        		parameters["projectId"] = this.id;
        		parameters["isPublic"] = mode;
        		GEPPETTO.MessageSocket.send("make_project_public", parameters);
        	}else{
        		return GEPPETTO.Utility.persistedAndWriteMessage(this);
        	}
        },
        
        isPublic : function(){
        	return this.isPublicProject;
        },
        
        isReadOnly : function(){
        	return this.readOnly;
        },

        /**
         * Download model for this project.
         *
         * @command ProjectNode.downloadModel(format)
         * * @param {String} name - File format to download
         */
        downloadModel : function(path, format) {
            if(this.downloadPermission && GEPPETTO.UserController.isLoggedIn()){
                var parameters = {};
                parameters["experimentId"] = this.getActiveExperiment().getId();
                parameters["projectId"] = this.getId();
                parameters["instancePath"] = path;
                parameters["format"] = format;
                GEPPETTO.MessageSocket.send("download_model", parameters);

                var formatMessage = (format=="")?"default format":format;
                return GEPPETTO.Resources.DOWNLOADING_MODEL + formatMessage;
            }else{
            	var message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + GEPPETTO.Resources.USER_NOT_LOGIN;
        		if(!GEPPETTO.UserController.isLoggedIn()){
        			return message;
        		}else{
        			message = GEPPETTO.Resources.OPERATION_NOT_SUPPORTED + GEPPETTO.Resources.DOWNLOAD_PRIVILEGES_NOT_SUPPORTED;
        		}
            	
        		GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.ERROR, message);
        		
            	return message;
            }
        },

        /**
         * Set project view
         *
         * @param view
         */
        setView: function(view){
            this.set('view', JSON.stringify(view));
            GEPPETTO.ExperimentsController.setView(view);
        },

        /**
         * Gets project view
         *
         * @returns {exports.view|{}}
         */
        getView: function(){
            var viewsString = this.get('view');
            var views = undefined;

            if(viewsString != undefined){
                views = JSON.parse(viewsString);
            }
            return views;
        },

         /*** Download this project.
         *
         * @command ProjectNode.downloadModel(format)
         * * @param {String} name - File format to download
         */
        download : function(path, format) {
        	var parameters = {};
        	parameters["projectId"] = this.getId();
        	GEPPETTO.MessageSocket.send("download_project", parameters);

        	return GEPPETTO.Resources.DOWNLOADING_PROJECT;
        },
        
        /**
         * Print out formatted node
         */
        print: function () {
            return "Name : " + this.name + "\n" + "    Id: " + this.id + "\n"
                + "    InstancePath : " + this.instancePath + "\n"
                + "    Properties : " + this.experiments + "\n";
        }
    });
});
