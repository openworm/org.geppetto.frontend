var collapsedWidgetHeight = 35;
casper.test.begin('Geppetto basic UI Components/Widgets Tests', function suite(test) {
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

	/**Tests Widgets, components and other UI elements using a new project with no scene loaded**/
	casper.thenOpen(urlBase+baseFollowUp,function() {
		casper.then(function(){launchTest(test,"Default Empty Project",5000);});
		casper.then(function(){casper.wait(2000, function () {
			//FIXME: Broken after tabbed drawer refactoring, on the to do list.
			casper.then(function(){consoleTest(test);});
			casper.then(function(){debugModeTest(test);});
			casper.then(function(){helpWindowTest(test);});
			casper.then(function(){popupWidgetTest(test);});
			casper.then(function(){plotWidgetTest(test);});
			casper.then(function(){treeVisualizerTest(test);});
			casper.then(function(){variableVisualizerTest(test);});
			casper.then(function(){unitsControllerTest(test);});
		})});
	});

	casper.run(function() {
		test.done();
	});
});

/* Tests debug mode functionality
 */
function debugModeTest(test){
	//test debug mode is off by default
	casper.then(function(){
		var debugMode = casper.evaluate(function() {
			return G.isDebugOn();
		});
		test.assertEquals(debugMode, false, "Debug mode correctly disabled.");
	});

	//test debug mode can be turn on
	casper.then(function(){
		var debugMode = casper.evaluate(function() {
			G.debug(true);
			return G.isDebugOn();
		});
		test.assertEquals(debugMode, true, "Debug mode correctly enabled.");
	});

	//tests that debug mode can be turn off
	casper.then(function(){
		var debugMode = casper.evaluate(function() {
			G.debug(false);
			return G.isDebugOn();
		});
		test.assertEquals(debugMode, false, "Debug mode correctly disabled.");
	});
}

/* Tests help window
 */
function helpWindowTest(test){
	//open help window
	casper.then(function () {
		buttonClick("#genericHelpBtn");
	});

	casper.then(function(){
		//wait for help modal to open and test elements are present
		this.waitUntilVisible('div[id="help-modal"]', function () {
			//tests help window has right amount of H4 headers
			casper.then(function(){
				var h4Elements = casper.evaluate(function() {
					var h4Elements = $("#help-modal").find("h4").length;
					return h4Elements;
				});
				test.assertEquals(h4Elements, 7, "Right amount of title headers for tutorial window");
			});
			//tests that help modal window has right amount of status circles
			casper.then(function(){
				var statusCirclesElements = casper.evaluate(function() {
					var statusCirclesElements = $("#help-modal").find("div").find(".circle").length;
					return statusCirclesElements;
				});
				test.assertEquals(statusCirclesElements, 10, "Right amount of status circles for tutorial window");
			});
		});
	});

	//tests help command doesn't return null
	casper.then(function () {
		var helpCommand = casper.evaluate(function() {
			return G.help();
		});
		test.assertNotEquals(helpCommand, null, "G.help command not null.");
	});

	//tests help modal window can be closed
	casper.then(function () {
		casper.evaluate(function() {
			$("#help-modal").find("button")[0].click();
		});
		casper.waitWhileVisible('div[id="help-modal"]', function () {
			this.echo("I've waited for help window to go away.");
		});
	});
}

/* Tests console component
 */
