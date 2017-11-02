define(function(require) {

    var React = require('react');
    var GEPPETTO = require('geppetto');

    require('./CameraControls.less')

    var CameraControls = React.createClass({

        panLeft: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraPan(-0.01, 0)', true);
        },

        panRight: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraPan(0.01, 0)', true);
        },

        panUp: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraPan(0, -0.01)', true);
        },

        panDown: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraPan(0, 0.01)', true);
        },

        rotateUp: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraRotate(0, 0.01)', true);
        },

        rotateDown: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraRotate(0, -0.01)', true);
        },

        rotateLeft: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraRotate(-0.01, 0)', true);
        },

        rotateRight: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraRotate(0.01, 0)', true);
        },
        
        rotateZ: function() {
        	GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraRotate(0, 0, 0.01)',true);
        },

        rotateMZ: function(increment) {
        	GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraRotate(0, 0, -0.01)',true);
        },

        rotate: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.autoRotate()', true);
        },
        
        cameraHome: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.resetCamera()', true);
        },

        zoomIn: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraZoom(-0.1)',true);
        },

        zoomOut: function() {
            GEPPETTO.CommandController.execute(this.props.viewer+'.incrementCameraZoom(+0.1)',true);
        },

        componentDidMount: function() {

        },

        render: function () {
            return (
            	<div className="position-toolbar">
                    <button id="panLeftBtn" className="btn squareB fa fa-chevron-left pan-left" onClick={this.panLeft}></button>
                    <button id="panUpBtn" className="btn squareB fa fa-chevron-up pan-top" onClick={this.panUp}></button>
                    <button id="panRightBtn" className="btn squareB fa fa-chevron-right pan-right" onClick={this.panRight}></button>
                    <button id="panDownBtn" className="btn squareB fa fa-chevron-down pan-bottom" onClick={this.panDown}></button>
                    <button id="panHomeBtn" className="btn squareB fa fa-home pan-home" onClick={this.cameraHome}></button>

                    <button id="rotateLeftBtn" className="btn squareB fa fa-undo rotate-left" onClick={this.rotateLeft}></button>
                    <button id="rotateUpBtn" className="btn squareB fa fa-repeat rotate90 rotate-top" onClick={this.rotateUp}></button>
                    <button id="rotateRightBtn" className="btn squareB fa fa-repeat rotate-right" onClick={this.rotateRight}></button>
                    <button id="rotateDownBtn" className="btn squareB fa fa-undo rotate90 rotate-bottom" onClick={this.rotateDown}></button>
                    <button id="rotateZBtn" className="btn squareB fa fa-undo rotate-z" onClick={this.rotateZ}></button>
                    <button id="rotateMZBtn" className="btn squareB fa fa-repeat rotate-mz" onClick={this.rotateMZ}></button>
                    <button id="rotateBtn" className="btn squareB fa fa-video-camera rotate-home" onClick={this.rotate}></button>

                    <button id="zoomInBtn" className="btn squareB fa fa-search-plus zoom-in" onClick={this.zoomIn}></button>
                    <button id="zoomOutBtn" className="btn squareB fa fa-search-minus zoom-out" onClick={this.zoomOut}></button>
                </div>

            );
        }

    });

    return CameraControls;
});
