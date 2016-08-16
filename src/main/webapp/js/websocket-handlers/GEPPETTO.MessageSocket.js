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
 ******************************************************************************
 *
 * WebSocket class use for communication between client and server
 *
 * @author  Jesus R. Martinez (jesus@metacell.us)
 */


define(function (require) {
    return function (GEPPETTO) {

        var messageHandlers = [];
        var clientID = null;
        var nextID = 0;
        var connectionInterval = 300;
        var pako = require("pako");
        
        var callbackHandler = {};

        /**
         * Web socket creation and communication
         */
        GEPPETTO.MessageSocket = {
            socket: null,

            //sets protocol to use for connection
            protocol: window.USE_SSL ? "wss://" : "ws://",

            //flag used to connect using ws protocol if wss failed
            failsafe: false,

            connect: function (host) {
                if ('WebSocket' in window) {
                    GEPPETTO.MessageSocket.socket = new WebSocket(host);
                    GEPPETTO.MessageSocket.socket.binaryType = "arraybuffer";
                }
                else if ('MozWebSocket' in window) {
                    GEPPETTO.MessageSocket.socket = new MozWebSocket(host);
                }
                else {
                    GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBSOCKET_NOT_SUPPORTED);
                    return;
                }

                GEPPETTO.MessageSocket.socket.onopen = function () {
                    //enable load simulation button, and welcome message buttons
                    GEPPETTO.FE.postSocketConnection();

                    GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBSOCKET_OPENED);

                    //attach the handlers once socket is opened
                    messageHandlers.push(GEPPETTO.SimulationHandler);
                    messageHandlers.push(GEPPETTO.GlobalHandler);
                };

                GEPPETTO.MessageSocket.socket.onclose = function () {
                    GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBSOCKET_CLOSED);
                };

                GEPPETTO.MessageSocket.socket.onmessage = function (msg) {
                    var messageData = msg.data;

                    if (messageData == "ping") {
                        return;
                    }

                    // if it's a binary (possibly compressed) then determine its type and process it
                    if (messageData instanceof ArrayBuffer) {
                        processBinaryMessage(messageData);

                        // otherwise, for a text message, parse it and notify listeners
                    } else {
                        // a non compresed message
                        parseAndNotify(messageData);
                    }

                };

                //Detects problems when connecting to Geppetto server
                GEPPETTO.MessageSocket.socket.onerror = function (evt) {
                    var message = GEPPETTO.Resources.SERVER_CONNECTION_ERROR;
                    //Attempt to connect using ws first time wss fails,
                    //if ws fails too then don't try again and display info error window
                    if (GEPPETTO.MessageSocket.failsafe) {
                        GEPPETTO.MessageSocket.protocol = "ws://";
                        GEPPETTO.MessageSocket.failsafe = true;
                        GEPPETTO.MessageSocket.connect(GEPPETTO.MessageSocket.protocol + window.location.host + '/' + window.BUNDLE_CONTEXT_PATH + '/GeppettoServlet');
                    } else {
                        GEPPETTO.FE.infoDialog(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR, message);
                    }
                };
            },

            /**
             * Sends messages to the server
             */
            send: function (command, parameter, callback) {
                var requestID = this.createRequestID();

                //if there's a script running let it know the requestID it's using to send one of it's commands
                if (GEPPETTO.ScriptRunner.isScriptRunning()) {
                    GEPPETTO.ScriptRunner.waitingForServerResponse(requestID);
                }

                this.waitForConnection(messageTemplate(requestID, command, parameter), connectionInterval);
                
                // add callback with request id if any
                if (callback != undefined) {
                    callbackHandler[requestID] = callback;
                }
                
                return requestID;
            },

            waitForConnection: function (messageTemplate, interval) {
                if (this.isReady() === 1) {
                    GEPPETTO.MessageSocket.socket.send(messageTemplate);
                }
                else {
                    var that = this;
                    setTimeout(function () {
                        that.waitForConnection(messageTemplate);
                    }, interval);
                }
            },

            isReady: function () {
                return GEPPETTO.MessageSocket.socket.readyState;
            },

            close: function () {
                GEPPETTO.MessageSocket.socket.close();
                //dispose of handlers upon closing connection
                messageHandlers = [];
            },

            /**
             * Add handler to receive updates from server
             */
            addHandler: function (handler) {
                messageHandlers.push(handler);
            },

            /**
             * Removes a handler from the socket
             */
            removeHandler: function (handler) {
                var index = messageHandlers.indexOf(handler);

                if (index > -1) {
                    messageHandlers.splice(index, 1);
                }
            },

            /**
             * Clear handlers
             */
            clearHandlers: function () {
                messageHandlers = [];
            },


            /**
             * Sets the id of the client
             */
            setClientID: function (id) {
                clientID = id;
            },

            /**
             * Creates a request id to send with the message to the server
             */
            createRequestID: function () {
                return clientID + "-" + (nextID++);
            }
        };

        /**
         * Template for Geppetto message
         *
         * @param msgtype - message type
         * @param payload - message payload, can be anything
         * @returns JSON stringified object
         */
        function messageTemplate(id, msgtype, payload) {

            if (!(typeof payload == 'string' || payload instanceof String)) {
                payload = JSON.stringify(payload);
            }

            var object = {
                requestID: id,
                type: msgtype,
                data: payload
            };
            return JSON.stringify(object);
        }

        function gzipUncompress(compressedMessage) {
            var messageBytes = new Uint8Array(compressedMessage);
            var message = pako.ungzip(messageBytes, {to: "string"});
            return message;
        }

        function parseAndNotify(messageData) {
            var parsedServerMessage = JSON.parse(messageData);

            //notify all handlers
            for (var i = 0, len = messageHandlers.length; i < len; i++) {
                var handler = messageHandlers[i];
                if (handler != null || handler != undefined) {
                    handler.onMessage(parsedServerMessage);
                }
            }
            
            // run callback if any
            if(parsedServerMessage.requestID != undefined){
                if (callbackHandler[parsedServerMessage.requestID] != undefined) {
                    callbackHandler[parsedServerMessage.requestID](parsedServerMessage.data);
                    delete callbackHandler[parsedServerMessage.requestID];
                }
            }
            
        }

        function processBinaryMessage(message) {

            var messageBytes = new Uint8Array(message);

            // if it's a binary message and first byte it's zero then assume it's a compressed json string
            //otherwise is a file and a 'save as' dialog is opened
            if (messageBytes[0] == 0) {
                var message = pako.ungzip(messageBytes.subarray(1), {to: "string"});
                parseAndNotify(message);
            }
            else {
                var fileNameLength = messageBytes[1];
                var fileName = String.fromCharCode.apply(null, messageBytes.subarray(2, 2 + fileNameLength));
                var blob = new Blob([message]);
                saveData(blob.slice(2 + fileNameLength), fileName);
            }
        }
    }
});
