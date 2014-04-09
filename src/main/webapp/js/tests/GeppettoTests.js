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
"use strict";

define(function(require) {

	var run = function() {
		module("Global Scope Test");
		test("Global scope Test", function() {
			notEqual(help(), null, "Global help() command available, passed");
		});

		module("G Object Test");
		test("Test Get Current Simulation", function() {
			equal(G.getCurrentSimulation(), GEPPETTO.Resources.NO_SIMULATION_TO_GET, "No simulation, passed.");
		});

		test("Test Debug Mode", function() {
			G.debug(true);

			equal(G.isDebugOn(), true, "Debug Mode on, passed");

			G.debug(false);

			equal(G.isDebugOn(), false, "Debug Mode Off, passed.");
		});

		test("Test G Object help method", function() {
			notEqual(G.help(), null, "Help command for object G is available, passed.");
		});

		test("Test Clear Console", function() {
			equal(G.clear(), GEPPETTO.Resources.CLEAR_HISTORY, "Console cleared");
		});

		test("Test Copy History To Clipboard", function() {

			equal(G.copyHistoryToClipboard(), GEPPETTO.Resources.EMPTY_CONSOLE_HISTORY, "No commands to copy, test passed");

			//add some commands to history
			GEPPETTO.Console.executeCommand("G.help();");
			GEPPETTO.Console.executeCommand("help();");
			GEPPETTO.Console.executeCommand("Simulation.start()");

			equal(G.copyHistoryToClipboard(), GEPPETTO.Resources.COPY_CONSOLE_HISTORY, "Commands copied, test passed");
		});

		test("Test Add Widget", function() {
			G.addWidget(Widgets.PLOT);

			equal(GEPPETTO.PlotsController.getWidgets().length, 1, "Plot widget created, test passed");

			G.removeWidget(Widgets.PLOT);
		});

		test("Test Remove Widget", function() {
			G.addWidget(Widgets.PLOT);

			equal(GEPPETTO.PlotsController.getWidgets().length, 1, "Plot widget created");

			G.removeWidget(Widgets.PLOT);

			equal(GEPPETTO.PlotsController.getWidgets().length, 0, "Plot widget removed, test passed");
		});

		test("Test Widget", function() {
			G.addWidget(Widgets.PLOT);

			equal(GEPPETTO.PlotsController.getWidgets().length, 1, "Plot widget created");

			var plot = GEPPETTO.PlotsController.getWidgets()[0];

			equal(plot.isVisible(), true, "Default visibility test passed");

			plot.hide();

			equal(plot.isVisible(), false, "Hide test passed");

			plot.show();

			equal(plot.isVisible(), true, "Show test passed");

			plot.destroy();

			equal($("#" + plot.getId()).html(), null, "Widget successfully destroyed, passed");
		});
		
		test("Test Commands", function() {
			G.showConsole(true);
			
			equal(GEPPETTO.Console.isConsoleVisible(), true, "Console Visible");
			
			G.showConsole(false);
			
			equal(GEPPETTO.Console.isConsoleVisible(), false, "Console hidden");
			
			G.showShareBar(true);
			
			equal(GEPPETTO.Share.isVisible(), true, "ShareBar Visible");
			
			G.showShareBar(false);
			
			equal(GEPPETTO.Share.isVisible(), false, "ShareBar hidden");
			
			//Qunit tests JS and not HTML. For the help window and share on twitter/facebook we are testing 
			//the returned message from the commands since we can't acess the index.html file
			equal(G.showHelpWindow(true), GEPPETTO.Resources.SHOW_HELP_WINDOW, "Show Help Window");

			equal(G.showHelpWindow(false), GEPPETTO.Resources.HIDE_HELP_WINDOW, "Hide Help Window");
			
			equal(G.shareOnTwitter(), GEPPETTO.Resources.SHARE_ON_TWITTER, "Share On Twitter");
						
			equal(G.shareOnFacebook(), GEPPETTO.Resources.SHARE_ON_FACEBOOK, "Share On Facebook");
		});
		
		

	};

	return {run: run};

});

