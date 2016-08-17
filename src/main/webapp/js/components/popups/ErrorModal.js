/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2016 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************
 */
 /**
 * Modal used to display error messages received from server
 *
 */
define(function (require) {

    var React = require('react'),
        $ = require('jquery');

    return React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
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