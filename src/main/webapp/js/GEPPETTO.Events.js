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
			Experiment_replay : "experiment:replay",
			Widgets_restarted : "widgets:restarted",
			Project_loaded : "project:loaded",
			Experiment_loaded : "experiment:loaded",
			Experiment_stopped : "experiment:stopped",
			ModelTree_populated : "experiment:modeltreepopulated",
			SimulationTree_populated : "experiment:simulationtreepopulated",
			Play_Experiment : "play_experiment",
			Update_Experiment : "update_experiment",
			Experiment_deleted : "experiment_deleted"
		};
define(function(require) {
	return function(GEPPETTO) {
		/**
		 * @class GEPPETTO.Events
		 */
		GEPPETTO.Events = {
				
			listen: function() {
				GEPPETTO.on(Events.Select, function(){
	        		//notify widgets that selection has changed in scene
	        		GEPPETTO.WidgetsListener.update(Events.Select);
	        	});
				GEPPETTO.on(Events.Experiment_loaded, function(){
					G.resetCamera();
				});
				GEPPETTO.on(Events.Experiment_deleted, function(){
		            GEPPETTO.FE.infoDialog(GEPPETTO.Resources.EXPERIMENT_DELETED, 
		            		"Experiment was deleted successfully");
				});
	        	GEPPETTO.on(Events.Experiment_replay, function(){
	        		//delete existing widgets, to allow new ones for new simulation
	        		GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
	        		//notify factory classes reload is happenning
	        		GEPPETTO.NodeFactory.reload();
	        	});
	        	GEPPETTO.on(Events.Widgets_restarted, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA);
	        	});
	        	GEPPETTO.on(Events.ModelTree_populated, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.ModelTree_populated);
	        	});
	        	GEPPETTO.on(Events.SimulationTree_populated, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.SimulationTree_populated);
	        	});
	        	GEPPETTO.on(Events.Play_Experiment, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.Play_Experiment);
	        	});
	        	GEPPETTO.on(Events.Update_Experiment, function(){
	        		//notify widgets a restart of data is needed
	        		GEPPETTO.WidgetsListener.update(Events.Update_Experiment);
	        	});
			},
		};
	}
});