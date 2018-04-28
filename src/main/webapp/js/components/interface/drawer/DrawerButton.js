define(function (require) {

    var React = require('react');
    require('./GeppettoDrawer.less');


    class DrawerButton extends React.Component {
        constructor(props) {
            super(props);

            this.buttonActioned = this.buttonActioned.bind(this);
        }

        buttonActioned() {
            this.props.functionDrawer(this.props.labelKey);
        }

        render() {
            return (
                <span
                    id="tabButton"
                    onClick={this.buttonActioned} >
                    {this.props.children}
                </span>
            );
        }
    }
    return DrawerButton;
})