/**
 * React component for displaying a Python console.
 *
 * @author Adrian Quintana (adrian@metacell.us)
 */
define(function (require) {
  
    var React = require('react'), $ = require('jquery');
    var GEPPETTO = require('geppetto');

    $.widget.bridge('uitooltip', $.ui.tooltip);

    require('./PythonConsole.less');

    /**
     * Creates a table html component used to dipslay the experiments
     */
    var pythonConsole = React.createClass({
        componentDidMount: function () {
        	$("#pythonConsoleButton").show();

            $("#pythonConsole").resizable({
                handles: 'n',
                minHeight: 100,
                autoHide: true,
                maxHeight: 400,
                resize: function (event, ui) {
                    if (ui.size.height > ($("#footerHeader").height() * .75)) {
                        $("#pythonConsole").height($("#footerHeader").height() * .75);
                        event.preventDefault();
                    }
                    $('#pythonConsole').resize();
                    $("#pythonConsole").get(0).style.top = "0px";
                }.bind(this)
            });
        },

        

        render: function () {

            return (
                <div className="col-lg-6 panel-body" id="pythonConsoleOutput">
                    <iframe id="pythonConsoleFrame" src={this.props.pythonNotebookPath} marginWidth="0" marginHeight="0" frameBorder="no" scrolling="yes" allowTransparency="true" style={{width:'100%', height:'100%'}}>
                   </iframe>
             	</div>  
            );
        }
    });

    return pythonConsole;
});
