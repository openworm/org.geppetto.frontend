
casper.test.begin('Geppetto basic tests', 12, function suite(test) {
    casper.start("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend", function() {
      this.waitForSelector('div[id="logo"]', function() {
        this.echo("I waited for the logo to load.");
        test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
        test.assertExists('div[id="logo"]', "logo is found");
      }, null, 30000);
    });

    casper.thenOpen("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend/login?username=guest1&password=guest",function() {
        this.waitForSelector('div[id="page"]', function() {
          this.echo("I've waited for the splash screen to come up.");
          test.assertUrlMatch(/splash$/, 'Virgo Splash Screen comes up indicating successful login');
      }, null, 30000);
    });

    casper.thenOpen("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend/",function() {
        this.waitForSelector('div[project-id="4"]', function() {
          this.echo("I've waited for the projects to load.");
          test.assertExists('div[id="logo"]', "logo is found");
          test.assertExists('div[project-id="4"]', "Projects from persistence bundle are present")
          test.assertSelectorHasText('div.user', 'Guest user', "Guest user is logged in");
      }, null, 30000);
    });

    casper.thenOpen("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend/geppetto?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/SingleComponentHH/GEPPETTO.json",function() {
        this.echo("Loading an external model that is not persisted")
        this.waitUntilVisible('div.modal-content', function() {
          this.echo("I've waited for the popup message to load up");
          test.assertVisible('h3.text-center', "Error message correctly pops up");
          test.assertSelectorHasText('h3.text-center', 'Message', "Error message correctly pops up with the message header");
          this.mouseEvent('click','button.btn', "closing error message");
          this.waitWhileVisible('h3.text-center', function () {
            test.assertNotVisible('h3.text-center', "Correctly closed error message");
          }, null, 30000);

          //TODO: Open experiment console.  Check presence of buttons, recording variables, setting parameters

          //TODO: Click persist button. Check things again
          test.assertVisible('button.SaveButton', "Persist button is present");

          test.assertEvalEquals(function() {
            return require('utils').dump(this.getElementAttribute('button.SaveButton', 'disabled'));
          }, null, "The persist button is correctly active.");

          this.mouseEvent('click','button.SaveButton', "attempting to persist");

          this.waitForSelector('button.SaveButton[disabled]', function() {
            test.assertExists("button.SaveButton[disabled]", "The persist button is now correctly inactive");
          }, null, 5000);

          //TODO: logout
      }, null, 100000);
    });

    //TODO: log back in as other users. Check more things
    //TODO: exercise the run loop, check the changing experiment status, try to make experiment fail

    casper.run(function() {
        test.done();
    });
});