function consoleTest(test){
	//open the console
	casper.then(function () {
		//buttonClick("#consoleButton");
		casper.clickLabel('Console', 'span');
	});

	casper.then(function () {
		test.assertVisible('div[class*="consoleContainer"]', "The console panel is correctly visible.");

		buttonClick(".minIcons");
		test.assertNotVisible('div[class*="consoleContainer"]', "The console panel is correctly hidden.");

		casper.clickLabel('Console', 'span');
		test.assertVisible('div[class*="consoleContainer"]', "The console panel is correctly visible.");

		buttonClick(".maxIcons");
		var tabberHeight = casper.evaluate(function () {
			return $(".drawer,.react-draggable").height() > 250;
		});
		test.assertEquals(tabberHeight, true, "Console is maximized correctly");

		buttonClick(".closeIcons");
		test.assertNotVisible('div[class*="consoleContainer"]', "The console panel is correctly hidden.");

		casper.clickLabel('Console', 'span');
	});

	casper.then(function(){
		this.waitUntilVisible("#commandInputArea", function () {
			//test console is empty upon opening
			casper.then(function () {
				var spanCount = casper.evaluate(function() {
					return $("#Console1_console").find("span").length <=1;
				});
				test.assertEquals(spanCount, true, "Console output empty");
			});

			casper.then(function () {
				casper.evaluate(function() {
					G.debug(true);
				});
			});

			//dummy UI interaction to create logs on console
			casper.then(function () {
				buttonClick("#panHomeBtn");
			});

			//test console is empty upon opening
			casper.then(function () {
				var spanCount = casper.evaluate(function() {
					return $("#undefined_console").find("span").length <=4;
				});
				test.assertEquals(spanCount, true, "Console output not empty");
			});

			//test clear command works on console
			casper.then(function () {
				var clearConsole = casper.evaluate(function() {
					return G.clear();
				});
				test.assertEquals(clearConsole, "Console history cleared", "G.clear command not null.");
			});

			//test console is empty after it got cleared
			casper.then(function () {
				var spanCount = casper.evaluate(function() {
					return $("#undefined_console").find("span").length;
				});
				test.assertEquals(spanCount, 0, "Console output not empty after G.clear");
			});

			//disable debug mode now that we are done
			casper.then(function () {
				casper.evaluate(function() {
					G.debug(false);
				});
			});
		});
	});


	casper.then(function () {
		//test hiding the console
		casper.then(function () {
			//buttonClick("#consoleButton");
			casper.clickLabel('Console', 'span');
		});
		casper.waitWhileVisible('#commandInputArea', function () {
			this.echo("I've waited for console hide.");
		});
	});
}

/* Tests popup widget basic functionality:
 * that it gets created, destroy and changes position/size.
 */
function popupWidgetTest(test){
	testWidget(test, 1, "Popup1",490, 394);
}

/* Tests popup widget basic functionality:
 * that it gets created, destroy and changes position/size.
 */
function plotWidgetTest(test){
	testWidget(test, 0, "Plot1", 350, 300);	
}

/* Tests tree visualizer widget basic functionality:
 * that it gets created, destroy and changes position/size.
 */
function treeVisualizerTest(test){
	testWidget(test, 3, "TreeVisualiserDAT1", 350, 260);	
}

/* Tests variable visualizer widget basic functionality:
 * that it gets created, destroy and changes position/size.
 */
function variableVisualizerTest(test){
	testWidget(test, 5, "VarVis1", 350, 120);		
}

/* Tests units controller functionality.
 */
function unitsControllerTest(test){
	//create Plot widget for testing units
	casper.evaluate(function(){
		G.addWidget(0);
	});

	casper.then(function(){
		this.waitUntilVisible('div[id="Plot1"]', function () {
			//test unit label without defining external unit, this will test against Math.js values
			casper.then(function () {
				var initialPlotLabel = casper.evaluate(function() {
					return Plot1.getUnitLabel("S / m2");
				});
				test.assertEquals(initialPlotLabel, "Electric conductance over surface (S / m<sup>2</sup>)", "Test Plot1 Math.js 'S / m2' unit");
			});

			//test unit after defining external unit
			casper.then(function () {
				var initialPlotLabel = casper.evaluate(function() {
					GEPPETTO.UnitsController.addUnit("S/m2","Electric conductance OVER density");
					return Plot1.getUnitLabel("S / m2");
				});
				test.assertEquals(initialPlotLabel, "Electric conductance over density (S / m<sup>2</sup>)", "Test Plot1 External 'S / m2' unit");
			});

			//test unit after defining external unit
			casper.then(function () {
				var initialPlotLabel = casper.evaluate(function() {
					return Plot1.getUnitLabel("S/m2");
				});
				test.assertEquals(initialPlotLabel, "Electric conductance over density (S/m<sup>2</sup>)", "Test Plot1 Math.js 'S / m2' unit");
			});

			casper.then(function () {
				closeWidget(test, "Plot1");
			});
		});
	});
}

