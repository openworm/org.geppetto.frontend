var amountOfRuns = 10;
var dropBoxURL="https://www.dropbox.com/1/oauth2/authorize?locale=en_US&client_id=kbved8e6wnglk4h&response_type=code";
var code;
var permissions;

var dropboxcode = casper.cli.get('dropboxcode');

function deleteProject(test, url,id){
	casper.thenOpen(url, function () {
		this.echo("Loading an external model that is persisted at " + url);

		casper.then(function () {
			this.waitForSelector("div.project-preview", function () {
				this.echo("Dashboard loaded")
			}, null, 10000);
		});

		casper.then(function(){
			casper.evaluate(function() {
				$("#projects").scrollTop($("#projects")[0].scrollHeight+1000);
			});
		});

		casper.then(function () {
			this.waitForSelector('div[project-id=\"'+id+'\"]', function (id) {
				this.echo("Waited for scrolldown projects to appear");
				this.mouse.click('div[project-id=\"'+id+'\"]');
			}, id, 4000);
		});

		casper.then(function () {
			this.waitForSelector('a[title=\"Delete project\"]', function () {
				this.echo("Waited for delete icon to delete project");
				this.mouse.click("i.fa-trash-o");
			}, null, 15000);

			this.waitWhileVisible('a[title=\"Open project\"]', function () {
				test.assertNotVisible('a[title=\"Open project\"]', "Correctly deleted project " + id);
			}, null, 30000);
		});
	});
}


function reloadProjectTest(test, url, customHandlers,widgetCanvasObject){
	casper.thenOpen(url, function () {
		this.echo("Reloading persisted project at " + url);

		casper.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for "+url+" project to load.");

			casper.waitForSelector('div#Popup1', function() {
				test.assertVisible('div#Popup1', "Popup1 is correctly open on reload");
			}, null, defaultLongWaitingTime);

			casper.waitForSelector('div#Connectivity1', function() {
				test.assertVisible('div#Connectivity1', "Connectivity1 is correctly open on reload");
			}, null, defaultLongWaitingTime);

			casper.waitForSelector('div#Canvas2', function() {
				test.assertVisible('div#Canvas2', "Canvas2 is correctly open on reload.");

				if(casper.exists('#tutorialBtn')){
					test.assertVisible('div#Tutorial1', "Tutorial1 is correctly open on reload");

					var tutorialStep = casper.evaluate(function() {
						return Tutorial1.state.currentStep;
					});

					test.assertEquals(tutorialStep, 2, "Tutorial1 step restored correctly");
				}

				var popUpCustomHandler = casper.evaluate(function() {
					return Popup1.customHandlers;
				});

				test.assertEquals(popUpCustomHandler.length, customHandlers, "Popup1 custom handlers restored correctly");
				test.assertEquals(popUpCustomHandler[0]["event"], "click", "Popup2 custom handlers event restored correctly");

				var meshInCanvas2Exists = casper.evaluate(function() {
					var mesh = $.isEmptyObject(Canvas1.engine.meshes);

					return mesh;
				});

				test.assertEquals(meshInCanvas2Exists, false, "Canvas2 has mesh set correctly");
			}, null, defaultLongWaitingTime);
		},null,defaultLongWaitingTime);
	});
}

