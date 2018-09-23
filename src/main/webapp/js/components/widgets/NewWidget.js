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
            console.log("New widget render method called");
            return (
                <div className={widgetId} >
                    <Rnd enableResizing={{
                        top: this.props.resizable, right: this.props.resizable, bottom: this.props.resizable, 
                        left: this.props.resizable, topRight: this.props.resizable, bottomRight: this.props.resizable, 
                        bottomLeft: this.props.resizable, topLeft: this.props.resizable}}
                        default={{ height: this.props.height, width: this.props.width, x: this.props.x, y: this.props.y }}
                        disableDragging={!this.props.draggable}
                        maxHeight={window.innerHeight - 150} minHeight={250}
                        maxWidth={window.innerWidth - 150} minWidth={250}
                        ref={c => { this.rnd = c; }} >
                        {this.props.children}
                    </Rnd>
                </div>
            );
        }
    }

    return NewWidget;
});