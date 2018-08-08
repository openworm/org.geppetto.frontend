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
        render: function () {

            return (
                <div className="col-lg-6 panel-body" id="pythonConsoleOutput">
                    <iframe id="pythonConsoleFrame" src={this.props["pythonNotebookPath"]} marginWidth="0"
                                                    marginHeight="0" frameBorder="no" scrolling="yes"
                                                    allowTransparency="true"
                                                    style={{width:'100%',
                                                            height:this.props.iframeHeight+'px'}}>
                   </iframe>
             	</div>
            );
        }
    });

    return pythonConsole;
});
