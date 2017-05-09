casper.test.begin('Geppetto basic tests', 52, function suite(test) {
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
        this.waitForSelector('div[project-id="1"]', function () {
            this.echo("I've waited for the projects to load.");
            test.assertExists('div#logo', "logo is found");
            test.assertExists('div[project-id="1"]', "Project width id 1 from core bundle are present");
            test.assertExists('div[project-id="3"]', "Project width id 3 from core bundle are present");
            test.assertExists('div[project-id="4"]', "Project width id 4 from core bundle are present");
            test.assertExists('div[project-id="5"]', "Project width id 5 from core bundle are present");
            test.assertExists('div[project-id="6"]', "Project width id 6 from core bundle are present");
            test.assertExists('div[project-id="8"]', "Project width id 8 from core bundle are present");
            test.assertExists('div[project-id="9"]', "Project width id 9 from core bundle are present");
            test.assertExists('div[project-id="16"]', "Project width id 16 from core bundle are present");
            test.assertExists('div[project-id="18"]', "Project width id 18 from core bundle are present");
            test.assertExists('div[project-id="58"]', "Project width id 58 from core bundle are present");
        }, null, 3000);
    });

	/**Tests HHCELL project**/
	casper.thenOpen(urlBase+baseFollowUp+hhcellProject,function() {
		casper.then(function(){launchTest(test,"Hhcell");});
		casper.then(function(){hhcellTest(test);});
	});
	
	/**Tests Acnet project**/
	casper.thenOpen(urlBase+baseFollowUp+acnetProject,function() {
		casper.then(function(){launchTest(test,"ACNet");});
		casper.then(function(){acnetTest(test);});
	});
//	
//	/**Tests C302 project**/
//	casper.thenOpen(urlBase+baseFollowUp+c302Project,function() {		
//		this.waitWhileVisible('div[id="loading-spinner"]', function () {
//			this.echo("I've waited for c302 project to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=6/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//			test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
//			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
//			c302Test(test);
//		},null,450000);
//	});


//
//	/**Tests CA1 project**/
//	casper.thenOpen(urlBase+baseFollowUp+ca1Project,function() {
//		this.waitWhileVisible('div[id="loading-spinner"]', function () {
//			this.echo("I've waited for CA1 project to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=3/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//			test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
//			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
//			ca1Test(test);
//		},null,40000);
//	});
//	
//	/**Tests EyeWire project**/
//	casper.thenOpen(urlBase+baseFollowUp+eyeWire,function() {
//		this.waitForSelector('div[id="Popup1"]', function() {
//			this.echo("I've waited for the EyeWireGanglionCell project to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=9/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//			test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
//			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
//		}, null, 50000);
//	});
//	
//	/**Tests Pharyngeal project**/
//	casper.thenOpen(urlBase+baseFollowUp+Pharyngeal,function() {
//		this.waitWhileVisible('div[id="loading-spinner"]', function () {
//			this.echo("I've waited for the Pharyngeal project to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=58/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//			test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
//			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
//			pharyngealTest(test);
//		},null,50000);
//	});
//	
//	/**Tests NWB project**/
//	casper.thenOpen(urlBase+baseFollowUp+nwbSample,function() {
//		this.waitWhileVisible('div[id="loading-spinner"]', function () {
//			this.echo("I've waited for NWB project to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=18/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//			test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
//			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
//			nwbSampleTest(test);
//		},null,50000);
//	});
	
//	casper.thenOpen(urlBase+baseFollowUp+cElegansConnectome,function() {
//		this.waitForSelector('div[id="sim-toolbar"]', function() {
//			this.echo("I've waited for the simulation controls to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=16/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//		}, null, 30000);
//	});
//	
//	casper.thenOpen(urlBase+baseFollowUp+cElegansMuscleModel,function() {
//		this.waitForSelector('div[id="sim-toolbar"]', function() {
//			this.echo("I've waited for the simulation controls to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=4/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//		}, null, 30000);
//	});
//	
//	casper.thenOpen(urlBase+baseFollowUp+cElegansPVDR,function() {
//		this.waitForSelector('div[id="sim-toolbar"]', function() {
//			this.echo("I've waited for the simulation controls to load.");
//			test.assertTitle("geppetto", "geppetto title is ok");
//			test.assertUrlMatch(/load_project_from_id=8/, "project load attempted");
//			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
//		}, null, 30000);
//	});
//	
	casper.run(function() {
		test.done();
	});
});

