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
                GEPPETTO.Console.removeCommands(entity);
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
        		return persistedAndWriteMessage(this);
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
                GEPPETTO.trigger(Events.Experiment_active);
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
         * Gets an experiment from this project.
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
        		return persistedAndWriteMessage(this);
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
            GEPPETTO.trigger(Events.Project_loading);
            console.time(GEPPETTO.Resources.LOADING_PROJECT);
            GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.LOADING_PROJECT);

            var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

            if (projectID != null && projectID != "") {
                var parameters = {};
                parameters["experimentId"] = experimentID;
                parameters["projectId"] = projectID;
                GEPPETTO.MessageSocket.send("load_project_from_id", parameters);
                this.initializationTime = new Date();
                GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
                GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
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
            GEPPETTO.trigger(Events.Project_loading);
            GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.LOADING_PROJECT);

            var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

            if (projectURL != null && projectURL != "") {
                GEPPETTO.MessageSocket.send("load_project_from_url", projectURL);
                GEPPETTO.trigger(Events.Volatile_project_loaded);
                this.persisted = false;
                this.initializationTime = new Date();
                GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
                GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
                //trigger simulation restart event
                GEPPETTO.trigger(Events.Simulation_restarted);
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

        	GEPPETTO.trigger(Events.Project_loading);
            GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);

            console.time(GEPPETTO.Resources.LOADING_PROJECT);
            GEPPETTO.trigger('show_spinner', GEPPETTO.Resources.LOADING_PROJECT);

            var loadStatus = GEPPETTO.Resources.LOADING_PROJECT;

            if (content != null && content != "") {
                //Updates the simulation controls visibility

                GEPPETTO.MessageSocket.send("load_project_from_content", content);
                this.initializationTime = new Date();
                GEPPETTO.Console.debugLog("Message sent : " + this.initializationTime.getTime());
                GEPPETTO.Console.debugLog(GEPPETTO.Resources.MESSAGE_OUTBOUND_LOAD);
                //trigger simulation restart event

            }

            else {
                loadStatus = GEPPETTO.Resources.PROJECT_UNSPECIFIED;
            }
            return loadStatus;
        },

        saveProjectProperties: function (properties) {
        	if(this.writePermission && this.persisted && GEPPETTO.UserController.isLoggedIn()){
        		var parameters = {};
        		parameters["projectId"] = this.getId();
        		parameters["properties"] = properties;
        		GEPPETTO.MessageSocket.send("save_project_properties", parameters);
        	}else{
        		return persistedAndWriteMessage(this);
        	}
        },

        persist: function () {
        	if(this.writePermission && GEPPETTO.UserController.isLoggedIn()){
        		var parameters = {};
        		parameters["projectId"] = this.id;
        		GEPPETTO.MessageSocket.send("persist_project", parameters);
        	}else{
        		return persistedAndWriteMessage(this);
        	}
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
            	
        		GEPPETTO.FE.infoDialog(GEPPETTO.Resources.ERROR, message);
        		
            	return message;
            }
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
