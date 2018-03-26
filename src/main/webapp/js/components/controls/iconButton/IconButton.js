import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import './IconButton.less';

export default class IconButton extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (

            <RaisedButton style={this.props.style} className={"iconButton"} onClick={this.props.onClick} id={this.props.id}>
                <FontIcon className={"fa " + this.props.icon}></FontIcon>
            </RaisedButton>


        );
    }
}
