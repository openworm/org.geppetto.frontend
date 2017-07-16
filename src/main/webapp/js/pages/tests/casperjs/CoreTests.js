casper.test.begin('Geppetto basic tests', 219, function suite(test) {
	casper.options.viewportSize = {
			width: 1340,
			height: 768
	};

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

	casper.start(urlBase+"org.geppetto.frontend", function () {
		this.echo(urlBase+baseFollowUp+hhcellProject);
//        this.waitForSelector('div[project-id="1"]', function () {
//            this.echo("I've waited for the projects to load.");
//            test.assertExists('div#logo', "logo is found");
//            test.assertExists('div[project-id="1"]', "Project width id 1 from core bundle are present");
//            test.assertExists('div[project-id="3"]', "Project width id 3 from core bundle are present");
//            test.assertExists('div[project-id="4"]', "Project width id 4 from core bundle are present");
//            test.assertExists('div[project-id="5"]', "Project width id 5 from core bundle are present");
//            test.assertExists('div[project-id="6"]', "Project width id 6 from core bundle are present");
//            test.assertExists('div[project-id="8"]', "Project width id 8 from core bundle are present");
//            test.assertExists('div[project-id="9"]', "Project width id 9 from core bundle are present");
//            test.assertExists('div[project-id="16"]', "Project width id 16 from core bundle are present");
//            test.assertExists('div[project-id="18"]', "Project width id 18 from core bundle are present");
//            test.assertExists('div[project-id="58"]', "Project width id 58 from core bundle are present");
//        }, null, 3000);
    });

	/**Tests HHCELL project**/
	casper.thenOpen(urlBase+baseFollowUp+hhcellProject,function() {
		casper.then(function(){launchTest(test,"Hhcell",30000);});
		casper.then(function(){hhcellTest(test);});
	});
	
	/**Tests Acnet project**/
	casper.thenOpen(urlBase+baseFollowUp+acnetProject,function() {
		casper.then(function(){launchTest(test,"ACNet",30000);});
		casper.then(function(){acnetTest(test);});
	});
	
	/**Tests C302 project**/
	casper.thenOpen(urlBase+baseFollowUp+c302Project,function() {
		casper.then(function(){launchTest(test,"C302",450000);});
		casper.then(function(){c302Test(test);});
	});
	
	/**Tests CA1 project**/
	casper.thenOpen(urlBase+baseFollowUp+ca1Project,function() {
		casper.then(function(){launchTest(test,"CA1",45000);});
		casper.then(function(){ca1Test(test);});
	});
	
	/**Tests EyeWire project**/
	casper.thenOpen(urlBase+baseFollowUp+eyeWire,function() {
		casper.then(function(){launchTest(test,"EyeWireGanglionCell",45000);});
	});
	
	/**Tests Pharyngeal project**/
	casper.thenOpen(urlBase+baseFollowUp+Pharyngeal,function() {
		casper.then(function(){launchTest(test,"Pharyngeal",45000);});
		casper.then(function(){pharyngealTest(test);});
	});
	
//	/**Tests NWB project**/
//	casper.thenOpen(urlBase+baseFollowUp+nwbSample,function() {
//		casper.then(function(){launchTest(test,"NWB Sample",45000);});
//		casper.then(function(){nwbSampleTest(test);});
//	});
	
	/**Tests cElegansConnectome project**/
	casper.thenOpen(urlBase+baseFollowUp+cElegansConnectome,function() {
		casper.then(function(){launchTest(test,"cElegansConnectome",180000);});
	});
	
	/**Tests cElegansMuscleModel project**/
	casper.thenOpen(urlBase+baseFollowUp+cElegansMuscleModel,function() {
		casper.then(function(){launchTest(test,"cElegansMuscleModel",180000);});
	});
	
	/**Tests cElegansPVDR project**/
	casper.thenOpen(urlBase+baseFollowUp+cElegansPVDR,function() {
		casper.then(function(){launchTest(test,"cElegansPVDR",180000);});
	});

	casper.run(function() {
		test.done();
	});
});

/**
 * Main method for testing the HHCEll project
 * @returns
 */
