/**
 * @class GEPPETTO.Init
 */
define(function (require) {
    return function (GEPPETTO) {

        var createChannel = function () {
            // Change link from blank to self for embedded environments
            if (window.EMBEDDED && window.EMBEDDEDURL !== "/" && typeof handleRequest == 'undefined') {
                handleRequest = function (e) {
                    if (window.EMBEDDEDURL.indexOf(e.origin) != -1) {
                        if (e.data.command == 'loadSimulation') {
                            if (e.data.projectId) {
                                GEPPETTO.Console.executeCommand('Project.loadFromID(' + e.data.projectId + ')');
                            }
                            else if (e.data.url) {
                                GEPPETTO.Console.executeCommand('Project.loadFromURL("' + e.data.url + '")');
                            }
                        }
                        else if (e.data.command == 'removeWidgets') {
                            GEPPETTO.Console.executeCommand('G.removeWidget()');
                        }
                        else {
                            eval(e.data.command);
                        }
                    }
                };
                // we have to listen for 'message'
                window.addEventListener('message', handleRequest, false);
                if ($.isArray(window.EMBEDDEDURL)) {
                    window.parent.postMessage({ "command": "ready" }, window.EMBEDDEDURL[0]);
                }
                else {
                    window.parent.postMessage({ "command": "ready" }, window.EMBEDDEDURL);
                }
            }
        };


        GEPPETTO.Init = {

            /**
             *
             */
            initEventListeners: function () {
                // setup listeners for geppetto events that can be triggered
                if (!GEPPETTO.Events.listening) {
                    GEPPETTO.Events.listen();
                    GEPPETTO.Events.listening = true;
                }
            },

            /**
             *
             * @param containerp
             * @returns {*|Object}
             */
            initialize: function (containerp) {
                createChannel();
            }


        };
    };
});
