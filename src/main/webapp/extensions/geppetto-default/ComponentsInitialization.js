define(function (require) {
	return function (GEPPETTO) {

		var Console = require('../../js/components/interface/console/Console');
		var PythonConsole = require('../../js/components/interface/pythonConsole/PythonConsole');
		var ExperimentsTable = require('../../js/components/interface/experimentsTable/ExperimentsTable');

		// Enable local storage
		G.enableLocalStorage(false);
		
	    window.voltage_color = function(x) {
	        x = (x+0.07)/0.1; // normalization
	        if (x < 0) { x = 0; }
	        if (x > 1) { x = 1; }
	        if (x < 0.25) {
	            return [0, x*4, 1];
	        } else if (x < 0.5) {
	            return [0, 1, (1-(x-0.25)*4)];
	        } else if (x < 0.75) {
	            return [(x-0.5)*4, 1, 0];
	        } else {
	            return [1, (1-(x-0.75)*4), 0];
	        }
	    };

		//Canvas initialisation
		GEPPETTO.ComponentFactory.addComponent('CANVAS', {}, document.getElementById("sim"), function () {
            this.displayAllInstances();
        });
	    
		//Logo initialization
		GEPPETTO.ComponentFactory.addComponent('LOGO', {logo: 'gpt-gpt_logo'}, document.getElementById("geppettologo"));

		//Logo initialization
		GEPPETTO.ComponentFactory.addComponent('LINKBUTTON', { left: 41, top: 390, icon: 'fa-github', url: 'https://github.com/openworm/org.geppetto'}, document.getElementById("github-logo"));

        //Control panel initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {
                useBuiltInFilters: true,
                enablePagination:true,
                resultsPerPage: 10
        }, document.getElementById("controlpanel"),
            function () {
            // whatever gets passed we keep
            var passThroughDataFilter = function (entities) {
                return entities;
            };

            // set data filter
            GEPPETTO.ControlPanel.setDataFilter(passThroughDataFilter);
        });


		//Spotlight initialization
		GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {}, document.getElementById("spotlight"), function(){
			GEPPETTO.Spotlight.addSuggestion(GEPPETTO.Spotlight.plotSample, GEPPETTO.Resources.PLAY_FLOW);
		});

		//Foreground initialization
		GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {dropDown : false}, document.getElementById("foreground-toolbar"));

		//Console and Experiments table initialization
		GEPPETTO.ComponentFactory.addComponent('DRAWER', {children: [Console, ExperimentsTable], labels: ["Console", "Experiments"], iconClass: ["fa fa-terminal", "fa fa-flask"]}, document.getElementById("footerHeader"));

		//Home button initialization
		GEPPETTO.ComponentFactory.addComponent('HOME', {}, document.getElementById("HomeButton"));
		
		//Save initialization
		GEPPETTO.ComponentFactory.addComponent('SAVECONTROL', {}, document.getElementById("SaveButton"));

		//Simulation controls initialization
		GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

		//Share controls initialization
		GEPPETTO.ComponentFactory.addComponent('SHARE', {}, document.getElementById("share-button"));		
		

	};
});
