/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/
/**
 * Loads all scripts needed for Geppetto
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */

define(function (require) {

    var run = function () {
        QUnit.module("Global Scope Test");
        QUnit.test("Global scope Test", function () {
            var help = GEPPETTO.Console.help();

            notEqual(help, null, "Global help() command test.");

            equal(G.showHelpWindow(true), GEPPETTO.Resources.SHOW_HELP_WINDOW, "Help Window Visible");

            G.showHelpWindow(false);

            var modalVisible = $('#help-modal').hasClass('in');

            equal(modalVisible, false, "Help Window Hidden");
        });

        QUnit.test("Test Debug Mode", function () {
            G.debug(true);

            equal(G.isDebugOn(), true, "Testing debug mode on scenario");

            G.debug(false);

            equal(G.isDebugOn(), false, "Testing debug mode off scenario");
        });

        QUnit.test("Test G Object help method", function () {
            notEqual(G.help(), null, "Help command for object G is available, passed.");
        });

        QUnit.test("Test Clear Console", function () {
            equal(G.clear(), GEPPETTO.Resources.CLEAR_HISTORY, "Console cleared");
        });

        QUnit.test("Test Plot Widget", function () {
            G.addWidget(Widgets.PLOT);

            equal(GEPPETTO.WidgetFactory.getController(Widgets.PLOT).getWidgets().length, 1, "Plot widget created");

            var plot = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets()[0];

            equal(plot.isVisible(), true, "Test Default Widget Visibility");

            plot.hide();

            equal(plot.isVisible(), false, "Test hide()");

            plot.show();

            equal(plot.isVisible(), true, "Test show()");

            plot.destroy();

            equal($("#" + plot.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test Popup Widget", function () {
            G.addWidget(Widgets.POPUP);

            equal(GEPPETTO.WidgetFactory.getController(Widgets.POPUP).getWidgets().length, 1, "Popup widget.");

            var pop = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.POPUP).getWidgets()[0];

            equal(pop.isVisible(), true, "Test Default Visibility");

            pop.hide();

            equal(pop.isVisible(), false, "Test hide()");

            pop.show();

            equal(pop.isVisible(), true, "Test show()");

            pop.destroy();

            equal($("#" + pop.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test Scattered-3D Widget", function () {
            G.addWidget(Widgets.SCATTER3D);

            equal(GEPPETTO.WidgetFactory.getController(Widgets.SCATTER3D).getWidgets().length, 1, "Scatter widget created");

            var scatter = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.SCATTER3D).getWidgets()[0];

            equal(scatter.isVisible(), true, "Test Default Visibility");

            scatter.hide();

            equal(scatter.isVisible(), false, "Test hide()");

            scatter.show();

            equal(scatter.isVisible(), true, "Test show()");

            scatter.destroy();

            equal($("#" + scatter.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test VARIABLEVISUALISER Widget", function () {
            G.addWidget(Widgets.VARIABLEVISUALISER);

            equal(GEPPETTO.WidgetFactory.getController(Widgets.VARIABLEVISUALISER).getWidgets().length, 1, "VARIABLEVISUALISER widget created");

            var VARIABLEVISUALISER = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.VARIABLEVISUALISER).getWidgets()[0];

            equal(VARIABLEVISUALISER.isVisible(), true, "Test Default Visibility");

            VARIABLEVISUALISER.hide();

            equal(VARIABLEVISUALISER.isVisible(), false, "Test hide()");

            VARIABLEVISUALISER.show();

            equal(VARIABLEVISUALISER.isVisible(), true, "Test show()");

            VARIABLEVISUALISER.destroy();

            equal($("#" + VARIABLEVISUALISER.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test TREEVISUALISERDAT Widget", function () {
            G.addWidget(Widgets.TREEVISUALISERDAT);

            equal(GEPPETTO.WidgetFactory.getController(Widgets.TREEVISUALISERDAT).getWidgets().length, 1, "TREEVISUALISERDAT widget created");

            var TREEVISUALISERDAT = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.TREEVISUALISERDAT).getWidgets()[0];

            equal(TREEVISUALISERDAT.isVisible(), true, "Test Default Visibility");

            TREEVISUALISERDAT.hide();

            equal(TREEVISUALISERDAT.isVisible(), false, "Test hide()");

            TREEVISUALISERDAT.show();

            equal(TREEVISUALISERDAT.isVisible(), true, "Test show()");

            TREEVISUALISERDAT.destroy();

            equal($("#" + TREEVISUALISERDAT.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test TreeVisualizerD3 Widget", function () {
            G.addWidget(Widgets.TREEVISUALISERD3);

            equal(GEPPETTO.WidgetFactory.getController(Widgets.TREEVISUALISERD3).getWidgets().length, 1, "TREEVISUALISERD3 widget created");

            var TREEVISUALISERD3 = GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.TREEVISUALISERD3).getWidgets()[0];

            equal(TREEVISUALISERD3.isVisible(), true, "Test Default Visibility");

            TREEVISUALISERD3.hide();

            equal(TREEVISUALISERD3.isVisible(), false, "Test hide()");

            TREEVISUALISERD3.show();

            equal(TREEVISUALISERD3.isVisible(), true, "Test show()");

            TREEVISUALISERD3.destroy();

            equal($("#" + TREEVISUALISERD3.getId()).html(), null, "Test destroy()");
        });

        QUnit.test("Test Commands", function () {
            G.showConsole(true);

            equal(GEPPETTO.Console.isConsoleVisible(), true, "Console Visible");

            G.showConsole(false);

            equal(GEPPETTO.Console.isConsoleVisible(), false, "Console hidden");

            G.showShareBar(true);

            equal(GEPPETTO.Share.isVisible(), true, "ShareBar Visible");

            G.showShareBar(false);

            equal(GEPPETTO.Share.isVisible(), false, "ShareBar hidden");
        });

        QUnit.module("Test Model Factory");
        QUnit.test("Test ModelFactory", function ( assert ) {

            var done = assert.async();

            var handler = {
                onMessage: function (parsedServerMessage) {
                    // Switch based on parsed incoming message type
                    switch (parsedServerMessage.type) {
                        //Simulation has been loaded and model need to be loaded
                        case GEPPETTO.SimulationHandler.MESSAGE_TYPE.PROJECT_LOADED:
                            GEPPETTO.SimulationHandler.loadProject(JSON.parse(parsedServerMessage.data));
                            equal(window.Project.getId(), 5, "Project ID checked");
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
                            assert.ok(GEPPETTO.ModelFactory.resolve('//@libraries.1/@types.5').getId() == 'Text' &&
                                      GEPPETTO.ModelFactory.resolve('//@libraries.1/@types.5').getMetaType() == 'TextType', "Ref string resolved to Type as expected");
                            assert.ok(GEPPETTO.ModelFactory.resolve('//@libraries.0/@types.20/@variables.5/@anonymousTypes.0/@variables.7').getId() == 'rateScale' &&
                                      GEPPETTO.ModelFactory.resolve('//@libraries.0/@types.20/@variables.5/@anonymousTypes.0/@variables.7').getMetaType() == 'Variable', "Ref string resolved to Variable as expected");
                            // check that types are resolved as expected in the model
                            assert.ok(acnet2.baskets_12[0].getTypes().length == 1 &&
                                      acnet2.baskets_12[0].getTypes()[0].getId() ==  'bask' &&
                                      acnet2.baskets_12[0].getTypes()[0].getMetaType() == 'CompositeType', 'Type in the model resolved as expected');
                            // check visual groups are created
                            assert.ok(acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups().length == 3 &&
                                      acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[0].getId() == 'Cell_Regions' &&
                                      acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[1].getId() == 'Na_bask_soma_group' &&
                                      acnet2.baskets_12[0].getTypes()[0].getVisualType().getVisualGroups()[2].getId() == 'Kdr_bask_soma_group', 'Visual groups created as expected');
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
                            assert.ok(GEPPETTO.ModelFactory.allPaths.length == 14661 &&
                                      GEPPETTO.ModelFactory.allPaths[0].path == 'acnet2' &&
                                      GEPPETTO.ModelFactory.allPaths[0].metaType == 'CompositeType' &&
                                      GEPPETTO.ModelFactory.allPaths[14661 - 1].path == 'time' &&
                                      GEPPETTO.ModelFactory.allPaths[14661 - 1].metaType == 'StateVariableType', 'All potential instance paths exploded as expected');
                            // check getAllPotentialInstancesEndingWith
                            assert.ok(GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v').length == 456 &&
                                      GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[0] == 'acnet2.pyramidals_48[0].soma_0.v' &&
                                      GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[333] == 'acnet2.pyramidals_48[45].basal0_6.v' &&
                                      GEPPETTO.ModelFactory.getAllPotentialInstancesEndingWith('.v')[456 - 1] == 'acnet2.baskets_12[11].dend_1.v',
                                      'getAllPotentialInstancesEndingWith returning expected paths');
                            // check getInstance:
                            assert.ok(window.Instances.getInstance('acnet2.baskets_12[3]').getInstancePath() == 'acnet2.baskets_12[3]', 'Instances.getInstance fetches existing instance as expected');
                            assert.ok(window.Instances.getInstance('acnet2.baskets_12[3].soma_0.v').getInstancePath() == 'acnet2.baskets_12[3].soma_0.v', 'Instances.getInstance creates and fetches instance as expected');

                            // TODO: figure out how to test for exception passing parameters to the function --> https://api.qunitjs.com/throws/
                            /*assert.raises(window.Instances.getInstance('acnet2.baskets_12[3].sticaxxi'),
                                          function( err ) { return err.toString() === 'The instance acnet2.baskets_12[3].sticaxxi does not exist in the current model';},
                                          'Trying to fetch something that does not exist in the model throws exception');*/

                            done();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.INFO_MESSAGE:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message);
                            ok(false, message);
                            done();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = JSON.parse(payload.message).message;
                            ok(false, message);
                            done();

                            break;
                        case GEPPETTO.GlobalHandler.MESSAGE_TYPE.ERROR_LOADING_PROJECT:
                            var payload = JSON.parse(parsedServerMessage.data);
                            var message = payload.message;
                            ok(false, message);
                            done();

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

