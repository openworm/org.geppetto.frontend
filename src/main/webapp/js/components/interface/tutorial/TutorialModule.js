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
	link.href = "geppetto/js/components/interface/tutorial/tutorial.css";
	document.getElementsByTagName("head")[0].appendChild(link);

	var React = require('react'),
	ReactDOM = require('react-dom'),
	$ = require('jquery'),
	Button = require('../../controls/mixins/bootstrap/button'),
	GEPPETTO = require('geppetto');
	
	$.cookie=require('js-cookie');
	
	var Tutorial = React.createClass({
				/**
		 * Stores cookie to avoid showing tutorial next time at startup
		 */
		dontShowAtStartup: function(val){
			$.cookie('ignore_tutorial', true);
		},
		
		getDefaultProps: function() {
		   return {
			   id: "tutorial"
		   };
		 },
		
		getInitialState: function() {
			return {
				tutorialData: {},
				activeTutorial : undefined,
				currentStep : 0
			};
		},

		/**
		 * Initial message at launch of tutorial
		 */
		start : function(){
			this.state.currentStep=0;
			this.open(true);
			this.updateTutorialWindow();			
			this.started = true;
		},
		
		getActiveTutorial : function(){
			return this.state.tutorialData[this.state.activeTutorial];
		},

		updateTutorialWindow : function(){
			var self = this;
			var step = this.getActiveTutorial().steps[this.state.currentStep];
			
			if(step.content_url!=undefined){
				$.ajax({
					type: 'GET',
					dataType: 'html',
					url: step.content_url,
					success: function (responseData, textStatus, jqXHR) {
						step.message = responseData; 
						self.forceUpdate();
					},
					error: function (responseData, textStatus, errorThrown) {
						throw ("Error retrieving tutorial: " + responseData + "  with error " + errorThrown);
					}
				});
			}
			else{
				this.forceUpdate();
			}

			//execute action associated with message
			if(step.action!=undefined){
				if(step.action!=""){
					eval(step.action);
				}
			}
		},

		nextStep: function(){
			this.state.currentStep++;
			if(this.state.currentStep <= this.getActiveTutorial().steps.length-1){
				this.updateTutorialWindow();
			}else{
				this.start();
			}
		},

		prevStep: function() {
			this.state.currentStep--;
			GEPPETTO.tutorialEnabled = false;
			this.updateTutorialWindow();
		},

		close : function(){
			this.dialog.parent().hide();
		},

		open : function(started){
			var p=this.dialog.parent();
			p.show();
			
			var self = this;
			var callback = function () {
				var width =self.getActiveTutorial()["width"];
				var height =self.getActiveTutorial()["height"];
				if(height!=undefined){
					p.height(height+"px");
					this.dialog.css("height",height+"px");
				}
				if(width!=undefined){
					p.width(width+"px");
					this.dialog.css("width",width+"px");
				}
			};
			
			if(!started){
				p.effect("shake", {distance:5, times: 3}, 500, callback);
			}
			
		},

		setTutorial : function(tutorialURL){
			this.state.tutorialData={};
			this.addTutorial(tutorialURL);
		},
		
		goToChapter: function(chapter){
			this.state.activeTutorial=chapter;
			this.start();
		},
		
		addTutorial : function(tutorialURL){
			var self = this;

			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: tutorialURL,
				success: function (responseData, textStatus, jqXHR) {
					self.loadTutorial(responseData, false);
				},
				error: function (responseData, textStatus, errorThrown) {
					throw ("Error retrieving tutorial: " + responseData + "  with error " + errorThrown);
				}
			});
		},
		
		loadTutorial : function(tutorialData,start){
			this.state.tutorialData[tutorialData.name] = tutorialData; 
			this.state.activeTutorial=tutorialData.name;
			this.state.currentStep=0;
			if(!this.getCookie()){
				if(start){
					this.forceUpdate();
					this.start();
				}
			}
		},
		
		showChaptersMenu: function (event) {
            var that = this;
            var allTutorials = Object.keys(this.state.tutorialData);
            if (allTutorials.length > 0) {

                var data = [];
                for (var i = 0; i < allTutorials.length; i++) {
                    data.push({
                        "label": allTutorials[i],
                        "action": ["GEPPETTO.Tutorial.goToChapter('"+allTutorials[i]+"')"],
                        "icon": "fa fa-bookmark",
                        "position": i
                    })
                }
                
                this.chaptersMenu.show({
                    top: event.pageY,
                    left: event.pageX + 1,
                    groups: data,
                    data: that
                });
            }

            if (event != null) {
                event.preventDefault();
            }
            return false;
        },

        
        componentDidUpdate:function(){
        	if(this.chaptersMenu==undefined){
        		var that = this;
				this.chaptersMenu = new GEPPETTO.ContextMenuView();
				
				var button = $("<div class='fa fa-leanpub' title='Select chapter'></div>").on('click', function(event) {
					that.showChaptersMenu(event);
	                event.stopPropagation();
				});
	
	        	var dialog = this.dialog.parent();
	        	var closeButton=dialog.find("button.ui-dialog-titlebar-close");
	        	closeButton.off("click");
	        	closeButton.click(this.close);
	        	dialog.find("div.ui-dialog-titlebar").prepend(button);
	        	$(button).addClass("widget-title-bar-button");
				this.dialog.css("overflow","scroll");
        	}
        	
        	
        	//centers the tutorials
        	var screenWidth = $( window ).width();
			var screenHeight = $( window ).height();
			
			var left = (screenWidth/2) - (this.dialog.parent().width()/2);
			var top = (screenHeight/2) - (this.dialog.parent().height()/2);

			this.dialog.parent().css("top",top+"px");
			this.dialog.parent().css("left",left+"px");
        },
		
		componentDidMount:function(){
			this.close();
			var self = this;

			//launches specific tutorial is experiment is loaded
			GEPPETTO.on(GEPPETTO.Events.Model_loaded,function(){
				if(!self.dontShowTutorial){
					//default tutorial when user doesn't specify one for this event
					if(self.props.tutorialURL){
						self.addTutorial(self.props.tutorialURL);
					}
					else if(self.props.tutorialData){
						self.loadTutorial(self.props.tutorialData,true);
					}
					self.dontShowTutorial = true;
				}
			});

			//Launches tutorial from button 
			GEPPETTO.on(GEPPETTO.Events.Show_Tutorial,function(){
				if(self.started){
					self.open(false);
				}else{
					if(!self.state.visible){
						self.start();
						self.open(false);
					}else{
						//default tutorial when user doesn't specify one for this event
						if(self.state.tutorialData=={}){
							self.setTutorial("/org.geppetto.frontend/geppetto/js/components/interface/tutorial/configuration/experiment_loaded_tutorial.json", "Geppetto tutorial");
						}
						else{
							if(!this.getCookie()){
								this.start();
							}
						}
					}
				}
			});
			
			//Hides tutorial
			GEPPETTO.on(GEPPETTO.Events.Hide_Tutorial,function(){
				self.close();
			});
			
			GEPPETTO.Tutorial = this;
			
			if(GEPPETTO.ForegroundControls != undefined){
        		GEPPETTO.ForegroundControls.refresh();
    		}
		},

		
		getCookie : function(){
			var ignoreTutorial = $.cookie('ignore_tutorial');
			if(ignoreTutorial == undefined){
				//sets to string instead of boolean since $.cookie returns string even when storing as boolean
				return false;
			}else{
				return ignoreTutorial === "true";
			}
		},
		
		getHTML(message){
			return {__html: message};
		},
		
		render: function () {
			
			var ignoreTutorial = this.getCookie();
			var activeTutorial = this.getActiveTutorial();
			if(activeTutorial!=undefined){
				
			
				var step = activeTutorial.steps[this.state.currentStep];
										
				var dialog = this.dialog.parent();
				dialog.find(".ui-dialog-title").html(step.title);
				var iconClass = "";
				if(step.icon!=null && step.icon!=undefined && step.icon!=""){
					iconClass = step.icon+" fa-3x"; 
				}
				
				var prevDisabled = this.state.currentStep == 0;
				var lastStep = this.state.currentStep == activeTutorial.steps.length-1;
				var lastStepLabel = (this.state.currentStep == activeTutorial.steps.length-1)?"Restart":"";
				var cookieClass=this.state.currentStep==0?"checkbox-inline cookieTutorial":"hide";

				var width =this.getActiveTutorial()["width"];
				var height =this.getActiveTutorial()["height"];

				if(height!=undefined){
					dialog.height(height+"px");
					this.dialog.css("height",height+"px");
				}
				if(width!=undefined){
					dialog.width(width+"px");
					this.dialog.css("width",width+"px");
				}
			    
				return  <div>
				<div className="tutorial-message">
				 <div id="tutorialIcon" className={iconClass}></div>
				 <div id="message" dangerouslySetInnerHTML={this.getHTML(step.message)}></div>
				</div>
				<div className="btn-group tutorial-buttons" role="group">
					<div className="tutorial-buttons">
						<button className="prevBtn btn btn-default btn-lg" disabled={prevDisabled} data-toogle="tooltip" data-placement="bottom" title="Previous step" data-container="body" onClick={this.prevStep}>
							<span><i className="fa fa-arrow-left fa-2x" aria-hidden="true"></i></span>
						</button>
						<button className="nextBtn btn btn-default btn-lg" data-toogle="tooltip" data-placement="bottom" title="Next step" data-container="body" onClick={this.nextStep}>
							<span>{lastStepLabel}   <i className={lastStep ? "fa fa-undo fa-2x" : "fa fa-arrow-right fa-2x"} aria-hidden="true"></i></span>
						</button>
					</div>
				<label className={cookieClass} id="ignoreTutorial"><input type="checkbox" value="Do not show tutorial at startup again." onClick={this.dontShowAtStartup} /> Do not show tutorial at startup again.</label>
				</div>
				
				</div>
			}
			else{
				return null;
			}
		}
	});
	
	return Tutorial;
});