/**
 * 
 * @param test
 * @param name
 * @returns
 */
function hhcellTest(test,name){
	casper.echo("------------STARTING HHCELL TEST--------------");
	testCameraControls(test, [0,0,30.90193733102435]);
	casper.then(function () {
		test3DMeshColor(test,defaultColor,"hhcell.hhpop[0]");
		casper.echo("Opening controls panel");
		buttonClick("#controlPanelBtn");
	});
	casper.then(function(){
		testInitialControlPanelValues(test,3);
	})
	casper.then(function(){
		testVisibility(test,"hhcell.hhpop[0]","#hhcell_hhpop_0__visibility_ctrlPanel_btn");
	})
	casper.then(function () {
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
			removeAllPlots();
			buttonClick("#anyProjectFilterBtn");
		});
	});	
	casper.then(function(){
		this.wait(500,function(){
			var rows = casper.evaluate(function() {
				var rows = $(".standard-row").length;
				return rows;
			});
			test.assertEquals(rows, 10, "Correct amount of rows for Global filter");
			buttonClick("#controlpanel");
			testSpotlight(test, "hhcell.hhpop[0].v",'div[id="Plot1"]',true,true,"hhcell","hhcell.hhpop[0]");
		});
	});
	
	casper.then(function(){
		closeSpotlight();
		casper.evaluate(function(){
			eval("hhcell.deselect()");
			eval("GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([hhcell])});")
			eval("GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);");
			eval("Project.getActiveExperiment().play({step:1})");
		});
		
		testCameraControls(test, [0,0,30.90193733102435]);
		
		casper.wait(1000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"hhcell.hhpop[0]");
		});
		casper.wait(3000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"hhcell.hhpop[0]");
		});
		casper.wait(5000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"hhcell.hhpop[0]");
			casper.echo("Done Playing, now exiting");
		})
	})
};

/**
 * 
 * @param test
 * @returns
 */
function acnetTest(test){
	casper.echo("------------STARTING ACNET TEST--------------");
	testCameraControls(test,[231.95608349343888,508.36555704435455,1849.8390363191731]);
	casper.then(function () {
		test3DMeshColor(test,defaultColor,"acnet2.pyramidals_48[0]");
		this.echo("Opening controls panel");
		buttonClick("#controlPanelBtn");
	});
	
	casper.then(function () {
		testInitialControlPanelValues(test,10);
	});
	casper.then(function(){
		testVisibility(test,"acnet2.pyramidals_48[0]","#acnet2_pyramidals_48_0__visibility_ctrlPanel_btn");
	})
	casper.then(function () {
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

	casper.then(function () {
		testSpotlight(test, "acnet2.pyramidals_48[1].soma_0.v",'div[id="Plot2"]',true,true,"acnet2.pyramidals_48[0]","acnet2.pyramidals_48[0]");	
		this.mouseEvent('click', 'i.fa-search', "attempting to close spotlight");
	});
	
	casper.then(function () {
		testSpotlight(test, "acnet2.pyramidals_48[0].biophys.membraneProperties.Ca_pyr_soma_group.gDensity",'div[id="Plot2"]',false,false,"acnet2.pyramidals_48[0]");	
	});
	
	casper.then(function(){
		closeSpotlight();
		casper.evaluate(function(){
			eval("acnet2.pyramidals_48[0].deselect()");
			eval("GEPPETTO.ComponentFactory.addWidget('CANVAS', {name: '3D Canvas',}, function () {this.setName('Widget Canvas');this.setPosition();this.display([acnet2])});");
			eval("GEPPETTO.SceneController.addColorFunction(GEPPETTO.ModelFactory.instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v'),false), window.voltage_color);");
			eval("Project.getActiveExperiment().play({step:10})");
		});
		
		casper.wait(2000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"acnet2.baskets_12[2].soma_0");
		});
		casper.wait(3000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"acnet2.baskets_12[2].soma_0");
		});
		casper.wait(5000, function(){
			test3DMeshColorNotEquals(test,defaultColor,"acnet2.baskets_12[2].soma_0");
			removeAllPlots();
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
	
	casper.then(function () {
		this.echo("Opening controls panel");
		buttonClick("#controlPanelBtn");
	});
	
	casper.then(function(){
		testInitialControlPanelValues(test,10);
	});
	
	casper.then(function(){
		var plots = this.evaluate(function(){
			buttonClick("#c302_ADAL_0__v_plot_ctrlPanel_btn");
			var plots = $(".js-plotly-plot").length;
			return plots;
		});

		this.waitUntilVisible('div[id="Plot2"]', function () {
			this.echo("I've waited for Plot2 to come up");
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
				testSpotlight(test,  "c302.ADAL[0].v",'div[id="Plot3"]',true,false);
			});
		});
	})
}

