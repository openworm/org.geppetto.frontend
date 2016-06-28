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
                            <h4>Colour code for connections and connected elements</h4>

                            <div className="circle default" ></div><div className="circle-description">The element is Unselected.</div>
                            <div className="circle selected" ></div><div className="circle-description">The element is Selected.</div>
                            <div className="circle input" ></div><div className="circle-description">The element is an input to the Selected one.</div>
                            <div className="circle output" ></div><div className="circle-description">The element is an output to the Selected one.</div>
                            <div className="circle inputoutput" ></div><div className="circle-description">The element is both an input and an output to the Selected one.</div>

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
