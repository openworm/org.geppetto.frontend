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

		var toggleClickHandler = function(){
			$('.DownloadProjectButton').uitooltip({content: "The project is getting downloaded..."});
        	$(".DownloadProjectButton").mouseover().delay(2000).queue(function(){$(this).mouseout().dequeue();});
			GEPPETTO.Console.executeCommand("Project.download();");
        	GEPPETTO.trigger("spin_download");
        };
        
		var configuration = {
        		id: "DownloadProjectButton",
        		onClick : toggleClickHandler,
        		tooltipPosition : { my: "right center", at : "left-10 center"},
        		icon : "fa fa-download",
        		className : "btn DownloadProjectButton pull-right",
        		disabled : false,
        		hidden : false
        };

		//Save initialization
		GEPPETTO.ComponentFactory.addComponent('BUTTON', {}, document.getElementById("SaveButton"));
		
		//Download Project Button initialization
		GEPPETTO.ComponentFactory.addComponent('DownloadProjectButton', {}, document.getElementById("DownloadProjectButton"));

		//Simulation controls initialization
		GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

		//Camera controls initialization
		GEPPETTO.ComponentFactory.addComponent('CAMERACONTROLS', {}, document.getElementById("camera-controls"));

		//Share controls initialization
		GEPPETTO.ComponentFactory.addComponent('SHARE', {}, document.getElementById("share-button"));		
		

	};
});
