define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
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