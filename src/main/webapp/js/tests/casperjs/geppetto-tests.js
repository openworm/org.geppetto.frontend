var TARGET_URL = "http://docker-x2go-development-1.02489874.cont.dockerapp.io"
var EXTERNAL_MODEL_URL = "https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/SingleComponentHH/GEPPETTO.json"
var EXTERNAL_MODEL_URL_2 = "https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/pharyngeal/project.json"



casper.test.begin('Geppetto basic tests', 51, function suite(test) {
  casper.options.viewportSize = {
          width: 1340,
          height: 768
      };

  casper.start(TARGET_URL + ":8080/org.geppetto.frontend", function() {
    this.waitForSelector('div#logo', function() {
      this.echo("I waited for the logo to load.");
      test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
      test.assertExists('div#logo', "logo is found");
    }, null, 30000);
  });

  casper.thenOpen(TARGET_URL + ":8080/org.geppetto.frontend/login?username=guest1&password=guest",function() {
      this.waitForSelector('div#page', function() {
        this.echo("I've waited for the splash screen to come up.");
        test.assertUrlMatch(/splash$/, 'Virgo Splash Screen comes up indicating successful login');
    }, null, 30000);
  });

  casper.thenOpen(TARGET_URL + ":8080/org.geppetto.frontend/",function() {
      this.waitForSelector('div[project-id="4"]', function() {
        this.echo("I've waited for the projects to load.");
        test.assertExists('div#logo', "logo is found");
        test.assertExists('div[project-id="4"]', "Projects from persistence bundle are present")
        test.assertSelectorHasText('div.user', 'Guest user', "Guest user is logged in");
    }, null, 30000);
  });

  casper.then(function() {
    testProject(test, TARGET_URL + ":8080/org.geppetto.frontend/geppetto?load_project_from_url=" + EXTERNAL_MODEL_URL, true, 'hhcell.hhpop[0].v');
  });

  casper.then(function() {
    testProject(test, TARGET_URL + ":8080/org.geppetto.frontend/geppetto?load_project_from_url=" + EXTERNAL_MODEL_URL_2, false, 'c302_A_Pharyngeal.M1[0].v')
  });

  //TODO: log back in as other users. Check more things
  //TODO: exercise the run loop, check the changing experiment status, try to make experiment fail

  casper.run(function() {
      test.done();
  });
});


function testProject(test, url, expect_error, spotlight_search) {

casper.thenOpen(url,function() {
    this.echo("Loading an external model that is not persisted at " + url);

    if (expect_error) {
      casper.then(function() {
        closeErrorMesage(test)
      });
    }

    casper.then(function() {
      doExperimentTableTest(test);
    });

    casper.then(function() {
      this.waitForSelector('tr.experimentsTableColumn:nth-child(1)', function() {
        test.assertExists('tr.experimentsTableColumn:nth-child(1)', "At least one experiment row exists");
      }, null, 5000);
    });

    casper.then(function() {
      //roll over the experiments row
      this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
      doPrePersistenceExperimentsTableButtonsCheck(test);
    });

    casper.then(function() {
      //TODO: check recording variables, setting parameters

      this.waitForSelector('button.btn.SaveButton', function() {
        test.assertVisible('button.btn.SaveButton', "Persist button is present");
      });

      //Good pattern for checking the absence of an attribute
      test.assertEvalEquals(function() {
        return require('utils').dump(this.getElementAttribute('button.SaveButton', 'disabled'));
      }, null, "The persist button is correctly active.");

      //Click persist button. Check things again
      this.mouseEvent('click','button.btn.SaveButton', "attempting to persist");

      test.assertExists("button.btn.SaveButton[disabled]", "The persist button is now correctly inactive");
    });

    casper.then(function() {

      //roll over the experiments row
      this.mouse.move('tr.experimentsTableColumn:nth-child(1)');
      doPostPersistenceExperimentsTableButtonCheck(test);

      doSpotlightCheck(test, spotlight_search);
        //TODO: logout
    });
  });
}

