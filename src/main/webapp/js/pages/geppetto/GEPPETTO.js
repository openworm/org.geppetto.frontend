/**
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @authot Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {

    var $ = require('jquery'), _ = require('underscore'), Backbone = require('backbone');
    var THREEx = require('./THREEx.KeyboardState'); //Nothing to do with THREE

    //These two libraries are required here so that Geppetto can work properly in an iframe (as embedded website).
    //Otherwise, sometimes (randomly)  these libraries are not loaded on time and some js commands failed and the web is not loaded properly.
    require('jquery-ui');
    require('bootstrap');
    

    /**
     * Initialise Geppetto
     *
     * @class GEPPETTO
     */
    var GEPPETTO = {

        debug : false,
        keyboard : new THREEx.KeyboardState(),
        /**
         * @param{String} key - The pressed key
         * @returns {boolean} True if the key is pressed
         */
        isKeyPressed: function (key) {
            return this.keyboard.pressed(key);
        },


        /**
         * @param msg
         */
        log: function (msg) {
            if (GEPPETTO.debug) {
                var d = new Date();
                var curr_hour = d.getHours();
                var curr_min = d.getMinutes();
                var curr_sec = d.getSeconds();
                var curr_msec = d.getMilliseconds();

                console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":"
                    + curr_msec + ' - ' + msg, "");

            }
        },

        /**
         * @param category
         * @param action
         * @param opt_label
         * @param opt_value
         * @param opt_noninteraction
         */
        trackActivity: function (category, action, opt_label, opt_value, opt_noninteraction) {
            if (typeof _gaq != 'undefined') {
                _gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
            }
        },

        winHeight: function () {
            return window.innerHeight || (document.documentElement || document.body).clientHeight;
        }
    };

    _.extend(GEPPETTO, Backbone.Events);

    require('../../components/interface/jsConsole/SandboxConsole')(GEPPETTO);
    require('../../common/GEPPETTO.Resources')(GEPPETTO);
    require('../../common/GEPPETTO.ViewController')(GEPPETTO);
    require('./GEPPETTO.Events')(GEPPETTO);
    require('./GEPPETTO.Init')(GEPPETTO);
    require('../../components/interface/3dCanvas/GEPPETTO.SceneController')(GEPPETTO);
    require('./GEPPETTO.FE')(GEPPETTO);
    require('../../common/GEPPETTO.UserController')(GEPPETTO);
    require('./GEPPETTO.Flows')(GEPPETTO);
    require('../../common/GEPPETTO.ScriptRunner')(GEPPETTO);
    require('../../common/GEPPETTO.UnitsController')(GEPPETTO);
    require('../../components/interface/jsEditor/GEPPETTO.JSEditor')(GEPPETTO);
    require('../../components/interface/jsConsole/GEPPETTO.Console')(GEPPETTO);
    require('../../common/GEPPETTO.Utility')(GEPPETTO);
    require('../../components/widgets/MenuManager')(GEPPETTO);
    require('../../communication/MessageSocket')(GEPPETTO);
    require('../../communication/GEPPETTO.GlobalHandler')(GEPPETTO);
    require('../../communication/MessageHandler')(GEPPETTO);
    require('./G')(GEPPETTO);
    require('./GEPPETTO.Main')(GEPPETTO);
    require("../../components/widgets/includeWidget")(GEPPETTO);
    require('../../geppettoProject/ProjectFactory')(GEPPETTO);
    require('../../geppettoModel/ModelFactory')(GEPPETTO);
    require('../../geppettoProject/ExperimentsController')(GEPPETTO);
    require('../../geppettoModel/QueriesController')(GEPPETTO);
    require('../../geppettoProject/ProjectsController')(GEPPETTO);

    return GEPPETTO;

});
