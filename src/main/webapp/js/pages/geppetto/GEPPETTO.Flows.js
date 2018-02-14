

/**
 * UI flows controller
 *
 *  @author Giovanni Idili & Friends
 */
define(function (require) {

    return function (GEPPETTO) {

        $ = require('jquery');

        /**
         * Create the container for holding the canvas
         *
         * @class GEPPETTO.Flows
         */
        GEPPETTO.Flows =
        {
            callbackCommand: null,
            compulsoryActions: {},
            
            addCompulsoryAction: function (suggestion, flow) {
                
                if (!this.compulsoryActions[flow]) {
                    this.compulsoryActions[flow] = [];
                }
                this.compulsoryActions[flow].push(suggestion);
            },
            
            showSpotlightForRun: function(callbackCommand){
            	this.callbackCommand = callbackCommand;
                var anythingRecorded = false;

                // check if anything is being recorded
                // 1. get all existing instances of type StateVariable
                var instantiatedStateVariables = GEPPETTO.ModelFactory.getAllInstancesOf(GEPPETTO.Resources.STATE_VARIABLE_TYPE_PATH);
                for(var i=0; i<instantiatedStateVariables.length; i++){
                    // 2. check if any isWatched
                    if(instantiatedStateVariables[i].isWatched() && instantiatedStateVariables[i].getId()!="time"){
                        anythingRecorded = true;
                        break;
                    }
                }

                if(!anythingRecorded){

                    // if not, bring up spotlight configured for the RUN flow
                    GEPPETTO.Spotlight.open(GEPPETTO.Resources.RUN_FLOW);

                    // listen to spotlight exit event and handle it running the callbackCommand passed in
                    GEPPETTO.on(GEPPETTO.Events.Spotlight_closed, this.onSpotlightExitFlowCallback, this);
                } else {
                    // nothing to do - run callbackCommand directly
                    GEPPETTO.CommandController.execute(callbackCommand, true);
                }
            },

            showSpotlightForPlay: function(callbackCommand){
            	// nothing to do - run callbackCommand directly
                GEPPETTO.CommandController.execute(callbackCommand, true);
                var anyPlotUp = false;

                GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).then(c => {
                    // check if any plots are up
                    if(c != null && c != undefined && c.getWidgets() != null && c.getWidgets() != undefined && c.getWidgets().length > 0){
                        anyPlotUp = true;
                    }

                    if(!anyPlotUp){
                        // if not, bring up spotlight configured for the PLAY flow
                        GEPPETTO.Spotlight.open(GEPPETTO.Resources.PLAY_FLOW);
                    }
                });
            },
            
            /*
             * Handles flow on run experiment
             */
            onRun: function (callbackCommand) {
            	if (this.compulsoryActions[GEPPETTO.Resources.RUN_FLOW] == undefined){
            		this.showSpotlightForRun(callbackCommand);
            	}
            	else{
            		$.each(this.compulsoryActions[GEPPETTO.Resources.RUN_FLOW], function (index, value) {
                        GEPPETTO.CommandController.execute(value + "('" + callbackCommand + "')", true);
                    });	
            	}
            	
        			
            },

            /*
             * Handles flow on play recording
             */
            onPlay: function (callbackCommand) {
            	if (this.compulsoryActions[GEPPETTO.Resources.PLAY_FLOW] == undefined){
            		this.showSpotlightForPlay(callbackCommand);
            	}
            	else{
            		$.each(this.compulsoryActions[GEPPETTO.Resources.PLAY_FLOW], function (index, value) {
                        GEPPETTO.CommandController.execute(value + "('" + callbackCommand + "')", true);
                    });	
            	}
            },

            onSpotlightExitFlowCallback : function(){
                GEPPETTO.CommandController.execute(this.callbackCommand, true);
                GEPPETTO.off(GEPPETTO.Events.Spotlight_closed, this.onSpotlightExitFlowCallback, this);
            }
        };

    };
});
