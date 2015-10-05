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
 * Client class use to represent an Aspect. It stores that aspect's properties
 * along with its population, visualization and model tree.
 *
 * @module nodes/AspectNode
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {

	var Node = require('nodes/Node');
	var SimulatorConfiguration = require('nodes/SimulatorConfiguration');

	return Node.Model
			.extend({
				modelInterpreterName : "",
				simulatorName : "",
				modelURL : "",
				selected : false,
				ModelTree : {},
				VisualizationTree : {},
				SimulationTree : {},
				visible : true,
				simulatorConfiguration : null,
				/**
				 * Initializes this node with passed attributes
				 *
				 * @param {Object} options - Object with options attributes to
				 *                           initialize node
				 */
				initialize : function(options) {
					this.id = options.id;
					this.modelInterpreterName = options.modelInterpreter;
					this.simulatorName = options.simulator;
					this.modelURL = options.model;
					this.instancePath = options.instancePath;
					this.name = options.name;
					this._metaType = options._metaType;
					this.domainType = options.domainType;
				},

				/**
				 * Hides the aspect
				 *
				 * @command AspectNode.hide()
				 *
				 */
				hide : function() {
					GEPPETTO.SceneController.hideAspect(this.instancePath);
					
					this.visible = false;

					var message = GEPPETTO.Resources.HIDE_ASPECT + this.instancePath;
					return message;
				},
				
				/**
				 * Shows the aspect
				 *
				 * @command AspectNode.show()
				 *
				 */
				show : function() {
					GEPPETTO.SceneController.showAspect(this.instancePath);

					this.visible = true;

					var message = GEPPETTO.Resources.SHOW_ASPECT + this.instancePath;
					return message;
				},
				
				/**
				 * Change the opacity of the aspect
				 *
				 * @command AspectNode.setOpacity(opacity)
				 *
				 */
				setOpacity:function(opacity) {
					GEPPETTO.SceneController.setOpacity(this.instancePath,opacity);
				},
				
				/**
				 * Change the opacity of the aspect
				 *
				 * @command AspectNode.setOpacity(opacity)
				 *
				 */
				setColor:function(color) {
					GEPPETTO.SceneController.setColor(this.instancePath,color);
				},
				
				

				/**
				 * Selects the aspect
				 *
				 * @command AspectNode.unselect()
				 *
				 */
				select : function() {
					var message;
					if (!this.selected) {
						if(G.getSelection().length>0) 
						{
							//something is already selected, we make everything not selected transparent
							GEPPETTO.SceneController.setGhostEffect(true);
						}
						else
						{
							//nothing is selected, we restore the default opacity for everything
							GEPPETTO.SceneController.setGhostEffect(false);
						}
						
						GEPPETTO.SceneController.selectAspect(this.instancePath);
						message = GEPPETTO.Resources.SELECTING_ASPECT + this.instancePath;
						this.selected = true;

						var parent  = this.getParent();
						while(parent!=null){
							parent.selected = true;
							parent = parent.getParent();
						}


						//Behavior: if the parent entity has connections change the opacity of what is not connected
						//Rationale: help exploration of networks by hiding non connected
						if(this.getParent().getConnections().length>0)
						{
							//allOtherMeshes will contain a list of all the non connected entities in the scene for the purpose
							//of changing their opacity
							var allOtherMeshes= $.extend({}, GEPPETTO.getVARS().meshes);
							//look on the simulation selection options and perform necessary
							//operations
							if(G.getSelectionOptions().show_inputs){
								var inputs=this.getParent().showInputConnections(true);
								for(var i in inputs)
								{
									delete allOtherMeshes[inputs[i]];
								}
							}
							if(G.getSelectionOptions().show_outputs){
								
								var outputs=this.getParent().showOutputConnections(true);
								for(var o in outputs)
								{
									delete allOtherMeshes[outputs[o]];
								}
							}
							if(G.getSelectionOptions().draw_connection_lines){
								this.getParent().showConnectionLines(true);
							}
							if(G.getSelectionOptions().hide_not_selected){
								G.showUnselected(true);
							}
							GEPPETTO.SceneController.ghostEffect(allOtherMeshes,true);		
						}
						//signal selection has changed in simulation
						GEPPETTO.trigger(Events.Select);
					} else {
						message = GEPPETTO.Resources.ASPECT_ALREADY_SELECTED;
					}

					return message;
				},

				/**
				 * Unselects the aspect
				 *
				 * @command AspectNode.unselect()
				 *
				 */
				unselect : function() {
					var message;
					G.showUnselected(false);
					if (this.selected) {
						message = GEPPETTO.Resources.UNSELECTING_ASPECT
								+ this.instancePath;
						GEPPETTO.SceneController.unselectAspect(this.instancePath);
						this.selected = false;

						var parent  = this.getParent();
						while(parent!=null){
							parent.selected = false;
							parent = parent.getParent();
						}

						//don't apply ghost effect to meshes if nothing is left selected after
						//unselecting this entity
						if(G.getSelection().length ==0){
							GEPPETTO.SceneController.setGhostEffect(false);
						}
						//update ghost effect after unselection of this entity
						else{
							GEPPETTO.SceneController.setGhostEffect(true);
						}

						//look on the simulation selection options and perform necessary
						//operations
						if(G.getSelectionOptions().show_inputs){
							this.getParent().showInputConnections(false);
						}
						if(G.getSelectionOptions().show_outputs){
							this.getParent().showOutputConnections(false);
						}
						if(G.getSelectionOptions().draw_connection_lines){
							this.getParent().showConnectionLines(false);
						}
						if(G.getSelectionOptions().hide_not_selected){
							G.showUnselected(false);
						}

						//trigger event that selection has been changed
						GEPPETTO.trigger(Events.Selection);
					} else {
						message = GEPPETTO.Resources.ASPECT_NOT_SELECTED;
					}
					return message;
				},

				/**
				 * Zooms to aspect
				 *
				 * @command AspectNode.zoomTo()
				 *
				 */
				 zoomTo : function(){
					 GEPPETTO.SceneController.zoomToMesh(this.instancePath);

					 return GEPPETTO.Resources.ZOOM_TO_ENTITY + this.instancePath;
			     },

				/**
				 * Get the model interpreter associated with aspect
				 *
				 * @command AspectNode.getId()
				 */
				getId : function() {
					return this.id;
				},

				/**
				 * Get this entity's children entities
				 *
				 * @command EntityNode.getChildren()
				 *
				 * @returns {List<Aspect>} All children e.g. aspects and
				 *          entities
				 *
				 */
				getChildren : function() {
					var subtrees = new Array();
					subtrees = subtrees.concat(this.SimulationTree);
					subtrees = subtrees.concat(this.VisualizationTree);
					subtrees = subtrees.concat(this.ModelTree);
					return subtrees;
				},

				/**
				 * Get the model interpreter associated with aspect
				 *
				 * @command AspectNode.getModelInterpreterName()
				 */
				getModelInterpreterName : function() {
					return this.modelInterpreterName;
				},

				/**
				 * Get the simulator interpreter associated with aspect
				 *
				 * @command AspectNode.getSimulatorName()
				 */
				getSimulatorName : function() {
					return this.simulatorName;
				},

				/**
				 * Get model URL associated with the aspect
				 *
				 * @command AspectNode.getModelURL()
				 */
				getModelURL : function() {
					return this.modelURL;
				},

				/**
				 * Get formatted model tree for this aspect
				 *
				 * @command AspectNode.getModelTree()
				 */
				getModelTree : function() {
					// empty model tree, request server for it

					if (this.ModelTree.getChildren().length == 0) {
						var parameters = {};
						parameters["experimentId"] = Project.getActiveExperiment().getId();
						parameters["projectId"] = Project.getId();
						parameters["instancePath"]=this.instancePath;
						GEPPETTO.MessageSocket.send("get_model_tree",
								parameters);

						return GEPPETTO.Resources.RETRIEVING_MODEL_TREE;
					}
					// model tree isn't empty, was requested previously and
					// stored
					else {
						return this.ModelTree;
					}
				},

				/**
				 * Get formatted simulation watch tree for this aspect.
				 *
				 * @command AspectNode.getSimulationTree()
				 */
				getSimulationTree : function() {
					var parameters = {};
					parameters["experimentId"] = Project.getActiveExperiment().getId();
					parameters["projectId"] = Project.getId();
					parameters["instancePath"]=this.instancePath;
					GEPPETTO.MessageSocket.send("get_simulation_tree",
					parameters);

					return GEPPETTO.Resources.RETRIEVING_SIMULATION_TREE;
				},

				/**
				 * Get formatted visualization watch tree for this aspect.
				 *
				 * @command AspectNode.getVisualizationTree()
				 */
				getVisualizationTree : function() {
					return this.VisualizationTree;
				},

				/**
				 * Write Model for this aspect
				 *
				 * @command AspectNode.downloadModel(format)
				 * * @param {String} name - File format to write
				 */
				downloadModel : function(format) {
					var parameters = {};
					parameters["experimentId"] = Project.getActiveExperiment().getId();
					parameters["projectId"] = Project.getId();
					parameters["instancePath"] = this.instancePath;
					parameters["format"] = format;
					GEPPETTO.MessageSocket.send("download_model", parameters);

					var formatMessage = (format=="")?"default format":format
					return GEPPETTO.Resources.DOWNLOADING_MODEL + formatMessage;
				},
				
				/**
				 * Download results for recording file
				 * 
				 * @command AspectNode.downloadResults(format)
				 */
				downloadResults : function(format)
				{
					if (this == window.Project.getActiveExperiment())
					{
						if (this.status == GEPPETTO.Resources.ExperimentStatus.COMPLETED)
						{
							var parameters =
							{};
							parameters["format"] = format;
							parameters["aspectPath"] = this.instancePath;
							parameters["experimentId"] = Project.getActiveExperiment().getId();
							parameters["projectId"] = Project.getId();
							GEPPETTO.MessageSocket.send("download_results", parameters);

							return "Sending request to download results.";
						} else
						{
							return "Experiment must be completed before attempting to download results";
						}
					} else
					{
						return "Experiment must be set to active before requesting results";
					}
				},

				/**
				 * Get Supported Outputs for this aspect
				 *
				 * @command AspectNode.writeModel(format)
				 */
				getSupportedOutputs : function() {
					var parameters = {};
					parameters["experimentId"] = Project.getActiveExperiment().getId();
					parameters["projectId"] = Project.getId();
					parameters["instancePath"] = this.instancePath;
					GEPPETTO.MessageSocket.send("get_supported_outputs", parameters);

					return GEPPETTO.Resources.RETRIEVING_SUPPORTED_OUTPUTS;
				},
				
				/**
				 * Get simulator configuration for this aspect
				 *
				 * @command AspectNode.getSimulatorConfiguration()
				 */
				uploadResults : function(format){
					return Project.getActiveExperiment().uploadResults(this.instancePath,format);
				},
				
				/**
				 * Get simulator configuration for this aspect
				 *
				 * @command AspectNode.getSimulatorConfiguration()
				 */
				uploadModel : function(format){
					return Project.getActiveExperiment().uploadModel(this.instancePath,format);
				},
				

				/**
				 * Get simulator configuration for this aspect
				 *
				 * @command AspectNode.getSimulatorConfiguration()
				 */
				getSimulatorConfiguration : function(){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath];
				},
				

				getTimeStep : function(){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].getTimeStep();
				},
				
				getSimulator : function(){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].getSimulator();
				},
				
				getSimulatorParameter : function(parameter){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].getSimulatorParameter(parameter);
				},
				
				getLength : function(){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].getLength();
				},
				
				getConversionService : function(){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].getConversionService();
				},

				setTimeStep : function(timeStep){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].setTimeStep(timeStep);
				},
				
				setSimulator : function(simulatorId){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].setSimulator(simulatorId);
				},
				
				setSimulatorParameter : function(parameter, value){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].setSimulatorParameter(parameter,value);
				},
				
				setLength : function(length){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].setLength(length);
				},
				
				setConversionService : function(conversionServiceId){
					return Project.getActiveExperiment().simulatorConfigurations[this.instancePath].setConversionService(conversionServiceId);
				},
				
				/**
				 * Print out formatted node
				 */
				print : function() {
					var formattedNode = "Name : " + this.name + "\n"
							+ "      Id: " + this.id + "\n"
							+ "      InstancePath : " + this.instancePath
							+ "\n" + "      SubTree : ModelTree \n"
							+ "      SubTree : VisualizationTree \n"
							+this.VisualizationTree+
							+ "      SubTree : SimulationTree \n"
							+ this.SimulationTree;

					return formattedNode;
				},
				
				/**
				 * Set the type of geometry to be used for this aspect
				 */
				setGeometryType : function(type, thickness)
				{
					if(GEPPETTO.SceneController.setGeometryType(this,type,thickness))
					{
						return "Geometry type successfully changed for "+this.instancePath; 
					}
					else
					{
						return "Error changing the geometry type for "+this.instancePath;
					}
				},
			});
});
