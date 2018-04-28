define(function (require) {

    var React = require('react');
    require('./GeppettoDrawer.less');


    class DrawerButtons extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            if(this.props.isVisible == null) {
                return (
                    <span id="tabShowDrawer">
                        {this.props.children}
                    </span>
                );
            } else {
                return(
                    <span 
                        id="tabShowDrawer"
                        className={this.props.isVisible}>
                        {this.props.children}
                    </span>
                );
            }
        }
    }
    return DrawerButtons;
})