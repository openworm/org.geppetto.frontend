var DASHBOARD_URL = "http://127.0.0.1:8080/org.geppetto.frontend/";
var PROJECT_URL = "http://127.0.0.1:8080/org.geppetto.frontend/geppetto?load_project_from_url=http://vfbsandbox.inf.ed.ac.uk/do/geppettoJson.json?i=VFBd_00100009%26t=VFBt_001%26d6d";
var PROJECT_URL_1 = "http://127.0.0.1:8080/org.geppetto.frontend/geppetto?load_project_from_id=1";

casper.test.begin('Geppetto control panel tests', 4, function suite(test) {
    casper.options.viewportSize = {
        width: 1340,
        height: 768
    };

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
        this.echo("Loading project at URL: " + PROJECT_URL_1);

        casper.then(function() {
            // wait for page to finish loading
            this.echo("Waiting for load project logo to stop spinning");
            casper.waitWhileSelector('div.spinner-container > div.fa-spin', function() {
                this.echo("Logo stopped spinning");
            }, null, 20000);
        });

        casper.then(function(){
            this.waitForSelector('#controlpanel a:contains(SAD - painted domain JFRC2)', function () {
                test.assertEvalEquals(function () {
                    return VFB_00030600.getId();
                }, 'VFB_00030600');
                test.assertEvalEquals(function () {
                    return VFB_00017894.getId();
                }, 'VFB_00017894');

                this.echo("Elements appeared in control panel + Instances created correctly");
            }, null, 50000);
        });
    });

    // open control panel, check it's visible
    casper.then(function () {
        // check that control panel is invisible
        test.assert(false, casper.evaluate(function() { return $('#controlpanel').is(":visible"); }));
        this.echo("Control panel is invisible");

        this.mouseEvent('click', 'button[id=controlPanelBtn]', 'Ppening control panel');

        test.assert(true, casper.evaluate(function() { return $('#controlpanel').is(":visible"); }));
    });

    // TODO: click on selection control, check term info is populated

    casper.run(function () {
        test.done();
    });
});
