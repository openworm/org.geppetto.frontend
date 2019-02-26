import React from 'react';
import PropTypes from 'prop-types';
import MenuPopper from './MenuPopper';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

const styles = {
    root1: {
        background: '#010101',
        "&:hover": {
            background: "#11bffe",
            backgroundColor: "#11bffe",
            color: '#ffffff'
        },
        borderRadius: 0,
        border: 0,
        boxShadow: '0px 0px',
        color: '#ffffff',
        fontSize: '16px',
        fontFamily: 'Khand, sans-serif',
        margin: '-10px 0px 0px 0px',
        minWidth: '44px'
    },
    root2:{
        background: "#11bffe",
        backgroundColor: "#11bffe",
        "&:hover": {
            background: "#11bffe",
            backgroundColor: "#11bffe",
            color: '#ffffff'
        },
        borderRadius: 0,
        border: 0,
        boxShadow: '0px 0px',
        color: '#ffffff',
        fontSize: '16px',
        fontFamily: 'Khand, sans-serif',
        margin: '-10px 0px 0px 0px',
        minWidth: '44px'
    },
    label: {
        textTransform: 'capitalize',
        textAlign: 'left',
        justifyContent: 'start'
    },
};

class MenuSection extends React.Component {
    constructor(props) {
		super(props);

		this.state = {
            anchorEl: null,
            customList: undefined
		}
        this.handleOver = this.handleOver.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleAwayListener = this.handleAwayListener.bind(this);

        this.tempList = undefined;
    };

    handleClick = event => {
        if((this.props.list === undefined) || (this.props.list.length === 0)) {
            if (this.props.button.hasOwnProperty('dynamicListInjector')) {
                    this.tempList = this.props.menuHandlerDirect(this.props.button.dynamicListInjector);
                    const { currentTarget } = event;
                    if (this.state.anchorEl !== null) {
                        this.props.menuClickHandler(false, undefined);
                    } else {
                        this.props.menuClickHandler(true, this.props.id);
                    }
                    this.setState(state => ({
                        anchorEl: state.anchorEl ? null : currentTarget,
                        customList: this.tempList
                    }));
            } else {
                return;
            }
        } else {
            const { currentTarget } = event;
            if (this.state.anchorEl !== null) {
                this.props.menuClickHandler(false, undefined);
            } else {
                this.props.menuClickHandler(true, this.props.id);
            }
            this.setState(state => ({
                anchorEl: state.anchorEl ? null : currentTarget
            }));
        }
    };

    handleAwayListener = event => {
        const { currentTarget } = event;
        if(currentTarget.activeElement !== this.state.anchorEl) {
            this.props.menuClickHandler(false, undefined);
            this.setState({anchorEl: null});
        }
    };

    handleOver = event =>  {
        const { currentTarget } = event;
        if(this.props.menuOpen && this.props.sectionOpened !== this.props.id) {
            if((this.props.list === undefined) || (this.props.list.length === 0)) {
                if(this.props.button.hasOwnProperty('dynamicListInjector')) {
                    this.tempList = this.props.menuHandlerDirect(this.props.button.dynamicListInjector);
                } else {
                    return;
                }
            }
            this.setState({
                anchorEl: currentTarget,
                customList: this.tempList
            }, () => {
                this.props.menuClickHandler(true, this.props.id);
            });
        }
    };

    componentWillReceiveProps(nextProps) {
        if((nextProps.sectionOpened !== this.props.id) && (this.props.menuOpen === true) && (this.state.anchorEl !== null)) {
            this.setState({anchorEl: null});
        }
    };

    render() {
        const { anchorEl } = this.state;
        const open = Boolean(anchorEl);
        const id = open ? 'simple-popper' : null;

        const { classes } = this.props;

        var popperToRender = undefined;
        if(this.props.button.list !== undefined) {
            popperToRender = (
                <MenuPopper
                    parentRef={anchorEl}
                    parentHandler={this.handleClick}
                    menuList={this.props.button.list}
                    menuHandler={this.props.menuHandler}
                    menuHandlerDirect={this.props.menuHandlerDirect}
                    awayClickHandler={this.handleAwayListener}
                    position={(this.props.button.position !== undefined) ? this.props.button.position : "right"}
                />
            );
        } else if (this.state.customList !== undefined) {
            popperToRender = (
                <MenuPopper
                    parentRef={anchorEl}
                    parentHandler={this.handleClick}
                    menuList={this.state.customList}
                    menuHandler={this.props.menuHandler}
                    menuHandlerDirect={this.props.menuHandlerDirect}
                    awayClickHandler={this.handleAwayListener}
                    position={(this.props.button.position !== undefined) ? this.props.button.position : "right"}
                />
            );
        }
        var buttonClasses = undefined;
        if(open) {
            buttonClasses={
                root: classes.root2,
                label: classes.label
            };
        } else {
            buttonClasses={
                root: classes.root1,
                label: classes.label
            };
        }

        return (
            <span>
                <Button
                    classes={buttonClasses}
                    size='small'
                    variant="contained"
                    aria-describedby={id}
                    onClick={this.handleClick}
                    onMouseOver={this.handleOver}>
                    {this.props.button.label}
                </Button>
                <MenuPopper
                    parentRef={anchorEl}
                    parentHandler={this.handleClick}
                    menuList={(this.props.button.list !== undefined) ? this.props.button.list : this.state.customList}
                    menuHandler={this.props.menuHandler}
                    menuHandlerDirect={this.props.menuHandlerDirect}
                    awayClickHandler={this.handleAwayListener}
                    position={(this.props.button.position !== undefined) ? this.props.button.position : "right"}
                />
            </span>
        );
    }
}

export default withStyles(styles)(MenuSection);