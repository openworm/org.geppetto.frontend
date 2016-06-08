define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
        GEPPETTO = require('geppetto'),
        LoadSimModal = require('jsx!../LoadSimulationModal');


    return React.createClass({
        mixins: [require('mixins/TutorialMixin'), require('mixins/Button')],

        popoverTitle: 'Load a Simulation',

        popoverContent: 'Use this button to load an existing simulation or enter the URL to your own simulation. ' +
            'Click this button to continue with tutorial.',

        componentDidMount: function() {
            GEPPETTO.on('start:tutorial', this.showPopover);
        },

        getDefaultProps: function() {
            return {
                label: 'Load Simulation',
                className: 'pull-right',
                icon:'fa fa-folder-open',
                onClick: function(){ ReactDOM.render(React.createFactory(LoadSimModal)({show:true, keyboard:false}), document.getElementById('modal-region')); }
            }
        }

    });
});