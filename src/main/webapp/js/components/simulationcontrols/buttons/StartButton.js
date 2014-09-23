 /**
 * Start Button
 * @module components/StartButton
 */
define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        popoverTitle: 'Start Simulation',

        popoverContent: "Once you have loaded a simulation, it's time to see it in action by pressing Start. Click it now to see the simulation in action",

        onClick: function() {
            GEPPETTO.Console.executeCommand("Simulation.start()");
        },

        componentDidMount: function() {
            GEPPETTO.on('start:tutorial', (function() {               
                GEPPETTO.once('simulation:modelloaded', (function(){
                    if(GEPPETTO.tutorialEnabled) {
                        this.showPopover;
                    }
                }).bind(this)); 
            }).bind(this));
        },

        getDefaultProps: function() {
            return {
                label: 'Start',
                className: 'pull-right',
                icon: 'icon-play',
                onClick: this.onClick
            };
        }

    });
});