casper.test.begin('Geppetto basic tests', 5, function suite(test) {
    casper.start("http://live.geppetto.org", function() {
        this.waitForSelector('div[project-id="1"]', function() {
            this.echo("I've waited for 10 seconds.");
            test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
            test.assertExists('div[id="logo"]', "logo is found");
            this.mouseEvent('dblclick','div[project-id="1"]');
        }, null, 30000);
    });

    casper.thenOpen("https://live.geppetto.org/geppetto?load_project_from_id=1",function() {
        this.waitForSelector('div[id="Popup1"]', function() {
            this.echo("I've waited for the popups to load.");
            test.assertTitle("geppetto", "geppetto title is ok");
            test.assertUrlMatch(/load_project_from_id=1/, "project load attempted");
            test.assertExists('div[id="Popup1"]', "geppetto loads the description popup");
        }, null, 30000);
    });

    casper.run(function() {
        test.done();
    });
});