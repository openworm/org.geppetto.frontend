import React from 'react';
import PropTypes from 'prop-types';
import MenuPopper from './MenuPopper';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import ArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";

const styles = theme => ({
    typography: {
        padding: theme.spacing.unit * 2,
    },
});

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

    handleClick = event => {
        const { currentTarget } = event;
        this.setState(state => ({
            anchorEl: state.anchorEl ? null : currentTarget,
        }));
        this.props.menuHandler(currentTarget.getAttribute("menuaction"));
    };

    handleMouseOver = (event) => {
        const { currentTarget } = event;
        if(this.state.sectionOpened !== currentTarget.id) {
            this.setState(state => ({
                anchorEl: currentTarget,
                sectionOpened: currentTarget.id
            }));
        }
    };

    render() {
        const { anchorEl } = this.state;
        let menuItems = this.props.menuList.map((item, index) => {
            if(item.hasOwnProperty('list')) {
                var vfbMenu = ((anchorEl !== null) && (anchorEl !== undefined) && (index === Number(this.state.sectionOpened))) ? (
                    <MenuPopper
                        position={item.position}
                        menuList={item.list}
                        parentRef={anchorEl}
                        menuHandler={this.props.menuHandler}
                        awayClickHandler={this.props.awayClickHandler}
                        />
                ) : undefined;
                return (
                    <MenuItem 
                        id={index} 
                        key={index}
                        menuaction="submenu"
                        onClick={this.handleClick}
                        onMouseOver={this.handleMouseOver}
                        ref="menuItemRef">
                        {item.label}
                        <ArrowRightIcon />
                        {vfbMenu}
                    </MenuItem>
                );
            } else {
                return (
                    <MenuItem key={index} onClick={this.handleClick} menuaction={item.action}>
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