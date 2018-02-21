/**
 * Main method for testing the HHCEll project
 * @returns
 */
function testSingleCompononetHHProject(test,name){
    casper.then(function(){launchTest(test,"Single Component HH Project",45000);});
    casper.echo("------------STARTING HHCELL TEST--------------");
    casper.then(function(){
    	casper.waitUntilVisible('div[id="Plot2"]', function () {
    		casper.echo("-------Testing Widgets--------");
    		casper.wait(2000, function(){
        		//test plot widgets have expected amount of graphs by counting G elements plotly draws
        		testPlotWidgets(test,"Plot1","hhcell.hhpop[0].v", 1);
        		testPlotWidgets(test,"Plot2","hhcell.hhpop[0].bioPhys1.membraneProperties.naChans.na.m.q",3);
           	});
    	});
    });
    casper.then(function () {
		var experiments = casper.evaluate(function() {return window.Project.getExperiments().length;});
		test.assertEquals(experiments, 1, "Initial amount of experiments for hhcell checked");
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
    
    casper.then(function () {
		test.assertEval(function() {
			return hhcell.hhpop[0].bioPhys1.membraneProperties.naChans.na.h.q.getTimeSeries().length==6001;
		},"Checking that time series length is 6001 in variable for hhcell project");
    });
    
    casper.then(function(){
    	casper.evaluate(function() {
            Plot1.plotData(hhcell.hhpop[0].v);
        });
    });
    casper.then(function(){
    	testPlotWidgets(test,"Plot1","hhcell.hhpop[0].v", 1);
    });
    casper.then(function(){
        removeAllPlots();
    });
    casper.then(function(){
        casper.echo("-------Testing Camera Controls--------");
        testCameraControls(test, [0,0,30.90193733102435]);
    });
    casper.then(function () {
        casper.echo("Opening controls panel");
        buttonClick("#controlPanelBtn");
    });
    casper.then(function(){
        casper.echo("-------Testing Control Panel--------");
        testInitialControlPanelValues(test,3);
    });
    casper.then(function(){
        casper.echo("-------Testing Mesh Visibility--------");
        testVisibility(test,"hhcell.hhpop[0]","#hhcell_hhpop_0__visibility_ctrlPanel_btn");
    });
    casper.then(function () {
        casper.echo("-------Testing Plotting from Control Panel--------");
        buttonClick("#stateVariablesFilterBtn");
    });
    casper.then(function () {
        this.waitUntilVisible('button[id="hhcell_hhpop_0__v_plot_ctrlPanel_btn"]', function () {
            buttonClick("#hhcell_hhpop_0__v_plot_ctrlPanel_btn");
        });	
    });
    casper.then(function(){
        this.waitUntilVisible('div[id="Plot1"]', function () {
            this.echo("I've waited for Plot1 to come up");
        });
    });	

    casper.then(function(){
        buttonClick("#anyProjectFilterBtn");
        removeAllPlots();
    });

    casper.then(function(){
        removeAllPlots();
        var rows = casper.evaluate(function() {
            var rows = $(".standard-row").length;
            return rows;
        });
        test.assertEquals(rows, 10, "Correct amount of rows for Global filter");
        casper.evaluate(function() {
            $("#controlpanel").hide();
        });
    });

    casper.then(function(){
        casper.echo("-------Testing Spotlight--------");
        testSpotlight(test, "hhcell.hhpop[0].v",'div[id="Plot1"]',true,false,"hhcell","hhcell.hhpop[0]");
    });

    casper.then(function () {
        closeSpotlight();
        //adding few widgets to the project to test View state later
        casper.evaluate(function(){
            GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([hhcell])});
            Plot1.setPosition(0,300);
            G.addWidget(1).then(w=>{w.setMessage("Hhcell popup");});
            G.addWidget(1).then(w=>{w.setMessage("Hhcell popup 2").addCustomNodeHandler(function(){},'click');});
        });
    });

    casper.then(function () {
        //toggle tutorial if tutorial button exists
        if(casper.exists('#tutorialBtn')){
            casper.mouseEvent('click', 'button#tutorialBtn', "attempting to open tutorial");
            //click on next step for Tutorial
            casper.evaluate(function () {
                var nextBtnSelector = $(".nextBtn");
                nextBtnSelector.click();
                nextBtnSelector.click();
            });
        }
    });

    casper.then(function () {
        //tests widget canvas has mesh
        var mesh = casper.evaluate(function(){
            var mesh = Canvas2.engine.getRealMeshesForInstancePath("hhcell.hhpop[0]").length;
            return mesh;
        });
        test.assertEquals(mesh, 1, "Canvas widget has hhcell");
    });

    casper.then(function(){	
        casper.echo("-------Testing Camera Controls on main Canvas and Canvas widget--------");
        testCameraControlsWithCanvasWidget(test, [0,0,30.90193733102435]);
    });

    //test color Function
    casper.then(function(){
        var initialColorFunctions = casper.evaluate(function(){
            return GEPPETTO.SceneController.getColorFunctionInstances().length;
        });
        casper.echo("-------Testing Color Function--------");
        //add color Function
        casper.evaluate(function(){
            GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);
            Project.getActiveExperiment().play({step:10});
        });
        var colorFunctionInstances = casper.evaluate(function(){
            return GEPPETTO.SceneController.getColorFunctionInstances().length;
        });
        test.assertNotEquals(initialColorFunctions,colorFunctionInstances, "More than one color function instance found");
        //test3DMeshColorNotEquals(test,defaultColor,"hhcell.hhpop[0]");
        casper.echo("Done Playing, now exiting");
    });

    //reload test, needed for testing view comes up
    casper.then(function(){launchTest(test,"Hhcell",30000);});

    //testing widgets stored in View state come up
    casper.then(function(){
        test.assertVisible('div#Canvas2', "Canvas2 is correctly open on reload.");
        test.assertVisible('div#Plot1', "Plot1 is correctly open on reload");
        test.assertVisible('div#Popup1', "Popup1 is correctly open on reload");
        test.assertVisible('div#Popup2', "Popup2 is correctly open on reload");

        //if tutorial button exists, tests existence of Tutorial
        if(casper.exists('#tutorialBtn')){
            test.assertVisible('div#Tutorial1', "Tutorial1 is correctly open on reload");
            var tutorialStep = casper.evaluate(function() {
                return Tutorial1.state.currentStep;
            });
            test.assertEquals(tutorialStep, 2, "Tutorial1 step restored correctly");
        }
        //Tests content of Popup1 
        var popUpMessage = casper.evaluate(function() {
            return $("#Popup1").html();
        });
        test.assertEquals(popUpMessage, "Hhcell popup", "Popup1 message restored correctly");

        //Tests popup has custom handlers
        var popUpCustomHandler = casper.evaluate(function() {
            return Popup2.customHandlers;
        });
        test.assertEquals(popUpCustomHandler.length, 1, "Popup2 custom handlers restored correctly");
        test.assertEquals(popUpCustomHandler[0]["event"], "click", "Popup2 custom handlers event restored correctly");

        //Test canvas widget has mesh 
        var meshInCanvas2Exists = casper.evaluate(function() {
            var mesh = Canvas1.engine.meshes["hhcell.hhpop[0]"];
            if(mesh!=null && mesh!=undefined){
                return true;
            }
            return false;
        });
        test.assertEquals(meshInCanvas2Exists, true, "Canvas2 hhcell set correctly");
    });	
}

