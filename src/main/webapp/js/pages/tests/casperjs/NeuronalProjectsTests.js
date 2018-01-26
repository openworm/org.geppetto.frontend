casper.test.begin('Geppetto neuronal projects tests', function suite(test) {
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

	/**Tests SingleComponentHH project**/
	casper.thenOpen(urlBase+baseFollowUp+hhcellProject,function() {
		casper.then(function(){testSingleCompononetHHProject(test);});
	});

	/**Tests Primary Auditory Cortex Network project**/
	casper.thenOpen(urlBase+baseFollowUp+acnetProject,function() {
		casper.then(function(){testACNET2Project(test);});
	});

	/**Tests C302 Network project**/
	casper.thenOpen(urlBase+baseFollowUp+c302Project,function() {
		casper.then(function(){testC302NetworkProject(test);});
	});

	/**Tests CA1 project**/
	casper.thenOpen(urlBase+baseFollowUp+ca1Project,function() {
		casper.then(function(){ca1Test(test);});
	});

	/**Tests C.elegans PVDR Neuron morphology project**/
	casper.thenOpen(urlBase+baseFollowUp+cElegansPVDR,function() {
		casper.then(function(){testPVDRNeuronProject(test);});
	});

	/**Tests PMuscle cell NEURON project**/
	casper.thenOpen(urlBase+baseFollowUp+cElegansMuscleModel,function() {
		casper.then(function(){testPMuscleCellProject(test);});
	});

	/**Tests cElegansConnectome project**/
	casper.thenOpen(urlBase+baseFollowUp+cElegansConnectome,function() {
		casper.then(function(){testC302Connectome(test);});
	});

	casper.run(function() {
		test.done();
	});
});