function closeErrorMesage(test) {
  casper.waitUntilVisible('div.modal-content', function() {
    this.echo("I've waited for the popup message to load up");
    test.assertVisible('h3.text-center', "Error message correctly pops up");
    test.assertSelectorHasText('h3.text-center', 'Message', "Error message correctly pops up with the message header");
    this.mouseEvent('click','button.btn', "closing error message");
    this.waitWhileVisible('h3.text-center', function () {
      test.assertNotVisible('h3.text-center', "Correctly closed error message");
    }, null, 30000);
  }, null, 10000);
}

function doExperimentTableTest(test) {
  test.assertExists('a[aria-controls="experiments"]', "Experiments tab anchor is present");

  test.assertExists('div#experiments', "Experiments panel is present");

  test.assertNotVisible('div#experiments', "The experiment panel is correctly closed.");

  casper.mouseEvent('click', 'a[aria-controls="experiments"]', "Opening experiment console");

  casper.waitUntilVisible('div#experiments', function() {
    test.assertVisible('div#experiments', "The experiment panel is correctly open.");
  }, null, 5000);
}

function doPrePersistenceExperimentsTableButtonsCheck(test) {

  //Check presence of experiment console buttons before persistence
  casper.waitForSelector('a.activeIcon', function() {
    test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
  }, null, 5000);

  casper.waitForSelector('a.deleteIcon', function() {
    test.assertDoesntExist('a.enabled.deleteIcon', "delete button exists and is correctly not enabled");
  }, null, 5000);

  casper.waitForSelector('a.downloadResultsIcon', function() {
    test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
  }, null, 5000);

  casper.waitForSelector('a.downloadModelsIcon', function() {
    test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
  }, null, 5000);

  casper.waitForSelector('a.cloneIcon', function() {
    test.assertDoesntExist('a.enabled.cloneIcon', "clone button exists and is correctly not enabled");
  }, null, 5000);
}

function doPostPersistenceExperimentsTableButtonCheck(test) {
  casper.waitForSelector('button.btn.SaveButton[disabled]', function() {
    //Check presence of experiment console buttons AFTER persistence
    casper.waitForSelector('a.activeIcon', function() {
      test.assertNotVisible('a.activeIcon', "active button exists and is correctly not enabled");
    }, null, 5000);

    casper.waitUntilVisible('a.deleteIcon', function() {
      test.assertVisible('a.deleteIcon', "delete button exists and is correctly enabled");
    }, null, 5000);

    casper.waitForSelector('a.downloadResultsIcon', function() {
      test.assertNotVisible('a.downloadResultsIcon', "download results button exists and is correctly not enabled");
    }, null, 5000);

    casper.waitUntilVisible('a.downloadModelsIcon', function() {
      test.assertVisible('a.downloadModelsIcon', "download models button exists and is correctly enabled");
    }, null, 5000);

    casper.waitUntilVisible('a.cloneIcon', function() {
      test.assertVisible('a.cloneIcon', "clone button exists and is correctly enabled");
    }, null, 5000);
  });
}

function doSpotlightCheck(test, spotlight_search) {
  test.assertExists('i.fa-search', "Spotlight button exists")
  casper.mouseEvent('click','i.fa-search', "attempting to open spotlight");

  casper.waitUntilVisible('div#spotlight', function() {
    test.assertVisible('div#spotlight', "Spotlight opened");

    //type in the spotlight
    casper.sendKeys('input#typeahead', spotlight_search, { keepFocus: true });
    //press enter
    casper.sendKeys('input#typeahead', casper.page.event.key.Return , {keepFocus: true});

    casper.waitForText(spotlight_search, function() {

      casper.capture("typed.png");

      casper.waitUntilVisible('button#watch', function() {
        test.assertVisible('button#watch', "Watch variables icon visible");
      }, null, 5000);

      //TODO: check on state of recorded variable and make sure it is accurate.

      casper.mouseEvent('click','i.fa-search', "attempting to close spotlight");

      /* TODO: make it work
      this.waitWhileVisible('div#spotlight', function() {
        test.assertNotVisible('div#spotlight', "Spotlight closed");
      }, null, 5000);*/
    }, null, 10000);

  }, null, 5000);
}
