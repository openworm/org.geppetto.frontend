define(function (require) {
	return function (GEPPETTO) {
		// Enable local storage
		G.enableLocalStorage(true);

		//Logo initialization
		GEPPETTO.ComponentFactory.addComponent('LOGO', {logo: 'gpt-gpt_logo'}, document.getElementById("geppettologo"));

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

		//Experiments table initialization
		GEPPETTO.ComponentFactory.addComponent('EXPERIMENTSTABLE', {}, document.getElementById("experiments"));

		//Home button initialization
		GEPPETTO.ComponentFactory.addComponent('HOME', {}, document.getElementById("HomeButton"));
		
		//Home button initialization
		GEPPETTO.ComponentFactory.addComponent('HOME', {}, undefined);
		
		//Home button initialization
		GEPPETTO.ComponentFactory.addComponent('HOME', {}, undefined);

		//Save initialization
		GEPPETTO.ComponentFactory.addComponent('SAVECONTROL', {}, document.getElementById("SaveButton"));

		//Simulation controls initialization
		GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

		//Camera controls initialization
		GEPPETTO.ComponentFactory.addComponent('CAMERACONTROLS', {}, document.getElementById("camera-controls"));

		//Share controls initialization
		GEPPETTO.ComponentFactory.addComponent('SHARE', {}, document.getElementById("share-button"));		
		

	};
});
