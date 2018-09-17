/**
 * New Widget resizable component
 * 
 *  @author Dario Del Piano
 */

define(function (require) {

    var React = require('react');
    var Rnd = require('react-rnd').default;
    require('./Widget.less');

    class NewWidget extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                widgetOpened: true 
            }

            this.close = this.close.bind(this);
            this.hide = this.hide.bind(this);
            this.minimize = this.minimize.bind(this);
            this.maximize = this.maximize.bind(this);
        }

        close() {
            console.log("close function called");
        }

        hide() {
            console.log("hide function called");
        }

        maximize() {
            console.log("hide function called");
        }

        minimize() {
            console.log("minimize function called");
        }

        render() {
            const widgetId = this.props.id + "_widget";
            return (
                <div className={widgetId} >
                    <Rnd enableResizing={{
                        top: true, right: true, bottom: true, left: true, topRight: true,
                        bottomRight: true, bottomLeft: true, topLeft: true
                    }}
                        default={{ height: 250, width: 250, x: 250, y: 250 }}
                        disableDragging={false}
                        maxHeight={window.innerHeight - 50} minHeight={250}
                        ref={c => { this.rnd = c; }} >
                        <div className="ui-dialog-titlebar ui-corner-all ui-widget-header ui-helper-clearfix ui-draggable-handle">
                            <div className="ui-dialog-titlebar-buttonpane">
                                <div className="ui-dialog-titlebar-close">
                                    <span className="fa fa-close"></span>
                                </div>
                                <div className="ui-dialog-titlebar-restore ui-corner-all ui-state-default">
                                    <span className="ui-icon fa fa-compress"></span>
                                </div>
                                <div className="ui-dialog-titlebar-collapse ui-corner-all ui-state-default">
                                    <span className="ui-icon fa fa-chevron-circle-up"></span>
                                </div>
                                <div className="ui-dialog-titlebar-maximize ui-corner-all ui-state-default">
                                    <span className="ui-icon fa fa-expand"></span>
                                </div>
                                <div className="ui-dialog-titlebar-minimize ui-corner-all ui-state-default">
                                    <span className="ui-icon fa fa-window-minimize"></span>
                                </div>
                            </div>
                        </div>
                        {this.props.children}
                    </Rnd>
                </div>
            );
        }
    }

    return NewWidget;
});