
/**
 * Front end, user interface, methods for handling updates to the UI
 *
 */
define(function(require)
{

    return function(GEPPETTO)
    {

        var React = require('react'), $ = require('jquery'), InfoModal = require('./components/modals/InfoModal'), ErrorModal = require('./components/modals/ErrorModal');
        var InputModal = require('./components/modals/InputModal');
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
             * Basic Dialog box with message to display.
             *
             * @method
             *
             * @param title -
             *            Title of message
             * @param msg -
             *            Message to display
             */
            inputDialog : function(title, msg, aLabel, aClick, bLabel, bClick)
            {
                var infoFactory = React.createFactory(InputModal);

                ReactDOM.render(
                    infoFactory(
                        {
                            show : true,
                            keyboard : false,
                            title : title,
                            text : msg,
                            aLabel:aLabel,
                            aClick:aClick,
                            bLabel:bLabel,
                            bClick:bClick
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
