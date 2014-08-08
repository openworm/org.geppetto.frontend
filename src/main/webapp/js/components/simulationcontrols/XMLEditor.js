define(function (require) {
    var React = require('react');
    require('codemirror');

    return React.createClass({

        setFullScreen: function (cm, full) {
            var wrap = cm.getWrapperElement();
            if (full) {
                wrap.className += " CodeMirror-fullscreen";
                document.documentElement.style.overflow = "hidden";
            }
            else {
                wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
                wrap.style.height = "";
                document.documentElement.style.overflow = "";
            }
            cm.focus();
            setTimeout(function () {
                cm.refresh();
            }, 20);
        },

        isFullScreen: function (cm) {
            return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
        },

        componentDidUpdate: function() {
            if(this.xmlEditor && this.xmlEditor.getValue() != this.props.simulationXML) {
                this.xmlEditor.setValue(this.props.simulationXML);
                var totalLines = this.xmlEditor.lineCount();
                var totalChars = this.xmlEditor.getTextArea().value.length;
                this.xmlEditor.autoFormatRange({line:0, ch:0}, {line:totalLines, ch:totalChars});
            }
        },

        componentDidMount: function () {
            var self = this;
            this.xmlEditor = CodeMirror.fromTextArea($('#xmlCodeEditor').get(0),
                {
                    mode: "xml",
                    lineNumbers: true,
                    theme: "lesser-dark",
                    extraKeys: {
                        "F11": function (cm) {
                            self.setFullScreen(cm, !self.isFullScreen(cm));
                        },
                        "Esc": function (cm) {
                            if (self.isFullScreen(cm)) {
                                self.setFullScreen(cm, false);
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
                </div>
                );
        }
    });
});