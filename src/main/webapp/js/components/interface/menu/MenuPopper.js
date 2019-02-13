import React from 'react';
import PropTypes from 'prop-types';
import MenuSingleItem from './MenuSingleItem';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuList from '@material-ui/core/MenuList';
import { withStyles } from '@material-ui/core/styles';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';


const styles = theme => ({
    typography: {
        padding: theme.spacing.unit * 2,
    },
});

class MenuPopper extends React.Component {
    constructor(props) {
		super(props);
    }

    render() {
        const anchorEl = this.props.parentRef;
        const open = Boolean(anchorEl);
        const id = open ? 'simple-popper' : null;
        let toRender = undefined;

        if(anchorEl !== undefined || anchorEl !== null) {
            return (<Popper id={id} open={open} anchorEl={anchorEl} placement={String(this.props.position)} transition>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={150}>
                        <ClickAwayListener onClickAway={this.props.awayClickHandler}>
                            <Paper>
                                <MenuList>
                                    <MenuSingleItem
                                        position={this.props.position}
                                        parentRef={anchorEl}
                                        menuList={this.props.menuList}
                                        menuHandler={this.props.menuHandler}
                                        awayClickHandler={this.props.awayClickHandler}
                                        />
                                </MenuList>
                            </Paper>
                        </ClickAwayListener>
                    </Fade>
                )}
            </Popper>);
        } else {
            return (
                <span></span>
            );
        }
    }
}

MenuPopper.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MenuPopper);