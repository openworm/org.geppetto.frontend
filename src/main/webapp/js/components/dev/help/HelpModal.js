define(function (require) {

    var React = require('react'),
        Button = require('mixins/bootstrap/button'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        startTutorial: function() {
            GEPPETTO.trigger('start:tutorial');
            GEPPETTO.tutorialEnabled = true;
            this.hide();
        },

        render: function () {
            return <div className="modal fade" id="help-modal">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <a className="btn pull-right" icon="fa-file-text" href="http://docs.geppetto.org" target="_blank">Docs </a>
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
                            <h4>Geppetto Console</h4>
                            <p>The console provides a way to interact with Geppetto without having to use the UI controls.
                            Through the console, the user can control the Geppetto project and experiments and use the other features available.
                            </p>
                            <h5>Commands</h5>
                            <p>Open the console and type help() in it to view list of available commands, a description on
                            how to use each one of them is also provided.
                            </p>
                            <h5>Autocompletion</h5>
                            <p>Console autcompletes a command once you start typing. Pressing double
                                <a className="btn btn-default">Tab</a>
                            provides list of available commands that match the entered input.</p>
                            <h4>Loading a Project</h4>
                            <h5>Using Controls</h5>
                            <p>Use the home button button in the top right corner to go back to the dashboard
                            load a Geppetto project by double-clicking on it.
                            </p>
                            <h5>Using console</h5>
                            <p>Projects can be loaded via console using commands
                                <a className="label label-default">Project.loadFromURL(projectURL)</a>
                            </p>
                            <h5>Passing a parameter via URL</h5>
                            <p>A project can be loaded by specifying its ID as a paramater in the Geppetto URL, for easy bookmarking. 
                            This will automatically load the project when the Geppetto simulation environment is opened. 
                            To use this feature add the query string paramater <a className="label label-default">load_project_from_id=PROJECT_ID</a>, where
                            <a className="label label-default">PROJECT_ID</a> corresponds to the ID of the project you want to load.
                            </p>
			    <h4>Colours Coding and Connected Elements</h4>
                            <p>The following colour chart demonstrates the colour coding of
                            each of the connected elements.</p>
                            <h5 style="color:#002266">Something Else Selected</h5>
                            <p></p>
                            <h5 style="color:#00ffff">Default Unselected</h5>
                            <p></p>
                            <h5 style="color:#ffd700">Selected</h5>
                            <p></p>
                            <h5 style="color:#ffffff">Input to Selected</h5>
                            <p></p>
                            <h5 style="color:#ff8c00">Output to Selected</h5>
                            <p></p>
                            <h5 style="color:#ff0000">Default Highlighted</h5>
                            <p></p>
                            <h5 style="color:#00ff00">Input and Output to Selected</h5>
                            <p></p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn" data-dismiss="modal" >Close</button>
                        </div>
                    </div>
                </div>
            </div>
        }
    });

});
