/**
 * Geppetto entry point
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {
        require('babel-polyfill');
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
                // Change link from blank to self for GEPPETTO_CONFIGURATION.embedded environments
                if (GEPPETTO_CONFIGURATION.embedded && GEPPETTO_CONFIGURATION.embedderURL !== "/" && typeof handleRequest == 'undefined') {
                    handleRequest = function (e) {
                        if (GEPPETTO_CONFIGURATION.embedderURL.indexOf(e.origin) != -1) {
                            if (e.data.command == 'loadSimulation') {
                                if (e.data.projectId) {
                                    GEPPETTO.CommandController.execute('Project.loadFromID(' + e.data.projectId + ')');
                                }
                                else if (e.data.url) {
                                    GEPPETTO.CommandController.execute('Project.loadFromURL("' + e.data.url + '")');
                                }
                            }
                            else if (e.data.command == 'removeWidgets') {
                                GEPPETTO.CommandController.execute('G.removeWidget()');
                            }
                            else {
                                eval(e.data.command);
                            }
                        }
                    };
                    // we have to listen for 'message'
                    window.addEventListener('message', handleRequest, false);
                    if ($.isArray(GEPPETTO_CONFIGURATION.embedderURL)) {
                        window.parent.postMessage({ "command": "ready" }, GEPPETTO_CONFIGURATION.embedderURL[0]);
                    }
                    else {
                        window.parent.postMessage({ "command": "ready" }, GEPPETTO_CONFIGURATION.embedderURL);
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
                if (GEPPETTO_CONFIGURATION.contextPath == "/") {
                    this.statusWorker = new Worker("/geppetto/js/geppettoProject/PullStatusWorker.js");
                }else{
                    this.statusWorker = new Worker("geppetto/js/geppettoProject/PullStatusWorker.js");
                }

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
                            GEPPETTO.MessageSocket.send(GEPPETTO.MessageHandler.MESSAGE_TYPE.EXPERIMENT_STATUS, window.Project.id);
                        }
                    }
                };
            },

            /**
             * Initialize web socket communication
             */
            init: function () {
            	var host = GEPPETTO.MessageSocket.protocol + window.location.host + '/' + GEPPETTO_CONFIGURATION.contextPath + '/GeppettoServlet';
            	if(GEPPETTO_CONFIGURATION.contextPath=="/"){
            		host = GEPPETTO.MessageSocket.protocol + window.location.host.replace("8081","8080") + '/GeppettoServlet';
            	}
                GEPPETTO.MessageSocket.connect(host);
                console.log("Host for MessageSocket to connect: "+host);
                GEPPETTO.Events.listen();
                this.createChannel();
                GEPPETTO.CommandController.log(GEPPETTO.Resources.GEPPETTO_INITIALIZED, true);
                GEPPETTO.MessageSocket.send("geppetto_version", null);
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
                            ReactDOM.render(infoFactory({ show: true, keyboard: false }), document.getElementById('modal-region'));

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

            $("#loadingText").hide();
            // add console to placeholder

            var webWorkersSupported = (typeof (Worker) !== "undefined");

            //make sure webgl started correctly
            if (!webWorkersSupported) {
                GEPPETTO.CommandController.log(GEPPETTO.Resources.WORKERS_NOT_SUPPORTED, true);
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
            }
        }
        );
    };
});
