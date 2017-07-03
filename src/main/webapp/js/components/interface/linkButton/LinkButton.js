define(function (require) {
    require('./LinkButton.less');
    var React = require('react');

    var linkButton = React.createClass({
        render: function () {
            var customStyle ={
                left: (this.props.left != undefined) ?  this.props.left : '41px',
                top: (this.props.top != undefined) ? this.props.top : '415px'
            };

            var iconClass = "fa {0}".format(this.props.icon);

            return (
                <div id="github">
                    <a href={this.props.url} target="_blank">
                        <icon className={iconClass} id="git" style={customStyle} />
                    </a>
                </div>
            );
        }
    });

    return linkButton;
});