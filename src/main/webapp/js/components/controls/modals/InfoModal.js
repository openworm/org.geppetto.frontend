 /**
 * Modal used to display info messages received from server
 *
 */
define(function (require) {

    var React = require('react');

    require("./InfoModal.less");

    return React.createClass({
        mixins: [
            require('../mixins/bootstrap/modal.js')
        ],
        
        getDefaultProps: function() {
            return {
                title: 'Message',
                text: '',
                buttonLabel: 'Ok', 
                onClick: function(){}              
            }
        },
        
        render: function (){
        	return <div className="modal fade" id="infomodal">
        			<div className="modal-dialog">
        			<div className="modal-content">
        				<div className="modal-header" id="infomodal-header">
        					<h3 id="infomodal-title" className="text-center">{this.props.title}</h3>
        				</div>
        				<div className="modal-body" dangerouslySetInnerHTML={{__html: this.props.text}}>
        			 	</div>
        			 	<div className="modal-footer" id="infomodal-footer">
        			 		<button  id="infomodal-btn" className="btn" data-dismiss="modal" aria-hidden="true" onClick={this.props.onClick} dangerouslySetInnerHTML={{__html: this.props.buttonLabel}}>
                            </button>
        			 	</div>
        			 </div>
              		 </div>
        		  </div>
        }
    });

});