define(function (require) {

    var React = require('react');
    var Modal = require('react-overlays').Modal;
    require('./Overlay.less');


    class Overlay extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                modalIsOpen: props.modalIsOpen,
                items: props.items,
                shouldCloseOnOverlayClick: props.shouldCloseOnOverlayClick,
                contentLabel: props.contentLabel
            };

            // this.openModal = this.openModal.bind(this);
            // this.afterOpenModal = this.afterOpenModal.bind(this);
            // this.closeModal = this.closeModal.bind(this);
        }



        afterOpenModal() {
            // references are now sync'd and can be accessed.

        }

        close() {
            this.setState({ modalIsOpen: false });
        }

        open() {
            this.setState({ modalIsOpen: true });
        }

        render() {



            return (
                <Modal
                    aria-labelledby='modal-label'
                    style={this.props.modalStyle}
                    backdropStyle={this.props.backdropStyle}
                    show={this.state.modalIsOpen}
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
        modalStyle: {
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