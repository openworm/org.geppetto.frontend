var TARGET_URL = "http://127.0.0.1";
var port = ":8080"; 
var PROJECT_URL_SUFFIX = "?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/SingleComponentHH/GEPPETTO.json";
var PROJECT_URL_SUFFIX_2 = "?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/pharyngeal/project.json";
var PROJECT_URL_SUFFIX_3 = "?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/balanced/project.json";
var projectID;

casper.test.begin('Geppetto basic tests', 133, function suite(test) {
    casper.options.viewportSize = {
        width: 1340,
        height: 768
    };

    // add for debug info
    //casper.options.verbose = true;
    //casper.options.logLevel = "debug";

    // show unhandled js errors
    casper.on("page.error", function(msg, trace) {
        this.echo("Error: " + msg, "ERROR");
    });

    // show page level errors
    casper.on('resource.received', function (resource) {
        var status = resource.status;
        if (status >= 400) {
            this.echo('URL: ' + resource.url + ' Status: ' + resource.status);
        }
    });

    casper.start(TARGET_URL + port+"/org.geppetto.frontend", function () {
        this.waitForSelector('div#logo', function () {
            this.echo("I waited for the logo to load.");
            test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
            test.assertExists('div#logo', "logo is found");
        }, null, 30000);
    });

    casper.thenOpen(TARGET_URL + port+"/org.geppetto.frontend/login?username=guest1&password=guest", function () {
        /*this.waitForSelector('div#page', function() {
         this.echo("I've waited for the splash screen to come up.");
         test.assertUrlMatch(/splash$/, 'Virgo Splash Screen comes up indicating successful login');
         }, null, 30000);*/
    });

    casper.thenOpen(TARGET_URL+  port+"/org.geppetto.frontend/", function () {
        this.waitForSelector('div.project-preview', function () {
            this.echo("I've waited for the projects to load.");
            test.assertExists('div#logo', "logo is found");
            test.assertSelectorHasText('div.user', 'Guest user', "Guest user is logged in");
        }, null, 30000);
    });

    casper.then(function () {
        testProject(test, TARGET_URL + port+"/org.geppetto.frontend/geppetto" + PROJECT_URL_SUFFIX, true,
            false, 'hhcell.hhpop[0].v', 'Model.neuroml.pulseGen1.delay', true,"hhcell");
    });
    
    casper.then(function () {
    	projectID = this.evaluate(function() {
           return Project.getId();
        });
    	this.echo("Project id to delete : "+projectID);
    });
    
    casper.then(function () {
        reloadProjectTest(test, TARGET_URL + port+"/org.geppetto.frontend/geppetto?load_project_from_id="+projectID,1);
    });
    
    casper.then(function () {
        deleteProject(test, TARGET_URL + port+"/org.geppetto.frontend",projectID);
    });

    casper.then(function () {
        testProject(test, TARGET_URL + port+"/org.geppetto.frontend/geppetto" + PROJECT_URL_SUFFIX_2, false,
            false, 'c302_A_Pharyngeal.M1[0].v', 'Model.neuroml.generic_neuron_iaf_cell.C', false,"c302_A_Pharyngeal");
    });
    
    casper.then(function () {
    	projectID = this.evaluate(function() {
           return Project.getId();
        });
    	this.echo("Project id to delete : "+projectID);
    });
    
    casper.then(function () {
        reloadProjectTest(test, TARGET_URL + port+"/org.geppetto.frontend/geppetto?load_project_from_id="+projectID,1);
    });
    
    casper.then(function () {
        deleteProject(test, TARGET_URL + port+"/org.geppetto.frontend",projectID);
    });

    casper.then(function () {
        testProject(test, TARGET_URL  +port+"/org.geppetto.frontend/geppetto" + PROJECT_URL_SUFFIX_3, false,
            false, '', '', false,"Balanced_240cells_36926conns");
    });
    
    casper.then(function () {
    	projectID = this.evaluate(function() {
           return Project.getId();
        });
    	this.echo("Project id to delete : "+projectID);
    });
    
    casper.then(function () {
        reloadProjectTest(test, TARGET_URL + port+"/org.geppetto.frontend/geppetto?load_project_from_id="+projectID,1);
    });
    
    casper.then(function () {
        deleteProject(test, TARGET_URL + port+"/org.geppetto.frontend",projectID);
    });

    casper.waitForSelector('.project-preview[title^="HippocampalNet"]', function(){
        casper.thenOpen(TARGET_URL + port+"/org.geppetto.frontend/geppetto?load_project_from_id="+getProjectIdByName("HippocampalNet"), function () {
            doConnectivityWidgetsTest(test);
        });
    });

    //TODO: log back in as other users. Check more things
    //TODO: exercise the run loop, check the changing experiment status, try to make experiment fail

    casper.thenOpen(TARGET_URL + port+"/org.geppetto.frontend/logout", function () {
    });
    
    casper.thenOpen(TARGET_URL + port+"/org.geppetto.frontend/login?username=admin&password=admin", function () {
    });

    casper.thenOpen(TARGET_URL+  port+"/org.geppetto.frontend/admin", function () {
        this.waitForSelector('div[class="griddle"]', function () {
            this.echo("I've waited for the admin panel to load.");
        }, null, 30000);
    });
    
    
    casper.run(function () {
        test.done();
    });
});

