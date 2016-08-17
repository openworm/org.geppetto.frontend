/*******************************************************************************
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
 *******************************************************************************/

define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
        $ = require('jquery'),
        Button = require('mixins/bootstrap/button'),
        GEPPETTO = require('geppetto');

    var Modal = React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        dontShowNextTime: function(val){
            console.log(val);
        },

        startTutorial: function(){
            GEPPETTO.tutorialEnabled = true;
            GEPPETTO.trigger('start:tutorial');
            this.hide();
        },

        skipTutorial: function() {
            GEPPETTO.tutorialEnabled = false;
            this.hide();
        },

        render: function () {
            return <div className="modal fade lead pagination-centered welcome-modal" data-backdrop="static" data-keyboard="false">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-body container">
                            <div className="message-container row">
                                <strong>Welcome to geppetto! </strong>

                            geppetto is an open-source platform built by engineers, scientists, and other hackers to
                            simulate complex biological systems and their surrounding environment.
                            This is an <strong>early access</strong> development release.
                                <br/>
                                <div className="small-text">
                                We worked hard to bring you the best possible alpha release but geppetto is still very much a platform under development.
                                In fact, we reckon this only represents about 20% of what you can expect in the end. We hope you'll enjoy it.
                                </div>

                                <Button className="btn btn-success welcomeButton" data-dismiss="modal" icon="fa-comment" onClick={this.startTutorial}>Start Tutorial</Button>
                                <Button className="btn btn-success welcomeButton" data-dismiss="modal" icon="fa-step-forward" onClick={this.skipTutorial}>Skip Tutorial</Button>

                                <div className="row disable-welcome">
                                    <span><input id="welcomeMsgCookie" type="checkbox" onChange={this.dontShowNextTime}/> Don't show next time I visit Geppetto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        }
    });

    ReactDOM.render(React.createFactory(Modal)({show:true}), document.getElementById('modal-region'));
});
