define(function (require) {

    var React = require('react');
    require('./GeppettoDrawer.less');


    class DrawerContent extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            if(this.props.isVisible == null) {
                return (
                    <div
                        id="drawer">
                        {this.props.children}
                    </div>
                );
            } else {
                return (
                    <div
                        id="drawer"
                        className={this.props.isVisible} >
                        {this.props.children}
                    </div>
                );
            }
        }
    }
    return DrawerContent;
})