
casper.test.begin('Geppetto basic tests', 30, function suite(test) {
    casper.start("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend", function() {
      this.waitForSelector('div#logo', function() {
        this.echo("I waited for the logo to load.");
        test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
        test.assertExists('div#logo', "logo is found");
      }, null, 30000);
    });

    casper.thenOpen("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend/login?username=guest1&password=guest",function() {
        this.waitForSelector('div#page', function() {
          this.echo("I've waited for the splash screen to come up.");
          test.assertUrlMatch(/splash$/, 'Virgo Splash Screen comes up indicating successful login');
      }, null, 30000);
    });

    casper.thenOpen("http://docker-x2go-development-1.02489874.cont.dockerapp.io:8080/org.geppetto.frontend/",function() {
        this.waitForSelector('div[project-id="4"]', function() {
          this.echo("I've waited for the projects to load.");
          test.assertExists('div#logo', "logo is found");
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

          test.assertExists('a[aria-controls="experiments"]', "Experiments tab anchor is present");

          test.assertExists('div#experiments', "Experiments panel is present");

          test.assertNotVisible('div#experiments', "The experiment panel is correctly closed.");

          this.mouseEvent('click', 'a[aria-controls="experiments"]', "Opening experiment console");

          this.waitUntilVisible('div#experiments', function() {
            test.assertVisible('div#experiments', "The experiment panel is correctly open.");
          }, null, 5000);


          this.waitForSelector('tr.experimentsTableColumn:nth-child(1)', function() {
            test.assertExists('tr.experimentsTableColumn:nth-child(1)', "At least one experiment row exists");

            //roll over the experiments row
            this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
          }, null, 5000);

          //Check presence of experiment console buttons before persistence
          this.waitForSelector('a.activeIcon', function() {
            test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
          }, null, 5000);

          this.waitForSelector('a.deleteIcon', function() {
            test.assertDoesntExist('a.enabled.deleteIcon', "delete button exists and is correctly not enabled");
          }, null, 5000);

          this.waitForSelector('a.downloadResultsIcon', function() {
            test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
          }, null, 5000);

          this.waitForSelector('a.downloadModelsIcon', function() {
            test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
          }, null, 5000);

          this.waitForSelector('a.cloneIcon', function() {
            test.assertDoesntExist('a.enabled.cloneIcon', "clone button exists and is correctly not enabled");
          }, null, 5000);


          //Click persist button. Check things again
          test.assertVisible('button.SaveButton', "Persist button is present");

          //TODO: check recording variables, setting parameters

          //Good pattern for checking the absence of an attribute
          test.assertEvalEquals(function() {
            return require('utils').dump(this.getElementAttribute('button.SaveButton', 'disabled'));
          }, null, "The persist button is correctly active.");

          this.mouseEvent('click','button.SaveButton', "attempting to persist");

          this.wait('8000', function() {
            test.assertExists("button.SaveButton[disabled]", "The persist button is now correctly inactive");

            //Check presence of experiment console buttons AFTER persistence
            this.waitForSelector('a.activeIcon', function() {
              test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
            }, null, 5000);

            this.waitUntilVisible('a.deleteIcon', function() {
              test.assertVisible('a.deleteIcon', "delete button exists and is correctly enabled");
            }, null, 5000);

            this.waitForSelector('a.downloadResultsIcon', function() {
              test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
            }, null, 5000);

            this.waitUntilVisible('a.downloadModelsIcon', function() {
              test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
            }, null, 5000);

            this.waitUntilVisible('a.cloneIcon', function() {
              test.assertVisible('a.cloneIcon', "clone button exists and is correctly enabled");
            }, null, 5000);

            test.assertExists('i.fa-search', "Spotlight button exists")
            this.mouseEvent('click','i.fa-search', "attempting to open spotlight");

            this.waitUntilVisible('div#spotlight', function() {
              test.assertVisible('div#spotlight', "Spotlight opened");
            }, null, 5000);

            //type in the spotlight
            this.sendKeys('input#typeahead', 'hhcell.hhpop[0].v', { keepFocus: true });
            //press enter
            this.sendKeys('input#typeahead', casper.page.event.key.Return , {keepFocus: true});

            this.waitForText('hhcell.hhpop[0].v', function() {

            this.capture("typed.png");

            this.waitUntilVisible('button#watch', function() {
              test.assertVisible('button#watch', "Watch variables icon visible");
            }, null, 5000);

            //TODO: check on state of recorded variable and make sure it is accurate.

            this.mouseEvent('click','i.fa-search', "attempting to close spotlight");

            /* TODO: make it work
            this.waitWhileVisible('div#spotlight', function() {
              test.assertNotVisible('div#spotlight', "Spotlight closed");
            }, null, 5000);*/

          }, null, 5000)

          //TODO: logout
          });

        }, null, 100000);
    });

    //TODO: log back in as other users. Check more things
    //TODO: exercise the run loop, check the changing experiment status, try to make experiment fail

    casper.run(function() {
        test.done();
    });
});
