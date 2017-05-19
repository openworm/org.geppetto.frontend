 /**
 * Modal used to display error messages received from server
 *
 */
define(function (require) {

    var React = require('react'),
        $ = require('jquery');

    require("./ErrorModal.less");

    return React.createClass({
        mixins: [
            require('../mixins/bootstrap/modal.js')
        ],
        
        getDefaultProps: function() {
            return {
                title: 'There was an error',
                text: '',
                code: '',
                source: '',
                exception: '' 
            }
        },
        
        shareTwitter: function() {
            GEPPETTO.Share.twitter('http://geppetto.org','Whoops, I broke Geppetto! @geppettoengine help!');
        },
        
        render: function (){
        	return (
                    <div className="modal fade" id="errormodal">
                        <div className="modal-dialog">
                          <div className="modal-content">
                            <div className="modal-header" id="errormodal-header">
                              <h3 id="errormodal-title" className="text-center">{this.props.title}</h3>
                            </div>
                            <div className="modal-body">
                              <p id="errormodal-text">
                              	{this.props.message}
                              </p>
                              <div className="panel panel-default">
                                <div className="panel-heading">
                                  <h4 className="panel-title">
                                   <a id="error_code" data-toggle="collapse" data-parent="#accordion" href="#collapseOne">{'Details '+this.props.code}</a>
                                 </h4>
                               </div>
                               <div id="collapseOne" className="panel-collapse collapse">
                                <div className="panel-body">
                                 <p id="error_source">{this.props.source}</p>
                                 <p id="error_exception">{this.props.exception}</p>
                               </div>
                             </div>
                           </div>
                         </div>
                         <div className="modal-footer" id="errormodal-footer">
                          <button  className="btn" onClick={this.shareTwitter} aria-hidden="true">
                           <i className="fa fa-twitter"></i> Shame on you
                         </button>
                         <a className="btn" href="https://github.com/openworm/org.geppetto/issues/new" target="_blank" aria-hidden="true">
                           <i className="fa fa-bug"></i> Open issue
                         </a>
                         <button id="errormodal-btn" className="btn" data-dismiss="modal" aria-hidden="true">
                           Close
                         </button>
                       </div>
                      </div>
                      </div>
                      </div>    

                    );
        }
    });

});