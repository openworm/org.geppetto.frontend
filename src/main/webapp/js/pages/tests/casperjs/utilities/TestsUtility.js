var urlBase = casper.cli.get('host');
if(urlBase==null || urlBase==undefined){
    urlBase = "http://127.0.0.1:8080/";
}
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
var cylinders = "load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/cylinder/geppetto.json";
var defaultColor = [0.00392156862745098,0.6,0.9098039215686274];
var zoomClicks = 50, panClicks=10, rotateClicks=20;

function launchTest(test, projectName, timeAllowed){
    casper.waitWhileVisible('div[id="loading-spinner"]', function () {
        this.echo("I've waited for "+projectName+" project to load.");
        test.assertTitle("geppetto", "geppetto title is ok");
        test.assertExists('div[id="sim-toolbar"]', "geppetto loads the initial simulation controls");
        test.assertExists('div[id="controls"]', "geppetto loads the initial camera controls");
        test.assertExists('div[id="foreground-toolbar"]', "geppetto loads the initial foreground controls");
    },null,timeAllowed);
}

function resetCameraTest(test,expectedCameraPosition){
    buttonClick("#panHomeBtn");
    testCameraPosition(test,expectedCameraPosition);
}

function resetCameraTestWithCanvasWidget(test,expectedCameraPosition){
    buttonClick("#panHomeBtn");
    casper.evaluate(function(){
        $("#Canvas2_component").find(".position-toolbar").find(".pan-home").click();
    });
    testCameraPosition(test,expectedCameraPosition);
}

function testInitialControlPanelValues(test, values){
    casper.waitUntilVisible('div#controlpanel', function () {
        test.assertVisible('div#controlpanel', "The control panel is correctly open.");
        var rows = casper.evaluate(function() {
            var rows = $(".standard-row").length;
            return rows;
        });
        test.assertEquals(rows, values, "The control panel opened with right amount of rows");
    });
}

function removeAllPlots(){
    casper.then(function(){
        casper.evaluate(function() {
            $("div.js-plotly-plot").remove();
        });
        this.wait(1000, function () {});
    });
}

function removeAllDialogs(){
    casper.then(function(){
        casper.evaluate(function() {
            $("div.dialog").remove();
        });
    });
}

function buttonClick(buttonName){
    casper.evaluate(function(buttonName) {
        $(buttonName).click();
    },buttonName);
}
/**
 * Tests visibility of a mesh
 * @param test
 * @param variableName
 * @param buttonName
 * @returns
 */
function testVisibility(test,variableName, buttonName){
    casper.then(function(){
        testMeshVisibility(test,true,variableName);
    });

    casper.then(function(){
        buttonClick(buttonName);
    });

    casper.then(function(){
        testMeshVisibility(test,false,variableName);
    });

    casper.then(function(){
        buttonClick(buttonName);
    });

    casper.then(function(){
        testMeshVisibility(test,true,variableName);
    });
}

/**
 * Tests an instance's mesh visibility
 * @param test
 * @param visible
 * @param variableName
 * @returns
 */
function testMeshVisibility(test,visible,variableName){
    var visibility = casper.evaluate(function(variableName) {
        var visibility = Canvas1.engine.getRealMeshesForInstancePath(variableName)[0].visible;
        return visibility;
    },variableName);

    test.assertEquals(visibility,visible, variableName +" visibility correct");
}

/**
 * Tests camera position
 * @param test
 * @param expectedCamPosition
 * @returns
 */
function testCameraPosition(test,expectedCamPosition){
    var camPosition = casper.evaluate(function() {
        var position = Canvas1.engine.camera.position;
        return [position.x, position.y, position.z];
    });

    for (var i in camPosition){
        camPosition[i] = parseFloat(camPosition[i].toFixed(2))
        expectedCamPosition[i] = parseFloat(expectedCamPosition[i].toFixed(2))
    }

    test.assertEquals( camPosition[0],expectedCamPosition[0], "Vector's x coordinate is correct as camera position");
    test.assertEquals( camPosition[1],expectedCamPosition[1], "Vector's y coordinate is correct as camera position");
    test.assertEquals( camPosition[2],expectedCamPosition[2], "Vector's z coordinate is correct as camera position");
}

/**
 * Tests default color of mesh
 * @param test
 * @param testColor
 * @param variableName
 * @returns
 */
