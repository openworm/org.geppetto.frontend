define(function (require) {

	
	var React = require('react');
	
	var panelChild = React.createClass({
		
		         render: function(){
		             return (
		            		 <div>
		            		 {this.props.children}
		                   </div>
		             		);
		         }
		     });
	
	return panelComponent;
	
});