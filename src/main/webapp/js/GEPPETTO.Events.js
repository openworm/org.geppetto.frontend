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
 *
 * Events
 *
 * Different types of events that exist
 *
 * @enum
 */
var Events = {
    Select: "experiment:selection_changed",
    Focus_changed: "experiment:focus_changed",
    Experiment_over: "experiment:over",
    Project_loaded: "project:loaded",
    Model_loaded: "model:loaded",
    Experiment_loaded: "experiment:loaded",
    ModelTree_populated: "experiment:modeltreepopulated",
    SimulationTree_populated: "experiment:simulationtreepopulated",
    Experiment_play: "experiment:play",
    Experiment_status_check: "experiment:status_check",
    Experiment_pause: "experiment:pause",
    Experiment_resume: "experiment:resume",
    Experiment_running: "experiment:running",
    Experiment_stop: "experiment:stop",
    Experiment_completed: "experiment:completed",
    Experiment_update: "experiment:update",
    Experiment_deleted: "experiment_deleted",
    Experiment_active: "experiment_active",
    Experiment_created:"experiment:created",
    Volatile_project_loaded: "project:volatile",
    Project_persisted: "project:persisted",
    Spotlight_closed : "spotlight:closed"
};
define(function (require) {
    return function (GEPPETTO) {
        /**
         * @class GEPPETTO.Events
         */
        GEPPETTO.Events = {

            listening: false,

            listen: function () {
                GEPPETTO.on(Events.Select, function () {
                    //notify widgets that selection has changed in scene
                    GEPPETTO.WidgetsListener.update(Events.Select);

                    //trigger focus change event
                    GEPPETTO.trigger(Events.Focus_changed);
                });
                GEPPETTO.on(Events.Model_loaded, function () {
                    G.resetCamera();
                });
                GEPPETTO.on(Events.Experiment_active, function () {
                    GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.DELETE);
                });
                GEPPETTO.on(Events.Experiment_loaded, function () {
                    GEPPETTO.trigger("hide:spinner");
                });
                GEPPETTO.on(Events.Project_loaded, function () {
                	GEPPETTO.Main.startStatusWorker();
                });
                GEPPETTO.on(Events.Experiment_over, function (e) {
                    var name = e.name;
                    var id = e.id;

                    //notify listeners experiment has finished playing
                    GEPPETTO.WidgetsListener.update(Events.Experiment_over);

                    // check if we are in looping mode
                    if (GEPPETTO.getVARS().playLoop === true) {
                        Project.getActiveExperiment().play({step: 1});
                    }
                    else {
                        GEPPETTO.Console.log("Experiment " + name + " with " + id + " is over ");
                    }
                });
                GEPPETTO.on(Events.Experiment_play, function (parameters) {
                    GEPPETTO.WidgetsListener.update(Events.Experiment_play, parameters);
                });
                GEPPETTO.on(Events.Experiment_update, function (parameters) {
                    if (parameters.playAll != null || parameters.step != undefined) {
                        //update scene brightness
                        for (var key in GEPPETTO.G.listeners) {
                            for (var i = 0; i < GEPPETTO.G.listeners[key].length; i++) {
                                GEPPETTO.G.listeners[key][i](Instances.getInstance(key), parameters.step);
                            }
                        }
                    }
                    //notify widgets a restart of data is needed
                    GEPPETTO.WidgetsListener.update(Events.Experiment_update, parameters);
                });
                GEPPETTO.on(Events.Experiment_stop, function (parameters) {
                    //notify widgets a restart of data is needed
                    GEPPETTO.WidgetsListener.update(GEPPETTO.WidgetsListener.WIDGET_EVENT_TYPE.RESET_DATA);
                });
            },
        };
    }
});