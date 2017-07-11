define(function(require) {

    var React = require('react');
    var HomeButton = require('./HomeButton');

    var HomeControls = React.createClass({

        render: function () {
            return React.DOM.div({className:'homeButton'},
                React.createFactory(HomeButton)({disabled:false})
            );
        }

    });

    return HomeControls;
});
