import React from 'react';
import PropTypes from 'prop-types';
import MenuSingleItem from './MenuSingleItem';
import Fade from '@material-ui/core/Fade';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuList from '@material-ui/core/MenuList';
import { withStyles } from '@material-ui/core/styles';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

const styles = {
    root: {
        background: '#444141',
        border: '5px',
        borderRadius: 0,
        borderColor: '#11bffe',
        color: '#ffffff',
        fontSize: '12px',
        fontFamily: 'Khand, sans-serif',
        marginTop: '-5px',
        minWidth: '110px'
    }
};

class MenuPopper extends React.Component {
    constructor(props) {
		super(props);
    }

    render() {
        const anchorEl = this.props.parentRef;
        const open = Boolean(anchorEl);
        const id = open ? 'simple-popper' : null;

        const { classes } = this.props;

        if(anchorEl !== undefined || anchorEl !== null) {
            return (<Popper id={id} open={open} anchorEl={anchorEl} placement={String((this.props.position !== undefined) ? this.props.position : "right-start")} transition>
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={50}>
                        <ClickAwayListener onClickAway={this.props.awayClickHandler}>
                            <Paper
                                classes={{
                                    root: classes.root, // class name, e.g. `classes-nesting-root-x`
                                }}
                                square={false}>
                                <MenuList>
                                    <MenuSingleItem
                                        position={this.props.position}
                                        parentRef={anchorEl}
                                        menuList={this.props.menuList}
                                        menuHandler={this.props.menuHandler}
                                        menuHandlerDirect={this.props.menuHandlerDirect}
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