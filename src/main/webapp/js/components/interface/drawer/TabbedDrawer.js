/**
 * Tabbed Drawer resizable component
 * It uses the components DrawerButton and Rnd to create a resizable Tabbed Drawer.
 * 
 *  @author Dario Del Piano
 */

define(function (require) {

    var React = require('react');
    var DrawerButton = require('./DrawerButton');
    var Rnd = require('react-rnd').default;
    require('./TabbedDrawer.less');

    class TabbedDrawer extends React.Component {
        constructor(props) {
            super(props);
            
            // the state drawerOpened is used to keep track of the display css attribute
            // the buttonSelected tell us what child has to be displayed
            // the drawerHeight is used for the resizing
            this.state = {
                drawerOpened: false,
                buttonSelected: null,
                drawerHeight: 250
            }
            this.openDrawer = this.openDrawer.bind(this);
            this.renderMyLabels = this.renderMyLabels.bind(this);
            this.renderMyChilds = this.renderMyChilds.bind(this);
            this.drawerResizing = this.drawerResizing.bind(this);
            this.drawerStopResizing = this.drawerStopResizing.bind(this);
            this.closeDrawer = this.closeDrawer.bind(this);
            this.maximizeDrawer = this.maximizeDrawer.bind(this);
            this.minimizeDrawer = this.minimizeDrawer.bind(this);
        }

        // using the callback onResize of Rnd, keep tracks of the resize and animate the tabber
        drawerResizing(e) {
            var newOffset = window.innerHeight - (e.clientY - e.layerY);
            if(newOffset >= window.innerHeight)
                newOffset = window.innerHeight - 50;
            if(newOffset < 250)
                newOffset = 250;
            this.setState({drawerHeight: newOffset});
        }  
        
        // exact resize is calculated with the callback onResizeStop using also movementY
        drawerStopResizing(e) {
            var newOffset = window.innerHeight - (e.clientY - e.layerY - e.movementY);
            if(newOffset >= window.innerHeight)
                newOffset = window.innerHeight - 50;
            if(newOffset < 250)
                newOffset = 250;
            this.setState({drawerHeight: newOffset});
        }  

        // function to render all the buttons
        renderMyLabels() {
            var renderedLabels = this.props.labels.map(function(label, _key) {
                return (
                    <DrawerButton 
                        functionDrawer={this.openDrawer}
                        labelKey={_key}
                        iconClass={this.props.iconClass[_key]}
                        buttonSelected={this.state.buttonSelected}
                        drawerOpened={this.state.drawerOpened}>
                        {label}
                    </DrawerButton>
                );
            }, this);
            return renderedLabels;
        }

        // function to render all the childs, wrap each one of them in a div and manage with display
        // which child has to be visible.
        renderMyChilds() {
            var renderedComponents = this.props.children.map(function(child, _key) {
                if(this.state.drawerOpened == true) {
                    var ElementToRender = child;
                    var MyElement = (this.state.buttonSelected != _key) ? <div className="hiddenComponent"><ElementToRender /></div> : <div><ElementToRender /></div>;

                } else {
                    var ElementToRender = child;
                    var MyElement = <div><ElementToRender className="hiddenComponent" /></div>;
                }
                return (MyElement);
            }, this);
            return renderedComponents;
        }

        // Called by the DrawerButton to determine when the drawer has to be open or closed
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

        maximizeDrawer() {
            var newOffset = (this.state.drawerHeight >= window.innerHeight - 50) ? 250 : window.innerHeight - 50;
            this.rnd.updateSize({height: newOffset, width: '100%'});
            this.setState({drawerHeight: newOffset});
        }

        closeDrawer() {
            this.setState({buttonSelected: null,
                           drawerOpened: !this.state.drawerOpened});
        }

        minimizeDrawer() {
            this.setState({drawerOpened: !this.state.drawerOpened});
        }

        render() {
            const drawerStyle = this.state.drawerOpened ? {top:null, bottom: 0, display: 'block'} : {display: 'none'};
            const bottonsStyle = this.state.drawerOpened ? {display: 'block'} : {display: 'none'};
            const tabStyle = this.state.drawerOpened ? {bottom: this.state.drawerHeight+'px'} : {bottom: '0px'};
            return (
                <div className="geppettoDrawer">
                    <span className="tabber" style={tabStyle}>
                        {this.renderMyLabels()}
                        <div style={bottonsStyle} onClick={this.minimizeDrawer} 
                             className="icons minIcons fa fa-window-minimize">
                        </div>
                        <div style={bottonsStyle} onClick={this.maximizeDrawer} 
                             className="icons maxIcons fa fa-expand">
                        </div>
                        <div style={bottonsStyle} onClick={this.closeDrawer} 
                             className="icons closeIcons fa fa-times">
                        </div>
                    </span>
                    <Rnd enableResizing={{ top:true, right:false, bottom:false, left:false, topRight:false, 
                                           bottomRight:false, bottomLeft:false, topLeft:false }} 
                         default={{height: 250, width: '100%'}} 
                         className="drawer" 
                         style={drawerStyle} 
                         disableDragging={true} 
                         onResize={this.drawerResizing} 
                         onResizeStop={this.drawerStopResizing} 
                         maxHeight={window.innerHeight - 50} minHeight={250}
                         ref={c => { this.rnd = c; }} >
                            {this.renderMyChilds()}
                    </Rnd>
                </div>
            );
        }
    }
    return TabbedDrawer;
});