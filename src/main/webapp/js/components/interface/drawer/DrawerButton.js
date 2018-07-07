/**
 * Button component used in the tabbed drawer to 
 * select the child component to display.
 *
 *  @author Dario Del Piano
 */

define(function (require) {

    var React = require('react');
    require('./TabbedDrawer.less');


    class DrawerButton extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                mouseOver: false,
                buttonActived: false}

            this.activeButton = this.activeButton.bind(this);
        }

        // function called onClick, recall the parent function passed as prop to display the right child
        // the props labelKey is passed as parameter to the TabbedDrawer component to let it known
        // which button has been selected.
        activeButton() {
            if((this.props.labelKey === this.props.selectedTab) && this.props.drawerOpened)
                this.setState({buttonActived: true,
                               mouseOver: false});
            else 
                this.setState({buttonActived: false,
                               mouseOver: false});
            this.props.functionDrawer(this.props.labelKey);
        }

        render() {
            var buttonStyle = "tabButton";
            if(this.props.labelKey === this.props.selectedTab) {
                buttonStyle = " tabButton selectedTab";
            }
            return (
                <span
                    onClick={this.activeButton}
                    className={buttonStyle}>
                    <div className={this.props.iconClass}></div>
                    &nbsp;{this.props.children}
                </span>
            );
        }
    }
    return DrawerButton;
})