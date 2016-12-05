// NOTE: requires geppetto-vfb extension casper-tests branch
var TARGET_URL = "http://127.0.0.1";
var PROJECT_URL_SUFFIX = "/geppetto?load_project_from_url=http://vfbsandbox.inf.ed.ac.uk/do/geppettoJson.json?i=VFBd_00100009%26t=VFBt_001%26d";

casper.test.begin('Geppetto query component tests', 99, function suite(test) {
    casper.options.viewportSize = {
        width: 1340,
        height: 768
    };

    // open dashboard
    casper.start(TARGET_URL + ":8080/org.geppetto.frontend", function () {
        this.waitForSelector('div#logo', function () {
            this.echo("I waited for the logo to load.");
            test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
            test.assertExists('div#logo', "logo is found");
        }, null, 30000);
    });

    // open project
    casper.thenOpen(TARGET_URL + ":8080/org.geppetto.frontend/" + PROJECT_URL_SUFFIX, function () {

    });

    // TODO: wait for project to load, check we have query control and term info on the page

    // TODO: open query control, put query in the box

    // TODO: wait for results count, check that number of results is as expected

    // TODO: run query

    // TODO: wait for results

    // TODO: check results are as expected

    // TODO: click on image example, check that term info is populated as epxected

    casper.run(function () {
        test.done();
    });
});
