var DASHBOARD_URL = "http://127.0.0.1:8080/org.geppetto.frontend/";
var PROJECT_URL = "http://127.0.0.1:8080/org.geppetto.frontend/geppetto?load_project_from_url=http://vfbsandbox.inf.ed.ac.uk/do/geppettoJson.json?i=VFBd_00100009%26t=VFBt_001%26d6d";

casper.test.begin('Geppetto control panel tests', 4, function suite(test) {
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

                /*var instance1 = this.page.evaluate(function() {
                    return window.VFB_00030600;
                });

                var instance2 = this.page.evaluate(function() {
                    return window.VFB_00017894;
                });

                test.assert(true, instance1 != undefined, 'Instance VFB_00030600 correctly created');
                test.assert(true, instance2 != undefined, 'Instance VFB_00017894 correctly created');*/

                this.echo("Elements appeared in control panel + Instances created correctly");
            }, null, 30000);
        });
    });

    // open control panel, check it's visible
    casper.then(function () {
        // check that control panel is invisible
        test.assertNotVisible('#controlpanel', "Control panel is invisible");
        this.echo("Control panel is invisible");

        this.mouseEvent('click', 'button[id=controlPanelBtn]', 'Ppening control panel');

        test.assertVisible('#controlpanel', "Control is visible");
    });

    // TODO: click on selection control, check term info is populated

    casper.run(function () {
        test.done();
    });
});
