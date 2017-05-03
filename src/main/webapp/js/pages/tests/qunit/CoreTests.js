
/**
 * Loads all scripts needed for Geppetto
 *
 * @author Jesus Martinez (jesus@metacell.us)
 * @author Giovanni Idili (giovanni@metacell.us)
 */
define(function (require) {
    var QUnit = require("qunitjs");
    require('../../../components/ComponentFactory')(GEPPETTO);
    /**
     * Closes socket and clears handlers. Method is called from each test.
     */
    function resetConnection() {
        //close socket
        GEPPETTO.MessageSocket.close();
        //clear message handlers, all tests within module should have performed by time method it's called
        GEPPETTO.MessageSocket.clearHandlers();
        //connect to socket again for next test
        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
    }

    var run = function () {
        QUnit.module("Global Scope Test");
        QUnit.test("Global scope Test", function (assert) {
            var help = GEPPETTO.Console.help();

            assert.notEqual(help, null, "Global help() command test.");

            assert.equal(G.showHelpWindow(true), GEPPETTO.Resources.SHOW_HELP_WINDOW, "Help Window Visible");

            G.showHelpWindow(false);

            var modalVisible = $('#help-modal').hasClass('in');

            assert.equal(modalVisible, false, "Help Window Hidden");
        });

        QUnit.test("Test Debug Mode", function (assert) {
            G.debug(true);

            assert.equal(G.isDebugOn(), true, "Testing debug mode on scenario");

            G.debug(false);

            assert.equal(G.isDebugOn(), false, "Testing debug mode off scenario");
        });

        QUnit.test("Test G Object help method", function (assert) {
            assert.notEqual(G.help(), null, "Help command for object G is available, passed.");
        });

        QUnit.test("Test Clear Console", function (assert) {
            assert.equal(G.clear(), GEPPETTO.Resources.CLEAR_HISTORY, "Console cleared");
        });

        QUnit.test("Test Popup Widget", function (assert) {
            G.addWidget(Widgets.POPUP);

            assert.equal(GEPPETTO.WidgetFactory.getController(Widgets.POPUP).getWidgets().length, 1, "Popup widget.");

            var pop = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.POPUP).getWidgets()[0];

            assert.equal(pop.isVisible(), true, "Test Default Visibility");

            pop.hide();

            assert.equal(pop.isVisible(), false, "Test hide()");

            pop.show();

            assert.equal(pop.isVisible(), true, "Test show()");

            pop.destroy();

            assert.equal($("#" + pop.getId()).html(), null, "Test destroy()");
        });
        
        QUnit.test("Test Plot Widget", function (assert) {
            G.addWidget(Widgets.PLOT);

            assert.equal(GEPPETTO.WidgetFactory.getController(Widgets.PLOT).getWidgets().length, 1, "Plot widget.");

            var plot = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets()[0];

            assert.equal(plot.isVisible(), true, "Test Default Visibility");

            plot.hide();

            assert.equal(plot.isVisible(), false, "Test hide()");

            plot.show();

            assert.equal(plot.isVisible(), true, "Test show()");

            plot.destroy();

            assert.equal($("#" + plot.getId()).html(), null, "Test destroy()");
        });
        
        QUnit.test("Test UnitsControllers", function (assert) {
            G.addWidget(Widgets.PLOT);

            assert.equal(GEPPETTO.WidgetFactory.getController(Widgets.PLOT).getWidgets().length, 1, "Plot widget.");

            var plot = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets()[0];
            
            assert.equal(plot.isVisible(), true, "Test Default Visibility");

            var initialLabel = plot.getUnitLabel("S / m2");
            
            assert.equal(initialLabel,"Electric conductance over surface (S/m<sup>2</sup>)", "Test Math.js unit");
            
            GEPPETTO.UnitsController.addUnit("S/m2","Electric conductance OVER density");
            initialLabel = plot.getUnitLabel("S / m2");
            
            assert.equal(initialLabel,"Electric conductance over density (S/m<sup>2</sup>)", "Test Math.js unit");

            plot.destroy();

            assert.equal($("#" + plot.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test VARIABLEVISUALISER Widget", function (assert) {
            G.addWidget(Widgets.VARIABLEVISUALISER);

            assert.equal(GEPPETTO.WidgetFactory.getController(Widgets.VARIABLEVISUALISER).getWidgets().length, 1, "VARIABLEVISUALISER widget created");

            var VARIABLEVISUALISER = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.VARIABLEVISUALISER).getWidgets()[0];

            assert.equal(VARIABLEVISUALISER.isVisible(), true, "Test Default Visibility");

            VARIABLEVISUALISER.hide();

            assert.equal(VARIABLEVISUALISER.isVisible(), false, "Test hide()");

            VARIABLEVISUALISER.show();

            assert.equal(VARIABLEVISUALISER.isVisible(), true, "Test show()");

            VARIABLEVISUALISER.destroy();

            assert.equal($("#" + VARIABLEVISUALISER.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test TREEVISUALISERDAT Widget", function (assert) {
            G.addWidget(Widgets.TREEVISUALISERDAT);

            assert.equal(GEPPETTO.WidgetFactory.getController(Widgets.TREEVISUALISERDAT).getWidgets().length, 1, "TREEVISUALISERDAT widget created");

            var TREEVISUALISERDAT = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.TREEVISUALISERDAT).getWidgets()[0];

            assert.equal(TREEVISUALISERDAT.isVisible(), true, "Test Default Visibility");

            TREEVISUALISERDAT.hide();

            assert.equal(TREEVISUALISERDAT.isVisible(), false, "Test hide()");

            TREEVISUALISERDAT.show();

            assert.equal(TREEVISUALISERDAT.isVisible(), true, "Test show()");

            TREEVISUALISERDAT.destroy();

            assert.equal($("#" + TREEVISUALISERDAT.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test Commands", function (assert) {
            G.showConsole(true);

            assert.equal(GEPPETTO.Console.isConsoleVisible(), true, "Console Visible");

            G.showConsole(false);

            assert.equal(GEPPETTO.Console.isConsoleVisible(), false, "Console hidden");

        });

        QUnit.module("Test Model Factory");
        QUnit.test("Test ModelFactory", function (assert) {

            var done = assert.async();
            // once off on the first test to establish connection
            resetConnection();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
                            assert.equal(window.Project.getId(), 5, "Project ID checked");
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.MODEL_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.SimulationHandler.loadModel(payload);

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2, "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined, "Instances are not undefined");
                            assert.ok(window.Instances.length == 1, "1 top level instance as expected");
                            assert.ok(window.acnet2 != undefined && window.acnet2.baskets_12 != undefined, "Shortcuts created as expected");
                            assert.ok(window.acnet2.baskets_12.getChildren().length == 12 && window.acnet2.pyramidals_48.getChildren().length == 48, "Visual types exploded into instances as expected");
                            // check resolve
                            assert.ok(GEPPETTO.ModelFactory.resolve('//@libraries.1/@types.5').getId() == window.Model.getLibraries()[1].getTypes()[5].getId() &&
                                      GEPPETTO.ModelFactory.resolve('//@libraries.1/@types.5').getMetaType() == window.Model.getLibraries()[1].getTypes()[5].getMetaType(),
                                      "Ref string resolved to Type as expected");
                            // check that types are resolved as expected in the model
                            assert.ok(acnet2.baskets_12[0].getTypes().length == 1 &&
                                      acnet2.baskets_12[0].getTypes()[0].getId() ==  'bask' &&
                                      acnet2.baskets_12[0].getTypes()[0].getMetaType() == 'CompositeType', 'Type in the model resolved as expected');
                            // check visual groups are created
                            assert.ok(acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups().length == 3 &&
                                      acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[0].getId() == 'Cell_Regions' &&
                                      acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[2].getId() == 'Na_bask' &&
                                      acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[1].getId() == 'Kdr_bask', 'Visual groups created as expected');
                            // test that ModelFactory.getInstanceOf gives expected results
                            assert.ok(GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType()).length == 12 &&
                                      GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType().getPath()).length == 12 &&
                                      GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType())[0].getId() == "baskets_12[0]" &&
                                      GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getType())[0].getMetaType() == "ArrayElementInstance",
                                      'getAllInstanceOf returning instances as expected for Type and Type path.');
                            assert.ok(GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable()).length == 1 &&
                                      GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable().getPath()).length == 1 &&
                                      GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable())[0].getId() == "baskets_12" &&
                                      GEPPETTO.ModelFactory.getAllInstancesOf(acnet2.baskets_12[0].getVariable())[0].getMetaType() == "ArrayInstance",
                                      'getAllInstanceOf returning instances as expected for Variable and Variable path.');
                            // check AllPotentialInstances
                            assert.ok(GEPPETTO.ModelFactory.allPathsIndexing.length == 7612 &&
                                      GEPPETTO.ModelFactory.allPathsIndexing[0].path == 'acnet2' &&
                                      GEPPETTO.ModelFactory.allPathsIndexing[0].metaType == 'CompositeType' &&
                                      GEPPETTO.ModelFactory.allPathsIndexing[7612 - 1].path == 'time' &&
                                      GEPPETTO.ModelFactory.allPathsIndexing[7612 - 1].metaType == 'StateVariableType', 'All potential instance paths exploded as expected');
                            // check getAllPotentialInstancesEndingWith
                            assert.ok(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v').length == 456 &&
                                      GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[0] == 'acnet2.pyramidals_48[0].soma_0.v' &&
                                      GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[333] == 'acnet2.pyramidals_48[45].basal0_6.v' &&
                                      GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[456 - 1] == 'acnet2.baskets_12[11].dend_1.v',
                                      'getAllPotentialInstancesEndingWith returning expected paths');
                            // check getInstance:
                            assert.ok(window.Instances.getInstance('acnet2.baskets_12[3]').getInstancePath() == 'acnet2.baskets_12[3]', 'Instances.getInstance fetches existing instance as expected');
                            assert.ok(window.Instances.getInstance('acnet2.baskets_12[3].soma_0.v').getInstancePath() == 'acnet2.baskets_12[3].soma_0.v', 'Instances.getInstance creates and fetches instance as expected');
                            // try to get instance that doesn't exist in the model
                            assert.throws(function() { window.Instances.getInstance('acnet2.baskets_12[3].sticaxxi'); }, 'Trying to fetch something that does not exist in the model throws exception');

                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);
                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);
                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR_LOADING_PROJECT:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = payload.message;

                            // make it fail
                            assert.ok(false, message);
                            done();
                            resetConnection();

                            break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("5", "1");
        });

        QUnit.module("Test Capabilities");
        QUnit.test("Test Capability Injection", function (assert) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
                            assert.equal(window.Project.getId(), 5, "Project ID checked");
                            break;
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.MODEL_LOADED:
                            var payload = JSON.parse(parsedServerMessage.data);
                            GEPPETTO.SimulationHandler.loadModel(payload);

                            // test that geppetto model high level is as expected
                            assert.ok(window.Model != undefined, "Model is not undefined");
                            assert.ok(window.Model.getVariables() != undefined && window.Model.getVariables().length == 2, "2 Variables as expected");
                            assert.ok(window.Model.getLibraries() != undefined && window.Model.getLibraries().length == 2, "2 Libraries as expected");
                            // test that instance tree high level is as expected
                            assert.ok(window.Instances != undefined, "Instances are not undefined");
                            assert.ok(window.Instances.length == 1, "1 top level instance as expected");
                            assert.ok(window.acnet2 != undefined && window.acnet2.baskets_12 != undefined, "Shortcuts created as expected");

                            // test if visual capability is injected in instances
                            assert.ok(window.acnet2.baskets_12[0].hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY), "Visual capability injected to instances of visual types");
                            // test if visual capability is injected in types
                            assert.ok(window.acnet2.baskets_12[0].getType().hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY), "Visual capability injected to types with visual types");
                            // test if parameter capability is injected in instances
                            assert.ok(window.Model.neuroml.network_ACnet2.temperature.hasCapability(GEPPETTO.Resources.PARAMETER_CAPABILITY), "Parameter capability injected to parameter instances");
                            // test if visual group capability is injected in visual groups
                            assert.ok(window.acnet2.pyramidals_48[0].hasCapability(GEPPETTO.Resources.VISUAL_GROUP_CAPABILITY), "Visual group capability injected to instances of visual types with visual groups");
                            // test if connection capability is injected in connection variables
                            
                            Model.neuroml.resolveAllImportTypes(function(){
                            	assert.ok(GEPPETTO.ModelFactory.getAllVariablesOfMetaType(GEPPETTO.ModelFactory.getAllTypesOfMetaType(GEPPETTO.Resources.COMPOSITE_TYPE_NODE), 'ConnectionType')[0].hasCapability(GEPPETTO.Resources.CONNECTION_CAPABILITY), "Connection capability injected to variables of ConnectionType");
                                assert.ok(window.acnet2.pyramidals_48[0].getConnections()[0].hasCapability(GEPPETTO.Resources.CONNECTION_CAPABILITY), "Connection capability injected to instances of connection types");
                            });
                            
                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);

                            // make it fail
                            assert.ok(false, message);
                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;

                            // make it fail
                            assert.ok(false, message);
                            done();
                            resetConnection();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR_LOADING_PROJECT:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = payload.message;

                            // make it fail
                            assert.ok(false, message);
                            done();
                            resetConnection();

                            break;
                    }
                }
            };

            GEPPETTO.MessageSocket.clearHandlers();
            GEPPETTO.MessageSocket.addHandler(handler);
            window.Project.loadFromID("5", "1");
        });

    };
    return {run: run};
});
