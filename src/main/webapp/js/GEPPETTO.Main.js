/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/

/**
 * Main class for handling user interface evens associated with: Simulation Controls,
 * alert & info messages, and server side communication
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author giovanni@openworm.org (Giovanni Idili)
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require) {
    return function(GEPPETTO) {

        var $ = require('jquery'),
            React = require('react'),
            InfoModal = require('jsx!components/popups/InfoModal'),
            ProjectNode = require('model/ProjectNode'),
            ReactDOM = require('react-dom');

        /**
         * @class GEPPETTO.Main
         */
        GEPPETTO.Main = {

            StatusEnum: {
                DEFAULT: 0,
                CONTROLLING: 1,
                OBSERVING: 2
            },

            idleTime: 0,
            disconnected: false,
            status: 0,
            statusWorker : null,

            getVisitorStatus: function() {
                return this.status;
            },

            getStatusWorker : function(){
                return this.statusWorker;
            },

            startStatusWorker : function(){
                //create web worker for checking status
                this.statusWorker = new Worker("geppetto/js/PullStatusWorker.js");

                this.statusWorker.postMessage(1000);

                //receives message from web worker
                this.statusWorker.onmessage = function (event) {
                    if(window.Project!=null || undefined){
                        var experiments = window.Project.getExperiments();
                        var pull = false;
                        for(var i=0; i < experiments.length; i++){
                            var status = experiments[i].getStatus();
                            if(status !== "COMPLETED"){
                                pull = true;
                                break;
                            }
                        }

                        if(pull && window.Project.persisted && window.Project.getId()!=-1){
                            GEPPETTO.MessageSocket.send(GEPPETTO.SimulationHandler.MESSAGE_TYPE.EXPERIMENT_STATUS, window.Project.id);
                        }
                    }
                };
            },

            /**
             * Initialize web socket communication
             */
            init: function() {
                GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/'+ window.BUNDLE_CONTEXT_PATH +'/GeppettoServlet');
                GEPPETTO.Console.debugLog(GEPPETTO.Resources.GEPPETTO_INITIALIZED);
            },

            /**
             * Idle check
             */
            idleCheck : function(){
                if(GEPPETTO.Main.idleTime>-1){
                    var allowedTime = 2, timeOut = 4;
                    if(!GEPPETTO.Main.disconnected) {
                        GEPPETTO.Main.idleTime = GEPPETTO.Main.idleTime + 1;
                        //first time check, asks if user is still there
                        if(GEPPETTO.Main.idleTime > allowedTime) { // 5 minutes

                            var infoFactory = React.createFactory(InfoModal);
                            ReactDOM.render(infoFactory({show:true, keyboard:false}), document.getElementById('modal-region'));

                            $('#infomodal-title').html("Zzz");
                            $('#infomodal-text').html(GEPPETTO.Resources.IDLE_MESSAGE);
                            $('#infomodal-btn').html("Yes");

                            $('#infomodal-btn').html("Yes").click(function() {
                                $('#infomodal').modal('hide');
                                GEPPETTO.Main.idleTime = 0;

                                //unbind click event so we can reuse same modal for other alerts
                                $('#infomodal-btn').unbind('click');
                            });
                        }

                        //second check, user isn't there or didn't click yes, disconnect
                        if(GEPPETTO.Main.idleTime > timeOut) {

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
                            GEPPETTO.FE.disableSimulationControls();
                            GEPPETTO.MessageSocket.close();
                            
                            var webGLStarted = GEPPETTO.init(GEPPETTO.FE.createContainer());
                            var webWorkersSupported = (typeof(Worker) !== "undefined") ? true : false;

                            if (!webGLStarted || !webWorkersSupported) {
                                GEPPETTO.FE.notifyInitErrors(webGLStarted, webWorkersSupported);
                            }
                        }
                    }
                }
            },

        };

// ============================================================================
// Application logic.
// ============================================================================

        $(document).ready(function () {
            //Create canvas
            var webGLStarted = GEPPETTO.webGLAvailable();
            var webWorkersSupported = (typeof(Worker) !== "undefined") ? true : false;

            //make sure webgl started correctly
            if (!webGLStarted || !webWorkersSupported) {
                GEPPETTO.FE.notifyInitErrors(webGLStarted, webWorkersSupported);
            }
            else {
                GEPPETTO.FE.initialEvents();

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

                //Initialize websocket functionality
                GEPPETTO.Main.init();

                var visibleExperiments = false;
                $('#experimentsButton').click(function (e) {
                    if (!visibleExperiments) {
                        $('#console').hide();
                        $('#experiments').show();
                        $(this).tab('show');
                        visibleExperiments = true;
                    } else {
                        $('#experiments').hide();
                        visibleExperiments = false;
                    }
                });

                $('#consoleButton').click(function (e) {
                    $('#console').show();
                    $('#experiments').hide();
                    $(this).tab('show');
                    visibleExperiments = false;
                });

                $("#experiments").resizable({
                    handles: 'n',
                    minHeight: 100,
                    autoHide: true,
                    maxHeight: 400,
                    resize: function (event, ui) {
                        if (ui.size.height > ($("#footerHeader").height() * .75)) {
                            $("#experiments").height($("#footerHeader").height() * .75);
                            event.preventDefault();
                        }
                        $('#experiments').resize();
                        $("#experiments").get(0).style.top = "0px";
                    }.bind(this)
                });

                $('.nav-tabs li.active').removeClass('active');

            }
        });
    };
});
