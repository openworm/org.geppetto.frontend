define(function (require) {

	var React = require('react'),
		$ = require('jquery'),
		Button = require('../../controls/mixins/bootstrap/button'),
		GEPPETTO = require('geppetto');

	require('./Tutorial.less');

	$.cookie = require('js-cookie');

	var AbstractComponent = require('../../AComponent');

	return class Tutorial extends AbstractComponent {

		constructor(props) {
			super(props);

			this.tutorials = [];

			this.state = {
				tutorialData: {},
				activeTutorial: undefined,
				currentStep: 0
			};

			this.prevStep = this.prevStep.bind(this);
			this.nextStep = this.nextStep.bind(this);
		}

		/**
		 * Stores cookie to avoid showing tutorial next time at startup
		 */
		dontShowAtStartup(val) {
			var value =$('#ignoreTutorialCheck').prop('checked');
			$.cookie('ignore_tutorial', value);
		}

		/**
		 * Initial message at launch of tutorial
		 */
		start() {
			this.state.currentStep = 0;
			this.updateTutorialWindow();
			this.started = true;
		}

		getActiveTutorial() {
			return this.state.tutorialData[this.state.activeTutorial];
		}

		updateTutorialWindow() {
			var self = this;
			if (this.getActiveTutorial() != undefined) {
				var step = this.getActiveTutorial().steps[this.state.currentStep];

				if (step.content_url != undefined) {
					$.ajax({
						type: 'GET',
						dataType: 'html',
						url: step.content_url,
						success(responseData, textStatus, jqXHR) {
							step.message = responseData;
							self.forceUpdate();
						},
						error(responseData, textStatus, errorThrown) {
							throw ("Error retrieving tutorial: " + responseData + "  with error " + errorThrown);
						}
					});
				}
				else {
					this.forceUpdate();
				}

				//execute action associated with message
				if (step.action != undefined) {
					if (step.action != "") {
						eval(step.action);
					}
				}
			}
		}

		gotToStep(currentStep) {
			this.state.currentStep = currentStep;
			if(this.getActiveTutorial()!=undefined){
				if (this.state.currentStep <= this.getActiveTutorial().steps.length - 1) {
					this.updateTutorialWindow();
				} else {
					this.start();
				}
			}

			this.setDirty(true);
		}

		nextStep() {
			this.state.currentStep++;
			if (this.state.currentStep <= this.getActiveTutorial().steps.length - 1) {
				this.updateTutorialWindow();
			} else {
				this.start();
			}

			this.setDirty(true);
		}

		prevStep() {
			this.state.currentStep--;
			GEPPETTO.tutorialEnabled = false;
			this.updateTutorialWindow();
			this.setDirty(true);
		}

		close() {
			this.dialog.parent().hide();
		}

		open(started) {
			var p = this.dialog.parent();
			var shake = p.is(":visible");
			p.show();

			if (!started) {
				if (shake) {
					p.effect("shake", {distance: 5, times: 3}, 500, undefined);
				}
			} else {
				//wait before ticking box, needed for dialog to appear and render
				setTimeout(
					function () {
						var ignoreTutorial = $.cookie('ignore_tutorial');
						if (ignoreTutorial == 'true') {
							$('#ignoreTutorialCheck').prop('checked', true);
						}
					}, 100);
			}
		}

		setTutorial(tutorialURL) {
			this.state.tutorialData = {};
			this.addTutorial(tutorialURL);
			this.setDirty(true);
		}

		goToChapter(chapter) {
			this.state.activeTutorial = chapter;
			this.start();
			this.setDirty(true);
		}

		addTutorial(tutorialURL, callback) {
			// do not add if the same url was already successfully added
			if (this.tutorials.includes(tutorialURL)) {
				if(callback!=undefined) {
					callback(this.tutorials);
				}
				return;
			}

			var self = this;

			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: tutorialURL,
				success: function (responseData, textStatus, jqXHR) {
					self.tutorials.push(tutorialURL);
					self.setDirty(true);
					self.loadTutorial(responseData,false);
					// load tutorial
					if(callback!=undefined){
						callback(self.tutorials);
					}
				},
				error: function (responseData, textStatus, errorThrown) {
					throw ("Error retrieving tutorial: " + responseData + "  with error " + errorThrown);
				}
			});
		}

		loadTutorial(tutorialData, start) {
			this.state.tutorialData[tutorialData.name] = tutorialData;

            if(start) {
                this.state.activeTutorial = tutorialData.name;
                this.state.currentStep = 0;
            }

			if (!this.getIgnoreTutorialCookie()) {
				if (start) {
					this.start();
                    this.forceUpdate();
                    if(!this.props.closeByDefault){
                        this.open(true);
        			}
				}
			}
		}

		showChaptersMenu(event) {
			var that = this;
			var allTutorials = Object.keys(this.state.tutorialData);
			if (allTutorials.length > 0) {

				var data = [];
				for (var i = 0; i < allTutorials.length; i++) {
					data.push({
						"label": allTutorials[i],
						"action": ["GEPPETTO.Tutorial.goToChapter('" + allTutorials[i] + "')"],
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
		}

		componentDidUpdate() {
			if (this.chaptersMenu == undefined) {
				var that = this;
				this.chaptersMenu = new GEPPETTO.ContextMenuView();

				var button = $("<div class='fa fa-leanpub' title='Select chapter'></div>").on('click', function (event) {
					that.showChaptersMenu(event);
					event.stopPropagation();
				}).bind(this);

				var dialog = this.dialog.parent();
				var closeButton = dialog.find("button.ui-dialog-titlebar-close");
				closeButton.off("click");
				closeButton.click(this.close.bind(this));
				dialog.find("div.ui-dialog-titlebar").prepend(button);
				$(button).addClass("widget-title-bar-button");
				this.dialog.css("overflow", "auto");
			}
		}

		componentDidMount() {
			this.close();
			var self = this;

			GEPPETTO.on("widgetRestored", function (id) {
				if(self.$el[0].id == id){
					self.forceUpdate();
				}
			});
			
			//launches specific tutorial is experiment is loaded
			GEPPETTO.on(GEPPETTO.Events.Model_loaded, function () {
				if (!self.dontShowTutorial) {
					//default tutorial when user doesn't specify one for this event
					if (self.props.tutorialURL != undefined) {
						self.addTutorial(self.props.tutorialURL);
					}
					else if (self.props.tutorialData != undefined) {
						self.loadTutorial(self.props.tutorialData, true);
					}
					self.dontShowTutorial = true;
				}
			});

			//Launches tutorial from button 
			GEPPETTO.on(GEPPETTO.Events.Show_Tutorial, function () {
				if (self.started== undefined) {
					self.loadTutorial(self.props.tutorialData, true);
					self.open(false);
				}
				else if (self.started) {
					self.open(false);
				} else {
					if (!self.state.visible) {
						self.start();
						self.open(false);
					} else {
						//default tutorial when user doesn't specify one for this event
						if (self.state.tutorialData == {}) {
							self.setTutorial("/org.geppetto.frontend/geppetto/js/components/interface/tutorial/configuration/experiment_loaded_tutorial.json", "Geppetto tutorial");
						}
						else {
							self.start();
						}
					}
				}
			});

			//Hides tutorial
			GEPPETTO.on(GEPPETTO.Events.Hide_Tutorial, function () {
				self.close();
			});

			GEPPETTO.Tutorial = this;

			if (GEPPETTO.ForegroundControls != undefined) {
				GEPPETTO.ForegroundControls.refresh();
			}
		}

		getIgnoreTutorialCookie() {
			var ignoreTutorial = $.cookie('ignore_tutorial');
			if (ignoreTutorial == undefined) {
				//sets to string instead of boolean since $.cookie returns string even when storing as boolean
				return false;
			} else {
				return ignoreTutorial === "true";
			}
		}

		getHTML(message) {
			return { __html: message };
		}

		getView() {
			// add data-type and data field + any other custom fields in the component-specific attribute
			var baseView = super.getView();
			baseView.dataType = "array";
			baseView.data = this.tutorials;
			baseView.componentSpecific = {
				activeTutorial: this.state.activeTutorial,
				currentStep: this.state.currentStep
			};

			return baseView;
		}
		
		setComponentSpecificView(componentSpecific){
			if (componentSpecific != undefined) {
				if (componentSpecific.activeTutorial != undefined) {
					this.goToChapter(componentSpecific.activeTutorial);
				}

				if (componentSpecific.currentStep != undefined) {
					this.gotToStep(componentSpecific.currentStep);
				}
			}
		}

		setView(view) {
			// set base properties
			super.setView(view);
			var self = this;
			var cb = function(tutorials){
				// only restore chapter and step once all the tutorials are loaded
				if(tutorials.length == view.data.length) {
					self.setComponentSpecificView(view.componentSpecific);
				}
			};
			
			// set data
			if (view.data != undefined) {
				if (view.dataType == 'array') {
					if(view.data.length == this.tutorials.length){
						this.setComponentSpecificView(view.componentSpecific);
						if(view.position!=undefined){
							this.updatePosition(view.position);
						}
					}else if (view.data.length > 0){
						for (var i = 0; i < view.data.length; i++) {
							this.addTutorial(view.data[i], cb);
						}
					}
				}
			}

			this.setDirty(false);
		}
		
		updatePosition(position){
			var left,top;
			var screenWidth = $(window).width();
			var screenHeight = $(window).height();
			
			if(position.left!=undefined && position.top!=undefined){
				left = position.left;
				top = position.top;
			}else{
				left = (screenWidth / 2) - (this.dialog.parent().width() / 2);
				top = (screenHeight / 2) - (this.dialog.parent().height() / 2);
			}

			if(typeof top === 'string' && typeof left === 'string'){
				left = (screenWidth / 2) - (this.dialog.parent().width() / 2);
				top = (screenHeight / 2) - (this.dialog.parent().height() / 2);
			}
			
			this.dialog.parent().css("top", top + "px");
			this.dialog.parent().css("left", left + "px");
		}

		render() {

			var ignoreTutorial = this.getIgnoreTutorialCookie();
			var activeTutorial = this.getActiveTutorial();
			if (activeTutorial != undefined) {


				var step = activeTutorial.steps[this.state.currentStep];

				var dialog = this.dialog.parent();
				dialog.find(".ui-dialog-title").html(step.title);
				var iconClass = "";
				if (step.icon != null && step.icon != undefined && step.icon != "") {
					iconClass = step.icon + " fa-3x";
				}

				var prevDisabled = this.state.currentStep == 0;
				var lastStep = this.state.currentStep == activeTutorial.steps.length - 1;
				var lastStepLabel = (this.state.currentStep == activeTutorial.steps.length - 1) ? "Restart" : "";
				var cookieClass = this.state.currentStep == 0 ? "checkbox-inline cookieTutorial" : "hide";

				var width = this.getActiveTutorial()["width"];
				var height = this.getActiveTutorial()["height"];

				if (height != undefined) {
					dialog.height(height + "px");
					//some padding on the bottom
					this.dialog.css("height", height-15 + "px");
				}
				if (width != undefined) {
					dialog.width(width + "px");
					this.dialog.css("width", width + "px");
				}
				

				var showMemoryCheckbox = this.props.showMemoryCheckbox;
				if(showMemoryCheckbox==undefined){
					showMemoryCheckbox = true;
				}

				return <div className="mainTutorialContainer">
					<div className={"tutorial-message " + this.props.tutorialMessageClass}>
						<div id="tutorialIcon" className={iconClass}></div>
						<div id="message" dangerouslySetInnerHTML={this.getHTML(step.message)}></div>
					</div>
					<div className={(activeTutorial.steps.length>1 ? "visible " : "hide ")+"btn-group tutorial-buttons"} role="group">
						<div className={(activeTutorial.steps.length>1 ? "visible " : "hide ")+"tutorial-buttons"}>
							<button className="prevBtn btn btn-default btn-lg" disabled={prevDisabled} data-toogle="tooltip" data-placement="bottom" title="Previous step" data-container="body" onClick={this.prevStep}>
								<span><i className="fa fa-arrow-left fa-2x" aria-hidden="true"></i></span>
							</button>
							<button className="nextBtn btn btn-default btn-lg" data-toogle="tooltip" data-placement="bottom" title="Next step" data-container="body" onClick={this.nextStep}>
								<span>{lastStepLabel}   <i className={lastStep ? "fa fa-undo fa-2x" : "fa fa-arrow-right fa-2x"} aria-hidden="true"></i></span>
							</button>
						</div>
						<label className={(showMemoryCheckbox ? "visible " : "hide ")+ cookieClass} id="ignoreTutorial"><input type="checkbox" id="ignoreTutorialCheck" value="Do not show tutorial at startup again." onClick={this.dontShowAtStartup} /> Do not show tutorial at startup again.</label>
					</div>

				</div>
			}
			else {
				return null;
			}
		}
	};
});
