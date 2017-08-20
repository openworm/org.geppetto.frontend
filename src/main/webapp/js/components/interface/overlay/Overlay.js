define(function (require) {

    var React = require('react');
    var Modal = require('react-overlays').Modal;
    require('./Overlay.less');

    class Overlay extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                show: props.show,
                items: props.items,
            };
        }

        close() {
            this.setState({ show: false });
        }

        open() {
            this.setState({ modalIsOpen: true });
        }

        render() {
            return (
                <Modal
                    aria-labelledby='modal-label'
                    style={this.props.style}
                    backdropStyle={this.props.backdropStyle}
                    show={this.state.show}
                    onHide={this.close}
                    container={this.props.container}
                    containerClassName={this.props.containerClassName}
                >
                    {this.state.items}
                </Modal>
            );
        }
    }

    Overlay.defaultProps = {
        modalIsOpen: false,
        container: document.body,
        style: {
            position: 'relative',
            zIndex: 1040,
            top: 0, bottom: 0, left: 0, right: 0
        },
        backdropStyle: {
            zIndex: 'auto',
            backgroundColor: '#000',
            opacity: 0.5
        },
        containerClassName:"overlay-outer"
        
    };

    return Overlay;
});