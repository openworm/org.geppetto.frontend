import React from 'react';
import PropTypes from 'prop-types';
import MenuPopper from './MenuPopper';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";

const styles = {
    root1: {
        background: '#444141',
        "&:hover": {
            background: "#11bffe",
            backgroundColor: "#11bffe",
            color: '#ffffff'
        },
        borderRadius: 0,
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: 'Khand, sans-serif',
        paddingTop: 0,
        paddingBottom: 0,
    },
    root2: {
        background: "#11bffe",
        backgroundColor: "#11bffe",
        "&:hover": {
            background: "#11bffe",
            backgroundColor: "#11bffe",
            color: '#ffffff'
        },
        borderRadius: 0,
        color: '#ffffff',
        fontSize: '14px',
        fontFamily: 'Khand, sans-serif',
        paddingTop: 0,
        paddingBottom: 0,
    }
};

class MenuSingleItem extends React.Component {
    constructor(props) {
		super(props);

		this.state = {
            anchorEl: null,
            subMenuOpened: false,
            sectionOpened: undefined
		}

        this.handleClick = this.handleClick.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
    }

    handleClick = (event, action) => {
        const { currentTarget } = event;
        this.setState(state => ({
            anchorEl: state.anchorEl ? null : currentTarget,
        }));
        this.props.menuHandler(action);
    };

    handleMouseOver = (event, index) => {
        const { currentTarget } = event;
        if(this.state.sectionOpened !== index) {
            this.setState(state => ({
                anchorEl: currentTarget,
                sectionOpened: index
            }));
        }
    };

    render() {
        const { anchorEl } = this.state;
        const { classes } = this.props;
        var menuToRender = undefined;
        var MenuItemClass = undefined;
        let menuItems = this.props.menuList.map((item, index) => {
            if (item.hasOwnProperty('list')) {
                if ((anchorEl !== null) && (anchorEl !== undefined) && (index === Number(this.state.sectionOpened))) {
                    menuToRender = (<MenuPopper
                        position={item.position}
                        menuList={item.list}
                        parentRef={anchorEl}
                        menuHandler={this.props.menuHandler}
                        menuHandlerDirect={this.props.menuHandlerDirect}
                        awayClickHandler={this.props.awayClickHandler}
                    />);
                    MenuItemClass={
                        root: classes.root2
                    };
                } else {
                    menuToRender = undefined;
                    MenuItemClass={
                        root: classes.root1
                    };
                } 
                return (
                    <MenuItem
                        id={index} 
                        key={index}
                        onClick={(e) => {this.handleClick(e, item.action)}}
                        onMouseOver={(e) => {this.handleMouseOver(e, index)}}
                        menuHandlerDirect={this.props.menuHandlerDirect}
                        classes={MenuItemClass}>
                            {item.label}
                            <ArrowRightIcon style={{marginLeft: '10px'}}/>
                        {menuToRender}
                    </MenuItem>
                );
            } else if(item.hasOwnProperty('dynamicListInjector')) {
                if ((anchorEl !== null) && (anchorEl !== undefined) && (index === Number(this.state.sectionOpened))) {
                    var tempList = this.props.menuHandlerDirect(item.dynamicListInjector);
                    menuToRender = (<MenuPopper
                        position={item.position}
                        menuList={tempList}
                        parentRef={anchorEl}
                        menuHandler={this.props.menuHandler}
                        menuHandlerDirect={this.props.menuHandlerDirect}
                        awayClickHandler={this.props.awayClickHandler}
                    />);
                    MenuItemClass={
                        root: classes.root2
                    };
                } else {
                    menuToRender = undefined;
                    MenuItemClass={
                        root: classes.root1
                    };
                } 
                return (
                    <MenuItem
                        id={index} 
                        key={index}
                        onClick={(e) => {this.handleClick(e, item.action)}}
                        onMouseOver={(e) => {this.handleMouseOver(e, index)}}
                        menuHandlerDirect={this.props.menuHandlerDirect}
                        classes={MenuItemClass}>
                            {item.label}
                            <ArrowRightIcon style={{marginLeft: '10px'}}/>
                        {menuToRender}
                    </MenuItem>
                );
            } else {
                return (
                    <MenuItem
                        key={index}
                        onClick={(e) => {this.handleClick(e, item.action)}}
                        onMouseOver={(e) => {this.handleMouseOver(e, index)}}
                        menuHandlerDirect={this.props.menuHandlerDirect}
                        menuaction={item.action}
                        classes={{
                            root: classes.root1, // class name, e.g. `classes-nesting-root-x`
                        }}>
                        {item.label}
                    </MenuItem>
                );
            }
        });

        return (
            <React.Fragment>
                {menuItems}
            </React.Fragment>
        );
    }
}

MenuSingleItem.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MenuSingleItem);