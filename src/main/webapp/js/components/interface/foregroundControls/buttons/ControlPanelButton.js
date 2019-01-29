define(function (require) {

    var CreateClass = require('create-react-class'),
        GEPPETTO = require('geppetto');

    return CreateClass({
        mixins: [require('../../../controls/mixins/Button')],

        componentDidMount: function () {

        },

        getDefaultProps: function () {
            return {
                label: '',
                id: 'controlPanelBtn',
                className: 'squareB',
                icon: 'fa fa-list',
                onClick: function () {
                    GEPPETTO.ControlPanel.open();
                }
            };
        }

    });
});