function testProject(test, url, expect_error, persisted, spotlight_record_variable, spotlight_set_parameter, testConsole,widgetCanvasObject) {

	casper.thenOpen(url, function () {
		this.echo("Loading an external model that is not persisted at " + url);

		casper.then(function () {
			casper.waitWhileVisible('div[id="loading-spinner"]', function () {
				this.echo("I've waited for "+url+" project to load.");
				test.assertTitle("geppetto", "geppetto title is ok");
				test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
				test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
				test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			},null,defaultLongWaitingTime);
		});

		casper.then(function () {
			if (expect_error) {
				casper.then(function () {
					closeErrorMesage(test)
				});
			}

			casper.then(function () {
				doExperimentTableTest(test);
				//FIXME Restore after fixing console test
				if(testConsole){
					doConsoleTest(test);
				}
			});

			casper.then(function () {
				this.waitForSelector('tr.experimentsTableColumn:nth-child(1)', function () {
					test.assertExists('tr.experimentsTableColumn:nth-child(1)', "At least one experiment row exists");
				}, null, 60000);
			});

			//do checks on the state of the project if it is not persisted
			if (persisted == false) {
				casper.then(function () {
					// make sure experiment panel is open
					// casper.clickLabel('Experiments', 'span');

					//roll over the experiments row
					this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
				});

				casper.then(function () {
					if(casper.exists('#tutorialBtn')){
						casper.mouseEvent('click', 'button#tutorialBtn', "attempting to open tutorial");
					}
					casper.evaluate(function(widgetCanvasObject) {
						var canvasObject = null;
						if(widgetCanvasObject=="hhcell"){
							canvasObject = hhcell;
						}else if(widgetCanvasObject=="c302_A_Pharyngeal"){
							canvasObject = c302_A_Pharyngeal;
						}else if(widgetCanvasObject=="Balanced_240cells_36926conns"){
							canvasObject = Balanced_240cells_36926conns;
						}
						G.addWidget(6);
						GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([canvasObject])});
						G.addWidget(1).then(w=>{w.setMessage("Hhcell popup").addCustomNodeHandler(function(){},'click');});
						$(".nextBtn").click();
						$(".nextBtn").click();
					},widgetCanvasObject);
				});
				casper.then(function () {
					this.echo("Checking content of experiment row");
					// test or wait for control panel stuff to be there
					if(this.exists('span[class*="tabber"]')){
						doExperimentsTableRowTests(test);
					} else {
						this.waitForSelector('span[class*="tabber"]', function(){
							doExperimentsTableRowTests(test);
						}, null, 10000);
					}
					//roll over the experiments row
					this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
					//doPrePersistenceExperimentsTableButtonsCheck(test);
				});
				casper.then(function () {
					if(spotlight_record_variable != ''){
						doPrePersistenceSpotlightCheckRecordedVariables(test, spotlight_record_variable);
					}
				});
				casper.then(function () {
					if(spotlight_set_parameter != '') {
						doPrePersistenceSpotlightCheckSetParameters(test, spotlight_set_parameter);
					}
				});

				casper.then(function () {
					casper.wait(5000, function () {});
				});

				casper.then(function () {
					this.waitForSelector('button.btn.SaveButton', function () {
						test.assertVisible('button.btn.SaveButton', "Persist button is present");
					});

					//Not really testing anything
					/*//Good pattern for checking the absence of an attribute
                    test.assertEvalEquals(function () {
                        return require('../../utils').dump(this.getElementAttribute('button.SaveButton', 'disabled'));
                    }, null, "The persist button is correctly active.");*/

					//Click persist button. Check things again
					this.mouseEvent('click', 'button.btn.SaveButton', "attempting to persist");

				});

				//TODO: make this work
				//this.mouseEvent('click', 'button[data-reactid=".9.4"]', "Running an experiment");

				//TODO: Test indicator light during experiment run
				//TODO: test experiment buttons again to see if they are in the right configuration after simulation run

				//TODO: Clone an experiment and see if it has the right state and changes the state correctly for the other experiment rows

			}

			casper.then(function () {
				test.assertExists("button.btn.SaveButton[disabled]", "The persist button is now correctly inactive");
			});
			casper.then(function () {
				this.echo("Waiting for persist star to stop spinning");
				casper.waitWhileSelector('button.btn.SaveButton > i.fa-spin', function () {
					//roll over the experiments row
					this.echo("Persist star to stopped spinning");
					//doPostPersistenceExperimentsTableButtonCheck(test);
				}, null, defaultLongWaitingTime);
			});
			casper.then(function () {
				doPostPersistenceSpotlightCheckSetParameters(test, spotlight_set_parameter);
				//TODO: set a variable to record and a parameter to watch and make sure
				//the experiment table row updates correctly.
				//TODO: logout
			});
		});
	});
}

