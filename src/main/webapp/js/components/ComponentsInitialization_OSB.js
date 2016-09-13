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
		
	    //Change this to prompt the user to switch to lines or not
	    GEPPETTO.SceneFactory.setLinesUserInput(false);
	    
		//This function will be called when the run button is clicked
		GEPPETTO.showExecutionDialog = function(callback){
			var formCallback = callback;
			
			var formId = "gptForm";
			
			var formName = "Run experiment";
			
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
					numberProcessors: 1
			};
			
			if(Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()]!=null||undefined){
				formData['timeStep']= Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getTimeStep();
				formData['length']= Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getLength();
				formData['simulator']=Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].getSimulator();
			}

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
							$("#experimentsOutput").find(".activeExperiment").find("td[name='name']").html(formObject.formData[key]).blur();
						}
						else if (key == 'timeStep'){
							$("#experimentsOutput").find(".activeExperiment").find("td[name='timeStep']").html(formObject.formData[key]).blur();
						}
						else if (key == 'length'){
							$("#experimentsOutput").find(".activeExperiment").find("td[name='length']").html(formObject.formData[key]).blur();				
						}
						else if (key == 'numberProcessors'){
							Project.getActiveExperiment().simulatorConfigurations[window.Instances[0].getId()].setSimulatorParameter('numberProcessors', formObject.formData[key]);
						}
						else if (key == 'simulator'){
							$("#experimentsOutput").find(".activeExperiment").find("td[name='simulatorId']").html(formObject.formData[key]).blur();
						}
						this.formData[key] = formObject.formData[key];
					}
				}
			};
	
			var formWidget = GEPPETTO.ComponentFactory.addComponent('FORM',
					{id: formId, name:formName, schema:schema, formData:formData, submitHandler:submitHandler, errorHandler:errorHandler, changeHandler:changeHandler});
		};

		//Function to add a dialog when run button is pressed
		GEPPETTO.Flows.addCompulsoryAction('GEPPETTO.showExecutionDialog', GEPPETTO.Resources.RUN_FLOW);
		
		//Logo initialization 
		GEPPETTO.ComponentFactory.addComponent('LOGO',	{logo: 'gpt-osb'}, document.getElementById("geppettologo"));
		
		//Tutorial component initialization
		GEPPETTO.ComponentFactory.addComponent('TUTORIAL', {}, document.getElementById("tutorial"));		
		GEPPETTO.Tutorial.setTutorial(Events.Experiment_loaded,"https://dl.dropboxusercontent.com/s/puwpjdy9u7bfm2s/osb_tutorial.json?dl=1");
		
		//Loading spinner initialization
		GEPPETTO.on('show_spinner', function(label) {
			GEPPETTO.ComponentFactory.addComponent('LOADINGSPINNER', {show : true, keyboard : false, text: label, logo: "gpt-osb"}, document.getElementById("modal-region"));	
		});
		
		//Save initialization 
		GEPPETTO.ComponentFactory.addComponent('SAVECONTROL', {}, document.getElementById("SaveButton"));

		//Control panel initialization
		GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {}, document.getElementById("controlpanel"));

		//Spotlight initialization
		GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {}, document.getElementById("spotlight"));

		//Home button initialization
		GEPPETTO.ComponentFactory.addComponent('DROPDOWNBUTTON', {label: ' Results', iconOn : 'fa fa-caret-square-o-up' , iconOff : 'fa fa-caret-square-o-down'}, document.getElementById("DropDownButton"));

		window.plotAllRecordedVariables=function(){
			Project.getActiveExperiment().playAll();
			var plt=G.addWidget(0).setName('Recorded Variables'); 
			$.each(Project.getActiveExperiment().getWatchedVariables(true,false),
				function(index,value){
					plt.plotData(value)
			});
		};
		
		window.getRecordedMembranePotentials=function(){
			var instances=Project.getActiveExperiment().getWatchedVariables(true,false);
			var v=[];
			for(var i=0;i<instances.length;i++){
				if(instances[i].getInstancePath().endsWith(".v")){
					v.push(instances[i]);
				}
			}
			return v;
		};
		
        var dropDownPanelConfig = [
	        {
        		label: "Plot all recorded variables",
    			action: "window.plotAllRecordedVariables();"
	        },
		    {
		    	label: "Play step by step",
		        action: "Project.getActiveExperiment().play({step:1});"
		    },
		    {
		    	label: "Play step by step (100x)",
		    	action: "Project.getActiveExperiment().play({step:100});"
		    },
            {
                label: "Apply voltage colouring to morphologies",
                condition: "GEPPETTO.G.isBrightnessFunctionSet()",
                false: {
                    action: "G.addBrightnessFunctionBulkSimplified(window.getRecordedMembranePotentials(), function(x){return (x+0.07)/0.1;});"
                },
                true: {
                    action: "G.removeBrightnessFunctionBulkSimplified(window.getRecordedMembranePotentials(),false);"
                }
            },
            {
                label: "Show simulation time",
                action: "G.addWidget(5).setName('Simulation time').setVariable(time);"
            }
        ];

		//FIXME Combine the dropdown button and the panel
		var dropDownPanelPosition = {top : 40, right : 244};
		
		GEPPETTO.ComponentFactory.addComponent('DROPDOWNPANEL', {configuration : dropDownPanelConfig, position : dropDownPanelPosition, openByDefault : false}, document.getElementById("dropDownPanel"));
		
		//Foreground initialization
		GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {}, document.getElementById("foreground-toolbar"));

		//Experiments table initialization
		GEPPETTO.ComponentFactory.addComponent('EXPERIMENTSTABLE', {}, document.getElementById("experiments"));

		//Home button initialization
		GEPPETTO.ComponentFactory.addComponent('HOME', {}, document.getElementById("HomeButton"));

		//Simulation controls initialization
		GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

		//Camera controls initialization
		GEPPETTO.ComponentFactory.addComponent('CAMERACONTROLS', {}, document.getElementById("camera-controls"));
		
		window.loadConnections = function(){
			Model.neuroml.resolveAllImportTypes(function(){ $(".osb-notification-text").html(Model.neuroml.importTypes.length+" projections and "+Model.neuroml.connection.getVariableReferences().length+ " connections were successfully loaded.");});
		};
		
        GEPPETTO.on(Events.Model_loaded, function () {
			if(Model.neuroml!=undefined && Model.neuroml.importTypes!=undefined && Model.neuroml.importTypes.length>0){
				$('#mainContainer').append('<div class="alert alert-warning osb-notification alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span class="osb-notification-text">'+Model.neuroml.importTypes.length+' projections in this model have not been loaded yet. <a href="javascript:loadConnections();" class="alert-link">Click here to load the connections.</a> (Note: depending on the size of the network this could take some time).</span></div>');
			}
    
        });
        
        GEPPETTO.on(Events.Project_loading, function () {
				$('.osb-notification').remove();
        });
	};
});
