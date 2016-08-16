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
                icon: 'fa fa-search',
                onClick: function () {
                    if(GEPPETTO.Spotlight!=undefined){
                    	GEPPETTO.trigger('spin_logo');
                		GEPPETTO.Spotlight.open();
                        GEPPETTO.trigger('stop_spin_logo');
                	}
                }
            };
        }

    });
});