function closeErrorMesage(test) {
	casper.waitUntilVisible('div.modal-content', function () {
		this.echo("I've waited for the popup message to load up");
		test.assertVisible('h3.text-center', "Error message correctly pops up");
		test.assertSelectorHasText('h3.text-center', 'Message', "Error message correctly pops up with the message header");
		this.mouseEvent('click', 'button.btn', "closing error message");
		this.waitWhileVisible('h3.text-center', function () {
			test.assertNotVisible('h3.text-center', "Correctly closed error message");
		}, null, 30000);
	}, null, 20000);
}

function doExperimentTableTest(test) {
	casper.then(function () {
		test.assertExists('span[class*="tabber"]', "Experiments tab anchor is present");

		test.assertSelectorHasText('span[class*="tabber"]', 'Experiments');

		test.assertExists('div#experimentsOutput', "Experiments panel is present");

		test.assertNotVisible('div#experimentsOutput', "The experiment panel is correctly closed.");
	});

	casper.then(function () {
		this.echo("Opening experiment console");
		casper.clickLabel('Experiments', 'span');

		this.waitUntilVisible('div#experimentsOutput', function () {
			test.assertVisible('div#experimentsOutput', "The experiment panel is correctly open.");
			this.echo("Closing experiment console");
			casper.clickLabel('Experiments', 'span');
		}, null, 15000);
	});
}

function doExperimentsTableRowTests(test){
	casper.echo("Opening experiments panel");
	casper.clickLabel('Experiments', 'span');

	// open first experiment row
	casper.echo("Opening first experiment row");
	casper.evaluate(function() {
		$('tr.experimentsTableColumn:nth-child(1)').click();
	});

	casper.echo("Waiting for row contents to appear");
	// make sure panel is open
	casper.evaluate(function() {
		if(!$('#experimentsOutput').is(':visible')){
			//$('#experimentsButton').click();
			//this.echo("Closing experiment console");
			casper.clickLabel('Experiments', 'span');
		}
	});
	casper.waitUntilVisible('td[name=variables]', function(){
		test.assertVisible('td[name=variables]', "Variables column content exists");
		test.assertVisible('td[name=parameters]', "Parameters column content exists");
	}, null, 10000);
}

function doConsoleTest(test) {

	casper.then(function () {
		test.assertExists('span[class*="tabber"]', "Tabber anchor is present");

		test.assertSelectorHasText('span[class*="tabber"]', 'Console');

		test.assertExists('div[class*="consoleContainer"]', "Console panel is present");

		test.assertNotVisible('div[class*="consoleContainer"]', "The console panel is correctly closed.");
	});

	casper.then(function () {
		//this.click('a[href="#console"]', "Opening command console");
		casper.clickLabel('Console', 'span');

		this.waitUntilVisible('div.consoleContainer', function () {
			test.assertVisible('div.consoleContainer', "The console panel is correctly open.");
			//type into console command (getTimeSeries()) half finished for state variable
			casper.evaluate(function() {
				$('textarea#commandInputArea').val('hhcell.hhpop[0].v.getTi');
				$('textarea#commandInputArea').trigger('keydown');
			});
			casper.wait(200, function () {
				var nameCount = casper.evaluate(function () {
					//retrieve console input via jquery
					var output = $('textarea#commandInputArea').val();
					return output;
				});
				casper.echo(nameCount);
				//console should return command fully finished after autocomplete kicks in
				test.assertEquals(nameCount, "hhcell.hhpop[0].v.getTimeSeries()", "Autocomplete for state variable present.");

				casper.sendKeys('textarea#commandInputArea', "", {reset: true});
			});
		}, null, 5000);
	});

	casper.then(function () {
		//type into console command (isSelected()) half finished for object, if
		//updated capability worked then isSelected() method from object VisualCapability
		//will be part of object hhcell
		casper.evaluate(function() {
			$('textarea#commandInputArea').val('hhcell.isS');
			$('textarea#commandInputArea').trigger('keydown');
		});
		casper.wait(200, function () {
			var nameCount = casper.evaluate(function () {
				//retrieve console input via jquery
				var output = $('textarea#commandInputArea').val();
				return output;
			});
			casper.echo(nameCount);
			//console should return command fully finished after autocomplete kicks in
			test.assertEquals(nameCount, "hhcell.isSelected()", "Autocomplete for updated capability present.");

			casper.sendKeys('textarea#commandInputArea', "", {reset: true});
		});
	});
}

