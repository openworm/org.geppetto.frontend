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
/**
 * React component for Tutorial
 *
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {

	var link = document.createElement("link");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = "geppetto/js/components/dev/tutorial/tutorial.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react'),
	ReactDOM = require('react-dom'),
	$ = require('jquery'),
	Button = require('mixins/bootstrap/button'),
	GEPPETTO = require('geppetto');

	var Tutorial = React.createClass({
		stepIndex : 0,
		totalSteps : 0,
		dontShowTutorial : false,
		started : false,
		tutorialLoaded : false,
		tutorialMap : {},
		
		/**
		 * Stores cookie to avoid showing tutorial next time at startup
		 */
		dontShowAtStartup: function(val){
			$.cookie('ignore_tutorial', true);
		},

		getInitialState: function() {
			return {
				tutorialData: {},
				tutorialTitle : "",
				tutorialMessage : "",
				iconClass: "",
				cookieClass : "checkbox-inline cookieTutorial",
				prevBtnDisabled : true,
				nextBtnLast : false,
				nextBtnLabel : "",
				visible : true,
			};
		},

		/**
		 * Initial message at launch of tutorial
		 */
		start : function(){
			this.stepIndex = 0;
			var title = this.state.tutorialData.steps[this.stepIndex].title;
			var message = this.state.tutorialData.steps[this.stepIndex].message;
			var action = this.state.tutorialData.steps[this.stepIndex].action;
			var icon = this.state.tutorialData.steps[this.stepIndex].icon;
			this.open(true);
			this.updateTutorialWindow(title,message,action,icon);			
			this.started = true;
		},

		updateTutorialWindow : function(title, message, action,icon){
			var newIconClass = "";
			if(icon!=null || undefined){
				if(icon!=""){
					newIconClass = icon+" fa-3x"; 
				}
			}
			
			//Hides checkbox after initial welcome window
			var newCookieClass = this.state.cookieClass;
			if(this.stepIndex==1){
				newCookieClass = "hide";
			}

			var prevDisabled = true;
			var lastStep = false;
			var lastStepLabel = "";
			
			if(this.stepIndex ==this.totalSteps){
				lastStep = true;
				lastStepLabel = "Restart";
				prevDisabled = false;
			}else if(this.stepIndex  >= 1){
				prevDisabled = false;
			}else if(this.stepIndex <=0){
				prevDisabled = true;
			}
			
			this.setState({nextBtnLast : lastStep, nextBtnLabel : lastStepLabel, prevBtnDisabled : prevDisabled, tutorialTitle: title, iconClass: newIconClass, tutorialMessage : message, cookieClass : newCookieClass});

			//execute action associated with message
			if(action!=null || undefined){
				if(action!=""){
					GEPPETTO.ComponentsController.executeAction(action);
				}
			}
		},

		nextStep: function(){
			this.stepIndex++;
			if(this.stepIndex <= this.totalSteps){
				var title = this.state.tutorialData.steps[this.stepIndex].title;
				var message = this.state.tutorialData.steps[this.stepIndex].message;
				var action = this.state.tutorialData.steps[this.stepIndex].action;
				var icon = this.state.tutorialData.steps[this.stepIndex].icon;

				this.updateTutorialWindow(title,message,action,icon);
			}else if(this.stepIndex>this.totalSteps){
				this.start();
			}else{
				this.close();
				this.started = false;
			}
		},

		prevStep: function() {
			if(this.stepIndex ==0){
				this.close();
			}else if(this.stepIndex > this.totalSteps){
				this.stepIndex = this.totalSteps;
			}else{
				this.stepIndex--;
				GEPPETTO.tutorialEnabled = false;
				var title = this.state.tutorialData.steps[this.stepIndex].title;
				var message = this.state.tutorialData.steps[this.stepIndex].message;
				var action = this.state.tutorialData.steps[this.stepIndex].action;
				var icon = this.state.tutorialData.steps[this.stepIndex].icon;

				this.updateTutorialWindow(title,message,action,icon);
			}
		},

		close : function(){
			$('#tutorial').hide();
		},

		open : function(started){
			$('#tutorial').show();
			if(!started){
				$('#tutorialMain').removeClass("hideTutorial");
			}
		},
		
		setTutorial : function(event, configurationURL){
			this.tutorialMap[event] = configurationURL;			
		},

		/**
		 * Extracts tutorial data for given configuration
		 */
		tutorialData : function(configurationURL){
			var self = this;

			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: configurationURL,
				success: function (responseData, textStatus, jqXHR) {
					self.setState({ tutorialData: responseData });
					self.totalSteps = self.state.tutorialData.steps.length-1;
					if(self.state.visible){
						self.start();
					}
					self.tutorialLoaded = true;
				},
				error: function (responseData, textStatus, errorThrown) {
					throw ("Error retrieving tutorial: " + responseData + "  with error " + errorThrown);
				}
			});
		},

		componentDidMount:function(){
			this.close();
			var self = this;

			//launches specific tutorial is experiment is loaded
			GEPPETTO.on(Events.Experiment_loaded,function(){
				if(!self.dontShowTutorial){
					//default tutorial when user doesn't specify one for this event
					var tutorialURL = "/org.geppetto.frontend/geppetto/js/components/dev/tutorial/configuration/experiment_loaded_tutorial.json";
					if(self.tutorialMap[Events.Experiment_loaded]!=null || undefined){
						tutorialURL = self.tutorialMap[Events.Experiment_loaded];
					}
					
					self.tutorialData(tutorialURL);
					self.dontShowTutorial = true;
				}
			});

			//Launches tutorial from button 
			GEPPETTO.on(Events.Show_Tutorial,function(){
				if(self.started){
					self.open(false);
				}else{
					if(!self.state.visible){
						self.start();
						self.open(false);
					}else{
						//default tutorial when user doesn't specify one for this event
						var tutorialURL = "/org.geppetto.frontend/geppetto/js/components/dev/tutorial/configuration/experiment_loaded_tutorial.json";
						if(self.tutorialMap[Events.Show_Tutorial]!=null || undefined){
							tutorialURL = self.tutorialMap[Events.Show_Tutorial];
						}

						self.tutorialData(tutorialURL);
					}
				}
			});
			
			//Hides tutorial
			GEPPETTO.on(Events.Hide_Tutorial,function(){
				self.close();
			});
			
			GEPPETTO.Tutorial = this;
			
			if(GEPPETTO.ForegroundControls != undefined){
                		GEPPETTO.ForegroundControls.refresh();
            		}
		},

		/**
		 * Allows for using HTML tags as part of messages defined in .json configuration
		 */
		createTutorialMessage : function(){
			return {__html: this.state.tutorialMessage}; 
		},
		
		getCookie : function(){
			var ignoreTutorial = $.cookie('ignore_tutorial');
			if(ignoreTutorial == undefined){
				//sets to string instead of boolean since $.cookie returns string even 
				//when storing as boolean
				ignoreTutorial = false;
			}else{
				ignoreTutorial = (ignoreTutorial === "true");
			}
			
			return ignoreTutorial;
		},
		
		render: function () {
			var ignoreTutorial = this.getCookie();
									
			this.state.visible = !ignoreTutorial;
			return  <div id="tutorialMain" className={(ignoreTutorial? "hideTutorial" : "showTutorial") + " tutorial ui-dialog ui-widget ui-widget-content ui-corner-all ui-front ui-draggable ui-draggable-disabled ui-state-disabled noStyleDisableDrag"}>
			<div className="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix">
				<span id="ui-id-5" className="tutorialTitle">{this.state.tutorialTitle}</span>
					<button className="ui-dialog-titlebar-close" onClick={this.close}><i className="fa fa-close" /></button>
			</div>
			<div className="tutorial-message dialog ui-dialog-content ui-widget-content popup">
			 <div id="tutorialIcon" className={this.state.iconClass}></div>
			 <p id="message" dangerouslySetInnerHTML={this.createTutorialMessage()}></p>
			</div>
			<div className="btn-group tutorial-buttons" role="group">
				<div className="tutorial-buttons">
					<button className="prevBtn btn btn-default btn-lg" disabled={this.state.prevBtnDisabled} data-toogle="tooltip" data-placement="bottom" title="Previous step" data-container="body" onClick={this.prevStep}>
						<span><i className="fa fa-arrow-left fa-2x" aria-hidden="true"></i></span>
					</button>
					<button className="nextBtn btn btn-default btn-lg" data-toogle="tooltip" data-placement="bottom" title="Next step" data-container="body" onClick={this.nextStep}>
						<span>{this.state.nextBtnLabel}   <i className={this.state.nextBtnLast ? "fa fa-undo fa-2x" : "fa fa-arrow-right fa-2x"} aria-hidden="true"></i></span>
					</button>
				</div>
			<label className={this.state.cookieClass} id="ignoreTutorial"><input type="checkbox" value="Do not show tutorial at startup again." onClick={this.dontShowAtStartup} /> Do not show tutorial at startup again.</label>
			</div>
			
			</div>
		}
	});
	
	return Tutorial;
});
