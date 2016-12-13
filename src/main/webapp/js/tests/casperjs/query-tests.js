var DASHBOARD_URL = "http://127.0.0.1:8080/org.geppetto.frontend/";
var PROJECT_URL = "http://127.0.0.1:8080/org.geppetto.frontend/geppetto?load_project_from_url=http://vfbsandbox.inf.ed.ac.uk/do/geppettoJson.json?i=VFBd_00100009%26t=VFBt_001%26d6d";

casper.test.begin('Geppetto control panel tests', 6, function suite(test) {
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

        this.waitForSelector('button[id=queryBuilderBtn]', function () {
            test.assertExists('button[id=queryBuilderBtn]', "Query builder logo appeared");
        }, null, 10000);

        this.waitForText('<a href="#">JFRC2_template</a>', function () {
            this.echo("Element JFRC2_template appeared in control panel");

            queryTests()
        }, null, 10000);
    });

    var queryTests = function() {
        // open query builder, check it's visible
        casper.then(function () {
            // check if query builder is invisible
            test.assertNotVisible('#querybuilder', "Query builder is invisible");

            this.echo("Clicking on query builder button toopen query builder");
            this.mouseEvent('click', 'button[id=queryBuilderBtn]', 'Opening query builder');

            test.assertVisible('#querybuilder', "Query builder is visible");
        });

        // click on selection control, check term info is populated
        casper.then(function () {
            this.echo("Typing in the query builder");
            this.sendKeys('#query-typeahead', 'medu');

            this.waitForSelector('div.tt-suggestion', function () {
                this.echo("Selecting first option");
                this.evaluate(function() {
                    $('div.tt-suggestion').first().click();
                });
                //this.mouseEvent('click', 'button[id=queryBuilderBtn]', 'Opening query builder again');
                this.waitForSelector('select.query-item-option', function () {
                    this.echo("Selecting first query for medulla");
                    this.evaluate(function() {
                        var selectElement = $('select.query-item-option');
                        selectElement.val('0').change();
                        var event = new Event('change', { bubbles: true });
                        selectElement[0].dispatchEvent(event);
                    });

                    // not ideal - react injects strange markup in strings
                    this.waitForText('<div id="query-results-label"><!-- react-text: 9 -->84<!-- /react-text --><!-- react-text: 10 --> results<!-- /react-text --></div>', function () {
                        runQueryTests();
                    }, null, 10000);
                }, null, 5000);
            }, null, 5000);
        });
    };

    var runQueryTests = function () {
        casper.echo("Running query");
        casper.mouseEvent('click', 'button[id=run-query-btn]', 'Running query');

        casper.waitForText('accessory medulla', function () {
            this.echo("Results rows appeared");
            this.mouseEvent('click', 'button[id=FBbt_00045003_info_queryResults_btn]', 'Click on results info for accessory medulla');

            // wait for text to appear in the term info widget
            this.waitForSelector('div[id=Popup1_FBbt_00045003_metadata_el_0]', function () {
                test.assertExists('div[id=Popup1_FBbt_00045003_metadata_el_0]', 'Term info correctly populated for FBbt_00045003 after query results info button click');
            }, null, 5000);

        }, null, 5000);
    };

    casper.run(function () {
        test.done();
    });
});
