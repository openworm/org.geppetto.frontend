casper.test.begin('Geppetto basic tests', function suite(test) {
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
	
	var vfbProject = "load_project_from_url=http://v2.virtualflybrain.org/conf/vfb.json";

	casper.start(urlBase, function () {
		this.echo(urlBase+baseFollowUp+vfbProject);
    });

	/**Tests HHCELL project**/
	casper.thenOpen(urlBase+baseFollowUp+hhcellProject,function() {
		casper.then(function(){launchTest(test,"VFB",30000);});
		casper.then(function(){vfbTest(test);});
	});

	casper.run(function() {
		test.done();
	});
});

/**
 * Main method for testing the HHCEll project
 * @returns
 */
function vfbTest(test,name){
	casper.echo("------------STARTING VFB TEST--------------");
	casper.then(function(){
		test.assertExists('i.fa-search', "Spotlight button exists")
	});
	
	casper.then(function(){
		spotlightTest(test, "VFB_00000001 (fru-M-200266)", "#buttonTwo","#Popup1_VFB_00000001_metadata_el_");
	});
	
	casper.then(function(){
		testMeshVisibility(test,true,"VFB_00017894.VFB_00017894_obj");
	});
	
	casper.then(function(){
		spotlightTest(test, "medulla", "#type","#Popup1_FBbt_00003748_metadata_el_");
	});
	
	casper.then(function(){launchTest(test,"VFB",30000);});
	
	casper.then(function(){
		testTermInfoWidget(test, "medulla", "#type","#Popup1_FBbt_00003748_metadata_el_");
	});
	
	casper.then(function(){
		testStackWidgetViewer(test, "medulla", "#type","#Popup1_FBbt_00003748_metadata_el_");
	});
}

function spotlightTest(test, searchQuery, buttonClick, termInfoData){
	casper.mouseEvent('click', 'i.fa-search', "attempting to open spotlight");

	casper.waitUntilVisible('div#spotlight', function () {
		test.assertVisible('div#spotlight', "Spotlight opened");

		//type in the spotlight
		this.sendKeys('input#typeahead', searchQuery, {keepFocus: true});
		//press enter
		this.sendKeys('input#typeahead', this.page.event.key.Return, {keepFocus: true});
		
		casper.waitUntilVisible('div#spotlight', function () {
			casper.then(function () {
				this.echo("Waiting to see if the button becomes visible");
				casper.waitUntilVisible(buttonClick, function () {
					test.assertVisible(buttonClick, "Show Info correctly visible");
					this.echo("Show Info button became visible correctly");
					buttonClick(buttonClick);
					this.waitUntilVisible(termInfoData+"0" function () {
						this.echo("Added to scene correctly");
						test.assertVisible(termInfoData+"1", "Term info property correctly visible");
						test.assertVisible(termInfoData+"2", "Term info property correctly visible");
						test.assertVisible(termInfoData+"3", "Term info property correctly visible");
						test.assertVisible(termInfoData+"4", "Term info property correctly visible");
						test.assertVisible(termInfoData+"5", "Term info property correctly visible");
						test.assertVisible(termInfoData+"6", "Term info property correctly visible");
						test.assertVisible(termInfoData+"7", "Term info property correctly visible");
					});
				}, null, 295000);
			});
		});
	});
}

function testTermInfoWidget(test){
	casper.then(function(){
		test.assertVisible("Popup1_VFB_00017894_metadata_el_1", "Term info property correctly visible");
	});
	
	casper.then(function(){
		casper.evaluate(function("#Popup1_VFB_00017894_metadata_el_1") {
			$(variableName).find("a").click();
		},variableName);
	});
	
	casper.then(function(){
		casper.waitUntilVisible('div#Popup1_FBbt_00003624_metadata_el_0', function () {
			casper.then(function () {
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_1", "Term info property correctly visible");
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_2", "Term info property correctly visible");
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_3", "Term info property correctly visible");
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_4", "Term info property correctly visible");
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_5", "Term info property correctly visible");
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_6", "Term info property correctly visible");
				test.assertVisible("Popup1_FBbt_00003624_metadata_el_7", "Term info property correctly visible");
			});
		});
	});
	
	casper.then(function(){
		casper.evaluate(function("#Popup1_FBbt_00003624_metadata_el_4") {
			$(variableName).find("a")[0].click()
		},variableName);
	});
	
	casper.then(function(){
	});
}

function testStackWidgetViewer(test){
	
}