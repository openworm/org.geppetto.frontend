define(function (require) {

    var React = require('react'),
        $ = require('jquery'),
        XMLEditor = require('jsx!./XMLEditor'),
        GEPPETTO = require('geppetto'),
        LoadingSpinner = require('jsx!./LoadingSpinner');

    return React.createClass({
        mixins: [
            require('jsx!components/bootstrap/modal')
        ],

        getInitialState: function() {
            return {
                loadFromURL: true,
                disableLoad: true
            };
        },

        onClickUrl: function() {
            this.setState({loadFromURL: true});
        },

        onClickCustom: function() {
            this.setState({loadFromURL: false});
        },

        loadSimulation: function() {
            if(this.state.loadFromURL) {
                GEPPETTO.Simulation.load(this.state.simulationUrl);
            } else {
                GEPPETTO.Simulation.loadFromContent(this.state.simulationXML);
            }
            
            this.hide();
            
            React.renderComponent(LoadingSpinner({show:true}), $('#modal-region').get(0));
        },

        loadSimulationTemplate: function() {
            var self = this;
            $.ajax(
                {
                    type: "GET",
                    url: 'resources/template.xml',
                    dataType: "xml",
                    success: function(result) {
                    	self.setState({simulationXML: (new XMLSerializer()).serializeToString(result)});
                    }
                });
        },
        
        setSimulationXML: function(result) {
        	this.setState({simulationXML: result});      	
        },
        
        loadSimulationURL: function(url) {       	
        	GEPPETTO.MessageSocket.send("sim", url);
        },

        componentDidMount: function() {
            if (!this.state.simulationXML) {
                this.setState({disableLoad:true});
                this.loadSimulationTemplate();
            }

            GEPPETTO.on('simulation:configloaded', this.setSimulationXML);
            
            if(GEPPETTO.tutorialEnabled) {
                $(this.getDOMNode()).on('shown.bs.modal', function(){
                    $('.select-model').popover({
                        content: 'You can load a sample simulation from the list available. Alternatively, you can enter the URL of your own simulation in the input field above. Open the dropdown list and select the third simulation. Then press continue to go to the next step',
                        placement: 'auto bottom'
                    }).popover('show');
                });
            }
        },
        
        componentWillUnmount: function(){
        	GEPPETTO.off('simulation:configloaded');
        },

        onSelectSimulationUrl: function(event) {
            var url = event.target.value;
            if(url) {
                this.loadSimulationURL(url);
                if(GEPPETTO.tutorialEnabled) {
                    $('.load-sim-button').popover({
                        title: 'Load Simulation',
                        content: 'Use the Load button to load the simulation. Click the button now to continue with tutorial.',
                    }).popover('show');
                } 
            }
            this.setState({disableLoad:!url, simulationUrl: url});

        },

        onChangeXML:function(xml) {
            this.setState({disableLoad:!xml, simulationXML:xml});
        },

        render: function () {
            return <div className="modal fade">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <strong>Load Simulation</strong>
                            {this.renderCloseButton()}
                        </div>
                        <div className="modal-body">
                            <form className="form-horizontal" role="form">
                                <div className="form-group">
                                    <div className="col-sm-2"></div>
                                    <div className="col-sm-10">
                                        <div className="btn-group">
                                            <button ref="selectUrlBtn" type="button" className={this.state.loadFromURL ? "btn btn-default active" : "btn btn-default"} onClick={this.onClickUrl}>URL</button>
                                            <button ref="selectCustomBtn" type="button" className={this.state.loadFromURL ? "btn btn-default" : "btn btn-default active"}onClick={this.onClickCustom}>Custom</button>
                                        </div>
                                        <a className="icon-question-sign" href="http://docs.geppetto.org/en/latest/simtutorial.html" target="_blank"></a>
                                    </div>
                                </div>
                            {this.state.loadFromURL ?
                               (<div className="form-group">
                                    <label htmlFor="modelUrl" className="col-sm-2 control-label">URL</label>
                                    <div className="col-sm-10">
                                        <input type="text" className="form-control" id="modelUrl" value={this.state.simulationUrl} onChange={this.onSelectSimulationUrl} placeholder="Paste URL of the simulation file..." />
                                    </div>
                                </div>)
                                :
                                (<XMLEditor simulationXML={this.state.simulationXML} update={true} onChangeXML={this.onChangeXML}/>)
                                }

                                <div className="form-group">
                                    <label htmlFor="selectSample" className="col-sm-2 control-label">Sample</label>
                                    <div className="col-sm-10">
                                        <select className="form-control select-model" onChange={this.onSelectSimulationUrl}>
                                            <option value="">Select Model...</option>
                                            <option value="https://raw.github.com/openworm/org.geppetto.samples/master/LEMS/SingleComponentHH/GEPPETTO.xml">LEMS Sample Hodgkin-Huxley Neuron</option>
                                            <option value="https://raw.github.com/openworm/org.geppetto.samples/master/SPH/LiquidSmall/GEPPETTO.xml">PCISPH Small Liquid Scene</option>
                                            <option value="https://raw.github.com/openworm/org.geppetto.samples/master/SPH/ElasticSmall/GEPPETTO.xml">PCISPH Small Elastic Scene</option>
                                            <option value="https://raw.githubusercontent.com/openworm/org.geppetto.samples/master/LEMS/C302/GEPPETTO.xml">C302 Experimental network of integrate and fire neurons</option>
                                            <option value="https://raw.github.com/openworm/org.geppetto.samples/master/LEMS/HindmarshRose/GEPPETTO.xml">Hindmarsh-Rose Spiking Neuron</option>
                                            <option value="https://raw.github.com/openworm/org.geppetto.samples/master/NeuroML/Purkinje/GEPPETTO.xml">NeuroML Purkinje Cell (No Simulation)</option>
                                            <option value="https://raw.github.com/openworm/org.geppetto.samples/master/NeuroML/PVDR/GEPPETTO.xml">NeuroML C.elegans PVDR Neuron (No Simulation)</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-info" onClick={this.hide}>Cancel</button>
                            <button type="button" className="btn btn-info load-sim-button" disabled={this.state.disableLoad} onClick={this.loadSimulation}>Load</button>
                        </div>
                    </div>
                </div>
            </div>
        }
    });

});