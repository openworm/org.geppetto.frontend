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
 ******************************************************************************
 *
 * Tutorial to help users learn how to use Geppetto 
 * 
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
	return function(GEPPETTO) {

		GEPPETTO.Tutorial = {

				//flag that keeps track if tutorial is on/off
				tutorialOn : false,
				
				startTutorial : function(){
					this.tutorialOn = true;

					GEPPETTO.FE.infoDialog(GEPPETTO.Tutorial.TITLE.BEGIN,
							GEPPETTO.Tutorial.MESSAGE.BEGIN);
					
					$('#infomodal-btn').on('click', function (e) {
						GEPPETTO.Tutorial.openLoadPopover();
						//hide openload popover
						$('#openload').on('click', function (e) {
							$("#openload").popover('hide');
						});
						$('#loadSimModal').on('shown', function (e) {
							GEPPETTO.Tutorial.samplesPopover();
						$('#next_load').on('click', function (e) {
							GEPPETTO.Tutorial.loadPopover();
						$('#loadingmodal').on('shown', function (e) {
							GEPPETTO.Tutorial.loadingPopover();
						;});});});});
				},

				stopTutorial : function(){
					this.tutorialOn = false;
					$('#helpButton').popover('hide');
					GEPPETTO.FE.infoDialog(GEPPETTO.Tutorial.TITLE.DONE,GEPPETTO.Tutorial.MESSAGE.DONE);
				},
				
				isTutorialOn : function(){
					return this.tutorialOn;
				},
				
				/**
				 * A step during tutorial is to load the simulation, after it's done loading it will call 
				 * this method to continue with the tutorial.
				 */
				continueTutorialAfterSim : function(){
					GEPPETTO.Tutorial.startPopover();
					$('#next_pause').on('click', function (e) {
						GEPPETTO.Tutorial.pausePopover();
					$('#next_stop').on('click', function (e) {
						GEPPETTO.Tutorial.stopPopover();
					$('#next_position').on('click', function (e) {
						GEPPETTO.Tutorial.positionPopover();
					$('#next_rotation').on('click', function (e) {
						GEPPETTO.Tutorial.rotationPopover();
					$('#next_zoom').on('click', function (e) {
						GEPPETTO.Tutorial.zoomPopover();
					$('#next_console').on('click', function (e) {
						GEPPETTO.Tutorial.consolePopover();
					$('#next_share').on('click', function (e) {
						GEPPETTO.Tutorial.sharePopover();
					$('#next_contact').on('click', function (e) {
						GEPPETTO.Tutorial.contactPopover();
					$('#next_help').on('click', function (e) {
						GEPPETTO.Tutorial.helpPopover();
					$('#tutorial_done').on('click', function (e) {
						GEPPETTO.Tutorial.stopTutorial();
					});});});});});});});});});});
				},
				
				openLoadPopover : function(){
					if(this.tutorialOn){
						$("#openload").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.OPENLOAD,
							content: GEPPETTO.Tutorial.MESSAGE.OPENLOAD,
							placement : 'bottom',
						});
						$('#openload').popover('show');
					}
				},
				
				samplesPopover : function(){
					if(this.tutorialOn){
						$("#loadSimModal").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.SAMPLES,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.SAMPLES +
							'<button class="btn btn-success btn-tut" id="next_load">Continue</button></div>',	
							placement : 'right',
						});
						$('#loadSimModal').popover('show');
						
						//double check if this popover is still visiblen user clicks load, user might have skipped a test
						$('#load').on('click', function (e) {
							var isVisible = $('#loadSimModal').data('popover').tip().hasClass('in');
							if(isVisible){
								$('#loadSimModal').popover('hide');
							}
						});
					}
				},
				
				loadPopover : function(){
					if(this.tutorialOn){
						$("#loadSimModal").popover('hide');
						$("#load").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.LOAD,
							content: GEPPETTO.Tutorial.MESSAGE.LOAD,
							placement : 'bottom',
						});
						$('#load').popover('show');
					}
				},
				
				loadingPopover : function(){
					if(this.tutorialOn){
						$("#load").popover('hide');
						$("#loadingmodal").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.LOADING,
							content: GEPPETTO.Tutorial.MESSAGE.LOADING,
							placement : 'bottom',
						});
						$('#loadingmodal').popover('show');
					}
				},
				
				startPopover : function(){
					if(this.tutorialOn){
						$("#loadingmodal").popover('hide');
						$("#start").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.START,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.START +
							'<button class="btn btn-success btn-tut" id="next_pause">Continue</button></div>',
							placement : 'bottom',
						});
						$('#start').popover('show');
					}
				},
				
				pausePopover : function(){
					if(this.tutorialOn){
						$("#start").popover('hide');
						$("#pause").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.PAUSE,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.PAUSE +
							'<button class="btn btn-success btn-tut" id="next_stop">Continue</button></div>',					
							placement : 'bottom',
						});
						$('#pause').popover('show');
					}
				},
				
				stopPopover : function(){
					if(this.tutorialOn){
						$("#pause").popover('hide');
						$("#stop").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.STOP,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.STOP +
							'<button class="btn btn-success btn-tut" id="next_position">Continue</button></div>',			
							placement : 'bottom',
						});
						$('#stop').popover('show');
					}
				},
				
				positionPopover : function(){
					if(this.tutorialOn){
						$("#stop").popover('hide');
						$("#position").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.POSITION,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.POSITION +
							'<button class="btn btn-success btn-tut" id="next_rotation">Continue</button></div>',			
							placement : 'bottom',
						});
						$('#position').popover('show');
					}
				},
				
				rotationPopover : function(){
					if(this.tutorialOn){
						$("#position").popover('hide');
						$("#rotation").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.ROTATION,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.ROTATION +
							'<button class="btn btn-success btn-tut" id="next_zoom">Continue</button></div>',			
							placement : 'bottom',
						});
						$('#rotation').popover('show');
					}
				},
				
				zoomPopover : function(){
					if(this.tutorialOn){
						$("#rotation").popover('hide');
						$("#zoom").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.CONSOLE,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.CONSOLE +
							'<button class="btn btn-success btn-tut" id="next_console">Continue</button></div>',			
							placement : 'bottom',
						});
						$('#zoom').popover('show');
					}
				},
				
				consolePopover : function(){
					if(this.tutorialOn){
						$("#zoom").popover('hide');
						$("#consoleButton").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.CONSOLE,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.CONSOLE +
							'<button class="btn btn-success btn-tut" id="next_share">Continue</button></div>',			
							placement : 'top',
						});
						$('#consoleButton').popover('show');
					}
				},
				
				sharePopover : function(){
					if(this.tutorialOn){
						$("#consoleButton").popover('hide');
						$("#shareTab").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.SHARE,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.SHARE +
							'<button class="btn btn-success btn-tut" id="next_contact">Continue</button></div>',			
							placement : 'top',
						});
						$('#shareTab').popover('show');
					}
				},
				
				contactPopover : function(){
					if(this.tutorialOn){
						$("#shareTab").popover('hide');
						$("#habla_topbar_div").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.CONTACT,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.CONTACT +
							'<button class="btn btn-success btn-tut" id="next_help">Continue</button></div>',			
							placement : 'top',
						});
						$('#habla_topbar_div').popover('show');
					}
				},
				
				helpPopover : function(){
					if(this.tutorialOn){
						$("#habla_topbar_div").popover('hide');
						$("#helpButton").popover({
							html : true,
							animation : true,
							trigger : "manual",
							title: GEPPETTO.Tutorial.TITLE.HELP,
							content: '<div>'+GEPPETTO.Tutorial.MESSAGE.HELP +
							'<button class="btn btn-success btn-tut" id="tutorial_done">Continue</button></div>',			
							placement : 'bottom',
						});
						$('#helpButton').popover('show');
					}
				},
		};

		GEPPETTO.Tutorial.TITLE = {
				BEGIN : "Geppetto Tutorial",
				OPENLOAD : "Load a Simulation",
				DROPDOWN : "Choose a Simulation from Samples",
				LOAD : "Load a Simulation",
				LOADING : "Simulation Loading",
				START :"Start Simulation",
				PAUSE : "Pause Simulation",
				STOP : "Stop Simulation",
				CONSOLE : "Console",
				POSITION : "Move around the Simulation",
				ROTATION : "Rotate the Simulation",
				ZOOM : "Zoom In & Out the Simulation",
				SHARE : "Share Geppetto!",
				CONTACT : "Contact Us",
				HELP : "Get More Help",
				DONE : "End of Tutorial"
		};
		
		GEPPETTO.Tutorial.MESSAGE = {
				BEGIN : "You are about to begin a guided journey through Geppetto. Through the duration of it you will " +
						"learn to load a Simulation and use the different controls for handling the Simulation.",
				OPENLOAD : "Use this button to load an existing simulation or enter the URL to your own simulation. Click this" +
						   " button to continue with tutorial.",
				SAMPLES : "You can load a sample simulation from the list available. Alternatively, you can enter the URL of your" +
						" own simulation in the input field above. Open the dropdown list and select the third simulation, press continue to go " +
						" to the next step",
				LOAD : "Use the Load button to load the simulation. Click the button now to continue with tutorial.",
				LOADING : "A simulation will take a few seconds to load, until then this message will be displayed and " +
						"will be gone once simulation is loaded",
				START: "Once you have loaded a simulation, it's time to see it on action by pressing Start. Click it now to see the " +
						"simulation on action",
				PAUSE : "You might want to admire the beauty of a simulation for a while, pausing it with " +
					    " this button is the way to go.",
				STOP : "Perhaps you want to restart the simulation or are done with it, the stop button will help " +
						"you with this task",
				CONSOLE : "Controls Geppetto using commands. Everything you can do through the interface you can " +
						  "do via commands. Open up the console by clicking this button, and type help() for more info.",
				POSITION : "Reposition navigation buttons for the simulation.Move the simulation; up, down, left and right."+
						   "Use the home button at the center to reset position to original default",
				ROTATION : "Rotate the simulation clockwise and counter-clockwise along the x and y axis. " +
							"Use the home button at the center to reset position to original default",
				ZOOM : "Zoom in and out of the Simulation. Use the '+' for getting closer, and the '-' to get farther",
				SHARE : "Once you get to experience the awesomeness of Geppetto you might want to share it with friends via Facebook or twitter." +
						" Click on this tab to choose either method of sharing it on your preferred social site.",
				CONTACT : "If you have any questions or want to talk to us, send us a message. Simply click this button " +
						"and you can inmediately start communication with us without leaving this page.",
				HELP : "Click this button at any time for detailed descriptions of all the commands and controls within " +
						"Geppetto.",
				DONE : "Congratulations! You have reached the end of the tutorial, become Geppetto itself and are " +
						"ready to create Pinochio!. "
		};
	};
});