define(function (require) {

    var React = require('react'),
        Button = require('../bootstrap/button'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [
            require('jsx!components/bootstrap/modal')
        ],

        startTutorial: function() {
            GEPPETTO.trigger('start:tutorial');
            GEPPETTO.tutorialEnabled = true;
            this.hide();
        },

        render: function () {
        	$('.help-modal').on('shown', function () {
        		alert("new height");
        	    $('.help-modal .modal-body').css('max-height', $(window).height() * 0.7);
        	});
            return <div className="modal fade" id="help-modal">
                <div className="modal-dialog">
                    <div className="modal-content help-modal">
                        <div className="modal-header">
                            <Button type="button" className="btn btn-info pull-left" icon="icon-play" onClick={this.startTutorial}>Start Tutorial </Button>
                            <a className="btn btn-info pull-right" icon="icon-file-text" href="http://docs.geppetto.org" target="_blank">Docs </a>
                            <h4 className="modal-title pagination-centered">Quick Help</h4>
                        </div>
                        <div className="modal-body">
                            <h4>Navigation Controls</h4>
                            <h5>Rotation</h5>
                            <p>Left click and drag with the mouse to rotate.</p>
                            <h5>Pan</h5>
                            <p>Right click and drag with the mouse to pan.</p>
                            <h5>Zoom</h5>
                            <p>Wheel click and move your mouse up and down to zoom in and out. In addition, you can use the buttons in the upper
                            left corner. The Home button resets the view.</p>
                            <h4>Shortcuts List</h4>
                            <p>Press
                                <a className="btn btn-default">Ctrl</a>
                                <a className="btn btn-default">Alt</a>
                                <a className="btn btn-default">J</a>
                            to toggle the Javascript Console</p>
                            <p>Press
                                <a className="btn btn-default">Ctrl</a>
                                <a className="btn btn-default">Alt</a>
                                <a className="btn btn-default">P</a>
                            to bring up a plotting widget</p>
                            <h4>Geppetto Console</h4>
                            <p>The console provides a way to interact with Geppetto without having to use the UI controls.
                            Through the console, the user can control the org.geppetto.simulation and use the other features available.
                            </p>
                            <h5>Commands</h5>
                            <p>Open the console and type help() in it to view list of available commands, a description on
                            how to use each one of them is also provided.
                            </p>
                            <h5>Autocompletion</h5>
                            <p>Console autcompletes a command once you start typing. Pressing double
                                <a className="btn btn-default">Tab</a>
                            provides list of available commands that match the entered input.</p>
                            <h4>Loading a Simulation</h4>
                            <h5>Using Controls</h5>
                            <p>Use the
                                <a className="btn btn-default">Load Simulation</a>
                            button in the top right corner to
                            load a org.geppetto.simulation. A drop down menu with org.geppetto.simulation samples that are ready to load is
                            available.
                            The contents of the org.geppetto.simulation file can be seen by selecting the Custom option after selecting or
                            entering
                            a org.geppetto.simulation. Using this feature, the contents of the org.geppetto.simulation file can be modified
                            prior to loading.
                            </p>
                            <h5>Using console</h5>
                            <p>Simulations can be loaded via console using commands
                                <a className="label label-default">Simulation.load(simulationURL)</a>
                            and
                                <a className="label label-default">Simulation.loadFromContent(simulationContent)</a>
                            </p>
                            <h5>Passing a parameter via URL</h5>
                            <p>A org.geppetto.simulation can be specified as a paramater in the Geppetto URL. This will automatically load the
                            org.geppetto.simulation when Geppetto is launched. To use this feature add the query string paramater "sim=simulationURL", where
                            simulationURL corresponds to the location of the org.geppetto.simulation you want to load.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-warning" data-dismiss="modal" >Close</button>
                        </div>
                    </div>
                </div>
            </div>
        }
    });

});