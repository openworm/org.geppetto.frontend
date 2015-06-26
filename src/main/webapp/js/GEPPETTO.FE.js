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
 * Front end, user interface, methods for handling updates to the UI
 *
 */
define(function(require) {

    return function(GEPPETTO) {

        var React = require('react'),
                $ = require('jquery'),
                InfoModal = require('jsx!components/popups/InfoModal'),
                ErrorModal = require('jsx!components/popups/ErrorModal');
        /**
         * Create the container for holding the canvas
         * @class GEPPETTO.FE
         */
        GEPPETTO.FE = {
        		
        	//variable to keep track of experiments rendered, used for giving alternate routes
            //different css backgrounds
            nth : 1,
            /*
             * Handles events that are executed as soon as page is finished loading
             */
            initialEvents: function() {

                GEPPETTO.Console.createConsole();

                GEPPETTO.Vanilla.enableKeyboard(false);

                /*
                 * Dude to bootstrap bug, multiple modals can't be open at same time. This line allows
                 * multiple modals to be open simultaneously without going in an infinite loop.
                 */
                $.fn.modal.Constructor.prototype.enforceFocus = function() {
                };
            },
            /**
             * Enables controls after connection is established
             */
            postSocketConnection: function() {
                GEPPETTO.Vanilla.enableKeyboard(true);
            },
            createContainer: function() {
                $("#sim canvas").remove();
                return $("#sim").get(0);
            },
            
            /**
             * Handles updates for experiments table once user has set the active
             * experiment
             */
            setActiveExperimentLabel : function(){
            	var experiment = window.Project.getActiveExperiment();

            	/*Add active label on top of screen*/
            	//Active label already exists, replace with new name of new active experiment
            	if( $('#activeLabel').length )
            	{
            		//active
            		$('#activeLabel').text(experiment.getName());
            	}else{
            		//Add label to top of screen as it doesn't exist
            		var activeExperimentLabel =$("<div class='activeExpLabel' id='activeLabel'>"+
            				experiment.getName()+"</div>");
            		activeExperimentLabel.appendTo($("#sim-toolbar"));
            	}

            	//loop through each row of experiments table
            	$('#experimentsTable tbody tr').each(function(){
            		//id of row matches that of active experiment
            		if (this.id == ("#"+experiment.getId())) {
            			//add class to make it clear it's active
            			$(this).addClass("activeExperiment");
            			if($(this).attr("rowType")=="main"){
            				var activeIcon = $("#activeIcon-"+experiment.getId());
            				activeIcon.remove();
            			}
            		}else{
            			//remove class from active experiment
            			$(this).removeClass("activeExperiment");
            		}
            	});
            },

            /**
             * Populates the experiments table
             */
            populateExperimentsTable : function(){            	
            	var experiments = window.Project.getExperiments();

            	for(var key in experiments){
            		var experiment = experiments[key];
            		//retrieve experiments table html component
            		var experimentsTable = document.getElementById("experimentsTable");
            		
            		var tr = GEPPETTO.FE.createExperimentRow(experiment);
            		
            		tr.appendTo(experimentsTable);
            		
            		var expandableRow = GEPPETTO.FE.createExpandableRow(experiment);
            		expandableRow.appendTo(experimentsTable);
            		this.nth++;
            	}

            	//method handles most of events for clickable elements in this table
            	GEPPETTO.FE.handleExperimentsTableControls();
    			GEPPETTO.Main.startStatusWorker();
            },

            /**
             * Handles experimets table events
             */
            handleExperimentsTableControls : function(){            	
            	$('#console').bind('resize', function(){
            		var consoleHeight = $(this).height();
            		//var experiments = $("#experiments").height(consoleHeight+40);
            	});            	
            	
            	//handle hovering over each row
            	$('#experimentsTable tbody tr').hover(function() {               
            		$(this).find(".iconsDiv").show();
            	}, function() {
            		$(this).find(".iconsDiv").hide();
            	}); 

            	//Handles new experiment button click
            	$("#new_experiment").click(function(){
            		GEPPETTO.Console.executeCommand("Project.newExperiment();");
            	});

        		//listenern for active icon button
        		$(".activeIcon").click(function(){
        			var experimentId = $(this).attr("experimentId");
        			var experiment;
        			var experiments = window.Project.getExperiments();
        			for(var e in experiments){
        				if(experiments[e].getId() == experimentId){
        					experiment = experiments[e];
        				}
        			}
        			var index = experiments.indexOf(experiment);
        			GEPPETTO.Console.executeCommand("Project.getExperiments()["+
        					index+"].setActive();");
        			
        			//loop through each row of experiments table
                	$('#experimentsTable tbody tr').each(function(){
                		//id of row matches that of active experiment
                		if (this.id != ("#"+experimentId)) {
                			//Add active icons to rows where it has been removed after set active
                			if($(this).attr("rowType")=="main"){
                				var activeIcon = 
                					$("<a class='activeIcon'>"+
                							"<i class='fa fa-check-circle fa-lg' style='padding-right: 10px;'" +
                					"rel='tooltip' title='Active Icon'></i></a>");
                				activeIcon.attr("id","activeIcon-"+experimentId);
                				var divIcons = $(this).find(".iconsDiv");
                				var getActiveIcon = divIcons.find("#activeIcon-"+experimentId);
                				if(getActiveIcon.length==0){
                					activeIcon.prependTo(divIcons);
                				}
                			}
                		}
                	});
                	
        			window.event.stopPropagation();
        		});
        		
            	//Handles delete icon button click
            	$(".deleteIcon").click(function(){
            		var experimentId = $(this).attr("experimentId");
        			var experiment;
        			var experiments = window.Project.getExperiments();
        			for(var e in experiments){
        				if(experiments[e].getId() == experimentId){
        					experiment = experiments[e];
        				}
        			}
        			var index = experiments.indexOf(experiment);
        			GEPPETTO.Console.executeCommand("Project.getExperiments()["+
        					index+"].deleteExperiment();");
        			window.event.stopPropagation();
            	});

            	//Handles download models button click
            	$(".downloadModelsIcon").click(function(){
            		var experimentId = $(this).attr("experimentId");
        			var experiment;
        			var experiments = window.Project.getExperiments();
        			for(var e in experiments){
        				if(experiments[e].getId() == experimentId){
        					experiment = experiments[e];
        				}
        			}
        			var simulatorConfigurations = experiment.simulatorConfigurations;
            		for(var config in simulatorConfigurations){
            			var simulatorConfig = simulatorConfigurations[config];
            			var index = experiments.indexOf(experiment);
            			GEPPETTO.Console.executeCommand(simulatorConfig["aspectInstancePath"]+
            					'.downloadModel();');
            		}
        			
        			window.event.stopPropagation();
            	});

            	//Handles download results icon
            	$(".downloadResultsIcon").click(function(){
            		var experimentId = $(this).attr("experimentId");
        			var experiment;
        			var experiments = window.Project.getExperiments();
        			for(var e in experiments){
        				if(experiments[e].getId() == experimentId){
        					experiment = experiments[e];
        				}
        			}
        			var simulatorConfigurations = experiment.simulatorConfigurations;
            		for(var config in simulatorConfigurations){
            			var simulatorConfig = simulatorConfigurations[config];
            			var index = experiments.indexOf(experiment);
            			GEPPETTO.Console.executeCommand("Project.getExperiments()["+
            					index+"].downloadResults('"+
            					simulatorConfig["aspectInstancePath"]+"',"+"'RECORDING');");
            		}
        			
        			window.event.stopPropagation();
            	});
            },
            
            deleteExperimentFromTable : function(experimentID){
            	//loop through each row of experiments table
            	$('#experimentsTable tbody tr').each(function(){
            		//id of row matches that of active experiment
            		if (this.id == ("#"+experimentID)) {
            			$(this).remove();
            		}
            	});
            },
            
            createExperimentRow : function(experiment){
            	//create one row to add experiment information (status, name, last modified)
        		var tr = 
        			$('<tr rowType="main" data-toggle="collapse" class="experimentsTableColumn accordion-toggle">');
        		//attributes needed to expanding extra row with more info
        		tr.attr("data-target", "#"+experiment.getId());
        		tr.attr("id","#"+experiment.getId());
        		
        		//adds class with different background every now and then
        		if(this.nth%2==1){
        			tr.addClass("nthTr");
        		}
        		
        		//create element in row for showing status
        		var tdStatus;
        		//keep track if status is in design
        		var design = false;
        		if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.COMPLETED){
        			tdStatus = $('<td><div class="circle COMPLETED center-block" title="COMPLETED"></div></td>');
        		}else if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.DELETED){
        			tdStatus = $('<td><div class="circle DELETED center-block" title="DELETED"></div></td>');
        		}else if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.RUNNING){
        			tdStatus = $('<td><div class="circle RUNNING center-block" title="RUNNING"></div></td>');
        		}else if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.DESIGN){
        			tdStatus = $('<td><div class="circle DESIGN center-block" title="DESIGN"></div></td>');
        			design = true;
        		}else if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.QUEUED){
        			tdStatus = $('<td><div class="circle QUEUED center-block" title="QUEUED"></div></td>');
        		}else if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.CANCELED){
        			tdStatus = $('<td><div class="circle CANCELED center-block" title="CANCELED"></div></td>');
        		}
        		tdStatus.attr("id","statusIcon");
        		//add experiment name to row and lastmodified
        		var tdName = $('<td>'+experiment.getName()+'</td>');      
        		var tdLastModified = $('<td>'+experiment.getLastModified()+'</td>');
        		//create element for showing icons
        		var tdIcons = $("<td></td>");
        		var divIcons = $("<div class='iconsDiv'></div>");

        		//if experiment in design status, make name and last modified elements editable
        		if(design){
        			tdName.attr("contentEditable","true");
        			tdLastModified.attr("contentEditable","true")
        		}

        		//append elements to row
        		tdStatus.appendTo(tr);
        		tdName.appendTo(tr);
        		tdLastModified.appendTo(tr);
        		divIcons.appendTo(tdIcons);
        		tdIcons.appendTo(tr);

        		//add icon to show this is active now
        		var activeIcon = 
        			$("<a class='activeIcon'>"+
        			"<i class='fa fa-check-circle fa-lg' style='padding-right: 10px;'" +
        			"rel='tooltip' title='Active Icon'></i></a>");
        		activeIcon.appendTo(divIcons);
        		activeIcon.attr("experimentId",experiment.getId());
        		activeIcon.attr("id","activeIcon-"+experiment.getId());

        		//create delete icon and append to div element inside row
        		var deleteIcon = $("<a class='deleteIcon'><i class='fa fa-remove fa-lg'"+
        				"rel='tooltip' title='Delete Experiment'></i></a>");
        		deleteIcon.appendTo(divIcons);
        		deleteIcon.attr("experimentId",experiment.getId());
        		
        		//create download results and append to div element inside row
        		if(experiment.getStatus()==GEPPETTO.Resources.ExperimentStatus.COMPLETED){
        			var downloadResultsIcon = 
        				$("<a class='downloadResultsIcon'><i class='fa fa-download fa-lg'"+
        						"rel='tooltip' title='Download Results'></i></a>");
        			downloadResultsIcon.appendTo(divIcons);
        			downloadResultsIcon.attr("experimentId",experiment.getId());
        		}
        		
        		//create download models icon and append to div element inside row
        		var downloadModelsIcon = $("<a class='downloadModelsIcon'>" +
        				"<i class='fa fa-cloud-download fa-lg' " +
        				"rel='tooltip' title='Download Models'></i></a>");
        		downloadModelsIcon.appendTo(divIcons);
        		downloadModelsIcon.attr("experimentId",experiment.getId());
        		
        		return tr;
            },
            
            createExpandableRow : function(experiment){
            	var expandableTR = $("<tr></tr>")
        		expandableTR.attr("id","#"+experiment.getId());
        		if(this.nth%2==1){
        			expandableTR.addClass("nthTr");
        		}
        		//created other properties for expandable row
        		var expandableTD = $("<td colspan='12' class='hiddenRow'></td>")
        		var expandableDIV = $("<div class='accordian-body collapse'></div>");
        		var expandableTable = $("<table class='table-condensed expandableTable'></table>");
        		expandableDIV.attr("id",experiment.getId());
        		expandableTD.appendTo(expandableTR);
        		expandableTable.appendTo(expandableDIV);
        		expandableDIV.appendTo(expandableTD);

        		//create head row with titles of info displayed in new table used for 
        		//showing expandable row
        		var head = $("<thead class='experimentsTableColumn'>"+
        				"<tr><th style='width:15%;'></th>"+
        				"<th>Aspect</th><th>Simulator</th>"+
        				"<th>TimeStep</th><th>Length</th>"+
        		"<th>ConversionService</th></tr></thead>");
        		head.appendTo(expandableTable);

        		//populate expandable table with rows for each simulator configuration
        		var simulatorConfigurations = experiment.simulatorConfigurations;
        		for(var config in simulatorConfigurations){
        			var simulatorConfig = simulatorConfigurations[config];
        			var configuration = $("<tr><td></td><td>"+
        					simulatorConfig["aspectInstancePath"]+"</td><td>"+
        					simulatorConfig["simulatorId"]+"</td><td>"+
        					simulatorConfig["timeStep"]+"</td><td>"+
        					simulatorConfig["length"]+"</td><td>"+
        					simulatorConfig["conversionId"]+"</td></tr>");
        			configuration.appendTo(expandableTable)
        		}
        		
        		return expandableTR;
            },
            
            updateExperimentsTableStatus : function(){
            	//loop through each row of experiments table
            	$('#experimentsTable tbody tr').each(function(){
            		//id of row matches that of active experiment
//            		if (this.id == ("#"+experimentID)) {
//            			$(this).find("#statusIcon");
//            		}
            	});
            },
            
            newExperiment : function(experiment){
        		var experimentsTable = document.getElementById("experimentsTable");
        		
        		var expandableRow = GEPPETTO.FE.createExpandableRow(experiment);
        		expandableRow.prependTo(experimentsTable);
        		
        		var tr = GEPPETTO.FE.createExperimentRow(experiment);
        		tr.prependTo(experimentsTable);
        		tr.addClass("newExperimentFocus");
        		
        		this.nth++;
            },
            
            /**
             * Show error message if webgl failed to start
             */
            update: function(webGLStarted) {
                if (!webGLStarted) {
                    GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBGL_FAILED);
                    GEPPETTO.FE.disableSimulationControls();
                    GEPPETTO.FE.infoDialog(GEPPETTO.Resources.WEBGL_FAILED, GEPPETTO.Resources.WEBGL_MESSAGE);
                }
            },
            /**
             * Basic Dialog box with message to display.
             *
             * @method
             *
             * @param title - Title of message
             * @param msg - Message to display
             */
            infoDialog: function(title, msg) {
                React.renderComponent(InfoModal({
                    show: true,
                    keyboard: false,
                    title: title,
                    text: msg,
                }), document.getElementById('modal-region'));
            },
            /**
             * Dialog box to display error messages.
             *
             * @method
             *
             * @param title - Notifying error
             * @param msg - Message to display for error
             * @param code - Error code of message
             * @param source - Source error to display
             * @param exception - Exception to display
             */
            errorDialog: function(title, msg, code, source, exception) {
                React.renderComponent(ErrorModal({
                    show: true,
                    keyboard: false,
                    title: title,
                    text: msg,
                    code: code,
                    source: source,
                    exception: exception
                }), document.getElementById('modal-region'));
            },
            /**
             * If simulation is being controlled by another user, hide the
             * control and load buttons. Show "Observe" button only.
             */
            disableSimulationControls: function() {
                GEPPETTO.trigger('simulation:disable_all');
                
                //disable console buttons
                $('#consoleButton').attr('disabled', 'disabled');
                $('#commandInputArea').attr('disabled', 'disabled');

                //disable keyboard
                document.removeEventListener("keydown", GEPPETTO.Vanilla.checkKeyboard);
            },
        };

    };
});
