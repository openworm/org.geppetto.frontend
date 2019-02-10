define(function (require) {
    require('./LinkButton.less');
    var React = require('react');
    var CreateClass = require('create-react-class');

    var linkButton = CreateClass({
        render: function () {
            var customStyle ={
                left: (this.props.left != undefined) ?  this.props.left+"px" : '41px',
                top: (this.props.top != undefined) ? this.props.top+"px" : '415px'
            };

            var iconClass = "fa {0}".format(this.props.icon);
            var styleStringed = "";
            Object.keys(customStyle).forEach((item, index) => {
                styleStringed += item+":"+customStyle[item]+"; ";
            })
            var iconHTML = "<icon class=\""+iconClass+"\" style=\""+styleStringed+"\">"

            return (
                <div id="github">
                    <a href={this.props.url} target="_blank">
                        <div dangerouslySetInnerHTML={{__html: iconHTML}} />
                    </a>
                </div>
            );
        }
    });

    return linkButton;
});