function test3DMeshColor(test,testColor,variableName,index){
    if(index==undefined){
        index=0;
    }
    var color = casper.evaluate(function(variableName,index) {
        var color = Canvas1.engine.getRealMeshesForInstancePath(variableName)[index].material.color;
        return [color.r, color.g, color.b];
    },variableName,index);

    test.assertEquals(color[0],testColor[0], "Red default color is correct for "+ variableName);
    test.assertEquals(color[1],testColor[1],"Green default color is correct for " + variableName);
    test.assertEquals(color[2],testColor[2],"Blue default color is correct for " +variableName);
}

function getMeshColor(test,variableName,index){
    if(index==undefined){
        index=0;
    }
    var color = casper.evaluate(function(variableName,index) {
        var color = Canvas1.engine.getRealMeshesForInstancePath(variableName)[index].material.color;
        return [color.r, color.g, color.b];
    },variableName,index);
    return color;
}

function test3DMeshOpacity(test,opactityExpected,variableName,index){
    if(index==undefined){
        index=0;
    }
    var opacity = casper.evaluate(function(variableName,index) {
        var opacity = Canvas1.engine.getRealMeshesForInstancePath(variableName)[index].material.opacity;
        return opacity;
    },variableName,index);

    test.assertEquals(opacity,opactityExpected, "Opacity is correct for "+ variableName);
}

/**
 * Tests color of mesh
 * @param test
 * @param testColor
 * @param variableName
 * @returns
 */
function test3DMeshColorNotEquals(test,testColor,variableName,index){
    if(index==undefined){
        index=0;
    }
    var color = casper.evaluate(function(variableName,index) {
        var color = Canvas1.engine.getRealMeshesForInstancePath(variableName)[index].material.color;
        return [color.r, color.g, color.b];
    },variableName,index);

    test.assertNotEquals(testColor[0], color[0], "Red default color is correctly different for "+ variableName);
    test.assertNotEquals(testColor[1], color[1], "Green default color is correctly different for " + variableName);
    test.assertNotEquals(testColor[2], color[2], "Blue default color is correctly different for " +variableName);
}

/**
 * Test Selection of instances in main canvas
 * @param test - Global test variable reference
 * @param variableName - Name of instance to apply selection to
 * @param selectColorVarName - Expected color to find in istance's mesh material
 * @returns
 */
function testSelection(test,variableName,selectColorVarName){
    buttonClick("#spotlightBtn");
    casper.echo("---testSelection----");
    casper.waitUntilVisible('div#spotlight', function () {
        casper.sendKeys('input#typeahead', variableName, {keepFocus: true});
        casper.sendKeys('input#typeahead', casper.page.event.key.Return, {keepFocus: true});
        casper.waitUntilVisible('button#buttonOne', function () {
            test.assertVisible('button#buttonOne', "Select button correctly visible");
            buttonClick("#buttonOne");
            this.wait(500, function () {
                var selectColor = [1,0.8,0];
                casper.echo("---test3DMeshColor----");
                test3DMeshColor(test,selectColor,selectColorVarName,0);
            });
        });
    });
}

function closeSpotlight(){
    casper.evaluate(function() {
        $("#spotlight").hide();
    });
    casper.echo("Clicking to close spotlight");
}

/**
 * Tests spotlight functionality
 * @param test
 * @param variableName
 * @param plotName
 * @param expectButton
 * @param testSelect
 * @param selectionName
 * @param selectColorVarName
 * @returns
 */
function testSpotlight(test, variableName,plotName,expectButton,testSelect, selectionName, selectColorVarName){
    test.assertExists('i.fa-search', "Spotlight button exists")
    casper.mouseEvent('click', 'i.fa-search', "attempting to open spotlight");

    casper.waitUntilVisible('div#spotlight', function () {
        test.assertVisible('div#spotlight', "Spotlight opened");

        //type in the spotlight
        this.sendKeys('input#typeahead', variableName, {keepFocus: true});
        //press enter
        this.sendKeys('input#typeahead', this.page.event.key.Return, {keepFocus: true});

        casper.waitUntilVisible('div#spotlight', function () {
            casper.then(function () {
                this.echo("Waiting to see if the Plot variables button becomes visible");
                if(expectButton){
                    casper.waitUntilVisible('button#plot', function () {
                        test.assertVisible('button#plot', "Plot variables icon correctly visible");
                        this.echo("Plot variables button became visible correctly");
                        buttonClick("#plot");
                        this.waitUntilVisible(plotName, function () {
                            this.echo("Plot 2 came up correctly");
                            if(testSelect){
                                testSelection(test, selectionName,selectColorVarName);
                            }
                        });
                    }, null, 5000);
                }else{
                    casper.wait(1000, function () {
                        casper.then(function () {
                            this.echo("Waiting to see if the Plot and watch variable buttons becomes visible");
                            test.assertDoesntExist('button#plot', "Plot variables icon correctly invisible");
                            test.assertDoesntExist('button#watch', "Watch button correctly hidden");
                            this.echo("Variables button are hidden correctly");
                            if(testSelect){
                                testSelection(test, selectionName,selectColorVarName);
                            }
                        });
                    });
                }
            });
        });
    });
}

