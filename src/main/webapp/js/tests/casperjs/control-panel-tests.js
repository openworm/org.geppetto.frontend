var DASHBOARD_URL = "http://127.0.0.1:8080/org.geppetto.frontend/";
var PROJECT_URL = "http://127.0.0.1:8080/org.geppetto.frontend/geppetto?load_project_from_url=http://vfbsandbox.inf.ed.ac.uk/do/geppettoJson.json?i=VFBd_00100009%26t=VFBt_001%26d6d";

casper.test.begin('Geppetto control panel tests', 5, function suite(test) {
    casper.options.viewportSize = {
        width: 1340,
        height: 768
    };

    // add for debug info
    // casper.options.verbose = true;
    // casper.options.logLevel = "debug";

    // show unhandled js errors
    casper.on("page.error", function(msg, trace) {
        this.echo("Error: " + msg, "ERROR");
    });

    // show page level errors
    casper.on('resource.received', function (resource) {
        var status = resource.status;
        if (status >= 400) {
            this.echo('URL: ' + resource.url + ' Status: ' + resource.status);
        }
    });

    // open dashboard
    casper.start(DASHBOARD_URL, function () {
        this.waitForSelector('div#logo', function () {
            this.echo("I waited for the logo to load.");
            test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
            test.assertExists('div#logo', "logo is found");
        }, null, 10000);
    });

    // open project, check for items in control panel + instances
    casper.thenOpen(PROJECT_URL, function () {
        this.echo("Loading project at URL: " + PROJECT_URL);

        casper.then(function(){
            this.waitForText('<a href="#">JFRC2_template</a>', function () {
                this.echo("Element JFRC2_template appeared in control panel");
            }, null, 30000);

            this.waitForText('<a href="#">SAD - painted domain JFRC2</a>', function () {
                this.echo("Element SAD appeared in control panel");
            }, null, 30000);
        });
    });

    // open control panel, check it's visible
    casper.then(function () {
        // check that control panel is invisible
        test.assertNotVisible('#controlpanel', "Control panel is invisible");

        this.echo("Clicking on control panel button toopen query builder");
        this.mouseEvent('click', 'button[id=controlPanelBtn]', 'Opening control panel');

        test.assertVisible('#controlpanel', "Control panel is visible");
    });

    // click on selection control, check term info is populated
    casper.then(function () {
        // click on select control
        this.echo("Clicking on selection control button for JFRC2_template");
        this.mouseEvent('click', 'button[id=VFB_00017894_select_ctrlPanel_btn]', 'Clicking selection button on JFRC2_template');

        // wait for text to appear in the term info widget
        this.waitForSelector('div[id=Popup1_VFB_00017894_metadata_el_0]', function () {
            test.assertExists('div[id=Popup1_VFB_00017894_metadata_el_0]', 'Term info correctly populated  for JFRC2_template after control panel selection click');
        }, null, 10000);
    });

    casper.run(function () {
        test.done();
    });
});
