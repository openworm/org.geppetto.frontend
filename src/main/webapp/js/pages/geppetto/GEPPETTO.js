/**
 *
 * @author Matteo Cantarelli
 * @authot Jesus R Martinez (jesus@metacell.us)
 */
define(function (require) {

    var $ = require('jquery'), _ = require('underscore'), Backbone = require('backbone');
    var THREEx = require('./THREEx.KeyboardState'); //Nothing to do with THREE

    //These two libraries are required here so that Geppetto can work properly in an iframe (as embedded website).
    //Otherwise, sometimes (randomly)  these libraries are not loaded on time and some js commands failed and the web is not loaded properly.
    require('jquery-ui-bundle');
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
                console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec + ' - ' + msg, "");
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

    require('../../common/GEPPETTO.Resources')(GEPPETTO);
    require('../../common/GEPPETTO.ViewController')(GEPPETTO);
    require('../../common/GEPPETTO.CommandController')(GEPPETTO);
    require('./GEPPETTO.Events')(GEPPETTO);
    require('../../common/GEPPETTO.UserController')(GEPPETTO);
    require('./GEPPETTO.Flows')(GEPPETTO);
    require('../../common/GEPPETTO.ScriptRunner')(GEPPETTO);
    require('../../common/GEPPETTO.UnitsController')(GEPPETTO);
    

    GEPPETTO.ModalFactory = new(require('../../components/controls/modals/ModalFactory'))();
    GEPPETTO.SceneController =  new(require('../../components/interface/3dCanvas/SceneController'))();

    require('../../common/GEPPETTO.Utility')(GEPPETTO);
    require('../../components/widgets/MenuManager')(GEPPETTO);
    require('../../communication/MessageSocket')(GEPPETTO);
    require('../../communication/GEPPETTO.GlobalHandler')(GEPPETTO);

    GEPPETTO.Manager = new(require('../../common/Manager'))();

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
