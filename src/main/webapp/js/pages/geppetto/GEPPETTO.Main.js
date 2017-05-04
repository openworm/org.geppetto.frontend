/**
 * Geppetto entry point
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {

        var $ = require('jquery');
        var React = require('react');
        var InfoModal = require('../../components/controls/modals/InfoModal');
        var ProjectNode = require('../../geppettoProject/model/ProjectNode');
        var ReactDOM = require('react-dom');

        /**
         * @class GEPPETTO.Main
         */
        GEPPETTO.Main = {

            idleTime: 0,
            disconnected: false,
            statusWorker: null,
            localStorageEnabled: false,

            /**
             *
             */
            createChannel: function () {
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
                        window.parent.postMessage({"command": "ready"}, window.EMBEDDEDURL[0]);
                    }
                    else {
                        window.parent.postMessage({"command": "ready"}, window.EMBEDDEDURL);
                    }
                }
            },

            /**
             *
             * @returns {null}
             */
            getStatusWorker: function () {
                return this.statusWorker;
            },

            /**
             *
             */
            startStatusWorker: function () {
                //create web worker for checking status
                if (this.statusWorker != undefined) {
                    this.statusWorker.terminate();
                }
                this.statusWorker = new Worker("geppetto/js/geppettoProject/PullStatusWorker.js");

                this.statusWorker.postMessage(2000);

                //receives message from web worker
                this.statusWorker.onmessage = function (event) {
                    if (window.Project != null || undefined) {
                        var experiments = window.Project.getExperiments();
                        var pull = false;
                        for (var i = 0; i < experiments.length; i++) {
                            var status = experiments[i].getStatus();
                            if (status !== "COMPLETED") {
                                pull = true;
                                break;
                            }
                        }

                        if (pull && window.Project.persisted && window.Project.getId() != -1) {
                            GEPPETTO.MessageSocket.send(GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_STATUS, window.Project.id);
                        }
                    }
                };
            },

            /**
             * Initialize web socket communication
             */
            init: function () {
                GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
                GEPPETTO.Events.listen();
                this.createChannel();
                GEPPETTO.Console.debugLog(GEPPETTO.Resources.GEPPETTO_INITIALIZED);
            },

            /**
             * Idle check
             */
            idleCheck: function () {
                if (GEPPETTO.Main.idleTime > -1) {
                    var allowedTime = 2, timeOut = 4;
                    if (!GEPPETTO.Main.disconnected) {
                        GEPPETTO.Main.idleTime = GEPPETTO.Main.idleTime + 1;
                        //first time check, asks if user is still there
                        if (GEPPETTO.Main.idleTime > allowedTime) { // 5 minutes

                            //TODO Matteo: Make a function to create a custom Info modal inside ModalFactory and use it from here.
                            var infoFactory = React.createFactory(InfoModal);
                            ReactDOM.render(infoFactory({show: true, keyboard: false}), document.getElementById('modal-region'));

                            $('#infomodal-title').html("Zzz");
                            $('#infomodal-text').html(GEPPETTO.Resources.IDLE_MESSAGE);
                            $('#infomodal-btn').html("Yes");

                            $('#infomodal-btn').html("Yes").click(function () {
                                $('#infomodal').modal('hide');
                                GEPPETTO.Main.idleTime = 0;

                                //unbind click event so we can reuse same modal for other alerts
                                $('#infomodal-btn').unbind('click');
                            });
                        }

                        //second check, user isn't there or didn't click yes, disconnect
                        if (GEPPETTO.Main.idleTime > timeOut) {

                            //TODO Matteo: Make a function to create a custom Info modal inside ModalFactory and use it from here.
                            var infoFactory = React.createFactory(InfoModal);
                            ReactDOM.render(infoFactory({
                                show: true,
                                keyboard: false,
                                title: "",
                                text: GEPPETTO.Resources.DISCONNECT_MESSAGE,
                            }), document.getElementById('modal-region'));

                            $('#infomodal-footer').remove();
                            $('#infomodal-header').remove();

                            GEPPETTO.Main.idleTime = 0;
                            GEPPETTO.Main.disconnected = true;
                            GEPPETTO.MessageSocket.close();


                        }
                    }
                }
            },

        };

        $(document).ready(function () {
            GEPPETTO.Console.createConsole();
            var webWorkersSupported = (typeof (Worker) !== "undefined") ? true : false;

            //make sure webgl started correctly
            if (!webWorkersSupported) {
                GEPPETTO.Console.debugLog(GEPPETTO.Resources.WORKERS_NOT_SUPPORTED);
                GEPPETTO.ModalFactory.infoDialog(GEPPETTO.Resources.WORKERS_NOT_SUPPORTED, GEPPETTO.Resources.WORKERS_NOT_SUPPORTED_MESSAGE);
            } else {

                //Increment the idle time counter every minute.
                setInterval(GEPPETTO.Main.idleCheck, 240000); // 1 minute
                var here = $(this);

                //Zero the idle timer on mouse movement.
                here.mousemove(function (e) {
                    if (GEPPETTO.Main.idleTime > -1) {
                        GEPPETTO.Main.idleTime = 0;
                    }
                });

                here.keypress(function (e) {
                    if (GEPPETTO.Main.idleTime > -1) {
                        GEPPETTO.Main.idleTime = 0;
                    }
                });

                GEPPETTO.Main.init();

                //TODO Matteo: All the code below needs to be removed creating a component for the tabbed UI
                var visibleExperiments = false;
                $('#experimentsButton').click(function (e) {
                    if (!visibleExperiments) {
                        $('#console').hide();
                        $("#pythonConsole").hide();
                        $('#experiments').show();
                        $(this).tab('show');
                        visibleExperiments = true;
                        GEPPETTO.Console.focusFooter();
                    } else {
                        $('#experiments').hide();
                        visibleExperiments = false;
                        GEPPETTO.Console.unfocusFooter();
                    }
                });

                $('#consoleButton').click(function (e) {
                    $('#console').show();
                    $('#experiments').hide();
                    $("#pythonConsole").hide();
                    $(this).tab('show');
                    visibleExperiments = false;
                });

                $('#pythonConsoleButton').click(function (e) {
                    $('#console').hide();
                    $('#experiments').hide();
                    $("#pythonConsole").show();
                    $(this).tab('show');
                    visibleExperiments = false;
                });

                $('.nav-tabs li.active').removeClass('active');

            }
        });
    };
});