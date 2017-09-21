define(function (require) {

    var React = require('react'),
        Button = require('../../controls/mixins/bootstrap/button'),
        GEPPETTO = require('geppetto');

    require("./HelpModal.less");

    return React.createClass({
        mixins: [
            require('../../controls/mixins/bootstrap/modal.js')
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
                            <h4>Selection Controls</h4>
                            <p>Left click will select the closest object under the pointer. Holding <kbd>Shift</kbd> enables multiple objects to be selected at once.</p>
                            <h5>Selection Order</h5>
                            <p>Solid objects are selected over closer transparent objects. Holding <kbd>Ctrl</kbd> enables selection of the closest object regardless.</p>
                            <p>To toggle through multiple stacked transparent objects, just keep clicking.</p>
                            <h5>Clear Selection</h5>
                            <p>To unselect all objects simply click on empty space with <kbd>Ctrl</kbd> pressed.</p>
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
                                <kbd>Tab</kbd>
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
                            <div className="help-small-spacer help-clearer"></div>
                            <h4>Colour coding for connections and connected elements</h4>
                            <div className="circle default help-clearer left-floater" ></div><div className="circle-description left-floater">The element is <b>unselected</b>.</div>
                            <div className="circle selected help-clearer left-floater" ></div><div className="circle-description left-floater">The element is <b>selected.</b></div>
                            <div className="circle input help-clearer left-floater" ></div><div className="circle-description left-floater">The element is an <b>input</b> to the selected one.</div>
                            <div className="circle output help-clearer left-floater" ></div><div className="circle-description left-floater">The element is an <b>output</b> from the selected one.</div>
                            <div className="circle inputoutput help-clearer left-floater" ></div><div className="circle-description left-floater">The element is both an <b>input and an output</b> to/from the selected one.</div>
                            <div className="help-spacer help-clearer"></div>
                            <h4>Colour coding for experiment status lifecycle</h4>
                            <div className="circle design-status help-clearer left-floater"></div><div className="circle-description left-floater">The experiment is in <b>design</b> phase. If available in the model, parameters can be set and state variables can be set to be recorded before running the experiment.</div>
                            <div className="circle queued-status help-clearer left-floater"></div><div className="circle-description left-floater">The experiment is <b>queued</b> for running on the configured server.</div>
                            <div className="circle running-status help-clearer left-floater"></div><div className="circle-description left-floater">The experiment is currently <b>running</b> on the designated server.</div>
                            <div className="circle completed-status help-clearer left-floater"></div><div className="circle-description left-floater">The experiment has successfully <b>completed</b> running. Simulation results (state variables that were recorded, if any) can now be visualized/plotted.</div>
                            <div className="circle error-status help-clearer left-floater"></div><div className="circle-description left-floater">Bad news! The experiment caused an <b>error</b> while running on the server.</div>

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
