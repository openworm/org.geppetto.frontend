var urlBase = casper.cli.get('host');
if(urlBase==null || urlBase==undefined){
	urlBase = "http://127.0.0.1:8080/";
}
var PROJECT_URL_SUFFIX = "?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/SingleComponentHH/GEPPETTO.json";
var PROJECT_URL_SUFFIX_2 = "?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/pharyngeal/project.json";
var PROJECT_URL_SUFFIX_3 = "?load_project_from_url=https://raw.githubusercontent.com/openworm/org.geppetto.samples/development/UsedInUnitTests/balanced/project.json";
var PROJECT_URL_SUFFIX_4 = "?load_project_from_id=1";
var projectID;

var defaultLongWaitingTime = 295000;

casper.test.begin('Geppetto basic tests', function suite(test) {
    casper.options.viewportSize = {
        width: 1340,
        height: 768
    };

    // add for debug info
    //casper.options.verbose = true;
    //casper.options.logLevel = "debug";

    // show unhandled js errors
    casper.on("page.error", function(msg, trace) {
        this.echo("Error: " + msg, "ERROR");
    });

    // show page level errors
    casper.on('resource.received', function (resource) {
        var status = resource.status;
        if (status >= 400) {
            this.echo('URL: ' + resource.url + ' Status: ' + resource.status);
            this.echo('URL: ' + resource.url + ' Body: '  + resource.status);
        }
    });

    casper.start(urlBase+"org.geppetto.frontend", function () {
    	this.echo("Starting geppetto at host "+ urlBase);
        this.waitForSelector('div#logo', function () {
            this.echo("I waited for the logo to load.");
            test.assertTitle("geppetto's home", "geppetto's homepage title is the one expected");
            test.assertExists('div#logo', "logo is found");
        }, null, defaultLongWaitingTime);
    });

    casper.then(function () {
    	//TODO: log back in as other users. Check more things
        //TODO: exercise the run loop, check the changing experiment status, try to make experiment fail
        casper.echo("Waiting to logout");
        casper.thenOpen(urlBase+"org.geppetto.frontend/logout", function () {
        	this.echo("I've waited for user to logout.");
        });
    });
    
    casper.then(function () {
        casper.thenOpen(urlBase+"org.geppetto.frontend/login?username=guest1&password=guest", function () {
        	this.echo("Starting geppetto at host login "+ urlBase);
            /*this.waitForSelector('div#page', function() {
             this.echo("I've waited for the splash screen to come up.");
             test.assertUrlMatch(/splash$/, 'Virgo Splash Screen comes up indicating successful login');
             }, null, 30000);*/
        });
    });
    
    casper.then(function () {
        casper.thenOpen(urlBase+"org.geppetto.frontend", function () {
            this.waitForSelector('div[project-id="2"]', function () {
                this.echo("I've waited for the projects to load.");
                test.assertExists('div#logo', "logo is found");
                test.assertExists('div[project-id="2"]', "Projects from persistence bundle are present")
                test.assertSelectorHasText('div.user', 'Guest user', "Guest user is logged in");
            }, null, 100000);
            
            this.waitForSelector('div[project-id="1"]', function () {
                this.echo("I've waited for the projects to load.");
                test.assertExists('div#logo', "logo is found");
                test.assertExists('div[project-id="1"]', "Projects from persistence bundle are present")
                test.assertSelectorHasText('div.user', 'Guest user', "Guest user is logged in");
            }, null, 100000);
        });
    });
    casper.then(function () {
        testProject(test, urlBase+"org.geppetto.frontend/geppetto" + PROJECT_URL_SUFFIX, true,
            false, 'hhcell.hhpop[0].v', 'Model.neuroml.pulseGen1.delay', true,"hhcell");
    });
    
    casper.then(function () {
    	projectID = this.evaluate(function() {
           return Project.getId();
        });
    	this.echo("Project id to delete : "+projectID);
    });
    
    casper.then(function () {
        reloadProjectTest(test, urlBase+"org.geppetto.frontend/geppetto?load_project_from_id="+projectID,1);
    });
    
    casper.then(function () {
        deleteProject(test, urlBase+"org.geppetto.frontend",projectID);
    });
 
    casper.then(function () {
        testProject(test, urlBase+"org.geppetto.frontend/geppetto" + PROJECT_URL_SUFFIX_2, false,
            false, 'c302_A_Pharyngeal.M1[0].v', 'Model.neuroml.generic_neuron_iaf_cell.C', false,"c302_A_Pharyngeal");
    });
    
    casper.then(function () {
    	projectID = this.evaluate(function() {
           return Project.getId();
        });
    	this.echo("Project id to delete : "+projectID);
    });
    
    casper.then(function () {
        reloadProjectTest(test, urlBase+"org.geppetto.frontend/geppetto?load_project_from_id="+projectID,1);
    });
    
    casper.then(function () {
        deleteProject(test, urlBase+"org.geppetto.frontend",projectID);
    });

    casper.then(function () {
        testProject(test, urlBase+"org.geppetto.frontend/geppetto" + PROJECT_URL_SUFFIX_3, false,
            false, '', '', false,"Balanced_240cells_36926conns");
    });
    
    casper.then(function () {
    	projectID = this.evaluate(function() {
           return Project.getId();
        });
    	this.echo("Project id to delete : "+projectID);
    });
    
    casper.then(function () {
        reloadProjectTest(test, urlBase+"org.geppetto.frontend/geppetto?load_project_from_id="+projectID,1);
    });
   
    casper.then(function () {
        deleteProject(test, urlBase+"org.geppetto.frontend",projectID);
    });
    
    //tests persistence project features
    casper.then(function () {
        testPersistedProjectFeatures(test, urlBase+"org.geppetto.frontend/geppetto?load_project_from_id=1");
    });
    
    casper.then(function () {
    	//TODO: log back in as other users. Check more things
        //TODO: exercise the run loop, check the changing experiment status, try to make experiment fail
        casper.echo("Waiting to logout");
        casper.thenOpen(urlBase+"org.geppetto.frontend/logout", function () {
        	this.echo("I've waited for user to logout.");
        });
    });

    casper.then(function () {
    	casper.echo("Waiting for admin to login");
        casper.thenOpen(urlBase+"org.geppetto.frontend/login?username=admin&password=admin", function () {
        	this.echo("I've waited for the admin user to log");
        });
    });
    
    casper.then(function () {
    	casper.echo("Waiting for admin panel");
        casper.thenOpen(urlBase+"org.geppetto.frontend/admin", function () {
            this.waitForSelector('div[class="griddle"]', function () {
                this.echo("I've waited for the admin panel to load.");
            }, null, 30000);
        });
    });  
    
    casper.run(function () {
        test.done();
    });
});