
/**
 * Loads and runGeppetto core QUnit tests
 *
 * @author Jesus Martinez (jesus@metacell.us)
 * @author Giovanni (giovanni@metacell.us)
 */

/*
 * Configure RequireJS. Values inside brackets mean those libraries are required prior
 * to loading the one one.
 */
global.jQuery = require("jquery");
var QUnit = require("qunitjs");
var ProjectNode = require('./geppettoProject/model/ProjectNode');

jQuery(function () {
    window.GEPPETTO = require('geppetto');
    window.Project = new ProjectNode({name: "Project", id: -1});
    window.G = GEPPETTO.G;
    window.Widgets = GEPPETTO.Widgets;
    window.help = GEPPETTO.Utility.help;

    var QUnitGeppettoNeuronalTests = require('./tests/QUnitGeppettoNeuronalTests');
    QUnitGeppettoNeuronalTests.run();

    // sacrifice a goat and start QUnit
    QUnit.load();
    QUnit.start();
});