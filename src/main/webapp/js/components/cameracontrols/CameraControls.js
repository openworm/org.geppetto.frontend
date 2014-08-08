define(function(require) {

    var React = require('react');
    var GEPPETTO = require('geppetto');

    var Controls = React.createClass({

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
                    <button className="btn squareB icon-chevron-left pan-left" onClick={this.panLeft}></button>
                    <button className="btn squareB icon-chevron-up pan-top" onClick={this.panUp}></button>
                    <button className="btn squareB icon-chevron-right pan-right" onClick={this.panRight}></button>
                    <button className="btn squareB icon-chevron-down pan-bottom" onClick={this.panDown}></button>
                    <button className="btn squareB icon-home pan-home" onClick={this.cameraHome}></button>

                    <button className="btn squareB icon-undo rotate-left" onClick={this.rotateLeft}></button>
                    <button className="btn squareB icon-repeat rotate90 rotate-top" onClick={this.rotateUp}></button>
                    <button className="btn squareB icon-repeat rotate-right" onClick={this.rotateRight}></button>
                    <button className="btn squareB icon-undo rotate90 rotate-bottom" onClick={this.rotateDown}></button>
                    <button className="btn squareB icon-home rotate-home" onClick={this.cameraHome}></button>

                    <button className="btn squareB icon-zoom-in zoom-in" onClick={this.zoomIn}></button>
                    <button className="btn squareB icon-zoom-out zoom-out" onClick={this.zoomOut}></button>
                </div>

            );
        }

    });

    React.renderComponent(Controls({},''), document.getElementById('camera-controls'));

});