function doPrePersistenceExperimentsTableButtonsCheck(test) {
	//Check presence of experiment console buttons before persistence
	casper.waitForSelector('a.activeIcon', function () {
		test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
	}, null, 10000);

	casper.waitForSelector('a.deleteIcon', function () {
		test.assertDoesntExist('a.enabled.deleteIcon', "delete button exists and is correctly not enabled");
	}, null, 10000);

	casper.waitForSelector('a.downloadResultsIcon', function () {
		test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
	}, null, 10000);

	casper.waitForSelector('a.downloadModelsIcon', function () {
		test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
	}, null, 10000);

	casper.waitForSelector('a.cloneIcon', function () {
		test.assertDoesntExist('a.enabled.cloneIcon', "clone button exists and is correctly not enabled");
	}, null, 10000);
}

function doPostPersistenceExperimentsTableButtonCheck(test) {
	casper.waitForSelector('button.btn.SaveButton[disabled]', function () {
		casper.wait(5000, function () {});
		
		test.assertSelectorHasText('span[class*="tabber"]', 'Console', 'Experiments button exists');

		casper.mouse.move('tr.experimentsTableColumn:nth-child(1)');
		//Check presence of experiment console buttons AFTER persistence
		casper.waitForSelector('a.activeIcon', function () {
			test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
		}, null, 5000);

		casper.waitForSelector('a.downloadResultsIcon', function () {
			test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
		}, null, 5000);

		casper.waitUntilVisible('a.downloadModelsIcon', function () {
			test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
		}, null, 5000);

		casper.waitUntilVisible('a.cloneIcon', function () {
			test.assertVisible('a.cloneIcon', "clone button exists and is correctly enabled");
		}, null, 5000);

		casper.waitUntilVisible('a.deleteIcon', function () {
			test.assertVisible('a.deleteIcon', "delete button exists and is correctly enabled");
		}, null, 5000);
	});
}


function doSpotlightCheck(test, spotlight_search, persisted, check_recorded_or_set_parameters) {
	// do checks only if spotlight search is specified
	if(spotlight_search!= '') {
		test.assertExists('i.fa-search', "Spotlight button exists")
		casper.mouseEvent('click', 'i.fa-search', "attempting to open spotlight");

		casper.waitUntilVisible('div#spotlight', function () {
			test.assertVisible('div#spotlight', "Spotlight opened");

			//type in the spotlight
			casper.sendKeys('input#typeahead', spotlight_search, {keepFocus: true});
			//press enter
			casper.sendKeys('input#typeahead', casper.page.event.key.Return, {keepFocus: true});

			casper.waitUntilVisible('div#spotlight', function () {

				casper.then(function () {

					if (persisted) {
						if (check_recorded_or_set_parameters) {
							this.echo("Waiting to see if the recorded variables button becomes visible");
							casper.waitUntilVisible('button#watch', function () {
								test.assertVisible('button#watch', "Record variables icon correctly visible");
								this.echo("Recorded variables button became visible correctly");
							}, null, 8000);
						} else {
							//TESTS THAT THE PARAMETER IS SETTABLE
							test.assertVisible('input.spotlight-input', "Parameter input field correctly visible");
						}
					} else {
						if (check_recorded_or_set_parameters) {
							//TESTS THAT THE VARIABLE IS NOT RECORDABLE
							test.assertNotVisible('button#watch', "Record variables icon correctly not visible");
						} else {
							//TESTS THAT THE PARAMETER IS NOT SETTABLE
							test.assertNotVisible('input.spotlight-input', "Parameter input field correctly not visible");
						}
					}
				});

				casper.then(function () {
					this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
					casper.mouseEvent('click', 'div#spotlight', "attempting to close spotlight");
					this.echo("Clicking to close spotlight");
					casper.sendKeys('input#typeahead', casper.page.event.key.Escape, {keepFocus: true});
					this.echo("Hitting escape to close spotlight");

					this.waitWhileVisible('div#spotlight', function () {
						test.assertNotVisible('div#spotlight', "Spotlight closed correctly");
					}, null, 10000);
				})
			});

		});
	}
}