/**
 * Main method for testing ACNet
 */
function testACNET2Project(test){
    casper.then(function(){launchTest(test,"ACNET2",45000);});
    casper.echo("------------Starting Primary Auditory Cortary Test--------------");
    casper.then(function () {
		var experiments = casper.evaluate(function() {return window.Project.getExperiments().length;});
		test.assertEquals(experiments, 2, "Initial amount of experiments for ACNE2 checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return acnet2!=null;});
		test.assertEquals(evaluate,true, "Top level instance present");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return acnet2.baskets_12[3] != undefined && acnet2.pyramidals_48[12] != undefined;
		},"Instances exploded as expected");
	});
    
    casper.page.onCallback = function(){
    	test.assertEval(function() {
			return acnet2.baskets_12[9].getConnections().length===60 && acnet2.pyramidals_48[23].getConnections().length===22;
		},"bask and pyramidal connections check after resolveAllImportTypes() call.");
    };
    
    casper.then(function () {
		casper.evaluate(function() {Model.neuroml.resolveAllImportTypes(window.callPhantom);});
	});
    
    casper.then(function () {
    	test.assertEval(function() {
    		return acnet2.pyramidals_48[23].getVisualGroups().length==5;
    	},"Test number of Visual Groups on pyramidals");
    });

    casper.then(function () {
    	test.assertEval(function() {
    		return acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups().length==3;
    	},"Test number of Visual Groups on acnet2.baskets_12[0]");
    });
    
    casper.then(function () {
    	test.assertEval(function() {
    		return acnet2.pyramidals_48[23].getVisualGroups().length==5;
    	},"Test number of Visual Groups on pyramidals");
    });

    casper.then(function () {
    	test.assertEval(function() {
			return window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
            window.Model.getVariables()[0].getId() == 'acnet2' && window.Model.getVariables()[1].getId() == 'time';
		},"2 top Variables as expected for ACNET2");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2;
		},"2 Libraries as expected for ACNET2");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Instances != undefined && window.Instances.length == 2 && window.Instances[0].getId() == 'acnet2';
		},"1 top level instance as expected for ACNET2");
	});
    
    casper.then(function(){
        removeAllPlots();
    });
    casper.then(function(){
        casper.echo("-------Testing Camera Controls--------");
        testCameraControls(test,[231.95608349343888,508.36555704435455,1849.839]);
    });
    casper.then(function () {
        casper.echo("-------Testing Original Color--------");
        test3DMeshColor(test,[0.796078431372549,0,0],"acnet2.pyramidals_48[0]");
        test3DMeshColor(test,[0.796078431372549,0,0],"acnet2.pyramidals_48[47]");
        test3DMeshColor(test,[0,0.2,0.596078431372549],"acnet2.baskets_12[0]");
        test3DMeshColor(test,[0,0.2,0.596078431372549],"acnet2.baskets_12[11]");
        this.echo("Opening controls panel");
        buttonClick("#controlPanelBtn");
    });

    casper.then(function () {
        casper.echo("-------Testing Control Panel--------");
        testInitialControlPanelValues(test,10);
    });
    casper.then(function(){
        casper.echo("-------Testing Mesh Visibility--------");
        testVisibility(test,"acnet2.pyramidals_48[0]","#acnet2_pyramidals_48_0__visibility_ctrlPanel_btn");
    });
    casper.then(function () {
        casper.echo("-------Testing Plotting from Control Panel--------");
        buttonClick("#stateVariablesFilterBtn");
    });

    casper.then(function () {
        this.waitUntilVisible('button[id="acnet2_pyramidals_48_0__soma_0_v_plot_ctrlPanel_btn"]', function () {
            buttonClick("#acnet2_pyramidals_48_0__soma_0_v_plot_ctrlPanel_btn");
        });	
    });

    casper.then(function () {
        this.waitUntilVisible('div[id="Plot1"]', function () {
            test.assertExists('div[id="Plot1"]', "Plot1 exists");
            casper.evaluate(function() {
                $("#controlpanel").hide();
            });			
        });
    });

    casper.then(function(){
        removeAllPlots(); //removes exisiting plots for clearer view
    });

    casper.then(function () {
        casper.echo("-------Testing Spotlight--------");
        testSpotlight(test, "acnet2.pyramidals_48[1].soma_0.v",'div[id="Plot1"]',true,true,"acnet2.pyramidals_48[0]","acnet2.pyramidals_48[0]");	
        this.mouseEvent('click', 'i.fa-search', "attempting to close spotlight");
    });

    casper.then(function () {
        casper.echo("-------Testing Connected cells to Instance--------");

        //testing right amount of connection lines are shown
        testingConnectionLines(test,23);

        //testing that connected cells of acnet2.pyramidals_48[0] have changed color
        test3DMeshColorNotEquals(test,defaultColor, "acnet2.baskets_12[4]");
        test3DMeshColor(test,[0.39215686274509803,0.5882352941176471,0.08235294117647059], "acnet2.baskets_12[4]");

        test3DMeshColorNotEquals(test,defaultColor, "acnet2.baskets_12[1]");
        test3DMeshColor(test,[1,0.35294117647058826,0.00784313725490196], "acnet2.baskets_12[1]");

        //test they are ghosted
        test3DMeshOpacity(test,0.3, "acnet2.baskets_12[4]");
        test3DMeshOpacity(test,0.3, "acnet2.baskets_12[1]");

    });

    casper.then(function () {
        testSpotlight(test, "acnet2.pyramidals_48[0].biophys.membraneProperties.Ca_pyr_soma_group.gDensity",'div[id="Plot1"]',false,false,"acnet2.pyramidals_48[0]");	
    });

    casper.then(function () {
        casper.evaluate(function(){
            acnet2.pyramidals_48[0].deselect();
        });

        //test these cells are no longer ghosted
        test3DMeshOpacity(test,1, "acnet2.baskets_12[1]");
        test3DMeshOpacity(test,1, "acnet2.baskets_12[4]");
    });

    casper.then(function () {
        closeSpotlight(); //close spotlight before continuing
        casper.echo("-------Testing Canvas Widget and Camera Controls--------");

        //adding few widgets to the project to test View state later
        casper.evaluate(function(){
            GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([acnet2])});
            Plot1.setPosition(0,300); // get out of the way 
            acnet2.baskets_12[4].getVisualGroups()[0].show(true);
        });		
    });

    casper.then(function () {
        //tests camera controls are working by checking camera has moved
        testCameraControlsWithCanvasWidget(test,[231.95608349343888,508.36555704435455,1849.839]);
    });

    casper.then(function () {
        //applies visual group to instance and tests colors
        testVisualGroup(test,"acnet2.baskets_12[0]",2,[[],[0,0.4,1],[0.6,0.8,0]]);	
        testVisualGroup(test,"acnet2.baskets_12[5]",2,[[],[0,0.4,1],[0.6,0.8,0]]);
    });

    casper.then(function(){
        casper.echo("Testing setGeometry");

        casper.evaluate(function(){
            acnet2.pyramidals_48[0].setGeometryType("cylinders")
        });

        //test mesh set geometry
        var meshType = casper.evaluate(function(){
            return Canvas1.engine.getRealMeshesForInstancePath("acnet2.pyramidals_48[0]")[0].type;
        });
        test.assertEquals(meshType, "Mesh", "Correctly set mesh to cylinders");

        var meshTotal = casper.evaluate(function(){
            return Object.keys(Canvas1.engine.meshes).length;
        });
        test.assertEquals(meshTotal, 60, "Correctly amount of meshes after applying cylinders");

        //retrieve original color pre setGeomtry
        var color = getMeshColor(test,"acnet2.pyramidals_48[0]");
        casper.evaluate(function(){
            acnet2.pyramidals_48[0].setGeometryType("lines")
        });

        casper.echo("Testing color post setGeometryType");
        test3DMeshColor(test,color,"acnet2.pyramidals_48[0]");

        //test mesh set geometry
        meshType = casper.evaluate(function(){
            return Canvas1.engine.getRealMeshesForInstancePath("acnet2.pyramidals_48[0]")[0].type;
        });
        test.assertEquals(meshType, "LineSegments", "Correctly set mesh to lines");

        //testsing same amount of meshes exists after changing a mesh to lines
        var meshTotal = casper.evaluate(function(){
            return Object.keys(Canvas1.engine.meshes).length;
        });
        test.assertEquals(meshTotal, 60, "Correctly amount of meshes after applying cylinders");

        //Set geometry type to cylinders
        casper.evaluate(function(){
            acnet2.pyramidals_48[0].setGeometryType("cylinders")
        });

        //test  set geometry type in a mesh
        var meshType = casper.evaluate(function(){
            return Canvas1.engine.getRealMeshesForInstancePath("acnet2.pyramidals_48[0]")[0].type;
        });
        test.assertEquals(meshType, "Mesh", "Correctly set mesh to cylinders");

        casper.echo("Testing color post setGeometryType to cylinders");
        test3DMeshColor(test,color,"acnet2.pyramidals_48[0]");

        //testing same amount of meshes exists after changing a mesh to cylinders
        var meshTotal = casper.evaluate(function(){
            return Object.keys(Canvas1.engine.meshes).length;
        });
        test.assertEquals(meshTotal, 60, "Correctly amount of meshes after applying cylinders");
    });

    casper.then(function () {
        var initialColorFunctions = casper.evaluate(function(){
            return GEPPETTO.SceneController.getColorFunctionInstances().length;
        });
        casper.echo("-------Testing Color Function--------");
        //add color Function
        casper.evaluate(function(){
            GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);
            Project.getActiveExperiment().play({step:10});
        });
        var colorFunctionInstances = casper.evaluate(function(){
            return GEPPETTO.SceneController.getColorFunctionInstances().length;
        });
        test.assertNotEquals(initialColorFunctions,colorFunctionInstances, "More than one color function instance found");
        //		casper.wait(2000, function(){
        //			//test color function
        //			test3DMeshColorNotEquals(test,defaultColor,"acnet2.baskets_12[2].soma_0");
        //		});
        casper.echo("Done Playing, now exiting");
    });
}

