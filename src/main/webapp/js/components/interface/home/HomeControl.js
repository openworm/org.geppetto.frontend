define(function(require) {

    var React = require('react');
    var DOM = require('react-dom-factories');
    var CreateClass = require('create-react-class');
    var HomeButton = require('./HomeButton');

    var HomeControls = CreateClass({

        render: function () {
            return DOM.div({className:'homeButton'},
                React.createFactory(HomeButton)({disabled:false})
            );
        }

    });

    return HomeControls;
});