function doPrePersistenceSpotlightCheckRecordedVariables(test, spotlight_search) {
	doSpotlightCheck(test, spotlight_search, false, true);
}

function doPrePersistenceSpotlightCheckSetParameters(test, spotlight_search) {
	doSpotlightCheck(test, spotlight_search, false, false);
}

function doPostPersistenceSpotlightCheckRecordedVariables(test, spotlight_search) {
	doSpotlightCheck(test, spotlight_search, true, true);
}

function doPostPersistenceSpotlightCheckSetParameters(test, spotlight_search) {
	doSpotlightCheck(test, spotlight_search, true, false);
}

function testPersistedProjectFeatures(test,url){
	casper.thenOpen(url, function () {
		this.echo("Loading a model that is persisted at " + url);

		casper.then(function () {
			casper.waitWhileVisible('div[id="loading-spinner"]', function () {
				this.echo("I've waited for "+url+" project to load.");
				test.assertTitle("geppetto", "geppetto title is ok");
				test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
				test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
				test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			},null,defaultLongWaitingTime);
		});

		casper.then(function () {
			casper.then(function () {
				var experiments = casper.evaluate(function() {return window.Project.getExperiments().length;});
				test.assertEquals(experiments, 3, "Initial amount of experiments for hhcell checked");
			});

			casper.then(function () {
				test.assertEval(function() {
					return window.Project.getExperiments().length > 1;
				},"Loaded project from persistence");
			});

			casper.then(function(){
				casper.evaluate(function() {
					window.Project.getExperiments()[1].setActive();
				});
			});

			casper.then(function () {
				casper.waitWhileVisible('div[id="loading-spinner"]', function () {
					this.echo("I've waited for experment to be actve.");
					test.assertEval(function() {
						return window.Project.getActiveExperiment().getId()===2;
					},"New Active experiment id of loaded project checked");
				},null,10000);
			});

			casper.then(function () {
				var evaluate = casper.evaluate(function() {return hhcell!=null;});
				test.assertEquals(evaluate,true, "Top level instance present");
			});

			casper.then(function () {
				test.assertEval(function() {
					return window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
					window.Model.getVariables()[0].getId() == 'hhcell' && window.Model.getVariables()[1].getId() == 'time';
				},"2 top Variables as expected for hhcell");
			});

			casper.then(function () {
				test.assertEval(function() {
					return window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2;
				},"2 Libraries as expected for hhcell");
			});

			casper.then(function () {
				test.assertEval(function() {
					return window.Instances != undefined && window.Instances.length == 2 && window.Instances[0].getId() == 'hhcell';
				},"1 top level instance as expected for hhcell");
			});

		});

		casper.then(function () {
			testUpload2DropBoxFeature(test,url);
		});

		casper.then(function () {
			testDownloadExperimentModel(test);
		});

		casper.then(function () {
			testDownloadExperimentResults(test);
		});

		for(var testRun=0;testRun<amountOfRuns;testRun++){
			casper.then(function () {
				testCreateExperiment(test);
			});

			casper.then(function () {
				experimentConsoleToggleTests(test,4);
			});

			casper.then(function () {
				testDeleteExperiment(test);
			});

			casper.then(function () {
				experimentConsoleToggleTests(test,3);
			});

			casper.then(function () {
				testCloneExperiment(test);
			});

			casper.then(function () {
				experimentConsoleToggleTests(test,4);
			});

			casper.then(function () {
				testDeleteExperiment(test);
			});

			casper.then(function () {
				experimentConsoleToggleTests(test,3);
			});

			casper.then(function () {
				testCreateExperiment(test);
			});

			casper.then(function () {
				experimentConsoleToggleTests(test,4);
			});

			casper.then(function () {
				testSaveExperimentProperties(test);
			});

			casper.then(function () {
				testSaveProjectProperties(test);
			});

			casper.then(function () {
				testDeleteExperiment(test);
			});

			casper.then(function () {
				experimentConsoleToggleTests(test,3);
			});
		}
	});
}

