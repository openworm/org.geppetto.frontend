define(function (require) {

    var React = require('react'),
        ReactDOM = require('react-dom'),
        $ = require('jquery'),
        Button = require('mixins/bootstrap/button'),
        GEPPETTO = require('geppetto');

    var Modal = React.createClass({
        mixins: [
            require('jsx!mixins/bootstrap/modal')
        ],

        dontShowNextTime: function(val){
            $.cookie('geppetto_hideWelcomeMessage', true);
        },

        startTutorial: function(){
            GEPPETTO.trigger('start:tutorial');
            GEPPETTO.tutorialEnabled = true;
            this.hide();
        },

        skipTutorial: function() {
            this.hide();
        },

        render: function () {
            return <div className="modal fade lead pagination-centered welcome-modal" data-backdrop="static" data-keyboard="false">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-body container">
                            <div className="message-container row">
                                <strong>Welcome to geppetto! </strong>
                            geppetto is an open-source platform built by engineers, scientists, and other hackers to
                            simulate complex biological systems and their surrounding environment.
                            This is an <strong>early access</strong> development release.
                                <br/>
                                <div className="small-text">
                                We worked hard to bring you the best possible alpha release but geppetto is still very much a platform under development.
                                In fact, we reckon this only represents about 20% of what you can expect in the end. We hope you'll enjoy it.
                                </div>

                                <Button className="btn btn-success welcomeButton" data-dismiss="modal" icon="fa fa-comment" onClick={this.startTutorial}>Start Tutorial</Button>
                                <Button className="btn btn-success welcomeButton" data-dismiss="modal" icon="fa fa-step-forward" onClick={this.skipTutorial}>Skip Tutorial</Button>

                                <div className="row disable-welcome">
                                    <span><input id="welcomeMsgCookie" type="checkbox" onChange={this.dontShowNextTime}/> Don't show next time I visit Geppetto</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        }
    });

    if(!$.cookie('geppetto_hideWelcomeMessage')){
        ReactDOM.render(React.createFactory(Modal)({show:true}), document.getElementById('modal-region'));
    }

});