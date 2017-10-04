define(function (require) {

    var React = require('react'),
    	GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('../../../controls/mixins/Button')],
        
        componentDidMount: function() {

        },

        getDefaultProps: function() {
            return {
                label: '',
                id: 'tutorialBtn',
                className: 'squareB',
                icon:'fa fa-leanpub',
                onClick: function(){ GEPPETTO.CommandController.execute("G.toggleTutorial()", true); }
            }
        }
    });
});