function testUpload2DropBoxFeature(test,projectURL){
	casper.then(function () {
		permissions = test.assertEval(function() {
			var login = GEPPETTO.UserController.isLoggedIn();
			var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
			var projectPersisted = window.Project.persisted;
			return writePermission && projectPersisted && login;
		},"No Permissions restrictions for uploading!");
	});

	
	casper.then(function () {
		casper.clickLabel('Console', 'span');
	});

	casper.then(function(){
		this.waitUntilVisible('div[id="undefined_console"]', function () {
			casper.then(function () {
				casper.evaluate(function() {
					G.debug(true);
				});
			});
		});
	});
	
	if(dropboxcode!=null && dropboxcode !=undefined && dropboxcode!=""){

		casper.then(function () {
			casper.evaluate(function(dropboxcode) {
				G.linkDropBox(dropboxcode);
			},dropboxcode);
			this.echo("Copy drop box access code"+dropboxcode);
		});

		casper.then(function () {
			casper.waitForText("Dropbox linked successfully", function() {
				this.echo('Dropbox linked successfully using persisted project hhcell');
			},10000);
		});

		casper.then(function () {
			casper.evaluate(function(permissions) {
				if(permissions){
					window.Project.getActiveExperiment().uploadModel('hhcell');
					window.Project.getActiveExperiment().uploadResults("hhcell", "GEPPETTO_RECORDING");
				}
			},permissions);
			this.echo("");
		});

		casper.then(function () {
			casper.waitForText("Results uploaded succesfully", function() {
				this.echo('Results uploaded succesfully using persisted project hhcell');
			},150000);

			casper.waitForText("Model uploaded succesfully", function() {
				this.echo('Model uploaded succesfully using persisted project hhcell');
			},150000);
		});
	}
}

function testDownloadExperimentModel(test){
	casper.then(function () {
		casper.evaluate(function() {
			var login = GEPPETTO.UserController.isLoggedIn();
			var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
			var projectPersisted = window.Project.persisted;
			if(writePermission && projectPersisted && login){
				window.Project.downloadModel('hhcell');
			}
		});
	});

	casper.then(function () {
		casper.waitForText("Results downloaded succesfully", function() {
			this.echo('Results downloaded succesfully using persisted project hhcell');
		},150000);
	});
}

function testDownloadExperimentResults(test){
	casper.then(function () {
		casper.evaluate(function() {
			var login = GEPPETTO.UserController.isLoggedIn();
			var writePermission = GEPPETTO.UserController.hasPermission(GEPPETTO.Resources.WRITE_PROJECT);
			var projectPersisted = window.Project.persisted;
			if(writePermission && projectPersisted && login){
				window.Project.getActiveExperiment().downloadResults('hhcell', 'GEPPETTO_RECORDING');
			}
		});
	});

	casper.then(function () {
		casper.waitForText("Results downloaded succesfully", function() {
			this.echo('Results downloaded succesfully using persisted project hhcell');
		},150000);
	});
}

function testSaveProjectProperties(test){
	casper.then(function () {
		casper.evaluate(function() {
			var properties = {"name": "New Project Name"};
			window.Project.saveProjectProperties(properties);
		});
		this.echo("--------Save project using persisted project hhcell");
	});

	casper.then(function () {
		casper.waitForText("Project saved succesfully", function() {
			this.echo('Project saved succesfullyusing persisted project hhcell');
		},150000);
	});
}

function testSaveExperimentProperties(test){
	casper.then(function () {
		casper.evaluate(function() {
			var properties = {"name": "New Name for Experiment",
					"conversionServiceId" : "testService",
					"simulatorId" : "testSimulator",
					"length" : "2",
					"timeStep" : "3",
					"aspectInstancePath" : "hhcell(net1)"};
			window.Project.getExperiments()[(window.Project.getExperiments().length-1)].saveExperimentProperties(properties);
		});
		this.echo("--------Save experiment using persisted project hhcell");
	});

	casper.then(function () {
		casper.waitForText("Experiment saved succesfully", function() {
			this.echo('Experiment saved succesfully using persisted project hhcell');
		},150000);
	});
}

