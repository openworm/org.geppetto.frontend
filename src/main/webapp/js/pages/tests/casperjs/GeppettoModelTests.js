casper.test.begin('Geppetto Model Factory and Injected Capabilities Tests', function suite(test) {
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
		//testing with project ACNET
		this.waitForSelector('div[project-id="5"]', function () {
			this.echo("I've waited for the projects to load.");
			test.assertExists('div#logo', "logo is found");
			test.assertExists('div[project-id="5"]', "Project width id 5 from core bundle present");
		}, null, 3000);
	});

	/**Tests model factory and injected capabilities using Primary Auditory Cortex Network project**/
	casper.thenOpen(urlBase+baseFollowUp+acnetProject,function() {
		casper.then(function(){testUsingSingleCompononetHHProject(test);});
	});

	casper.run(function() {
		test.done();
	});
});

/**
 * Tests model factory and injected capabilities using the  Primary Auditory Cortex Network project.
 */
function testUsingSingleCompononetHHProject(test){
	casper.then(function(){launchTest(test,"Primary Auditory Cortex Network",30000);});
	casper.echo("------------STARTING ACNET TEST--------------");
	casper.then(function(){removeAllPlots();});

	/*Start Testing Model Factory*/
	casper.echo("----Start Testing Model Factory----");
	casper.then(function () {
		var modelDefined = casper.evaluate(function() {return window.Model != undefined;});
		test.assertEquals(modelDefined, true, "Model is not undefined");
	});

	casper.then(function () {
		var modelVariables = casper.evaluate(function() {return window.Model.getVariables().length;});
		test.assertEquals(modelVariables, 2, "2 Variables as expected");
	});

	casper.then(function () {
		var modelLibraries = casper.evaluate(function() {return window.Model.getLibraries().length;});
		test.assertEquals(modelLibraries, 2, "2 Libraries as expected");
	});

	casper.then(function () {
		var modelInstanceDefined = casper.evaluate(function() {return window.Instances != undefined;});
		test.assertEquals(modelInstanceDefined, true, "Instances are not undefined");
	});

	casper.then(function () {
		var modelTopLevelInstances = casper.evaluate(function() {return window.Instances.length;});
		test.assertEquals(modelTopLevelInstances, 2, "2 top level instance as expected");
	});

	casper.then(function () {
		test.assertEval(function() {
			return window.acnet2 != undefined && window.acnet2.baskets_12 != undefined;
		}, "Shortcuts created as expected. Tested with acnet and acnet.baskets_12");
	});

	casper.then(function () {
		test.assertEval(function() {
			return window.acnet2.pyramidals_48.getChildren().length === 48 && window.acnet2.baskets_12.getChildren().length === 12;
		},"Visual types exploded into instances as expected. Tested with acnet2.pyramidals_48 and acnet2.baskets_12");
	});

	casper.then(function () {
		test.assertEval(function() {
			return GEPPETTO.ModelFactory.resolve('//@libraries.1/@types.5').getId() == window.Model.getLibraries()[1].getTypes()[5].getId() &&
			GEPPETTO.ModelFactory.resolve('//@libraries.1/@types.5').getMetaType() == window.Model.getLibraries()[1].getTypes()[5].getMetaType();
		},"Ref string resolved to Type as expected. Tested with referencef : //@libraries.1/@types.5");
	});

	casper.then(function () {
		test.assertEval(function() {
			return acnet2.baskets_12[0].getTypes().length == 1 &&
			acnet2.baskets_12[0].getTypes()[0].getId() ==  'bask' &&
			acnet2.baskets_12[0].getTypes()[0].getMetaType() == 'CompositeType';
		},"Type in the model resolved as expected. Tested with acnet2.baskets_12[0]");
	});

	casper.then(function () {
		test.assertEval(function() {
			return acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups().length == 3 &&
			acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[0].getId() == 'Cell_Regions' &&
			(acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[1].getId() == 'Na_bask' ||
					acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[1].getId() == 'Na_bask') &&
					(acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[2].getId() == 'Kdr_bask' ||
							acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[2].getId() == 'Kdr_bask');
		},'Visual groups created as expected. Tested with acnet2.baskets_12[0]');
	});	

	casper.then(function () {
		test.assertEval(function() {
			return GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType()).length == 12 &&
			GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType().getPath()).length == 12 &&
			GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType())[0].getId() == "baskets_12[0]" &&
			GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType())[0].getMetaType() == "ArrayElementInstance";
		}, 'getAllInstanceOf returning instances as expected for Type and Type path. Tested with acnet2.baskets_12[0]');
	});	

	casper.then(function () {
		test.assertEval(function() {
			return GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable()).length == 1 &&
			GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable().getPath()).length == 1 &&
			GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable())[0].getId() == "baskets_12" &&
			GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable())[0].getMetaType() == "ArrayInstance";
		},'getAllInstanceOf returning instances as expected for Variable and Variable path. Tested with acnet2.baskets_12[0]');
	});	

	casper.then(function () {
		test.assertEval(function() {
			return GEPPETTO.ModelFactory.allPathsIndexing.length == 9741 &&
			GEPPETTO.ModelFactory.allPathsIndexing[0].path == 'acnet2' &&
			GEPPETTO.ModelFactory.allPathsIndexing[0].metaType == 'CompositeType' &&
			GEPPETTO.ModelFactory.allPathsIndexing[9741 - 1].path == "acnet2.SmallNet_bask_bask.GABA_syn_inh.GABA_syn_inh" &&
			GEPPETTO.ModelFactory.allPathsIndexing[9741 - 1].metaType == 'StateVariableType';
		},"All potential instance paths exploded as expected");
	});

	casper.then(function () {
		test.assertEval(function() {
			return GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v').length == 456 &&
			GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[0] == 'acnet2.pyramidals_48[0].soma_0.v' &&
			GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[333] == 'acnet2.pyramidals_48[45].basal0_6.v' &&
			GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[456 - 1] == 'acnet2.baskets_12[11].dend_1.v';
		},"getAllPotentialInstancesEndingWith .v returning expected paths");
	});

	casper.then(function () {
		var instances = casper.evaluate(function() {return window.Instances.getInstance('acnet2.baskets_12[3]').getInstancePath();});
		test.assertEquals(instances, 'acnet2.baskets_12[3]', "Instances.getInstance creates and fetches instance as expected. Tested with acnet2.baskets_12[3]");
	});

	casper.then(function () {
		var instances = casper.evaluate(function() {return window.Instances.getInstance('acnet2.baskets_12[3].soma_0.v').getInstancePath();});
		test.assertEquals(instances, 'acnet2.baskets_12[3].soma_0.v', 
		"Instances.getInstance creates and fetches instance as expected. Tested with acnet2.baskets_12[3].soma_0.v");
	});

	casper.then(function () {
		var instances = casper.evaluate(function() {window.Instances.getInstance('acnet2.baskets_12[3].sticaxxi')==undefined;});
		test.assertEquals(instances, null, "Trying to fetch something that does not exist in the model throws exception");
	});

	/*Start Testing Injected Capabilities*/
	casper.echo("----Start Testing Injected Capabilities----");
	casper.then(function () {
		test.assertEval(function() {
			return window.acnet2.baskets_12[0].hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY);
		},"Visual capability injected to instances of visual types. Tested with acnet2.baskets_12[0]");
	});

	casper.then(function () {
		test.assertEval(function() {
			return window.acnet2.baskets_12[0].getType().hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY);
		},"Visual capability injected to types with visual types. Tested with acnet2.baskets_12[0]");
	});

	casper.then(function () {
		test.assertEval(function() {
			return window.Model.neuroml.network_ACnet2.temperature.hasCapability(GEPPETTO.Resources.PARAMETER_CAPABILITY);
		},"Parameter capability injected to parameter instances. Tested with Model.neuroml.network_ACnet2.temperature");
	});

	casper.then(function () {
		test.assertEval(function() {
			return window.acnet2.pyramidals_48[0].hasCapability(GEPPETTO.Resources.VISUAL_GROUP_CAPABILITY);
		}, "Visual group capability injected to instances of visual types with visual groups. Tested with acnet2.pyramidals_48[0]");
	});

	casper.then(function () {
		var getAllVariablesOfMetaType = casper.evaluate(function() {
			var meta = GEPPETTO.ModelFactory.getAllTypesOfMetaType(GEPPETTO.Resources.COMPOSITE_TYPE_NODE);
			var vars = GEPPETTO.ModelFactory.getAllVariablesOfMetaType(meta, 'ConnectionType')[0];
			return vars.hasCapability(GEPPETTO.Resources.CONNECTION_CAPABILITY);
		});
		test.assertEquals(getAllVariablesOfMetaType, true, "Connection capability injected to variables of ConnectionType.");
	});

	casper.then(function () {
		var getAllVariablesOfMetaType = casper.evaluate(function() {
			return window.acnet2.pyramidals_48[0].getConnections()[0].hasCapability(GEPPETTO.Resources.CONNECTION_CAPABILITY);
		});
		test.assertEquals(getAllVariablesOfMetaType, true, "Connection capability injected to instances of connection types. Tested with acnet2.pyramidals_48[0]");
	});
}