function testWidget(test, widgetType, widgetIdentifier, originalWidth, originalHeight){
	//call to created desired widget
	casper.evaluate(function(widgetType){
		G.addWidget(widgetType);
	},widgetType);

	//test widget UI features
	casper.then(function(){
		this.waitUntilVisible('div[id="'+widgetIdentifier+'"]', function () {
			//test widget got created with correct size/dimensions
			casper.then(function () {
				var popupSize = casper.evaluate(function(widgetIdentifier) {
					var widget = eval(widgetIdentifier);
					return widget.getSize();
				},widgetIdentifier);

				test.assertEquals(popupSize.width, originalWidth, widgetIdentifier+" initial width correct");
				test.assertEquals(popupSize.height, originalHeight,widgetIdentifier+ " initial height correct");
			});

			casper.then(function () {
				testMaximizeWidget(test, widgetIdentifier,originalWidth, originalHeight);		
			});

			casper.then(function () {
				testMinimizeWidget(test, widgetIdentifier);		
			});

			casper.then(function () {
				testCollapseWidget(test, widgetIdentifier);		
			});

			casper.then(function () {
				closeWidget(test, widgetIdentifier);
			});
		});
	});
}

function testMaximizeWidget(test, widgetIdentifier,originalWidth, originalHeight){
	//maximize widget
	casper.then(function () {
		casper.evaluate(function(widgetIdentifier) {
			$("#"+widgetIdentifier).parent().find("a")[2].click()
		},widgetIdentifier);
	});

	//test widget got maximixed by testing its size
	casper.then(function () {
		casper.wait(1000, function () {
			var popupHeight = casper.evaluate(function(widgetIdentifier) {
				var widget = eval(widgetIdentifier);
				return widget.$el.parent().height();
			},widgetIdentifier);

			var expectedHeight = casper.evaluate(function(widgetIdentifier) {
				return $(window).height()-5.2;
			},widgetIdentifier);

			var popupWidth = casper.evaluate(function(widgetIdentifier) {
				var widget = eval(widgetIdentifier);
				return widget.$el.parent().width();
			},widgetIdentifier);

			var expectedWidth = casper.evaluate(function(widgetIdentifier) {
				return $(window).width()-5.2;
			},widgetIdentifier);

			test.assertEquals(popupWidth, expectedWidth, widgetIdentifier+" maximize width correct");
			test.assertEquals(popupHeight, expectedHeight, widgetIdentifier+" maximize height correct"); 
		});		
	});

	//test restoring widget after it got maximized
	casper.then(function () {
		casper.evaluate(function(widgetIdentifier) {
			$("#"+widgetIdentifier).parent().find("a")[2].click()
		},widgetIdentifier);

		casper.wait(1000, function () {
			var popupSize = casper.evaluate(function(widgetIdentifier) {
				var widget = eval(widgetIdentifier);
				return widget.getSize();
			},widgetIdentifier);

			test.assertEquals(popupSize.width, originalWidth, widgetIdentifier+" restore width correct");
			test.assertEquals(popupSize.height, originalHeight, widgetIdentifier+" restore height correct");    
		});   		
	});
}

