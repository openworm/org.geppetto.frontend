define(function (require) {
    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }

    loadCss("geppetto/js/components/dev/foregroundcontrols/foregroundcontrols.css");

    var React = require('react');
    var ReactDOM = require('react-dom');

    var SpotlightButton = require('./buttons/SpotlightButton');
    var ControlPanelButton = require('./buttons/ControlPanelButton');

    var GEPPETTO = require('geppetto');

    var ForegroundControls = React.createClass({

        componentDidMount: function () {

        },

        componentWillMount: function () {
            GEPPETTO.ForegroundControls = this;
        },

        refresh: function(){
            this.forceUpdate();
        },

        render: function () {
            var spotlightBtn = GEPPETTO.Spotlight != undefined ? React.createFactory(SpotlightButton)({}) : '';
            var controlPanelBtn = GEPPETTO.ControlPanel != undefined ? React.createFactory(ControlPanelButton)({}) : '';

            return <div className={'foreground-controls'}>
                {controlPanelBtn}
                <br/>
                {spotlightBtn}
            </div>
        }
    });

    ReactDOM.render(
        React.createFactory(ForegroundControls)({}, ''),
        document.getElementById('foreground-toolbar')
    );

});