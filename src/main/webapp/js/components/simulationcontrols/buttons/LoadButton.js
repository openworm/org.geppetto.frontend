define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto'),
        LoadSimModal = require('jsx!components/simulationcontrols/LoadSimulationModal');


    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        popoverTitle: 'Load a Simulation',

        popoverContent: 'Use this button to load an existing simulation or enter the URL to your own simulation. ' +
            'Click this button to continue with tutorial.',

        onClick: function () {
            React.renderComponent(LoadSimModal({show:true, keyboard:false}), document.getElementById('modal-region'));
        },

        componentDidMount: function() {
            GEPPETTO.on('start:tutorial', this.showPopover);
        },

        getDefaultProps: function() {
            return {
                label: 'Load Simulation',
                className: 'pull-right',
                icon:'icon-folder-open-alt',
                onClick: this.onClick
            }
        }

    });
});