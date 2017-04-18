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
                id: 'queryBuilderBtn',
                className: 'squareB',
                icon: 'fa fa-cogs',
                tooltip: 'Build Query',
                onClick: function () {
                    GEPPETTO.QueryBuilder.open();
                }
            };
        }

    });
});
