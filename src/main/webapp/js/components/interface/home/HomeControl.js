define(function(require) {

    var CreateClass = require('create-react-class');
    var HomeButton = require('./HomeButton');

    var HomeControls = CreateClass({

        render: function () {
            return React.DOM.div({className:'homeButton'},
                React.createFactory(HomeButton)({disabled:false})
            );
        }

    });

    return HomeControls;
});
