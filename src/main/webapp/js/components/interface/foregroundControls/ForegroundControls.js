define(function (require) {

    require("./ForegroundControls.less");

    var React = require('react');

    var SpotlightButton = require('./buttons/SpotlightButton');
    var ControlPanelButton = require('./buttons/ControlPanelButton');
    var QueryBuilderButton = require('./buttons/QueryBuilderButton');
    var TutorialButton = require('./buttons/TutorialButton');

    var GEPPETTO = require('geppetto');

    var ForegroundControls = React.createClass({

    	getInitialState: function () {
            return {
                disableSpotlight: false,
                showDropDown : false
            }
        },

        componentDidMount: function () {


        },

        componentWillMount: function () {
            GEPPETTO.ForegroundControls = this;
        },

        refresh: function(){
            this.forceUpdate();
        },

        render: function () {
            var spotlightBtn = GEPPETTO.Spotlight != undefined ? React.createFactory(SpotlightButton)({disabled: this.state.disableSpotlight}) : '';
            var controlPanelBtn = GEPPETTO.ControlPanel != undefined ? React.createFactory(ControlPanelButton)({}) : '';

            var queryBuilderBtn = GEPPETTO.QueryBuilder != undefined ? React.createFactory(QueryBuilderButton)({}) : '';

            var tutorialBtn = GEPPETTO.Tutorial != undefined ? React.createFactory(TutorialButton)({}) : '';


            return <div className={'foreground-controls'}>
                {controlPanelBtn}
                <br/>
                {spotlightBtn}

                {queryBuilderBtn==""? '': <br />}
                {queryBuilderBtn}

                <br/>
                {tutorialBtn}

            </div>
        }
    });

    return ForegroundControls;
});
