define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],
        
        popoverTitle: 'Persist project',

        componentDidMount: function() {

        },

        getDefaultProps: function() {
            return {
            	label : '',
                className: 'SaveButton pull-right',
                icon: 'fa fa-star',
                onClick: function() {
                    GEPPETTO.Console.executeCommand("Project.persist();");
                }
            };
        }

    });
});