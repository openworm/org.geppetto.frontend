module( "Geppetto Client Testing", {
    setup: function() {
    }, teardown: function() {
    }
});

test("Global scope Test", function(){
	notEqual(help(), null, "Global help() command available, passed");
});

test( "G Object Test", function() {
	GEPPETTO.Main.init();
	equal(G.getCurrentSimulation(), NO_SIMULATION_TO_GET, "No simulation, passed.");
	    
	equal(isDebugOn(), false, "Debug Mode Off, passed.");
	
	G.debug(true);
	
	equal(isDebugOn(), true, "Debug Mode on, passed");
	
	notEqual(G.help(), null, "Help command for object G is available, passed.");
	
	var autocompleteWasCalled = false;
	var oldAutocomplete = $.fn.extend(true, {}, $.autocomplete);
	$.autocomplete = function(){
	    autocompleteWasCalled = true;
	};
	
	$.fn.autocomplete = oldAutocomplete;

	ok(autocompleteWasCalled,"Should call autocomplete.");

	
	GEPPETTO.Console.createConsole();
	
	equal(G.clear(),CLEAR_HISTORY, "Console cleared");
	
	equal(G.copyToClipboard(), EMPTY_CONSOLE_HISTORY, "No commands to copy, test passed");

});

test( "Simulation Test", function() {
	notEqual(Simulation.help(), null, "Help command for Simulation object is available, passed.");
	
	equal(getSimulationStatus(), Simulation.StatusEnum.INIT, "Simulation in initial conditions, passed.");
	
	Simulation.load("https://dl.dropboxusercontent.com/s/2oczzgnheple0mk/sph-sim-config.xml?token_hash=AAGbu0cCNW8zK_2DUoc0BPuCpspGqcNRIfk-6uDCMVUiHA");
	equal( getSimulationStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");
	
	Simulation.start();
	equal( getSimulationStatus(),Simulation.StatusEnum.STARTED, "Simulation Started, passed");
	
	Simulation.pause();
	equal( getSimulationStatus(),Simulation.StatusEnum.PAUSED, "Simulation Paused, passed");
	
	Simulation.stop();
	equal( getSimulationStatus(),Simulation.StatusEnum.STOPPED, "Simulation Stopped, passed");	
});