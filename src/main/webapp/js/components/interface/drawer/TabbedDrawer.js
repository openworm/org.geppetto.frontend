define(function (require) {

    var React = require('react');
    var DrawerButton = require('./DrawerButton');
    var Rnd = require('react-rnd').default;
    var Resizable = require('re-resizable').default;
    require('./TabbedDrawer.less');

    class TabbedDrawer extends React.Component {
        constructor(props) {
            super(props);
            
            this.state = {
                drawerOpened: false,
                buttonSelected: null,
                drawerHeight: 250
            }
            this.openDrawer = this.openDrawer.bind(this);
            this.renderMyLabels = this.renderMyLabels.bind(this);
            this.drawerResizing = this.drawerResizing.bind(this);
            this.drawerStopResizing = this.drawerStopResizing.bind(this);
        }

        drawerResizing(e) {
            var newOffset = window.innerHeight - (e.clientY - e.layerY);
            if(newOffset >= window.innerHeight)
                newOffset = window.innerHeight - 50;
            if(newOffset < 250)
                newOffset = 250;
            this.setState({drawerHeight: newOffset});
        }  
        
        drawerStopResizing(e) {
            var newOffset = window.innerHeight - (e.clientY - e.layerY - e.movementY);
            if(newOffset >= window.innerHeight)
                newOffset = window.innerHeight - 50;
            if(newOffset < 250)
                newOffset = 250;
            this.setState({drawerHeight: newOffset});
        }  

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
            //const ElementToRender = (this.state.buttonSelected !== null) ? this.props.children[this.state.buttonSelected] : null;
            //const myElement = (ElementToRender !== null) ? <ElementToRender /> : "";
            const drawerStyle = this.state.drawerOpened ? {top:null, bottom: 0, display: 'block'} : {display: 'none'};
            const tabStyle = this.state.drawerOpened ? {bottom: this.state.drawerHeight+'px'} : {bottom: '0px'};
            return (
                <div className="geppettoDrawer">
                    <span className="tabber" style={tabStyle}>
                        {this.renderMyLabels()}
                    </span>
                    <Rnd enableResizing={{ top:true, right:false, bottom:false, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }} 
                        default={{height: 250, width: '100%'}} className="drawer" style={drawerStyle} 
                        disableDragging={true} onResize={this.drawerResizing} onResizeStop={this.drawerStopResizing} 
                        maxHeight={window.innerHeight - 50} minHeight={250}>
                            {this.renderMyChilds()}
                    </Rnd>
                </div>
            );
        }
    }
    return TabbedDrawer;
});