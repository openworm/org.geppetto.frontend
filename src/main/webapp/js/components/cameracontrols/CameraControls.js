/**
 * Bootstrap button
 *
 * @module components/CameraControls
 */
define(function(require) {

	var React = require('react');
	var GEPPETTO = require('geppetto');

	var Controls = React.createClass({

		mixins:[require('mixins/TutorialMixin')],

		popoverTitle: 'Camera Controls',

		popoverText: 'Use these controls to pan, rotate, and zoom the camera.',

		popoverTemplate: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div><button class="btn btn-info tutorial-next"><i class="icon-check"></i></button></div>',

		/**
		 * Pan camera left event
		 */
		panLeft: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraPan(-0.01, 0)');
		},

		/**
		 * Pan camera right event, connect event to console
		 */
		panRight: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraPan(0.01, 0)');
		},

		/**
		 * Pan camera up event, connect event to console
		 */
		panUp: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraPan(0, -0.01)');
		},

		/**
		 * Pan camera down event, connect event to console
		 */
		panDown: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraPan(0, 0.01)');
		},

		/**
		 * Rotate camera up event, connect event to console
		 */
		rotateUp: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraRotate(-0.01, 0, 0)');
		},

		/**
		 * Rotate camera down event, connect event to console
		 */
		rotateDown: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraRotate(0, 0, 0.01)');
		},

		/**
		 * Rotate camera left event, connect event to console
		 */
		rotateLeft: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraRotate(0.01, 0, 0)');
		},

		/**
		 * Rotate camera right event, connect event to console
		 */
		rotateRight: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraRotate(0, 0, -0.01)');
		},

		/**
		 * Reset camera view event, connect event to console
		 */
		cameraHome: function() {
			GEPPETTO.Console.executeCommand('G.resetCamera()');
		},

		/**
		 * Zoom in camera control event, connect event to console
		 */
		zoomIn: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraZoom(-0.01)');
		},

		/**
		 * Zoom out camera control event, connect event to console
		 */
		zoomOut: function() {
			GEPPETTO.Console.executeCommand('G.incrementCameraZoom(+0.01)');
		},

        /**Modal mounted fine, handle event logic inside it*/
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

        /**
         * Render the Cameral Controls Components
         */
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