function testMinimizeWidget(test, widgetIdentifier){
	//test widget is not yet minimized
	casper.then(function () {
		casper.wait(1000, function () {
			var minimizeBar = casper.evaluate(function(widgetIdentifier) {
				return $("#dialog-extend-fixed-container").find(".ui-dialog").length;
			},widgetIdentifier);

			test.assertEquals(minimizeBar, 0, widgetIdentifier+" not minimize, expected and passes correctly.");
		});		
	});

	//minimize widget button call
	casper.then(function () {
		casper.evaluate(function(widgetIdentifier) {
			$("#"+widgetIdentifier).parent().find("a")[3].click()
		},widgetIdentifier);
	});

	//locate minimized widget in corner of geppetto
	casper.then(function () {
		casper.wait(1000, function () {
			var minimizeBar = casper.evaluate(function(widgetIdentifier) {
				return $("#dialog-extend-fixed-container").find(".ui-dialog").length;
			},widgetIdentifier);

			test.assertEquals(minimizeBar, 1, widgetIdentifier+" minimize correctly.");
		});		
	});

	//restore minimized widget
	casper.then(function () {
		casper.evaluate(function(widgetIdentifier) {
			$("#"+widgetIdentifier).parent().find("a")[3].click()
		},widgetIdentifier);
	});

	//test restored widget is actually restored
	casper.then(function () {
		casper.wait(1000, function () {
			var minimizeBar = casper.evaluate(function(widgetIdentifier) {
				return $("#dialog-extend-fixed-container").find(".ui-dialog").length;
			},widgetIdentifier);

			test.assertEquals(minimizeBar, 0, widgetIdentifier+" not minimize, expected and passes correctly.");
		});		
	});
}

function testCollapseWidget(test, widgetIdentifier){
	//test widget is not yet collapsed
	casper.then(function () {
		casper.wait(1000, function () {
			var collapsedWidget = casper.evaluate(function(widgetIdentifier,collapsedWidgetHeight) {
				return $("#"+widgetIdentifier).height()<collapsedWidgetHeight;
			},widgetIdentifier,collapsedWidgetHeight);

			test.assertEquals(collapsedWidget, false, widgetIdentifier+" not collapsed, expected and passes correctly.");
		});		
	});

	//collapse widget
	casper.then(function () {
		casper.evaluate(function(widgetIdentifier) {
			$("#"+widgetIdentifier).parent().find("a")[0].click()
		},widgetIdentifier);
	});

	//test collapsed widget is actually collapase
	casper.then(function () {
		casper.wait(1000, function () {
			var collapsedWidget = casper.evaluate(function(widgetIdentifier,collapsedWidgetHeight) {
				return $("#"+widgetIdentifier).height()<collapsedWidgetHeight;
			},widgetIdentifier,collapsedWidgetHeight);

			test.assertEquals(collapsedWidget, true, widgetIdentifier+" collapsed, expected and passes correctly.");
		});		
	});

	//restore collapsed widget
	casper.then(function () {
		casper.evaluate(function(widgetIdentifier) {
			$("#"+widgetIdentifier).parent().find("a")[1].click()
		},widgetIdentifier);
	});

	//test restored widget is not collapsed anymore
	casper.then(function () {
		casper.wait(1000, function () {
			var collapsedWidget = casper.evaluate(function(widgetIdentifier,collapsedWidgetHeight) {
				return $("#"+widgetIdentifier).height()<collapsedWidgetHeight;
			},widgetIdentifier,collapsedWidgetHeight);

			test.assertEquals(collapsedWidget, false, widgetIdentifier+" not collapsed, expected and passes correctly.");
		});		
	});
}

function closeWidget(test, widgetIdentifier){
	//destroy widget
	casper.evaluate(function(widgetIdentifier) {
		var widget = eval(widgetIdentifier);
		return widget.destroy();
	},widgetIdentifier);

	//test destroyed widget no longer exists
	casper.waitWhileVisible('div[id="'+widgetIdentifier+'"]', function () {
		this.echo("I've waited for " + widgetIdentifier + " to go away.");
		test.assertDoesntExist('div[id="'+widgetIdentifier+'"]', widgetIdentifier+" doesn't exist after being destroyed.")
	}); 		
}