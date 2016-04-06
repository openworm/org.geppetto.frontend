define(function(require) {

    var React = require('react');
    var ReactDOM = require('react-dom');
    var SaveButton = require('./HomeButton');

    var Controls = React.createClass({

        render: function () {
            return React.DOM.div({className:'homeButton'},
                React.createFactory(SaveButton)({disabled:false})
            );
        }

    });

    ReactDOM.render(React.createFactory(Controls)(), document.getElementById("HomeButton"));

});