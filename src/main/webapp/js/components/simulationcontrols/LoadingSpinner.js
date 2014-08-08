define(function(require) {

	var React = require('react'),
		GEPPETTO = require('geppetto');
	
	return React.createClass({		
		mixins: [require('jsx!components/bootstrap/modal')],

		getDefaultProps: function() {
			return {
				text :'Loading Simulation'
			};
		},
		
		componentDidMount: function(){
			GEPPETTO.once('simulation:loaded', this.hide);
			setTimeout((function(){
				if(GEPPETTO.Simulation.loading){
					this.setProps({text: 'Loading is taking longer than usual...'});
				}
			}).bind(this), 15000);
		},
		
		render: function () {
            return (
            	<div className="modal fade">
            		<div className="spinner-container">
            			<div className="asterisk icon-spin"></div>
            			<p id="loadingmodaltext" className="orange">{this.props.text}</p>
            		</div>
            	</div>
            	);
        }		
	});
});
