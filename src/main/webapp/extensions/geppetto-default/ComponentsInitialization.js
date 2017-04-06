define(function (require) {
	return function (GEPPETTO) {
		
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

		var eventHandler = function(component){
			GEPPETTO.on(GEPPETTO.Events.Project_downloaded, function(){
				component.showToolTip("The project was downloaded!");
			});

			GEPPETTO.on("geppetto:error", function(){
				component.showToolTip("The project has failed download!");
				component.setState({icon:"fa fa-download"});
			});

			GEPPETTO.on('spin_download', function() {
				component.showToolTip("The project is getting downloaded...");
				component.setState({icon:"fa  fa-download fa-spin"});
			}.bind($("#DownloadProjectButton")));

			GEPPETTO.on('stop_spin_download', function() {
				component.setState({icon:"fa fa-download"});
			}.bind($("#DownloadProjectButton")));
		};

		var clickHandler = function(){
			GEPPETTO.Console.executeCommand("Project.download();");
			GEPPETTO.trigger("spin_download");
		};

		var configuration = {
				id: "DownloadProjectButton",
				onClick : clickHandler,
				eventHandler : eventHandler,
				tooltipPosition : { my: "right center", at : "left-25 center"},
				tooltipLabel : "Click to download project!",
				icon : "fa fa-download",
				className : "btn DownloadProjectButton pull-right",
				disabled : false,
				hidden : false
		};

		//Download Project Button initialization
		GEPPETTO.ComponentFactory.addComponent('BUTTON', {configuration: configuration}, document.getElementById("DownloadProjectButton"));
		
		//Simulation controls initialization
		GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

		//Camera controls initialization
		GEPPETTO.ComponentFactory.addComponent('CAMERACONTROLS', {}, document.getElementById("camera-controls"));

		//Share controls initialization
		GEPPETTO.ComponentFactory.addComponent('SHARE', {}, document.getElementById("share-button"));		
		

	};
});
