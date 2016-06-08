define(function(require) {

	var React = require('react'),
		ReactDOM = require('react-dom'),
		GEPPETTO = require('geppetto');
	
	return React.createClass({		
		mixins: [require('jsx!mixins/bootstrap/modal')],

		getDefaultProps: function() {
			return {
				text :'Loading Experiment'
			};
		},
		
		componentDidMount: function(){
			GEPPETTO.once('hide:spinner', this.hide);
			setTimeout((function(){
				if(this.isMounted()){
					this.props.text = 'Loading is taking longer than usual, either a big project is being loaded or bandwidth is limited';
					this.forceUpdate();

					// this.setProps({text: 'Loading is taking longer than usual, either a big project is being loaded or bandwidth is limited'});
				}
			}).bind(this), 20000);
			
			setTimeout((function(){
				if(this.isMounted()){
					this.props.text = GEPPETTO.Resources.SPOTLIGHT_HINT;
					this.forceUpdate();

					// this.setProps({text: GEPPETTO.Resources.SPOTLIGHT_HINT});
				}
			}).bind(this), 3000);
		},
				
		render: function () {
            return (
            	<div className="modal fade" id="loading-spinner">
            		<div className="spinner-backdrop">
	            		<div className="spinner-container">
	            			<div className="gpt-gpt_logo fa-spin"></div>
	            			<p id="loadingmodaltext" className="orange">{this.props.text}</p>
	            		</div>
            		</div>
            	</div>
            	);
        }		
	});
});
