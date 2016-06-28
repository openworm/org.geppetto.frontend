/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
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

define(function (require) {

    var React = require('react');
    var ReactDOM = require('react-dom');

    var RunButton = require('./buttons/RunButton');
    var PlayButton = require('./buttons/PlayButton');
    var PauseButton = require('./buttons/PauseButton');
    var StopButton = require('./buttons/StopButton');
    var HelpButton = require('./buttons/HelpButton');

    var GEPPETTO = require('geppetto');

    var Controls = React.createClass({

        getInitialState: function () {
            return {
                disableRun: true,
                disablePlay: true,
                disablePause: true,
                disableStop: true
            }
        },

        componentDidMount: function () {

            var self = this;

            GEPPETTO.on(Events.Experiment_loaded, function () {
                var experiment = window.Project.getActiveExperiment();
                if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.COMPLETED) {
                    self.setState({disablePlay: false, disablePause: true, disableStop: true});
                }
                else if (experiment.getStatus() == GEPPETTO.Resources.ExperimentStatus.DESIGN) {
                    self.setState({disableRun: false, disablePlay: true, disablePause: true, disableStop: true});
                }
            });

            GEPPETTO.on(Events.Experiment_running, function () {
                self.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            });

            GEPPETTO.on(Events.Experiment_completed, function () {
                self.setState({disableRun: true, disablePlay: false, disablePause: true, disableStop: true});
            });

            GEPPETTO.on(Events.Experiment_play, function () {
                self.setState({disableRun: true, disablePlay: true, disablePause: false, disableStop: false});
            });

            GEPPETTO.on(Events.Experiment_resume, function () {
                self.setState({disableRun: true, disablePlay: true, disablePause: false, disableStop: false});
            });

            GEPPETTO.on(Events.Experiment_pause, function () {
                self.setState({disableRun: true, disablePlay: false, disablePause: true, disableStop: false});
            });

            GEPPETTO.on(Events.Experiment_stop, function () {
                self.setState({disableRun: true, disablePlay: false, disablePause: true, disableStop: true});
            });

            GEPPETTO.on('disable_all', function () {
                self.setState({disableRun: true, disablePlay: true, disablePause: true, disableStop: true});
            });

            GEPPETTO.on(Events.Experiment_over, function () {
                if (GEPPETTO.getVARS().playLoop === false) {
                    self.setState({disableRun: true, disablePlay: false, disablePause: true, disableStop: true});
                }
            });
        },

        render: function () {
            return React.DOM.div({className: 'simulation-controls'},
                React.createFactory(HelpButton)({disabled: false}),
                React.createFactory(StopButton)({disabled: this.state.disableStop}),
                React.createFactory(PauseButton)({disabled: this.state.disablePause}),
                React.createFactory(PlayButton)({disabled: this.state.disablePlay}),
                React.createFactory(RunButton)({disabled: this.state.disableRun})
            );
        }

    });

    ReactDOM.render(React.createFactory(Controls)({}, ''), document.getElementById('sim-toolbar'));

});