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
            this.overButton = this.overButton.bind(this);
            this.outButton = this.outButton.bind(this);
        }

        activeButton() {
            if((this.props.labelKey === this.props.buttonSelected) && this.props.drawerOpened)
                this.setState({buttonActived: true,
                               mouseOver: false});
            else 
                this.setState({buttonActived: false,
                               mouseOver: false});
            this.props.functionDrawer(this.props.labelKey);
        }

        overButton() {
            if((this.state.buttonActived === false))
                this.setState({mouseOver: true});
        }

        outButton(e) {
            if(!this.props.drawerOpened)
                this.setState({buttonActived: false});
            if((this.state.buttonActived === false))
                this.setState({mouseOver: false});
        }

        render() {
            var buttonStyle = "tabButton";
            if(this.props.labelKey === this.props.buttonSelected) {
                buttonStyle = " tabButton buttonSelected";
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