function ca1Test(test){
	casper.waitForSelector('div[id="TreeVisualiserDAT1"]', function() {
		this.echo("I've waited for the TreeVisualiserDAT1 to load.");
		casper.then(function () {
			this.echo("Opening controls panel");
			this.evaluate(function() {
				$("#controlPanelBtn").click();
			});

			this.waitUntilVisible('div#controlpanel', function () {
				test.assertVisible('div#controlpanel', "The control panel is correctly open.");

				var rows = casper.evaluate(function() {
					var rows = $(".standard-row").length;
					return rows;
				});
				test.assertEquals(rows, 3, "The control panel opened with right amount of rows");

				this.evaluate(function(){
					$("#anyProjectFilterBtn").click();
				});

				this.wait(500,function(){
					var rows = casper.evaluate(function() {
						var rows = $(".standard-row").length;
						return rows;
					});
					test.assertEquals(rows, 3, "Correct amount of rows for Global filter");
					
					casper.evaluate(function() {
						$("#controlpanel").hide();
					});
					
					test.assertExists('i.fa-search', "Spotlight button exists")
					this.mouseEvent('click', 'i.fa-search', "attempting to open spotlight");

					this.waitUntilVisible('div#spotlight', function () {
						test.assertVisible('div#spotlight', "Spotlight opened");

						//type in the spotlight
						this.sendKeys('input#typeahead', "ca1.CA1_CG[0].Seg0_apical_dendrite_22_1158.v", {keepFocus: true});
						//press enter
						this.sendKeys('input#typeahead', casper.page.event.key.Return, {keepFocus: true});

						casper.wait(1000, function () {
							casper.then(function () {
								this.echo("Waiting to see if the Plot and watch variable buttons becomes visible");
								test.assertDoesntExist('button#plot', "Plot variables icon correctly invisible");
								test.assertDoesntExist('button#watch', "Watch button correctly hidden");
								this.echo("Variables button are hidden correctly");
							});
						});
					});
				});
			}, null, 500);
		});
	}, null, 30000);
}

function pharyngealTest(test){
	casper.then(function(){
		casper.waitForSelector('div[id="Plot1"]', function() {
			this.echo("I've waited for Plot1 to load.");
			this.echo("Opening controls panel");
			this.evaluate(function() {
				$("#controlPanelBtn").click();
			});
		}, null, 30000);
	});

	casper.then(function(){
		testInitialControlPanelValues(test,10);
	});
	
	casper.then(function(){
		casper.waitForSelector('div[id="ButtonBar1"]', function() {
			this.echo("I've waited for ButtonBar component to load.");
		});
	});
};

function nwbSampleTest(test){
	casper.waitForSelector('div[id="Popup1"]', function() {
		this.echo("I've waited for Popup1 to load.");
		
		this.waitForSelector('div[id="Popup2"]', function() {
			this.echo("I've waited for Popup2 component to load.");
		});
	}, null, 30000);
}