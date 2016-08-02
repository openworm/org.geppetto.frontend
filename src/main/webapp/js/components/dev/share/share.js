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
        GEPPETTO = require('geppetto');

    var Share = React.createClass({

        visible: false,
        /**
         * Shares Geppetto on Facebook
         *
         * @param {URL} linkURL - URL to share
         * @param {String} title - Title of sharing post
         * @param {String} text - Test of sharing post
         */
        facebook: function () {
            var url = 'http://www.facebook.com/sharer.php?';
            url += '&u=' + encodeURIComponent('http://geppetto.org');
            this.popup(url);
            return GEPPETTO.Resources.SHARE_ON_FACEBOOK;
        },
        /**
         * Shares Geppetto on Twitter
         *
         * @param {URL} linkURL - URL to share
         * @param {String} title - Title of sharing post
         */
        twitter: function () {
            var url = 'http://twitter.com/share?';
            url += 'text=' + encodeURIComponent('Check out Geppetto, an opensource platform to explore and simulate digital biology!');
            url += '&url=' + encodeURIComponent('http://geppetto.org');
            url += '&counturl=' + encodeURIComponent('http://geppetto.org');
            this.popup(url);
            return GEPPETTO.Resources.SHARE_ON_TWITTER;
            
        },

        /**
         * General method to display popup window with either facebook or twitter share
         *
         * @param {URL} url - URL to share
         */
        popup: function (url) {
            window.open(url, '', 'toolbar=0,status=0,width=626, height=436');
        },

        setVisible: function (mode) {
            this.visible = mode;
        },


        isVisible: function () {
            return this.visible;
        },
        
        show: function (mode) {
            var returnMessage;

            if (mode) {
                returnMessage = GEPPETTO.Resources.SHOW_SHAREBAR;

                //show share bar
                if (!this.isVisible()) {
                    $("#geppetto-share").toggleClass("clicked");
                    $("#geppetto-share").slideToggle();
                    this.setVisible(mode);
                }
                //share bar is already visible, nothing to see here
                else {
                    returnMessage = GEPPETTO.Resources.SHAREBAR_ALREADY_VISIBLE;
                }
            }
            else {
                returnMessage = GEPPETTO.Resources.SHOW_SHAREBAR;
                //hide share bar
                if (this.isVisible()) {
                    $("#geppetto-share").toggleClass("clicked");
                    $("#geppetto-share").slideToggle();
                    this.setVisible(mode);
                }
                //share bar already hidden
                else {
                    returnMessage = GEPPETTO.Resources.SHAREBAR_ALREADY_HIDDEN;
                }
            }

            return returnMessage;
        },
        
        componentDidMount: function () {
        	GEPPETTO.Share = this;
        	
            var share = $("#share");

            share.click(function() {

                //toggle button class
                share.toggleClass('clicked');

                //user has clicked the console button
                GEPPETTO.Share.show(share.hasClass('clicked'));
                return false;
            }.bind(this));
        	
        },
        
        render: function () {
        	var that = this;
            return (
                <div>
                    <div id="shareTab">
                        <button className="btn" id="share">
                            <i className="fa fa-share icon-xlarge"></i>
                        </button>
                    </div>
                    <div id="geppetto-share" className="col-md-1 share-panel">
                        <p>
                            <a className="btn" onClick={that.facebook}>
                                <i className="icon-xlarge fa fa-facebook"></i>
                            </a>
                        </p>
                        <p>
                            <a className="btn" onClick={that.twitter}>
                                <i className="icon-xlarge fa fa-twitter"></i>
                            </a>
                        </p>
                    </div>
                </div>
                );

        }
    });

    return Share;
});