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
 * UI flows controller
 *
 *  @author Giovanni Idili
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
                    GEPPETTO.Console.executeImplicitCommand(callbackCommand);
                }
            },

            showSpotlightForPlay: function(callbackCommand){
            	// nothing to do - run callbackCommand directly
                GEPPETTO.Console.executeImplicitCommand(callbackCommand);
                var anyPlotUp = false;

                // check if any plots are up
                if(GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT) != null && GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT) != undefined &&
                    GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets() != null && GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets() != undefined &&
                    GEPPETTO.WidgetFactory.getController(GEPPETTO.Widgets.PLOT).getWidgets().length > 0){
                    anyPlotUp = true;
                }

                if(!anyPlotUp){
                    // if not, bring up spotlight configured for the PLAY flow
                    GEPPETTO.Spotlight.open(GEPPETTO.Resources.PLAY_FLOW);

                }
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
            			GEPPETTO.Console.executeImplicitCommand(value + "('" + callbackCommand + "')");
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
            			GEPPETTO.Console.executeImplicitCommand(value + "('" + callbackCommand + "')");
                    });	
            	}
            },

            onSpotlightExitFlowCallback : function(){
                GEPPETTO.Console.executeImplicitCommand(this.callbackCommand);
                GEPPETTO.off(GEPPETTO.Events.Spotlight_closed, this.onSpotlightExitFlowCallback, this);
            }
        };

    };
});
