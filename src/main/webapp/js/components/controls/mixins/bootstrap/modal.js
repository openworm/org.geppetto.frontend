
define(function (require) {
    var React = require('react'),
        ReactDOM = require('react-dom'),
        $ = require('jquery');

    return function () {
        var handlerProps = ['handleShow', 'handleShown', 'handleHide', 'handleHidden'];

        var bsModalEvents = {
            handleShow: 'show.bs.modal', handleShown: 'shown.bs.modal', handleHide: 'hide.bs.modal', handleHidden: 'hidden.bs.modal'
        };

        return {
            propTypes: {
                handleShow: React.PropTypes.func,
                handleShown: React.PropTypes.func,
                handleHide: React.PropTypes.func,
                handleHidden: React.PropTypes.func,
                backdrop: React.PropTypes.bool,
                keyboard: React.PropTypes.bool,
                show: React.PropTypes.bool,
                remote: React.PropTypes.string
            },

            getDefaultProps: function () {
                return {
                    backdrop: true, 
                    keyboard: true, 
                    show: false, 
                    remote: '', 
                    handleHidden: function(){
                        var node = $(ReactDOM.findDOMNode(this)).parent().get(0);
                        ReactDOM.unmountComponentAtNode(node);
                    }
                }
            },
            
            componentDidMount: function () {
                var $modal = $(ReactDOM.findDOMNode(this)).modal({
                    backdrop: this.props.backdrop, keyboard: this.props.keyboard, show: this.props.show, remote: this.props.remote
                });

                handlerProps.forEach(function (prop) {
                    if (this[prop]) {
                        $modal.on(bsModalEvents[prop], this[prop])
                    }
                    if (this.props[prop]) {
                        $modal.on(bsModalEvents[prop], this.props[prop])
                    }
                }.bind(this));
            },

            componentWillUnmount: function () {
                var $modal = $(ReactDOM.findDOMNode(this));

                handlerProps.forEach(function (prop) {
                    if (this[prop]) {
                        $modal.off(bsModalEvents[prop], this[prop])
                    }
                    if (this.props[prop]) {
                        $modal.off(bsModalEvents[prop], this.props[prop])
                    }
                }.bind(this));

                $modal.modal('hide');
            },

            hide: function () {
                $(ReactDOM.findDOMNode(this)).hide();
                $(".modal-backdrop").hide();
            },

            show: function () {
            	$(ReactDOM.findDOMNode(this)).modal('show');
                $(ReactDOM.findDOMNode(this)).show();
                $(".modal-backdrop").show();
            },

            toggle: function () {
                $(ReactDOM.findDOMNode(this)).modal('toggle');
            },

            renderCloseButton: function () {
                return <button
                type="button"
                className="close"
                onClick={this.hide}
                dangerouslySetInnerHTML={{__html: '&times'}}
                />
            }
        }
    }();
});