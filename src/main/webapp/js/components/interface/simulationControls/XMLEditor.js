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
    var React = require('react');
    require('codemirror');

    return React.createClass({

        showFullscreen: function() {
            this.setFullScreen(true);
        },

        setFullScreen: function(fullscreen) {

            var wrap = this.xmlEditor.getWrapperElement();
            if(fullscreen) {
                $('.modal-dialog').addClass('fullscreen');
                wrap.className += " CodeMirror-fullscreen";
                wrap.style.height = GEPPETTO.winHeight() + "px";
                document.documentElement.style.overflow = "hidden";
            }
            else {
                $('.modal-dialog').removeClass('fullscreen');
                wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
                wrap.style.height = "";
                document.documentElement.style.overflow = "";
            }

            this.xmlEditor.focus();

            setTimeout(function() {
                this.xmlEditor.refresh();
            }.bind(this), 20);           
        },

        isFullScreen: function (cm) {
            return /\bCodeMirror-fullscreen\b/.test(this.xmlEditor.getWrapperElement().className);
        },

        componentDidUpdate: function() {
            if(this.xmlEditor && this.xmlEditor.getValue() != this.props.simulationXML) {
                this.xmlEditor.setValue(this.props.simulationXML);
                var totalLines = this.xmlEditor.lineCount();
                var totalChars = this.xmlEditor.getTextArea().value.length;
                this.xmlEditor.autoFormatRange({line:0, ch:0}, {line:totalLines, ch:totalChars});
            }

            CodeMirror.on(window, "resize", function() {
                var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
                if(showing) {
                    showing.CodeMirror.getWrapperElement().style.height = GEPPETTO.winHeight() + "px";
                }                
            });
        },

        componentDidMount: function () {
            var self = this;
            this.xmlEditor = CodeMirror.fromTextArea($('#xmlCodeEditor').get(0),
                {
                    mode: "xml",
                    lineNumbers: true,
                    theme: "lesser-dark",
                    extraKeys: {
                        "F11": function () {
                            self.setFullScreen(!self.isFullScreen());
                        },
                        "Esc": function () {
                            if (self.isFullScreen()) {
                                self.setFullScreen(false);
                            }
                        }
                    }
                });

            this.xmlEditor.setValue(this.props.simulationXML);

            var callback = function(viewer){
                self.props.onChangeXML(viewer.getValue());
            };

            this.xmlEditor.on('change',callback);
        },

        render: function () {
            return (
                <div className="form-group">
                    <label htmlFor="modelCustom" className="col-sm-2 control-label">Custom</label>
                    <div className="col-sm-10">
                        <textarea id="xmlCodeEditor" className="form-control" placeholder="" />
                    </div>
                    <i className="fa-fullscreen expand-editor pull-right" onClick={this.showFullscreen}></i>
                </div>
                );
        }
    });
});