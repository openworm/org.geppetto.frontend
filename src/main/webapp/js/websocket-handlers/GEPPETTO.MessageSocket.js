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


define(function(require) {
	return function(GEPPETTO) {

		var messageHandlers = [];
		var clientID = null;
		var nextID = 0;

		/**
		 * Web socket creation and communication
		 */
		GEPPETTO.MessageSocket = {
			socket:null,
			connect: function(host) {
				if('WebSocket' in window) {
					this.socket = new WebSocket(host);
				}
				else if('MozWebSocket' in window) {
					this.socket = new MozWebSocket(host);
				}
				else {
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBSOCKET_NOT_SUPPORTED);
					return;
				}

				this.socket.onopen = function() {
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBSOCKET_OPENED);

					//attach the handlers once socket is opened
					messageHandlers.push(GEPPETTO.SimulationHandler);
					messageHandlers.push(GEPPETTO.GlobalHandler);

				};

				this.socket.onclose = function() {
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBSOCKET_CLOSED);
				};

				this.socket.onmessage = function(msg) {
					var parsedServerMessage = JSON.parse(msg.data);

					//notify all handlers
					for(var i = 0, len = messageHandlers.length; i < len; i++) {
						messageHandlers[ i ].onMessage(parsedServerMessage);
					}
				};

				//Detects problems when connecting to Geppetto server
				this.socket.onerror = function(evt) {
					var message = GEPPETTO.Resources.SERVER_CONNECTION_ERROR;

					GEPPETTO.FE.infoDialog(GEPPETTO.Resources.WEBSOCKET_CONNECTION_ERROR, message);
				};
			},

			/**
			 * Sends messages to the server
			 */
			send: function(command, parameter) {

				var requestID = this.createRequestID();

				//if there's a script running let it know the requestID it's using to send one of it's commands
				if(GEPPETTO.ScriptRunner.isScriptRunning()) {
					GEPPETTO.ScriptRunner.waitingForServerResponse(requestID);
				}

				this.socket.send(messageTemplate(requestID, command, parameter));
			},

			isReady: function() {
				return this.socket.readyState;
			},

			close: function() {
				this.socket.close();
				//dispose of handlers upon closing connection
				messageHandlers = [];
			},

			/**
			 * Add handler to receive updates from server
			 */
			addHandler: function(handler) {
				messageHandlers.push(handler);
			},

			/**
			 * Removes a handler from the socket
			 */
			removeHandler: function(handler) {
				var index = messageHandlers.indexOf(handler);

				if(index > -1) {
					messageHandlers.splice(index, 1);
				}
			},

			/**
			 * Sets the id of the client
			 */
			setClientID: function(id) {
				clientID = id;
			},

			/**
			 * Creates a request id to send with the message to the server
			 */
			createRequestID: function() {
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

			if(!(typeof payload == 'string' || payload instanceof String)) {
				payload = JSON.stringify(payload);
			}

			var object = {
				requestID: id,
				type: msgtype,
				data: payload
			};
			return  JSON.stringify(object);
		};

	}
});
