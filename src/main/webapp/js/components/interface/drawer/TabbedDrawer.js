define(function (require) {

    var React = require('react');
    var ReactDOM = require('react-dom');
    var PropTypes = require('prop-types');
    var DrawerButton = require('./DrawerButton');
    var Rnd = require('react-rnd');
    var Resizable = require('re-resizable').default;
    require('./TabbedDrawer.less');

    class TabbedDrawer extends React.Component {
        constructor(props) {
            super(props);
            
            this.state = {
                drawerOpened: false,
                buttonSelected: null,
                drawerHeight: 0
            }
            this.openDrawer = this.openDrawer.bind(this);
            this.renderMyLabels = this.renderMyLabels.bind(this);
            this.dragTopBorder = this.dragTopBorder.bind(this);
        }

        dragTopBorder(e) {
            document.body.onMouseDown = function() {console.log("mouse down asciss position is " + e.pageY);}
            document.body.onMouseUp = function() {console.log("mouse up asciss position is " + e.pageY);}
        }   

        renderMyLabels() {
            var renderedLabels = this.props.labels.map(function(label, _key) {
                return (
                    <DrawerButton 
                        functionDrawer={this.openDrawer}
                        labelKey={_key}
                        buttonSelected={this.state.buttonSelected}
                        drawerOpened={this.state.drawerOpened}>
                        {label}
                    </DrawerButton>
                );
            }, this);
            return renderedLabels;
        }

        openDrawer(buttonClicked) {
            if(this.state.drawerOpened && (buttonClicked == this.state.buttonSelected)) {
                this.setState({buttonSelected: null,
                               drawerOpened: !this.state.drawerOpened});
            } else if(this.state.drawerOpened && (buttonClicked != this.state.buttonSelected))  {
                this.setState({buttonSelected: buttonClicked});
            } else {
                this.setState({buttonSelected: buttonClicked,
                               drawerOpened: !this.state.drawerOpened});
            }
        }

        render() {
            const ElementToRender = (this.state.buttonSelected !== null) ? this.props.children[this.state.buttonSelected] : null;
            const myElement = (ElementToRender !== null) ? <ElementToRender /> : "";
            const drawerStyle = this.state.drawerOpened ? {display: 'block'} : {display: 'none'};
            const tabStyle = this.state.drawerOpened ? {bottom: '250px'} : {bottom: '0px'};
            return (
                <div id="geppettoDrawer">
                    <span id="tabber" style={tabStyle}>
                        {this.renderMyLabels()}
                    </span>
                    <div id="drawer" 
                         style={drawerStyle}>
                        <div 
                            id="topLine"
                            onMouseDown={this.dragTopBorder}
                            onMouseUp={this.dragTopBorder}>
                        </div>
                        {myElement}
                    </div>
                </div>
            );
        }
    }
    return TabbedDrawer;
});