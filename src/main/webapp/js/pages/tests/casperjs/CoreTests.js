var urlBase = "http://127.0.0.1:8080/";
var baseFollowUp = "org.geppetto.frontend/geppetto?";

var hhcellProject = "load_project_from_id=1";
var c302Project = "load_project_from_id=6";
var acnetProject = "load_project_from_id=5";
var ca1Project = "load_project_from_id=3";
var cElegansConnectome = "load_project_from_id=16";
var cElegansMuscleModel = "load_project_from_id=4";
var cElegansPVDR = "load_project_from_id=8";
var eyeWire = "load_project_from_id=9";
var nwbSample = "load_project_from_id=18";
var Pharyngeal = "load_project_from_id=58";


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
		this.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for hhcell project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=1/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			hhcellTest(test);
		},null,20000);
	});
	
	/**Tests C302 project**/
	casper.thenOpen(urlBase+baseFollowUp+c302Project,function() {		
		this.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for c302 project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=6/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			c302Test(test);
		},null,30000);
	});

	/**Tests Acnet project**/
	casper.thenOpen(urlBase+baseFollowUp+acnetProject,function() {
		this.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for ACNet project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=5/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			acnetTest(test);
		},null,30000);
	});

	/**Tests CA1 project**/
	casper.thenOpen(urlBase+baseFollowUp+ca1Project,function() {
		this.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for CA1 project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=3/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			ca1Test(test);
		},null,30000);
	});
	
	/**Tests EyeWire project**/
	casper.thenOpen(urlBase+baseFollowUp+eyeWire,function() {
		this.waitForSelector('div[id="Popup1"]', function() {
			this.echo("I've waited for the EyeWireGanglionCell project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=9/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
		}, null, 30000);
	});
	
	/**Tests Pharyngeal project**/
	casper.thenOpen(urlBase+baseFollowUp+Pharyngeal,function() {
		this.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for the Pharyngeal project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=58/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			pharyngealTest(test);
		},null,30000);
	});
	
	/**Tests NWB project**/
	casper.thenOpen(urlBase+baseFollowUp+nwbSample,function() {
		this.waitWhileVisible('div[id="loading-spinner"]', function () {
			this.echo("I've waited for NWB project to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=18/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
			test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
			test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
			nwbSampleTest(test);
		},null,30000);
	});
	
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

function hhcellTest(test){
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

			casper.evaluate(function(){
				$("#stateVariablesFilterBtn").click();
			})

			casper.wait(500,function(){
				this.evaluate(function(){
					$("#hhcell_hhpop_0__v_plot_ctrlPanel_btn").click();
				});

				this.waitUntilVisible('div[id="Plot1"]', function () {
					var plots = this.evaluate(function(){
						var plots = $("#Plot1").length;

						return plots;
					});
					this.echo("I've waited for Plot1 to come up");
					test.assertEquals(plots, 1,"Amount of plot widgets in existence passed");
				});
			});
		}, null, 500);
	});
};

function c302Test(test){
	casper.waitForSelector('div[id="Plot1"]', function() {
		this.echo("I've waited for Plot1 to load.");
		test.assertExists('div[id="Plot1"]', "geppetto loads the initial Plot1");
		this.then(function () {
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
				test.assertEquals(rows, 10, "The control panel opened with right amount of rows");

				casper.evaluate(function(){
					$("#stateVariablesFilterBtn").click();
				})

				casper.wait(500,function(){
					var plots = this.evaluate(function(){
						$("#c302_ADAL_0__v_plot_ctrlPanel_btn").click();
						var plots = $(".js-plotly-plot").length;

						return plots;
					});

					this.waitUntilVisible('div[id="Plot2"]', function () {
						this.echo("I've waited for Plot2 to come up");
						test.assertEquals(plots, 2,"Amount of plot widgets in existence passed");
					});
				});
			}, null, 500);
		});
	}, null, 5000);
}

function acnetTest(test){
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
			test.assertEquals(rows, 10, "The control panel opened with right amount of rows");

			casper.evaluate(function(){
				$("#stateVariablesFilterBtn").click();
			})

			casper.wait(500,function(){
				this.evaluate(function(){
					$("#acnet2_pyramidals_48_0__soma_0_v_plot_ctrlPanel_btn").click();
				});

				this.waitUntilVisible('div[id="Plot1"]', function () {
					var plots = this.evaluate(function(){
						var plots = $("#Plot1").length;

						return plots;
					});
					this.echo("I've waited for Plot1 to come up");
					test.assertEquals(plots, 1,"Amount of plot widgets in existence passed");
				});
			});
		}, null, 500);
	});
}

function ca1Test(test){
	casper.waitForSelector('div[id="TreeVisualiserDAT1"]', function() {
		this.echo("I've waited for the TreeVisualiserDAT1 to load.");
		test.assertTitle("geppetto", "geppetto title is ok");
		test.assertUrlMatch(/load_project_from_id=3/, "project load attempted");
		test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		test.assertExists('div[id="camera-controls"]', "geppetto loads the initial camera controls");
		test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial camera controls");
	}, null, 30000);
}

function pharyngealTest(test){
	casper.waitForSelector('div[id="Plot1"]', function() {
		this.echo("I've waited for Plot1 to load.");
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
			test.assertEquals(rows, 10, "The control panel opened with right amount of rows");

			this.waitForSelector('div[id="ButtonBar1"]', function() {
				this.echo("I've waited for ButtonBar component to load.");
			});
		}, null, 500);;
	}, null, 30000);
};

function nwbSampleTest(test){
	casper.waitForSelector('div[id="Popup1"]', function() {
		this.echo("I've waited for Popup1 to load.");
		
		this.waitForSelector('div[id="Popup2"]', function() {
			this.echo("I've waited for Popup2 component to load.");
		});
	}, null, 30000);
}