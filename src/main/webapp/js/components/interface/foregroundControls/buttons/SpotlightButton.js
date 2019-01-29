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
                id: 'spotlightBtn',
                className: 'squareB',
                icon: 'fa fa-search',
                onClick: function () {
                    if(GEPPETTO.Spotlight!=undefined){
                    	GEPPETTO.trigger('spin_logo');
                		GEPPETTO.Spotlight.open(GEPPETTO.Resources.SEARCH_FLOW);
                        GEPPETTO.trigger('stop_spin_logo');
                	}
                }
            };
        }

    });
});