/**
 * Tests camera controls for main canvas
 * @param test
 * @param expectedCameraPosition
 * @returns
 */
function testCameraControls(test, expectedCameraPosition){
    casper.then(function(){
        casper.echo("------Zoom-------");
        casper.repeat(zoomClicks, function() {
            this.thenClick("button#zoomInBtn", function() {});
        });
    });//zoom in
    casper.then(function(){
        resetCameraTest(test, expectedCameraPosition);
    });//reset home camera position
    casper.then(function(){
        casper.echo("------Pan-------");
        casper.repeat(panClicks, function() {
            this.thenClick("button#panRightBtn", function(){});
        });
    });//pan right test
    casper.then(function(){
        resetCameraTest(test, expectedCameraPosition);
    });//reset home position
    casper.then(function(){
        casper.echo("------Rotate-------");
        casper.repeat(rotateClicks, function() {
            this.thenClick("button#rotateRightBtn", function(){});
        });
    });//rotate test
    casper.then(function(){
        resetCameraTest(test, expectedCameraPosition);
    });//reset home
}

/**
 * Tests Camera controls for Main canvas and a canvas widget
 * @param test
 * @param expectedCameraPosition
 * @returns
 */
function testCameraControlsWithCanvasWidget(test, expectedCameraPosition){
    casper.echo("-------Testing Camera Controls while playing experiment--------");
    casper.then(function(){
        casper.echo("------Zoom-------");
        casper.repeat(zoomClicks*2, function() {
            this.thenClick("button#zoomInBtn", function() {});
            this.thenClick("#Canvas2 button#zoomInBtn", function() {});
        });
    });//zoom in
    casper.then(function(){
        resetCameraTestWithCanvasWidget(test, expectedCameraPosition);
    });//reset home camera position
    casper.then(function(){
        casper.echo("------Pan-------");
        casper.repeat(panClicks*2, function() {
            this.thenClick("button#panRightBtn", function(){});
            this.thenClick("#Canvas2 button#panRightBtn", function(){});
        });
    });//pan right test
    casper.then(function(){
        resetCameraTestWithCanvasWidget(test, expectedCameraPosition);
    });//reset home position
    casper.then(function(){
        casper.echo("------Rotate-------");
        casper.repeat(rotateClicks*2, function() {
            this.thenClick("button#rotateRightBtn", function(){});
            this.thenClick("#Canvas2 button#rotateRightBtn", function(){});
        });
    });//rotate test
    casper.then(function(){
        resetCameraTestWithCanvasWidget(test, expectedCameraPosition);
    });//reset home
}

function testVisualGroup(test,variableName, expectedMeshes,expectedColors){
    casper.then(function(){
        casper.echo("-------Testing Highlighted Instance--------");
        var i=1;
        casper.repeat(expectedMeshes, function() {
            casper.echo("Debug Log: variableName "+ variableName+" and i ="+i);
            var color = casper.evaluate(function(variableName,i) {
                var color = Canvas1.engine.getRealMeshesForInstancePath(variableName)[i].material.color;
                return [color.r, color.g, color.b];
            },variableName,i);
            test3DMeshColorNotEquals(test,color, variableName);
            test3DMeshColor(test,expectedColors[i], variableName,i);
            ++i;
        });
    });
}

function testingConnectionLines(test, expectedLines){
    casper.then(function(){
        var connectionLines = casper.evaluate(function() {
            var connectionLines = Object.keys(Canvas1.engine.connectionLines).length;
            return connectionLines;
        });
        test.assertEquals(expectedLines, connectionLines, "Right amount of connections line");
    });
}

function testMoviePlayerWidget(test,id){
    test.assertExists('div[id="'+id+'"]', "Movie player exists");
    test.assertExists("iframe[id=\"widget6\"]", "Movie player iframe exists");
}

function testPlotWidgets(test, widget, variableName, expectedGElements){
	test.assertExists('div[id="'+widget+'"]', "Plot widget exists")

	casper.then(function(){
		var gElements = casper.evaluate(function(widget, expectedGElements) {
			var gElements = $("#"+widget)[0].getElementsByClassName("legendtoggle").length;
			return gElements;
		}, widget, expectedGElements);
		test.assertEquals(gElements, expectedGElements, "Right amount of graph elements for "+widget);
	});
}
