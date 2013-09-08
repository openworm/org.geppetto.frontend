module( "Commands Test", {
    setup: function() {
        //ok( true, "one extra assert per test" );
    }, teardown: function() {
        //ok( true, "and one extra assert after each test" );
    }
});

test( "Global Object Test", function() {
	
	equal(G.getCurrentSimulation(), "No Simulation to get as none is running", "No simulation, passed.");
	
	var event, 
		$toggleConsole = $('#jsConsoleButton');
	
//	// trigger event
    event = $.Event( "click" );
    event.keyCode = 9;
    $toggleConsole.trigger( event );
    
	equal(G.clear(), "Console history cleared", "Console cleared");
});

test( "Simulation Test", function() {

	equal(Simulation.getStatus(), Simulation.StatusEnum.INIT, "Simulation in initial conditions, passed.");
	Simulation.load();
	equal( Simulation.getStatus(),Simulation.StatusEnum.LOADED, "Simulation Loaded, passed");
});