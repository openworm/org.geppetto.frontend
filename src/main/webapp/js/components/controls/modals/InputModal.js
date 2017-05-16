 /**
 * Modal used to display info messages received from server
 *
 */
define(function (require) {

    var React = require('react');

    return React.createClass({
        mixins: [
            require('../mixins/bootstrap/modal.js')
        ],
        
        getDefaultProps: function() {
            return {
                title: 'Message',
                text: '',
                aLabel: 'Yes', 
                aClick: function(){},
                bLabel: 'No', 
                bClick: function(){},
            }
        },
        
        render: function (){
        	return <div className="modal fade" id="infomodal">
        			<div className="modal-dialog">
        			<div className="modal-content">
        				<div className="modal-header" id="infomodal-header">
        					<h3 id="infomodal-title" className="text-center">{this.props.title}</h3>
        				</div>
        				<div className="modal-body">
        			 		<p id="infomodal-text">{this.props.text}</p>
        			 	</div>
        			 	<div className="modal-footer" id="infomodal-footer">
        			 		<button  className="btn" data-dismiss="modal" aria-hidden="true" onClick={this.props.aClick} dangerouslySetInnerHTML={{__html: this.props.aLabel}}></button>
        			 		<button  className="btn" data-dismiss="modal" aria-hidden="true" onClick={this.props.bClick} dangerouslySetInnerHTML={{__html: this.props.bLabel}}></button>
        			 	</div>
        			 </div>
              		 </div>
        		  </div>
        }
    });

});