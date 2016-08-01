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
 * Front end, user interface, methods for handling updates to the UI
 *
 */
define(function(require)
{

    return function(GEPPETTO)
    {

        var React = require('react'), $ = require('jquery'), InfoModal = require('jsx!components/popups/InfoModal'), ErrorModal = require('jsx!components/popups/ErrorModal');
        var ReactDOM = require('react-dom');

        /**
         * Create the container for holding the canvas
         *
         * @class GEPPETTO.FE
         */
        GEPPETTO.FE =
        {

            // variable to keep track of experiments rendered, used for giving
            // alternate routes
            // different css backgrounds
            nth : 1,

            /*
             * Handles events that are executed as soon as page is finished
             * loading
             */
            initialEvents : function()
            {

                GEPPETTO.Console.createConsole();

                GEPPETTO.Vanilla.enableKeyboard(false);

                /*
                 * Dude to bootstrap bug, multiple modals can't be open at same
                 * time. This line allows multiple modals to be open
                 * simultaneously without going in an infinite loop.
                 */
                $.fn.modal.Constructor.prototype.enforceFocus = function()
                {
                };
            },
            /**
             * Enables controls after connection is established
             */
            postSocketConnection : function()
            {
                GEPPETTO.Vanilla.enableKeyboard(true);
            },
            createContainer : function()
            {
                $("#sim canvas").remove();
                return $("#sim").get(0);
            },
       
            /**
             * Show error message if webgl failed to start
             */
            update : function(webGLStarted)
            {
                if (!webGLStarted)
                {
                    GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBGL_FAILED);
                    GEPPETTO.FE.disableSimulationControls();
                    GEPPETTO.FE.infoDialog(GEPPETTO.Resources.WEBGL_FAILED, GEPPETTO.Resources.WEBGL_MESSAGE);
                }
            },
            /**
             * Basic Dialog box with message to display.
             *
             * @method
             *
             * @param title -
             *            Title of message
             * @param msg -
             *            Message to display
             */
            infoDialog : function(title, msg)
            {
                var infoFactory = React.createFactory(InfoModal);

                ReactDOM.render(
                    infoFactory(
                        {
                            show : true,
                            keyboard : false,
                            title : title,
                            text : msg,
                        }),

                    document.getElementById('modal-region')
                );
            },
            /**
             * Dialog box to display error messages.
             *
             * @method
             *
             * @param title -
             *            Notifying error
             * @param msg -
             *            Message to display for error
             * @param code -
             *            Error code of message
             * @param source -
             *            Source error to display
             * @param exception -
             *            Exception to display
             */
            errorDialog : function(title, message, code, exception)
            {
                var errorModalFactory = React.createFactory(ErrorModal);

                ReactDOM.render(
                    errorModalFactory(
                        {
                            show : true,
                            keyboard : false,
                            title : title,
                            message : message,
                            code : code,
                            exception : exception
                        }),
                    document.getElementById('modal-region')
                );
            },
            /**
             * If simulation is being controlled by another user, hide the
             * control and load buttons. Show "Observe" button only.
             */
            disableSimulationControls : function()
            {
                GEPPETTO.trigger('simulation:disable_all');

                // disable console buttons
                $('#consoleButton').attr('disabled', 'disabled');
                $('#commandInputArea').attr('disabled', 'disabled');

                // disable keyboard
                document.removeEventListener("keydown", GEPPETTO.Vanilla.checkKeyboard);
            },

            /**
             * Refreshes UI components base on current model / instances
             */
            refresh: function(newInstances){
                // populate control panel with exploded instances
                if (GEPPETTO.ControlPanel != undefined) {
                    GEPPETTO.ControlPanel.addData(newInstances);
                }
                // populate spotligh with exploded instances
                if (GEPPETTO.Spotlight != undefined) {
                    GEPPETTO.Spotlight.addData(GEPPETTO.ModelFactory.newPathsIndexing);
                }
            },
            
            /**
			 * Show error message if webgl failed to start
			 */
			notifyInitErrors : function(webGLStarted, workersSupported)
			{
				if (!webGLStarted)
				{
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.WEBGL_FAILED)
					GEPPETTO.Main.disconnected = true;;
					GEPPETTO.FE.disableSimulationControls();
					GEPPETTO.FE.infoDialog(GEPPETTO.Resources.WEBGL_FAILED, GEPPETTO.Resources.WEBGL_MESSAGE);
				}
				
				if (!workersSupported)
				{
					GEPPETTO.Console.debugLog(GEPPETTO.Resources.WORKERS_NOT_SUPPORTED);
					GEPPETTO.FE.infoDialog(GEPPETTO.Resources.WORKERS_NOT_SUPPORTED, GEPPETTO.Resources.WORKERS_NOT_SUPPORTED_MESSAGE);
				}
				
				if(!webGLStarted || !workersSupported){
					GEPPETTO.FE.disableSimulationControls();
				}
			}
        };

    };
});
