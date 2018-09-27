import React, { Component } from 'react';
import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';

import './IconButton.less';

export default class IconButton extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Button variant="contained" style={this.props.style} color="primary" className={"iconButton"} onClick={this.props.onClick} id={this.props.id}>
                <Icon className={"fa " + this.props.icon} />
            </Button>
        );
    }
}
