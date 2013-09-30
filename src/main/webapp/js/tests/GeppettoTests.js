
module("Global Scope Test");
test("Global scope Test", function(){
	notEqual(help(), null, "Global help() command available, passed");
});

module( "G Object Test");

test( "Test Get Current Simulation", function() {
	equal(G.getCurrentSimulation(), NO_SIMULATION_TO_GET, "No simulation, passed.");	
});

test("Test Debug Mode", function(){
	equal(isDebugOn(), false, "Debug Mode Off, passed.");	
	
	G.debug(true);
	
	equal(isDebugOn(), true, "Debug Mode on, passed");
});

test("Test G Object help method", function(){
	notEqual(G.help(), null, "Help command for object G is available, passed.");
});

test("Test Clear Console", function(){
	GEPPETTO.MessageSocket.connect('ws://' + window.location.host + '/org.geppetto.frontend/SimulationServlet');
	
	setTimeout(GEPPETTO.Console.createConsole(),5000);
	
	setTimeout(equal(G.clear(),CLEAR_HISTORY, "Console cleared"),3000);
});

test("Test Copy History To Clipboard", function(){
	equal(G.copyHistoryToClipboard(), EMPTY_CONSOLE_HISTORY, "No commands to copy, test passed");
});

module("Simulation Test");
test( "Test Simulation Help Command", function() {
	equal(getSimulationStatus(), Simulation.StatusEnum.INIT, "Simulation in initial conditions, passed.");
	notEqual(Simulation.help(), null, "Help command for Simulation object is available, passed.");
});

test("Test Load Simulation", function(){
	//GEPPETTO.Main.init();
	Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
	equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");	
});

test("Test Start Simulation", function(){
	Simulation.start();
	equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Started, passed");
});

test("Test Pause Simulation", function(){
	Simulation.pause();
	equal( getSimulationStatus(),Simulation.StatusEnum.PAUSED, "Simulation Paused, passed");
});

test("Test Stop Simulation", function(){
	Simulation.stop();
	equal( getSimulationStatus(),Simulation.StatusEnum.STOPPED, "Simulation Stopped, passed");
});