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

define(function(require) {

    var React = require('react');
    var GEPPETTO = require('geppetto');

    var CameraControls = React.createClass({

        mixins:[require('mixins/TutorialMixin')],

        popoverTitle: 'Camera Controls',

        popoverText: 'Use these controls to pan, rotate, and zoom the camera.',

        popoverTemplate: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div><button class="btn btn-info tutorial-next"><i class="icon-check"></i></button></div>',

        panLeft: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraPan(-0.01, 0)');
        },

        panRight: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraPan(0.01, 0)');
        },

        panUp: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraPan(0, -0.01)');
        },

        panDown: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraPan(0, 0.01)');
        },

        rotateUp: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraRotate(-0.01, 0, 0)');
        },

        rotateDown: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraRotate(0, 0, 0.01)');
        },

        rotateLeft: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraRotate(0.01, 0, 0)');
        },

        rotateRight: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraRotate(0, 0, -0.01)');
        },

        cameraHome: function() {
            GEPPETTO.Console.executeCommand('G.resetCamera()');
        },

        zoomIn: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraZoom(-0.01)');
        },

        zoomOut: function() {
            GEPPETTO.Console.executeCommand('G.incrementCameraZoom(+0.01)');
        },

        componentDidMount: function() {
            GEPPETTO.on('start:tutorial', (function() {               
                GEPPETTO.once('tutorial:cameracontrols', (function(){
                    if(GEPPETTO.tutorialEnabled) {
                        this.showPopover;
                    }
                }).bind(this)); 

                $('.tutorial-next').click(function(){
                    this.destroyPopover;
                    GEPPETTO.trigger('tutorial:console');
                }.bind(this));
            }).bind(this));
        },

        render: function () {
            return (
            	<div className="position-toolbar">
                    <button className="btn squareB fa fa-chevron-left pan-left" onClick={this.panLeft}></button>
                    <button className="btn squareB fa fa-chevron-up pan-top" onClick={this.panUp}></button>
                    <button className="btn squareB fa fa-chevron-right pan-right" onClick={this.panRight}></button>
                    <button className="btn squareB fa fa-chevron-down pan-bottom" onClick={this.panDown}></button>
                    <button className="btn squareB fa fa-home pan-home" onClick={this.cameraHome}></button>

                    <button className="btn squareB fa fa-undo rotate-left" onClick={this.rotateLeft}></button>
                    <button className="btn squareB fa fa-repeat rotate90 rotate-top" onClick={this.rotateUp}></button>
                    <button className="btn squareB fa fa-repeat rotate-right" onClick={this.rotateRight}></button>
                    <button className="btn squareB fa fa-undo rotate90 rotate-bottom" onClick={this.rotateDown}></button>
                    <button className="btn squareB fa fa-home rotate-home" onClick={this.cameraHome}></button>

                    <button className="btn squareB fa fa-search-plus zoom-in" onClick={this.zoomIn}></button>
                    <button className="btn squareB fa fa-search-minus zoom-out" onClick={this.zoomOut}></button>
                </div>

            );
        }

    });

    return CameraControls;
});