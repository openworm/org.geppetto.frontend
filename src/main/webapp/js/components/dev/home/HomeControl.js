define(function(require) {

    var React = require('react');

    var SaveButton = require('./HomeButton');

    var GEPPETTO = require('geppetto');

    var Controls = React.createClass({

        render: function () {
            return React.DOM.div({className:'homeButton'},
                SaveButton({disabled:false})
            );
        }

    });

    React.renderComponent(Controls({},''), document.getElementById("HomeButton"));

});