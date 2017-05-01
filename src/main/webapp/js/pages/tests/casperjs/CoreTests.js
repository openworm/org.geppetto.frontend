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


casper.test.begin('Geppetto basic tests', 2, function suite(test) {
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

	casper.thenOpen(urlBase+baseFollowUp+hhcellProject,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=1/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 3000);
	});

	casper.thenOpen(urlBase+baseFollowUp+c302Project,function() {
		this.waitForSelector('div[id="Plot1"]', function() {
			this.echo("I've waited for Plot1 to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=6/, "project load attempted");
			test.assertExists('div[id="Plot1"]', "geppetto loads the initial Plot1");
		}, null, 30000);
	});

	casper.thenOpen(urlBase+baseFollowUp+acnetProject,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=5/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 30000);
	});

	casper.thenOpen(urlBase+baseFollowUp+ca1Project,function() {
		this.waitForSelector('div[id="TreeVisualiserDAT1"]', function() {
			this.echo("I've waited for the TreeVisualiserDAT1 to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=3/, "project load attempted");
			test.assertExists('div[id="TreeVisualiserDAT1"]', "geppetto loads the initial TreeVisualiserDAT1");
		}, null, 30000);
	});
	
	casper.thenOpen(urlBase+baseFollowUp+cElegansConnectome,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=16/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 30000);
	});
	
	casper.thenOpen(urlBase+baseFollowUp+cElegansMuscleModel,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=4/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 30000);
	});
	
	casper.thenOpen(urlBase+baseFollowUp+cElegansPVDR,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=8/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 30000);
	});
	
	casper.thenOpen(urlBase+baseFollowUp+eyeWire,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=9/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 30000);
	});
	
	casper.thenOpen(urlBase+baseFollowUp+nwbSample,function() {
		this.waitForSelector('div[id="sim-toolbar"]', function() {
			this.echo("I've waited for the simulation controls to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=18/, "project load attempted");
			test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
		}, null, 30000);
	});
	
	casper.thenOpen(urlBase+baseFollowUp+Pharyngeal,function() {
		this.waitForSelector('div[id="Plot1"]', function() {
			this.echo("I've waited for the Plots to load.");
			test.assertTitle("geppetto", "geppetto title is ok");
			test.assertUrlMatch(/load_project_from_id=58/, "project load attempted");
			test.assertExists('div[id="Plot1"]', "geppetto loads the initial Plot");
		}, null, 40000);
	});

	casper.run(function() {
		test.done();
	});
});