function getProjectIdByName(name){
    var id = casper.evaluate(function(name){
        return $('.project-preview[title^="'+name+'"]').attr('project-id');
    }, {name: name});
    return id;
}

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
			
			casper.then(function () {
				casper.wait(5000, function () {});
				test.assertVisible('div#Canvas2', "Canvas2 is correctly open on reload.");
				test.assertVisible('div#Popup1', "Popup1 is correctly open on reload");
				test.assertVisible('div#Connectivity1', "Connectivity1 is correctly open on reload");
				
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
			});
		},null,300000);
	});
}

function testProject(test, url, expect_error, persisted, spotlight_record_variable, spotlight_set_parameter, testConsole,widgetCanvasObject) {

    casper.thenOpen(url, function () {
        this.echo("Loading an external model that is not persisted at " + url);

        if (expect_error) {
            casper.then(function () {
                closeErrorMesage(test)
            });
        }

        casper.then(function () {
            doExperimentTableTest(test);
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
                this.evaluate(function() {
                    $('a[href=experiments]').click();
                });

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
        			G.addWidget(1).setMessage("Hhcell popup");
        			var customHandler = function(node, path, widget) {};
        			Popup1.addCustomNodeHandler(customHandler,'click');
        			$(".nextBtn").click();
        			$(".nextBtn").click();
        		},widgetCanvasObject);
        		
        		 casper.wait(5000, function () {});
                this.echo("Checking content of experiment row");
                // test or wait for control panel stuff to be there
                if(this.exists('a[href="#experiments"]')){
                    doExperimentsTableRowTests(test);
                } else {
                    this.waitForSelector('a[href="#experiments"]', function(){
                        doExperimentsTableRowTests(test);
                    }, null, 10000);
                }
                doPrePersistenceExperimentsTableButtonsCheck(test);
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
        		
                this.waitForSelector('button.btn.SaveButton', function () {
                    test.assertVisible('button.btn.SaveButton', "Persist button is present");
                });

                //Good pattern for checking the absence of an attribute
                test.assertEvalEquals(function () {
                    return require('../../utils').dump(this.getElementAttribute('button.SaveButton', 'disabled'));
                }, null, "The persist button is correctly active.");

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
                this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
                doPostPersistenceExperimentsTableButtonCheck(test);
            }, null, 300000);
        });
        casper.then(function () {
            doPostPersistenceSpotlightCheckRecordedVariables(test, spotlight_record_variable);
        });
        casper.then(function () {
            doPostPersistenceSpotlightCheckSetParameters(test, spotlight_set_parameter);
            //TODO: set a variable to record and a parameter to watch and make sure
            //the experiment table row updates correctly.
            //TODO: logout
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
        test.assertExists('a[aria-controls="experiments"]', "Experiments tab anchor is present");

        test.assertExists('div#experiments', "Experiments panel is present");

        test.assertNotVisible('div#experiments', "The experiment panel is correctly closed.");
    });

    casper.then(function () {
        this.echo("Opening experiment console");
        this.evaluate(function() {
            $("a[href='#experiments']").click();
        });

        this.waitUntilVisible('div#experiments', function () {
            test.assertVisible('div#experiments', "The experiment panel is correctly open.");
        }, null, 15000);
    });
}

