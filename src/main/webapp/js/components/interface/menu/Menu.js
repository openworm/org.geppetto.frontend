import React from 'react';
import MenuSection from './MenuSection';

export default class Menu extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            menuOpen: false,
            sectionOpened: undefined
        }
        
        this.menuClick = this.menuClick.bind(this);
        this.menuHandler = this.menuHandler.bind(this);
    };

    menuClick(clicked, index) {
        this.setState({
            menuOpen: clicked,
            sectionOpened: index
        });
    };

    menuHandler(action) {
        this.setState({
            menuOpen: false,
            sectionOpened: undefined
        }, () => {this.props.menuHandler(action)});
    }

    render() {
        var buttonsToRender = this.props.configuration.buttons.map((button, index) => {
            return (
                <MenuSection 
                    id={index}
                    key={index}
                    button={button}
                    list={button.list}
                    menuHandler={this.menuHandler} 
                    menuClickHandler={this.menuClick}
                    menuOpen={this.state.menuOpen}
                    sectionOpened={this.state.sectionOpened}
                />
            );
        });

        return (
            <span>
                {buttonsToRender}
            </span>
        );
    }
}