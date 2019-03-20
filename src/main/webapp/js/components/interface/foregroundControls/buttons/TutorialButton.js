define(function (require) {

    var CreateClass = require('create-react-class'), 
    	GEPPETTO = require('geppetto');

    return CreateClass({
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
