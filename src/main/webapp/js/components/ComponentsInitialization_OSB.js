/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
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



define(function (require) {
	
	return function (GEPPETTO) {

	    var link = document.createElement("link");
	    link.type = "text/css";
	    link.rel = "stylesheet";
	    link.href = "geppetto/js/components/OSB.css";
	    document.getElementsByTagName("head")[0].appendChild(link);
		
		//This function will be called when the run button is clicked
		GEPPETTO.showExecutionDialog = function(callback){
			var formCallback = callback;
			
			var formId = "gptForm";
			
			var formName = "Simulation Form";
			
			var schema = {
				  type: "object",
				  required: ["experimentName", "timeStep", "length", "simulator", "numberProcessors"],
				  properties: {
					experimentName: {type: "string", title: "Experiment Name"},
					timeStep:{type:'number', title: 'Time Step (s)'},
					length:{type:'number', title: 'Length (s)'},
					simulator:{
					      type: "string",
					      title: "Simulator",
					      enum: ["neuronSimulator", "lemsSimulator", "neuronNSGSimulator"],
					      enumNames: ["Neuron", "jLems", "Neuron on NSG"]
					},
	
					numberProcessors:{type:'number', title: 'Number of Processors'}
				  }
				};
	
			var formData= {
					experimentName: Project.getActiveExperiment().getName(),
					timeStep: Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getTimeStep(),
					length: Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getLength(),
					simulator:Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getSimulator(),
					numberProcessors: 1
			};
			
			var submitHandler = function(){
				GEPPETTO.Flows.showSpotlightForRun(formCallback);
				$("#" + formWidget.props.id + "_container").remove();
			};
			
			var errorHandler = function(){
				
			};
			
			var changeHandler = function(formObject){
				for (var key in formObject.formData) {
					if (formObject.formData[key] != this.formData[key]){
						if (key == 'experimentName'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='name']").html(formObject.formData[key]).blur();
						}
						else if (key == 'timeStep'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='timeStep']").html(formObject.formData[key]).blur();
						}
						else if (key == 'length'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='length']").html(formObject.formData[key]).blur();					
						}
						else if (key == 'simulator'){
							Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].setSimulatorParameter('numberProcessors', formObject.formData[key]).blur();
						}
						else if (key == 'numberProcessors'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='simulatorId']").html(formObject.formData[key]).blur();
						}
						this.formData[key] = formObject.formData[key];
					}
				}
			};
	
			var formWidget = GEPPETTO.ComponentFactory.addComponent('FORM',
					{id: formId, name:formName, schema:schema, formData:formData, submitHandler:submitHandler, errorHandler:errorHandler, changeHandler:changeHandler});
		};
	
		//Function to illustrate how panel component works
		GEPPETTO.showingPanelConcept = function(){
			var formId = "gptForm";
			
			var formName = "Simulation Form";
			
			var schema = {
				  type: "object",
				  required: ["experimentName", "timeStep", "length", "simulator", "numberProcessors"],
				  properties: {
					experimentName: {type: "string", title: "Experiment Name"},
					timeStep:{type:'number', title: 'Time Step (s)'},
					length:{type:'number', title: 'Length (s)'},
					simulator:{
					      type: "string",
					      title: "Simulator",
					      enum: ["neuronSimulator", "lemsSimulator", "neuronNSGSimulator"],
					      enumNames: ["Neuron", "jLems", "Neuron on NSG"]
					},
	
					numberProcessors:{type:'number', title: 'Number of Processors'}
				  }
				};
	
			var formData= {
					experimentName: Project.getActiveExperiment().getName(),
					timeStep: Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getTimeStep(),
					length: Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getLength(),
					simulator:Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getSimulator(),
					numberProcessors: 1
			};
			
			var submitHandler = function(){
				GEPPETTO.Flows.showSpotlightForRun(formCallback);
				$("#" + formWidget.props.id + "_container").remove();
			};
			
			var errorHandler = function(){
				
			};
			
			var changeHandler = function(formObject){
				for (var key in formObject.formData) {
					if (formObject.formData[key] != this.formData[key]){
						if (key == 'experimentName'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='name']").html(formObject.formData[key]).blur();
						}
						else if (key == 'timeStep'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='timeStep']").html(formObject.formData[key]).blur();
						}
						else if (key == 'length'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='length']").html(formObject.formData[key]).blur();					
						}
						else if (key == 'simulator'){
							Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].setSimulatorParameter('numberProcessors', formObject.formData[key]).blur();
						}
						else if (key == 'numberProcessors'){
							$("#experimentsOutput").find(".activeExperiment").find("td[field='simulatorId']").html(formObject.formData[key]).blur();
						}
						this.formData[key] = formObject.formData[key];
					}
				}
			};
			
			var panelChildren = [];
			panelChildren.push(GEPPETTO.ComponentFactory.getComponent('LOGO',{}));
			panelChildren.push(GEPPETTO.ComponentFactory.getComponent('FORM',{id: "pp2", name:"mm", schema:schema, formData:formData, submitHandler:submitHandler, errorHandler:errorHandler, changeHandler:changeHandler}));
			
			var panelComponent = GEPPETTO.ComponentFactory.addComponent('PANEL', {id: "kklr", name:"pl"});
			panelComponent.addChildren(panelChildren);
		};
	
		//Function to add a dialog when run button is pressed
		GEPPETTO.Flows.addCompulsoryAction('GEPPETTO.showExecutionDialog', GEPPETTO.Resources.RUN_FLOW);
		
		//Logo initialization 
		GEPPETTO.ComponentFactory.addComponent('LOGO',	{logo: 'gpt-osb'}, document.getElementById("geppettologo"));
		
		//Loading spinner initialization
		GEPPETTO.on('show_spinner', function(label) {
			GEPPETTO.ComponentFactory.addComponent('LOADINGSPINNER', {show : true, keyboard : false, text: label, logo: "gpt-osb"}, document.getElementById("modal-region"));	
		});
	};
});