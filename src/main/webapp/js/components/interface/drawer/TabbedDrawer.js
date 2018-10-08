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
            // the selectedTab tell us what child has to be displayed
            // the drawerHeight is used for the resizing
            this.state = {
                drawerOpened: false,
                selectedTab: null,
                drawerHeight: 250
            }
            this.openDrawer = this.openDrawer.bind(this);
            this.drawerResizing = this.drawerResizing.bind(this);
            this.drawerStopResizing = this.drawerStopResizing.bind(this);
            this.closeDrawer = this.closeDrawer.bind(this);
            this.maximizeDrawer = this.maximizeDrawer.bind(this);
            this.minimizeDrawer = this.minimizeDrawer.bind(this);
        }

        // using the callback onResize of Rnd, keep tracks of the resize and animate the tabber
        drawerResizing(e) {

            if (e.clientY == e.layerY)
                var newOffset = window.innerHeight - e.clientY;
            else
                var newOffset = window.innerHeight - (e.clientY - e.layerY);

            if (newOffset >= window.innerHeight)
                newOffset = window.innerHeight - 50;
            if (newOffset < 250)
                newOffset = 250;
            this.setState({ drawerHeight: newOffset });
        };

        // exact resize is calculated with the callback onResizeStop using also movementY
        drawerStopResizing(e) {
            if (e.clientY == e.layerY)
                var newOffset = window.innerHeight - e.clientY;
            else
                var newOffset = window.innerHeight - (e.clientY - e.layerY);

            if (newOffset >= window.innerHeight)
                newOffset = window.innerHeight - 50;
            if (newOffset < 250)
                newOffset = 250;
            this.setState({ drawerHeight: newOffset });
        };

        // function to render all the buttons
        renderMyLabels() {
            var renderedLabels = this.props.labels.map(function (label, index) {
                return (
                    <DrawerButton
                        key={index}
                        functionDrawer={this.openDrawer}
                        labelKey={index}
                        iconClass={this.props.iconClass[index]}
                        selectedTab={this.state.selectedTab}
                        drawerOpened={this.state.drawerOpened}>
                        {label}
                    </DrawerButton>
                );
            }, this);
            return renderedLabels;
        };

        // function to render all the childs, wrap each one of them in a div and manage with display
        // which child has to be visible.
        renderMyChildren() {
            var paddingChildren = 45;
            // Check for children since react will complain if we try to iterate an undefined object.
            if (this.props.children != undefined) {
                var renderedComponents = this.props.children.map(function (child, index) {
                    var DrawerChild = undefined;
                    var ComponentToRender = undefined;
                    // I am relying on the type to distinguish between componentFactory usage in the
                    // ComponentInitialization and the reacty way to use the TabbedDrawer.
                    // If type is defined we are in the reacty way to use the component, in this case we need
                    // to append the additional props that the Drawer defines, reason because we are cloning
                    // the child to do so.
                    if (child.type != undefined) {
                        // React declarative way.
                        var DrawerChild = React.cloneElement(child, {
                            iframeHeight: (this.state.drawerHeight - paddingChildren)
                        });
                        if (this.state.drawerOpened == true) {
                            ComponentToRender = (this.state.selectedTab != index) ? <div className="hiddenComponent" key={index}> {DrawerChild} </div> : <div key={index}> {DrawerChild} </div>;
                        } else {
                            ComponentToRender = <div key={index}> {DrawerChild} </div>;
                        }
                    } else {
                        // Component Factory way.
                        var DrawerChild = child;
                        if (this.state.drawerOpened == true) {
                            ComponentToRender = (this.state.selectedTab != index) ? <div className="hiddenComponent" key={index}><DrawerChild iframeHeight={this.state.drawerHeight - paddingChildren} /></div> : <div key={index}><DrawerChild iframeHeight={this.state.drawerHeight - paddingChildren} /></div>;
                        } else {
                            ComponentToRender = <div key={index}><DrawerChild className="hiddenComponent" iframeHeight={this.state.drawerHeight - paddingChildren} /></div>;
                        }
                    }
                    return (ComponentToRender);
                }, this);
                return renderedComponents;
            } else {
                return undefined;
            }
        };

        // Called by the DrawerButton to determine when the drawer has to be open or closed
        openDrawer(buttonClicked) {
            if (this.state.drawerOpened && (buttonClicked == this.state.selectedTab)) {
                this.setState({
                    selectedTab: null,
                    drawerOpened: !this.state.drawerOpened
                });
            } else if (this.state.drawerOpened && (buttonClicked != this.state.selectedTab)) {
                this.setState({ selectedTab: buttonClicked });
            } else {
                this.setState({
                    selectedTab: buttonClicked,
                    drawerOpened: !this.state.drawerOpened
                });
            }
        };

        maximizeDrawer() {
            var newOffset = (this.state.drawerHeight >= window.innerHeight - 50) ? 250 : window.innerHeight - 50;
            this.rnd.updateSize({ height: newOffset, width: '100%' });
            this.setState({ drawerHeight: newOffset });
        };

        closeDrawer() {
            this.setState({
                selectedTab: null,
                drawerOpened: !this.state.drawerOpened,
                drawerHeight: 250
            });
            this.rnd.updateSize({ height: 250, width: '100%' });
        };

        minimizeDrawer() {
            this.setState({ drawerOpened: !this.state.drawerOpened });
        };

        render() {
            const drawerStyle = this.state.drawerOpened ? { top: null, bottom: 0, display: 'block' } : { display: 'none' };
            const bottonsStyle = this.state.drawerOpened ? { display: 'block' } : { display: 'none' };
            const tabStyle = this.state.drawerOpened ? { bottom: this.state.drawerHeight + 'px' } : { bottom: '0px' };
            return (
                <div className="geppettoDrawer">
                    <span className="tabber" style={tabStyle}>
                        {this.renderMyLabels()}
                        <div style={bottonsStyle} className="icons">
                            <div onClick={this.minimizeDrawer}
                                className="minIcons fa fa-chevron-down">
                            </div>
                            <div onClick={this.maximizeDrawer}
                                className="maxIcons fa fa-chevron-up">
                            </div>
                            <div onClick={this.closeDrawer}
                                className="closeIcons fa fa-times">
                            </div>
                        </div>
                    </span>
                    <Rnd enableResizing={{
                        top: true, right: false, bottom: false, left: false, topRight: false,
                        bottomRight: false, bottomLeft: false, topLeft: false
                    }}
                        default={{ height: 250, width: '100%' }}
                        className="drawer"
                        style={drawerStyle}
                        disableDragging={true}
                        onResize={this.drawerResizing}
                        onResizeStop={this.drawerStopResizing}
                        maxHeight={window.innerHeight - 50} minHeight={250}
                        ref={c => { this.rnd = c; }} >
                        {this.renderMyChildren()}
                    </Rnd>
                </div>
            );
        }
    }

    return TabbedDrawer;
});