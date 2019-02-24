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
                id: 'queryBuilderBtn',
                className: 'squareB',
                icon: 'fa fa-cogs',
                onClick: function () {
                    GEPPETTO.QueryBuilder.open();
                }
            };
        }

    });
});