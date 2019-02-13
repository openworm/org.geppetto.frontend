import React from 'react';
import PropTypes from 'prop-types';
import MenuPopper from './MenuPopper';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';

const styles = {
    root: {
        background: '#010101',
        borderRadius: 0,
        border: 1,
        borderColor: '#11bffe',
        color: '#11bffe',
        height: '-5',
        padding: '0 30px',
        fontSize: '16px',
        fontFamily: 'Khand, sans-serif'
    },
    label: {
        textTransform: 'capitalize',
    },
};

class MenuSection extends React.Component {
    constructor(props) {
		super(props);

		this.state = {
			anchorEl: null
		}
        this.handleOver = this.handleOver.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleAwayListener = this.handleAwayListener.bind(this);
    };

    handleClick = event => {
        const { currentTarget } = event;
        if(this.state.anchorEl !== null) {
            this.props.menuClickHandler(false, undefined);
        } else {
            this.props.menuClickHandler(true, this.props.id);
        }
        this.setState(state => ({
            anchorEl: state.anchorEl ? null : currentTarget,
        }));
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
            this.setState({
                anchorEl: currentTarget
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

        return (
            <span>
                <Button
                    classes={{
                        root: classes.root, // class name, e.g. `classes-nesting-root-x`
                        label: classes.label, // class name, e.g. `classes-nesting-label-x`
                    }}
                    variant="contained"
                    aria-describedby={id}
                    onClick={this.handleClick}
                    onMouseOver={this.handleOver}>
                    {this.props.button.label}
                </Button>
                <MenuPopper
                    parentRef={anchorEl}
                    parentHandler={this.handleClick}
                    menuList={this.props.button.list}
                    menuHandler={this.props.menuHandler}
                    awayClickHandler={this.handleAwayListener}
                    position={(this.props.button.position !== undefined) ? this.props.button.position : "right"}
                />
            </span>
        );
    }
}

MenuSection.propTypes = {
    root: PropTypes.object.isRequired,
};

export default withStyles(styles)(MenuSection);