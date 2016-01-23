/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
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
    return function (GEPPETTO) {
        /**
         * @class GEPPETTO.Share
         */
        GEPPETTO.Share = {
            visible: false,
            /**
             * Shares Geppetto on Facebook
             *
             * @param {URL} linkURL - URL to share
             * @param {String} title - Title of sharing post
             * @param {String} text - Test of sharing post
             */
            facebook: function (linkURL, title, img, text) {
                var url = 'http://www.facebook.com/sharer.php?s=100';
                url += '&p[title]=' + encodeURIComponent(title);
                url += '&p[summary]=' + encodeURIComponent(text);
                url += '&p[url]=' + encodeURIComponent(linkURL);
                url += '&p[images][0]=' + encodeURIComponent(img);
                this.popup(url);
            },
            /**
             * Shares Geppetto on Twitter
             *
             * @param {URL} linkURL - URL to share
             * @param {String} title - Title of sharing post
             */
            twitter: function (linkURL, title) {
                var url = 'http://twitter.com/share?';
                url += 'text=' + encodeURIComponent(title);
                url += '&url=' + encodeURIComponent(linkURL);
                url += '&counturl=' + encodeURIComponent(linkURL);
                this.popup(url);
            },

            /**
             * General method to display popup window with either facebook or twitter share
             *
             * @param {URL} url - URL to share
             */
            popup: function (url) {
                window.open(url, '', 'toolbar=0,status=0,width=626, height=436');
            },

            /**
             * Toggles sharing popup on and off
             *
             * @param {boolean} mode - Sets popup visible or invisible
             */
            setVisible: function (mode) {
                this.visible = mode;
            },

            /**
             * Returns visibility of popup window
             *
             * @returns {boolean} Visibility of popup window
             */
            isVisible: function () {
                return this.visible;
            }
        };
    }
});