function testC302NetworkProject(test){
    casper.then(function(){launchTest(test,"C302",45000);});
    casper.echo("------------STARTING C302 NETWORK TEST--------------");
    
    casper.then(function(){
    	casper.waitUntilVisible('div[id="Plot1"]', function () {
    		this.echo("I've waited for Plot1 to load.");
    		test.assertExists('div[id="Plot1"]', "geppetto loads the initial Plot1");

    		casper.then(function(){
    			casper.waitUntilVisible('div[id="loading-spinner"]', function () {
    				this.echo("I've waited for resolve types loading spinner to appear.");
    			},125000);
    		});
    	},25000);
    });
    
    casper.then(function () {
		var experiments = casper.evaluate(function() {return window.Project.getExperiments().length;});
		test.assertEquals(experiments, 2, "Initial amount of experiments for C302 checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return c302.getChildren().length;});
		test.assertEquals(evaluate, 299, "C302 Children count checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return c302!=null;});
		test.assertEquals(evaluate,true, "Top level instance present");
	});
    
    casper.page.onCallback = function(){
    	casper.echo("-------Testing Resolved Connections--------");

    	test.assertEval(function() {
    		return c302.ADAL[0].getConnections().length=== 31;
    	},"ADAL connections check after resolveAllImportTypes() call.");

    	test.assertEval(function() {
    		return c302.AVAL[0].getConnections().length === 170;
    	},"AVAL connections check after resolveAllImportTypes() call.");

    	test.assertEval(function() {
    		return c302.PVDR[0].getConnections().length===7;
    	},"PVDRD connections check after resolveAllImportTypes() call.");
    };

    casper.then(function () {
    	casper.echo("-------Executing command Model.neuroml.resolveAllImportTypes()--------");
    	casper.evaluate(function() {Model.neuroml.resolveAllImportTypes(window.callPhantom);});
    });
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
            window.Model.getVariables()[0].getId() == 'c302' && window.Model.getVariables()[1].getId() == 'time';
		},"2 top Variables as expected for C302");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2;
		},"2 Libraries as expected for C302");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Instances != undefined && window.Instances.length == 2 && window.Instances[0].getId() == 'c302';
		},"1 top level instance as expected for C302");
	});

    casper.then(function(){
        resetCameraTest(test, [49.25,-0.8000001907348633,733.3303486467378]);
    });

    casper.then(function(){
        removeAllPlots();
    });

    casper.then(function(){
        casper.echo("-------Testing Camera Controls--------");
        testCameraControls(test, [49.25,-0.8000001907348633,733.3303486467378]);
    });
    casper.then(function () {
        test3DMeshColor(test,defaultColor,"c302.ADAL[0]");
        casper.echo("Opening controls panel");
        buttonClick("#controlPanelBtn");
    });

    casper.then(function(){
        testInitialControlPanelValues(test,10);
    });

    casper.then(function () {
        buttonClick("#stateVariablesFilterBtn");
    });

    casper.then(function(){
        this.waitUntilVisible('button[id="c302_ADAL_0__v_plot_ctrlPanel_btn"]', function () {
            buttonClick("#c302_ADAL_0__v_plot_ctrlPanel_btn");
        });
    });

    casper.then(function(){
        this.waitUntilVisible('div[id="Plot1"]', function () {
            this.echo("I've waited for Plot1 to come up");
            buttonClick("#anyProjectFilterBtn");
            this.wait(500,function(){
                var rows = casper.evaluate(function() {
                    var rows = $(".standard-row").length;
                    return rows;
                });
                test.assertEquals(rows, 10, "Correct amount of rows for Global filter");
                casper.evaluate(function() {
                    $("#controlpanel").hide();
                });	
                casper.echo("-------Testing Spotlight--------");
                testSpotlight(test,  "c302.ADAL[0].v",'div[id="Plot2"]',true,false);
            });
        });
    });

    casper.then(function(){
        casper.echo("-------Testing Spotlight--------");
        testSpotlight(test,  "c302.ADAL[0].v",'div[id="Plot2"]',true,false);
    });

    casper.then(function(){
        closeSpotlight(); //close spotlight before continuing
        casper.echo("-------Testing Canvas Widget and Camera Controls for both canvas--------");
        casper.evaluate(function(){
            GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([c302])});
            Plot1.setPosition(0,300);
        });

        testCameraControlsWithCanvasWidget(test,[49.25,-0.8000001907348633,733.3303486467378]);
    });

    casper.then(function(){
        var initialColorFunctions = casper.evaluate(function(){
            return GEPPETTO.SceneController.getColorFunctionInstances().length;
        });
        casper.echo("-------Testing Color Function--------");
        //add color Function
        casper.evaluate(function(){
            GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);
            Project.getActiveExperiment().play({step:10});
        });
        var colorFunctionInstances = casper.evaluate(function(){
            return GEPPETTO.SceneController.getColorFunctionInstances().length;
        });
        test.assertNotEquals(initialColorFunctions,colorFunctionInstances, "More than one color function instance found");
        //		//test color function
        //		casper.wait(2000, function(){
        //			test3DMeshColorNotEquals(test,defaultColor,"c302.PVDR[0]");
        //		});
        casper.echo("Done Playing, now exiting");
    });
}

