define(function (require) {

    var React = require('react'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        TutorialModal = require('../../tutorial/TutorialModule');

    return React.createClass({
        mixins: [require('mixins/Button')],
        
        componentDidMount: function() {

        },

        getDefaultProps: function() {
            return {
                label: '',
                id: 'tutorialBtn',
                className: 'squareB',
                icon:'fa fa-leanpub',
                onClick: function(){ GEPPETTO.Console.executeCommand("G.toggleTutorial()"); }
            }
        }
    });
});