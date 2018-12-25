import React, { Component } from 'react';
import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';

import './IconButton.less';

export default class IconButton extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const { style, icon, className, ...others } = this.props;
        return (
            <Button style={{ backgroundColor: "white", borderRadius: 0, ...style }} className={"iconButton " + className} {...others}>
                <Icon className={"fa " + icon}/>
            </Button>
        );
    }
}