function ca1Test(test){
    casper.then(function(){launchTest(test,"CA1",45000);});
    casper.echo("------------STARTING CA1 TEST--------------");

    casper.then(function () {
        this.echo("Opening controls panel");
        buttonClick("#controlPanelBtn");
        casper.wait(10000, function(){});
    });

    casper.then(function(){
        testInitialControlPanelValues(test,3);
    });

    casper.then(function(){
        this.evaluate(function(){
            $("#anyProjectFilterBtn").click();
        });
    });

    casper.then(function(){
        casper.evaluate(function() {
            $("#controlpanel").hide();
        });	
        casper.echo("-------Testing Spotlight--------");
        testSpotlight(test,  "ca1.CA1_CG[0].Seg0_apical_dendrite_22_1158.v",'',false,false);
    });

    casper.then(function(){
        closeSpotlight(); //close spotlight before continuing
    });
}

function testPVDRNeuronProject(test){
	casper.then(function(){launchTest(test,"PVDR cell NEURON",200000);});
	casper.echo("------------STARTING PVDR Neuron TEST--------------");
	casper.then(function () {
		var experiments = casper.evaluate(function() {return window.Project.getExperiments().length;});
		test.assertEquals(experiments, 1, "Initial amount of experiments for PVDR checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return window.Project.getActiveExperiment().getId();});
		test.assertEquals(evaluate, 1, "PVDR Project.getActiveExperiment() checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return pvdr!=null;});
		test.assertEquals(evaluate,true, "Top level PVDR instance present");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return pvdr.getConnections().length===0;
		},"Connections checked for PVDR model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return pvdr.getVisualGroups().length===1;
		},"Test number of VisualGroups for PVDR model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
            window.Model.getVariables()[0].getId() == 'pvdr' && window.Model.getVariables()[1].getId() == 'time';
		},"2 top Variables as expected for PVDR model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2;
		},"2 Libraries as expected for PVDR model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Instances != undefined && window.Instances.length == 2 && window.Instances[0].getId() == 'pvdr';
		},"2 top level instance as expected for PVDR model");
	});
}

