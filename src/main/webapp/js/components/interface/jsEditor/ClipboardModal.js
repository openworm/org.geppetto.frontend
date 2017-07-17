 /**
 * Modal used to display info messages received from server
 *
 */
define(function (require) {

    var React = require('react'),
        $ = require('jquery');

    return React.createClass({
        mixins: [
            require('../../controls/mixins/bootstrap/modal.js')
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
        	return <div className="modal fade" id="javascriptEditor">
        			<div className="modal-dialog">
        			<div className="modal-content">
        				<div className="modal-header" id="infomodal-header">
        					<button type="button" className="close" data-dismiss="modal" aria-hidden="true">×</button>
        					<h3 id="jsEditor-title" className="text-center">{this.props.title}</h3>
        				</div>
        				<div className="modal-body">
	        				<div className="controls">
	        					<textarea id="javascriptCode" name="javascriptCode" className="javascriptCode_loading"></textarea>
	        					<button id="javascriptFullscreen" type="button" className="button fa fa-fullscreen"></button>
	        				</div>
	        			</div>
        				<div className="modal-footer" id="infomodal-footer">
        			 		<button  id="jsEditor-btn" className="btn" data-dismiss="modal" aria-hidden="true"  dangerouslySetInnerHTML={{__html: this.props.buttonLabel}}>
                                                </button>
        			 	</div>
        			 </div>
              		 </div>
        		  </div>
        }
    });
});
