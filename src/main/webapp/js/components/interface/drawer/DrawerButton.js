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
            console.log("button out position page Y is " + e.pageY);
        }

        render() {
            if(this.props.labelKey === this.props.buttonSelected) {
                var buttonStyle = {background: 'rgba(252, 99, 32, 0.8)', color: 'rgba(50, 50, 53)'};
            } else {
                var buttonStyle = (this.state.mouseOver) ? {background: 'rgba(252, 99, 32, 0.8)', 
                                                           color: 'rgba(50, 50, 53)'} : 
                                                          {background: 'rgba(50, 50, 53, 0.8)',
                                                           color: 'rgba(252, 99, 32)'};
            }
            return (
                <span
                    id="tabButton"
                    onClick={this.activeButton} 
                    onMouseOver={this.overButton}
                    onMouseOut={this.outButton}
                    style={buttonStyle}>
                    {this.props.children}
                </span>
            );
        }
    }
    return DrawerButton;
})