function testPMuscleCellProject(test){
	casper.then(function(){launchTest(test,"PMuscle cell NEURON",200000);});
	casper.echo("------------STARTING PMuscle Model TEST--------------");
	casper.waitForSelector('div[id="Popup1"]', function() {
        this.echo("I've waited for Popup1 to load.");
    }, null, 30000);
	
	casper.then(function () {
		var experiments = casper.evaluate(function() {return window.Project.getExperiments().length;});
		test.assertEquals(experiments, 1, "Initial amount of experiments for PVDR checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return window.Project.getActiveExperiment().getId();});
		test.assertEquals(evaluate, 1, "PVDR Project.getActiveExperiment() checked");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return net1!=null;});
		test.assertEquals(evaluate,true, "Top level net1 instance present for PMuscle Model");
	});
    
    casper.then(function () {
		var evaluate = casper.evaluate(function() {return net1.getChildren().length;});
		test.assertEquals(evaluate,2, "Children checked for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return net1.getConnections().length===0;
		},"Connections checked for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return !net1.neuron[0].getVisualType().hasCapability('VisualGroupCapability');
		},"Test No visual groups for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return net1.neuron[0].getVisualType().hasCapability('VisualCapability');
		},"Visual capability on neuron for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return net1.muscle[0].getVisualType().hasCapability('VisualCapability');
		},"Visual capability on muscle for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getVariables() != undefined && window.Model.getVariables().length == 2 &&
            window.Model.getVariables()[0].getId() == 'net1' && window.Model.getVariables()[1].getId() == 'time';
		},"2 top Variables as expected for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2;
		},"2 Libraries as expected for PMuscle Model");
	});
    
    casper.then(function () {
		test.assertEval(function() {
			return window.Instances != undefined && window.Instances.length == 2 && window.Instances[0].getId() == 'net1';
		},"2 top level instance as expected for for PMuscle Model");
	});
}

