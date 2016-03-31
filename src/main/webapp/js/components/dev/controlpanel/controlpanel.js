define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/controlpanel/controlpanel.css";
    document.getElementsByTagName("head")[0].appendChild(link);

    var React = require('react'), $ = require('jquery');
    var GEPPETTO = require('geppetto');

    var ControlPanel = React.createClass({
        displayName: 'ControlPanel',

        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        componentDidMount: function () {

            var escape = 27;
            var pKey = 80;

            var that = this;

            $(document).keydown(function (e) {
                if (GEPPETTO.isKeyPressed("ctrl") && e.keyCode == pKey) {
                    $("#controlpanel").show();
                }
            });

            $(document).keydown(function (e) {
                if ($("#controlpanel").is(':visible') && e.keyCode == escape) {
                    $("#controlpanel").hide();
                }
            });

            GEPPETTO.ControlPanel = this;

            // TODO: load mock data
        },

        render: function () {
            return (<div id="control-panel-main-container" className="control-panel-main-container">Control panel test</div>);
        },
    });

    React.renderComponent(
        <ControlPanel />,
        document.getElementById("controlpanel")
    );
});