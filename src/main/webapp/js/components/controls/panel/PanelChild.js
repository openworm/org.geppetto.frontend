define(function (require) {

	
	var createClass = require('create-react-class');
	
	var panelChild = createClass({
		
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