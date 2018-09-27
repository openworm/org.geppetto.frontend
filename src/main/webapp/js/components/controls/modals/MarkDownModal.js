 /**
 * Modal used to render markdown
 *
 */
define(function (require) {

    var CreateClass = require('create-react-classes');
    var Remarkable = require('remarkable');

    return CreateClass({
        mixins: [
            require('../mixins/bootstrap/modal.js')
        ],

        getDefaultProps: function() {
            return {
                title: '',
                content: '',
            }
        },

        rawMarkup: function() {
            var md = new Remarkable({html: true});
            return { __html: md.render(this.props.content)};
        },

        render: function (){
            return <div className="modal fade" id="infomodal">
                    <div className="modal-dialog">
                     <div className="modal-content">
                      <div
                          className="content"
                          dangerouslySetInnerHTML={this.rawMarkup()}
                      />
                     </div>
                      </div>
                  </div>
        }
    });

});