define(function (require) {

    var React = require('react');
    var DrawerButton = require('./DrawerButton'),
        DrawerButtons = require('./DrawerButtons'),
        DrawerContent = require('./DrawerContent');
    require('./GeppettoDrawer.less');

    class GeppettoDrawer extends React.Component {
        constructor(props) {
            super(props);
            
            this.state = {
                drawerOpened: false,
                drawerClass: null,
                tabDrawerClass: null,
                contentRendered: null,
                buttonSelected: null
            }
            this.openDrawer = this.openDrawer.bind(this);
            this.renderMyLabels = this.renderMyLabels.bind(this);
        }

        renderMyLabels() {
            var renderedLabels = this.props.content.map(function(label, key) {
                return (
                    <DrawerButton 
                        functionDrawer={this.openDrawer}
                        labelKey={key} 
                        drawerOpened={this.state.drawerOpened}>
                        {label}
                    </DrawerButton>
                );
            }, this);
            return renderedLabels;
        }

        openDrawer(buttonClicked) {
            console.log("Debug function");
            console.log("ButtonClicked " + buttonClicked);
            console.log("buttonSelected " + this.state.buttonSelected);
            console.log("drawerOpened " + this.state.drawerOpened);
            if(this.state.drawerOpened && (buttonClicked == this.state.buttonSelected)) {
                this.setState({drawerClass: null,
                               tabDrawerClass: null,
                               buttonSelected: null,
                               contentRendered: null,
                               drawerOpened: !this.state.drawerOpened});
            } else if(this.state.drawerOpened && (buttonClicked != this.state.buttonSelected))  {
                this.setState({drawerClass: "visible",
                               tabDrawerClass: "up",
                               buttonSelected: buttonClicked,
                               contentRendered: this.props.children[buttonClicked]});
            } else {
                this.setState({drawerClass: "visible",
                               tabDrawerClass: "up",
                               buttonSelected: buttonClicked,
                               contentRendered: this.props.children[buttonClicked],
                               drawerOpened: !this.state.drawerOpened});
            }
        }

        render() {
            const Element1 = this.state.contentRendered;
            const class1 = this.state.drawerClass;
            const class2 = this.state.tabDrawerClass;
            if(Element1 === null) {
                return (
                    <div id="geppettoDrawer">
                        <DrawerButtons isVisible={class2}>
                            {this.renderMyLabels()}
                        </DrawerButtons>
                        <DrawerContent isVisible={class1}>
                        </DrawerContent>
                    </div>
                );
            } else {
                return (
                    <div id="geppettoDrawer">
                        <DrawerButtons isVisible={class2}>
                            {this.renderMyLabels()}
                        </DrawerButtons>
                        <DrawerContent isVisible={class1}>
                            <Element1 />
                        </DrawerContent>
                    </div>
                );
            }
        }
    }
    return GeppettoDrawer;
});