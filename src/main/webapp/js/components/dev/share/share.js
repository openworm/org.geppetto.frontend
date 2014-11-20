define(function (require) {

    var React = require('react'),
        GEPPETTO = require('geppetto');

    var Share = React.createClass({

        render: function () {
            return (
                <div>
                    <div id="shareTab">
                        <button className="btn" id="share">
                            <i className="icon-share icon-xlarge"></i>
                        </button>
                    </div>
                    <div id="geppetto-share" className="col-md-1 share-panel">
                        <p>
                            <a className="btn btn-warning" onClick={GEPPETTO.G.shareOnFacebook}>
                                <i className="icon-xlarge icon-facebook"></i>
                            </a>
                        </p>
                        <p>
                            <a className="btn btn-warning" onClick={GEPPETTO.G.shareOnTwitter}>
                                <i className="icon-xlarge icon-twitter"></i>
                            </a>
                        </p>
                    </div>
                </div>
                );

        }
    });

    React.renderComponent(Share({}), document.getElementById('share-button'));

    var share = $("#share");

    share.click(function() {

        //toggle button class
        share.toggleClass('clicked');

        //user has clicked the console button
        var command = (share.hasClass('clicked')) ? "true" : "false";
        GEPPETTO.Console.executeCommand("G.showShareBar(" + command + ")");
        return false;
    }.bind(this));

});