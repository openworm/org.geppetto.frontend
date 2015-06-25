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
		 * 
		 * Events
		 * 
		 * Different types of widgets that exist
		 * 
		 * @enum
		 */
		var Events = {
			Select : "experiment:selection_changed",
			Experiment_over : "experiment:over",
			Project_loaded : "project:loaded",
			Experiment_loaded : "experiment:loaded",
			ModelTree_populated : "experiment:modeltreepopulated",
			SimulationTree_populated : "experiment:simulationtreepopulated",
			Experiment_play : "experiment:play",
			Experiment_status_check : "experiment:status_check",
			Experiment_replay : "experiment:replay",
			Experiment_pause : "experiment:pause",
			Experiment_resume : "experiment:resume",
			Experiment_running : "experiment:running",
			Experiment_stop : "experiment:stop",
			Experiment_update : "experiment:update",
			Experiment_deleted : "experiment_deleted"
		};
define(function(require) {
	return function(GEPPETTO) {
		/**
		 * @class GEPPETTO.Events
		 */
		GEPPETTO.Events = {
				
			listening : false,
			
			listen: function() {
				GEPPETTO.on(Events.Select, function(){
	        		//notify widgets that selection has changed in scene
	        		GEPPETTO.WidgetsListener.update(Events.Select);
	        	});
				GEPPETTO.on(Events.Project_loaded, function(){
					GEPPETTO.FE.populateExperimentsTable();
				});
				GEPPETTO.on(Events.Experiment_status_check, function(){
					GEPPETTO.FE.updateExperimentsTableStatus();
				});
				GEPPETTO.on(Events.Experiment_loaded, function(){
		            GEPPETTO.trigger("hide:spinner");
					G.resetCamera();
					GEPPETTO.FE.setActiveExperimentLabel();
				});
				GEPPETTO.on(Events.Experiment_deleted, function(e){
					var name = e.name;
					var id = e.id;
					
					GEPPETTO.FE.deleteExperimentFromTable(id);
					
		            GEPPETTO.FE.infoDialog(GEPPETTO.Resources.EXPERIMENT_DELETED, 
		            		"Experiment " + name + " with id " +
		            		id + " was deleted successfully");
				});
	        	GEPPETTO.on(Events.Experiment_over, function(e){
	        		var name = e.name;
					var id = e.id;
	        		GEPPETTO.Console.log("Experiment " + name + " with "+
	        				id + " is over ");
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.Experiment_over);
	        	});
	        	GEPPETTO.on(Events.ModelTree_populated, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.ModelTree_populated);
	        	});
	        	GEPPETTO.on(Events.SimulationTree_populated, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.SimulationTree_populated);
	        	});
	        	GEPPETTO.on(Events.Experiment_update, function(parameters){
	        		if(parameters.playAll != null ||parameters.steps != undefined){
	        			//update scene brightness
	        			for(var key in GEPPETTO.G.listeners) {
	        				//retrieve the simulate state from watch tree
	        				var simState = GEPPETTO.Utility.deepFind(window.Project.runTimeTree, key);

	        				//update simulation state
	        				GEPPETTO.G.listeners[key](simState,parameters.steps);
	        			}
	        		}
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.Experiment_update, parameters);
	        	});
	        	GEPPETTO.on(Events.Experiment_replay, function(parameters){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA);
	        	});
			},
		};
	}
});