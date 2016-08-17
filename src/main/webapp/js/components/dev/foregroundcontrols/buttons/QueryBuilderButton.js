define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/Button')],

        componentDidMount: function () {

        },

        getDefaultProps: function () {
            return {
                label: '',
                className: 'squareB',
                icon: 'fa fa-cogs',
                onClick: function () {
                    GEPPETTO.QueryBuilder.open();
                }
            };
        }

    });
});