function doExperimentsTableRowTests(test){
    casper.echo("Opening experiments panel");

    // open first experiment row
    casper.echo("Opening first experiment row");
    casper.evaluate(function() {
        $('tr.experimentsTableColumn:nth-child(1)').click();
    });

    casper.echo("Waiting for row contents to appear");
    // make sure panel is open
    casper.evaluate(function() {
        if(!$('#experimentsOutput').is(':visible')){
            $('#experimentsButton').click();
        }
    });
    casper.waitUntilVisible('td[name=variables]', function(){
        test.assertVisible('td[name=variables]', "Variables column content exists");
        test.assertVisible('td[name=parameters]', "Parameters column content exists");
    }, null, 10000);
}

function doConsoleTest(test) {
    casper.then(function () {
        test.assertExists('a[aria-controls="console"]', "Console tab anchor is present");

        test.assertExists('div#console', "Console panel is present");

        test.assertNotVisible('div#console', "The console panel is correctly closed.");
    });

    casper.then(function () {
        this.click('a[href="#console"]', "Opening command console");

        this.waitUntilVisible('div#console', function () {
            test.assertVisible('div#console', "The console panel is correctly open.");
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
        //Check presence of experiment console buttons AFTER persistence
        casper.waitForSelector('a.activeIcon', function () {
            test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
        }, null, 5000);

        casper.waitForSelector('a.downloadResultsIcon', function () {
            test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
        }, null, 5000);

        casper.mouse.move('a.deleteIcon');
        casper.waitUntilVisible('a.deleteIcon', function () {
            test.assertVisible('a.deleteIcon', "delete button exists and is correctly enabled");
        }, null, 5000);

        casper.mouse.move('a.downloadModelsIcon');
        casper.waitUntilVisible('a.downloadModelsIcon', function () {
            test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
        }, null, 5000);

        casper.mouse.move('a.cloneIcon');
        casper.waitUntilVisible('a.cloneIcon', function () {
            test.assertVisible('a.cloneIcon', "clone button exists and is correctly enabled");
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

function doConnectivityWidgetsTest(test) {
    casper.waitForSelector('a[aria-controls="experiments"]', function () {
        doExperimentTableTest(test);
    });

    casper.waitWhileVisible('div#loading-spinner', function() {
        this.echo("Waited for spinner to finish");
        this.mouse.move('tr.experimentsTableColumn');
        casper.click('.activeIcon');
        this.echo('Activating experiment.');
    }, null, 80000);

    casper.waitForSelector('button#Connectivity', function () {
        this.echo("Waited for connectivity button");
    }, null, 30000);

    casper.then(function() {
        this.mouse.click('button#Connectivity');
        casper.waitForSelector('div#Connectivity1', function () {
            this.echo("Waited for connectivity widget");
            casper.waitWhileVisible("div#loading-spinner", function() {
                this.echo("Waited for spinner to finish");
                casper.mouseEvent('click', 'div#connectivity-config-modal', "closing connectivity modal");
            }, null, 80000);
        }, null, 45000);
    });

    casper.then(function() {
        this.echo('Opening control panel.');
        casper.click('button#controlPanelBtn');
        casper.waitForSelector('button#HippocampalNet_pop_ngf_randomcolor_ctrlPanel_btn', function() {
            this.echo('Changing ngf population color.');
            casper.click('button#HippocampalNet_pop_ngf_randomcolor_ctrlPanel_btn');
            var popColor = casper.evaluate(function() {
                return $('#HippocampalNet_pop_ngf_color_ctrlPanel_btn').css('color');
            });
            this.echo('Closing control panel.')
            casper.sendKeys('input[name="filter"]', casper.page.event.key.Escape, {keepFocus: true});
            test.assertEvalEquals(function() {
                return $("text:contains(ngfcell)").prev().css('fill');
            }, popColor, 'Legend has updated to show new population color.');
        });
    });

    casper.then(function() {
        this.echo('Closing connectivity widget.');
        casper.evaluate(function() {
            Connectivity1.remove();
        });
        // allow to persist
        casper.wait(3000, function () {});
    });
}