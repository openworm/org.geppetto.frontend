

/**
 *
 * Creates Javascript editor to display commands.
 *
 * @author Jesus Martinez (jesus@metacell.us)
 */
define(function (require) {
    return function (GEPPETTO) {
        var $ = require('jquery');
        var editingJS = false;
        var jsEditor = null;

        var CodeMirror = require('codemirror');

        CodeMirror.on(window, "resize", function () {
            var showing = document.body.getElementsByClassName("CodeMirror-fullscreen")[0];
            if (!showing) {
                return;
            }
            showing.CodeMirror.getWrapperElement().style.height = GEPPETTO.winHeight() + "px";
        });

        /**
         * Selects all text within the Javascript editor
         */
        function autoSelectJSEditorText() {
            //give the editor focus
            jsEditor.focus();

            //start selecting the editor's text
            var totalLines = jsEditor.lineCount();
            var totalChars = jsEditor.getTextArea().value.length;
            jsEditor.setSelection(
                {
                    line: 0,
                    ch: 0
                },
                {
                    line: totalLines,
                    ch: totalChars
                });
        }

        /**
         * Javascript editor for simulation files
         *
         * @class GEPPETTO.JSEditor
         */
        GEPPETTO.JSEditor = {
            /**
             * Load the editor, create it if it doesn't exist
             */
            loadEditor: function () {
                GEPPETTO.JSEditor.createJSEditor();
            },

            /**
             * Create JSEditor, use to display command history
             */
            createJSEditor: function () {
                $("#javascriptCode").removeClass("javascriptCode_loading");
                //create the editor with given options
                jsEditor = CodeMirror.fromTextArea(document.getElementById("javascriptCode"),
                    {
                        mode: "javascript",
                        lineNumbers: true,
                        matchBrackets: true,
                        continueComments: "Enter",
                        theme: "lesser-dark",
                        autofocus: true,
                        extraKeys: {
                            "F11": function (cm) {
                                GEPPETTO.JSEditor.setFullScreen(cm, !GEPPETTO.JSEditor.isFullScreen(cm));
                            },
                            "Esc": function (cm) {
                                if (GEPPETTO.JSEditor.isFullScreen(cm)) {
                                    GEPPETTO.JSEditor.setFullScreen(cm, false);
                                }
                            },
                            "Ctrl-Q": "toggleComment"
                        }
                    });

                //Toggles fullscreen mode on editor
                $("#javascriptFullscreen").click(function () {
                    cm = jsEditor;
                    GEPPETTO.JSEditor.setFullScreen(cm, !GEPPETTO.JSEditor.isFullScreen(cm));
                });
            },

            /**
             * Load javascript code in the editor
             */
            loadCode: function (commands) {
                jsEditor.setValue(commands);
                autoSelectJSEditorText();
            },

            /**
             * Returns text inside editor, xml for edited simulation file
             */
            getEditedSimulation: function () {
                return jsEditor.getValue();
            },

            /**
             * Returns true if editor is being used
             */
            setEditing: function (mode) {
                editingJS = mode;
            },

            /**
             * Returns true if editor is being used
             */
            isEditing: function () {
                return editingJS;
            },

            isFullScreen: function (cm) {
                return /\bCodeMirror-fullscreen\b/.test(cm.getWrapperElement().className);
            },

            winHeight: function () {
                return window.innerHeight || (document.documentElement || document.body).clientHeight;
            },

            setFullScreen: function (cm, full) {
                var wrap = cm.getWrapperElement();
                if (full) {
                    wrap.className += " CodeMirror-fullscreen";
                    wrap.style.height = GEPPETTO.winHeight() + "px";
                    document.documentElement.style.overflow = "hidden";
                    cm.focus();
                }
                else {
                    wrap.className = wrap.className.replace(" CodeMirror-fullscreen", "");
                    wrap.style.height = "";
                    document.documentElement.style.overflow = "";
                    cm.focus();
                }
                cm.refresh();
            }
        };
    };
});
