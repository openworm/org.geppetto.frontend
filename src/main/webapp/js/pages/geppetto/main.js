/**
 * Loads all scripts needed for Geppetto
 *
 * @author Jesus Martinez (jesus@metacell.us)
 * @author Matt Olson (matt@metacell.us)
 * @author Adrian Quintana (adrian@metacell.us)
 */
global.jQuery = require("jquery");

//Styling
require('../../../style/less/main.less');

var GEPPETTO = require('geppetto');

require('../../components/ComponentFactory')(GEPPETTO);
require('../../components/NewWidgetFactory')(GEPPETTO);

GEPPETTO.ComponentFactory.loadSpinner();

jQuery(function () {
    window.GEPPETTO = require('geppetto');

    //start project node which will be used as a Singleton to store current project info
    var project = GEPPETTO.ProjectFactory.createProjectNode({name: "Project", id: -1}, false);
    window.Project = project;
    window.G = GEPPETTO.G;
    window.Widgets = GEPPETTO.Widgets;
    window.help = GEPPETTO.Utility.help;

    // Load Project if needed
    var command = "Project.loadFromURL";
    var simParam = GEPPETTO.Utility.getQueryStringParameter('load_project_from_url');
    var expParam = GEPPETTO.Utility.getQueryStringParameter('experimentId');
    if (simParam == "") {
        simParam = GEPPETTO.Utility.getQueryStringParameter('load_project_from_id');
        command = "Project.loadFromID";
    }

    if (simParam == "") {
        simParam = GEPPETTO.Utility.getQueryStringParameter('load_project_from_content');
        command = "Project.loadFromContent";
    }

    if (simParam) {
        $(document).ready(
            function () {
                if (expParam) {
                    GEPPETTO.Console.executeCommand(command + '("' + simParam + '", "' + expParam + '")');
                } else {
                    GEPPETTO.Console.executeCommand(command + '("' + simParam + '")');
                }
            });
    }

    //load extensions
    require('../../../extensions/extensions');
});
