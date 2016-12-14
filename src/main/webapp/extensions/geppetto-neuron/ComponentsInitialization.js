define(function (require) {
    return function (GEPPETTO) {

        //Inject css stylesheet
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = "geppetto/extensions/geppetto-neuron/css/material.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        //Logo initialization
        GEPPETTO.ComponentFactory.addComponent('LOGO', {logo: 'gpt-gpt_logo'}, document.getElementById("geppettologo"));

        //Control panel initialization
        GEPPETTO.ComponentFactory.addComponent('CONTROLPANEL', {}, document.getElementById("controlpanel"), function(){


            GEPPETTO.ControlPanel.setColumnMeta([
            {"columnName": "path", "order": 1, "locked": false, "displayName": "Path", "source": "$entity$.getPath()"},
            {
                "columnName": "variablePath",
                "order": 2,
                "locked": false,
                "displayName": "Variable",
                "source": "$entity$.getName()"
            },
            {
                "columnName": "controls",
                "order": 4,
                "locked": false,
                "customComponent": GEPPETTO.ControlsComponent,
                "displayName": "Controls",
                "source": "",
                "action": "GEPPETTO.ControlPanel.refresh();"
            }]);

            GEPPETTO.ControlPanel.setColumns(['variablePath', 'controls']);

            GEPPETTO.ControlPanel.setDataFilter(function (entities) {

                return window.Instances.getInstance(GEPPETTO.ModelFactory.getAllPotentialInstancesOfMetaType(GEPPETTO.Resources.STATE_VARIABLE_TYPE));
            });
            GEPPETTO.ControlPanel.setControlsConfig({
                "VisualCapability": {},
                "Common": {
                    "plot": {
                        "id": "plot",
                        "actions": ["G.addWidget(0).plotData($instance$).setSize(273.8,556.8).setPosition(130,35).setName($instance$.getPath());"],
                        "icon": "fa-area-chart",
                        "label": "Plot",
                        "tooltip": "Plot variable"
                    }
                }
            });
            GEPPETTO.ControlPanel.setControls({"VisualCapability": [], "Common": ['plot']});

            GEPPETTO.ControlPanel.addData(window.Instances);

            GEPPETTO.on(Events.Model_loaded,function(){
                GEPPETTO.ControlPanel.refresh();
            });


        });

        //Spotlight initialization
        GEPPETTO.ComponentFactory.addComponent('SPOTLIGHT', {}, document.getElementById("spotlight"));

        //Create python console
        var pythonNotebookPath = "http://localhost:8888/notebooks/libs/neuron-ui-demo.ipynb";
        GEPPETTO.ComponentFactory.addComponent('PYTHONCONSOLE', {pythonNotebookPath: pythonNotebookPath}, document.getElementById("pythonConsole"));

        //Experiments table initialization
        GEPPETTO.ComponentFactory.addComponent('EXPERIMENTSTABLE', {}, document.getElementById("experiments"));

        //Simulation controls initialization
        GEPPETTO.ComponentFactory.addComponent('SIMULATIONCONTROLS', {}, document.getElementById("sim-toolbar"));

        //Foreground initialization
        GEPPETTO.ComponentFactory.addComponent('FOREGROUND', {dropDown: false}, document.getElementById("foreground-toolbar"));





        //Customise layout
        $("#github").hide();
        $("#sim").css("background-color", "#3e2723");


        //Remove idle time out warning
        GEPPETTO.G.setIdleTimeOut(-1);

        //Add geppetto jupyter connector
        require('components/jupyter/GeppettoJupyter');

    };
});