function testDeleteExperiment(test){
	casper.then(function () {
		casper.evaluate(function() {
			window.Project.getExperiments()[(window.Project.getExperiments().length-1)].deleteExperiment();
		});
		this.echo("--------Deleting new experiment using persisted project hhcell");
	});

	casper.then(function () {
		casper.waitForText("Experiment deleted succesfully", function() {
			this.echo('Experiment deleted succesfully using persisted project hhcell');

			casper.then(function () {
				test.assertEval(function() {
					return window.Project.getExperiments().length===3;
				},"Experiment deleted checked using persisted project hhcell");
			});

			casper.then(function() {    
				casper.evaluate(function() {
					document.getElementById('infomodal-btn').click();
				});
			});
		},150000);
	});
}

function testCreateExperiment(test){
	casper.then(function () {
		casper.evaluate(function() {
			window.Project.newExperiment();
		});
		this.echo("------Creating new experiment using persisted project hhcell");
	});

	casper.then(function () {
		casper.waitForText("Experiment created succesfully", function() {
			this.echo("Experiment created succesfully using persisted project hhcell");

			casper.then(function () {
				test.assertEval(function() {
					return window.Project.getExperiments().length===4;
				},"New experiment created checked using persisted project hhcell");
			});
		},150000);
	});
}

function testCloneExperiment(test){
	casper.then(function () {
		casper.evaluate(function() {
			window.Project.getExperiments()[0].clone();
		});
		this.echo("-----Cloning new experiment using persisted project hhcell");
	});

	casper.then(function () {
		casper.waitForText("Experiment created succesfully", function() {
			this.echo('Experiment cloned succesfully using persisted project hhcell');

			casper.then(function () {
				test.assertEval(function() {
					return window.Project.getExperiments().length===4;
				},"Experiment cloned checked using persisted project hhcell");

				test.assertEval(function() {
					return Project.getExperiments()[0].simulatorConfigurations["hhcell"].length ===
						Project.getExperiments()[Project.getExperiments().length-1].simulatorConfigurations["hhcell"].length;
				},"Clone Experiment - Simulator Configuration duration checked");

				test.assertEval(function() {
					return Project.getExperiments()[0].simulatorConfigurations["hhcell"].timeStep===
						Project.getExperiments()[Project.getExperiments().length-1].simulatorConfigurations["hhcell"].timeStep;
				},"Clone Experiment - Simulator Configuration time step checked");

				test.assertEval(function() {
					return Project.getExperiments()[0].simulatorConfigurations["hhcell"].simulatorId===
						Project.getExperiments()[Project.getExperiments().length-1].simulatorConfigurations["hhcell"].simulatorId;
				},"Clone Experiment - Simulator Configuration service id checked");
			});
		},150000);
	});
}

function experimentConsoleToggleTests(test,rowLength){
	casper.then(function () {
		casper.then(function () {
			this.wait(1500, function () {});
		});

		casper.then(function () {
			this.echo("Opening experiment console");
			casper.clickLabel('Experiments', 'span');

			this.waitUntilVisible('div#experimentsOutput', function () {
				test.assertVisible('div#experimentsOutput', "The experiment panel is correctly open.");
			}, null, 15000);
		});
		casper.then(function () {
			var length = casper.evaluate(function() {
				return document.getElementsByClassName("nested-experiment-info").length;
			});

			test.assertEquals(length, rowLength,"Amount of experiment rows correct")
		});

		casper.then(function () {
			casper.then(function () {
				casper.clickLabel('Console', 'span');
			});

			casper.then(function(){
				this.waitUntilVisible('div[id="undefined_console"]', function () {
					casper.then(function () {
						casper.evaluate(function() {
							G.debug(true);
							GEPPETTO.CommandController.clear();
						});
					});
				});
			});
		});
	});
}