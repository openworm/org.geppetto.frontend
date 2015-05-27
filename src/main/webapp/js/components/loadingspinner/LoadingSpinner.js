define(function(require) {

	var React = require('react'),
		GEPPETTO = require('geppetto');
	
	return React.createClass({		
		mixins: [require('jsx!mixins/bootstrap/modal')],

		getDefaultProps: function() {
			return {
				text :'Loading Simulation'
			};
		},
		
		componentDidMount: function(){
			GEPPETTO.once('hide:spinner', this.hide);
			setTimeout((function(){
				if(this.isMounted()){
					this.setProps({text: 'Loading is taking longer than usual, either a big project is being loaded or bandwidth is limited'});
				}
			}).bind(this), 20000);
		},
				
		render: function () {
            return (
            	<div className="modal fade" id="loading-spinner">
            		<div className="spinner-backdrop">
	            		<div className="spinner-container">
	            			<div className="asterisk icon-spin"></div>
	            			<p id="loadingmodaltext" className="orange">{this.props.text}</p>
	            		</div>
            		</div>
            	</div>
            	);
        }		
	});
});