function testC302Connectome(test){
	casper.then(function(){launchTest(test,"C302 Connectome",200000);});
    casper.echo("------------STARTING C302 Connectome TEST--------------");
    casper.waitForSelector('div[id="Popup1"]', function() {
        this.echo("I've waited for Popup1 to load.");
    }, null, 150000);
}


function testCylindersProject(test){
	casper.then(function(){launchTest(test,"Cylinders",200000);});
	casper.echo("------------STARTING Cylinder Orientation TEST--------------");

    casper.then(function () {

        test.assertEval(function() {
            var reference = {"Example2.Pop_OneSeg[0]":[0, Math.PI/2, 0, "XYZ"],
                            "Example2.Pop_OneSeg[1]":[0, Math.PI/2, 0, "XYZ"],
                            "Example2.Pop_TwoSeg[0]":[0, 0, 0, "XYZ"]};
            var results = [];
            for (var path in reference) {
                var rotation = Canvas1.engine.meshes[path].rotation.toArray();
                var expected = reference[path];
                for (var i=0; i<rotation.length; ++i)
                    results.push(rotation[i] === expected[i]);
            }
            for (var i=0; i<rotation.length; ++i)
                results.push(rotation[i] === expected[i]);
	    return results.every(function(x){return x;});
	},"Rotation checked for all segments");
    });
}