function hhcellTest(test,name){
	casper.echo("------------STARTING HHCELL TEST--------------");
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
	
	casper.then(function(){
		closeSpotlight();
		casper.echo("-------Testing Canvas Widget and Color Function--------");
		//adding few widgets to the project to test View state later
		casper.evaluate(function(){
			hhcell.deselect();
			GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([hhcell])});
			GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);
			Project.getActiveExperiment().play({step:1});
			Plot1.setPosition(0,300);
			G.addWidget(1).setMessage("Hhcell popup");
			G.addWidget(1).setData(hhcell);
			var customHandler = function(node, path, widget) {};
	        Popup2.addCustomNodeHandler(customHandler,'click');
		});
		
		//toggle tutorial if tutorial button exists
		if(casper.exists('#tutorialBtn')){
			casper.mouseEvent('click', 'button#tutorialBtn', "attempting to open tutorial");
		}

		//tests widget canvas has mesh
		var mesh = casper.evaluate(function(){
			var mesh = Canvas2.engine.getRealMeshesForInstancePath("hhcell.hhpop[0]").length;
			return mesh;
		});
		test.assertEquals(mesh, 1, "Canvas widget has hhcell");

		//click on next step for Tutorial
		casper.evaluate(function () {
			var nextBtnSelector = $(".nextBtn");
			nextBtnSelector.click();
			nextBtnSelector.click();
		});
		
		casper.echo("-------Testing Camera Controls--------");
		testCameraControlsWithCanvasWidget(test, [0,0,30.90193733102435]);
		casper.wait(1000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"hhcell.hhpop[0]");
		});
		casper.wait(2000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"hhcell.hhpop[0]");
			casper.echo("Done Playing, now exiting");
		})
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
function acnetTest(test){
	casper.echo("------------STARTING ACNET TEST--------------");
	casper.then(function(){
		removeAllPlots();
	});
	casper.then(function(){
		casper.echo("-------Testing Camera Controls--------");
		testCameraControls(test,[231.95608349343888,508.36555704435455,1849.8390363191731]);
	});
	casper.then(function () {
		casper.echo("-------Testing Original Color--------");
		test3DMeshColor(test,[0.796078431372549,0,0],"acnet2.pyramidals_48[0]");
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
	
	casper.then(function(){
		closeSpotlight(); //close spotlight before continuing
		casper.echo("-------Testing Canvas Widget and Color Function--------");
		
		//adding few widgets to the project to test View state later
		casper.evaluate(function(){
			acnet2.pyramidals_48[0].deselect();
			GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([acnet2])});
			GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);
			Project.getActiveExperiment().play({step:10});
			Plot1.setPosition(0,300);
			acnet2.baskets_12[4].getVisualGroups()[0].show(true);
		});
		
		//tests camera controls are working by checking camera has moved
		testCameraControlsWithCanvasWidget(test,[231.95608349343888,508.36555704435455,1849.8390363191731]);
		
		//applies visual group to instance and tests colors
		testVisualGroup(test,"acnet2.baskets_12[0]",2,[[],[0,0.4,1],[0.6,0.8,0]]);
		
		testVisualGroup(test,"acnet2.baskets_12[5]",2,[[],[0,0.4,1],[0.6,0.8,0]]);
		
		//test these cells are no longer ghosted
		test3DMeshOpacity(test,1, "acnet2.baskets_12[4]");
		test3DMeshOpacity(test,1, "acnet2.baskets_12[1]");
		
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
		
		//test color function
		casper.wait(2000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"acnet2.baskets_12[2].soma_0");
		});
		casper.wait(1000, function(){
			//test color function
			test3DMeshColorNotEquals(test,defaultColor,"acnet2.baskets_12[2].soma_0");
			casper.echo("Done Playing, now exiting");
		})
	})
}

function c302Test(test){
	casper.echo("------------STARTING C302 TEST--------------");
	
	casper.waitForSelector('div[id="Plot1"]', function() {
		this.echo("I've waited for Plot1 to load.");
		test.assertExists('div[id="Plot1"]', "geppetto loads the initial Plot1");
	}, null, 5000);
	
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
		casper.echo("-------Testing Canvas Widget and Color Function--------");
		casper.evaluate(function(){
			GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([c302])});
			GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);
			Project.getActiveExperiment().play({step:10});
			Plot1.setPosition(0,300);
		});
		
		testCameraControlsWithCanvasWidget(test,[49.25,-0.8000001907348633,733.3303486467378]);
		
		//test color function
		casper.wait(2000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"c302.PVDR[0]");
		});
		casper.wait(1000, function(){
			//test color function
			test3DMeshColorNotEquals(test,defaultColor,"c302.PVDR[0]");
			casper.echo("Done Playing, now exiting");
		});
	});
}

function ca1Test(test){
	casper.echo("------------STARTING CA1 TEST--------------");
	casper.waitForSelector('div[id="TreeVisualiserDAT1"]', function() {
		this.echo("I've waited for the TreeVisualiserDAT1 to load.");
		test.assertExists('div[id="TreeVisualiserDAT1"]', "geppetto loads the initial TreeVisualiserDAT1");
	}, null, 5000);
	
	casper.then(function () {
		this.echo("Opening controls panel");
		buttonClick("#controlPanelBtn");
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

function pharyngealTest(test){
	casper.then(function () {
		casper.echo("Opening controls panel");
		buttonClick("#controlPanelBtn");
	});
	
	casper.then(function(){
		testInitialControlPanelValues(test,10);
	});
}

function nwbSampleTest(test){
	casper.waitForSelector('div[id="Popup1"]', function() {
		this.echo("I've waited for Popup1 to load.");
		
		this.waitForSelector('div[id="Popup2"]', function() {
			this.echo("I've waited for Popup2 component to load.");
		});
	}, null, 30000);
}

function c302Muscle(test){
	casper.echo("------------STARTING C302 Muscle Model TEST--------------");
	casper.waitForSelector('div[id="Popup1"]', function() {
		this.echo("I've waited for Popup1 to load.");
	}, null, 30000);
}

function c302Connectome(test){
	casper.echo("------------STARTING C302 Muscle Model TEST--------------");
	casper.waitForSelector('div[id="Popup1"]', function() {
		this.echo("I've waited for Popup1 to load.");
	}, null, 30000);
}

function c302PVDR(test){
	casper.echo("------------STARTING C302 Muscle Model TEST--------------");
	casper.waitForSelector('div[id="Popup1"]', function() {
		this.echo("I've waited for Popup1 to load.");
	}, null, 30000);
}