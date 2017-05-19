define(function(require) {

	var React = require('react');
	var	GEPPETTO = require('geppetto');

	require('./LoadingSpinner.less');
	
	return React.createClass({		
		mixins: [require('../../controls/mixins/bootstrap/modal.js')],
		timer1:null,
		timer2:null,
        visible: false,
		
		getInitialState: function() {
			return {
				text :'Loading...',
				logo :'gpt-gpt_logo'
			};
		},
		
		setLogo:function(logo){
			this.setState({logo:logo});
		},

		hideSpinner:function(){
			if(this.isMounted() && this.visible){
                if(this.timer1!=null){
                    clearTimeout(this.timer1);
                    clearTimeout(this.timer2);
                }

                this.visible = false;
				this.hide();
			}
		},
		
		showSpinner:function(label){
			var that=this;

			if(that.isMounted()){
                this.visible = true;
				this.setState({text:label});
				this.show();
			}
			
			if(this.timer1!=null){
				clearTimeout(this.timer1);
				clearTimeout(this.timer2);
			}
			
			this.timer1=setTimeout((function(){
				if(that.isMounted()){
					that.setState({text:'Loading is taking longer than usual, either a large amount of data is being loaded or bandwidth is limited'});
				}
			}).bind(this), 20000);
			
			this.timer2=setTimeout((function(){
				if(that.isMounted()){
					that.setState({text:GEPPETTO.Resources.SPOTLIGHT_HINT});
				}
			}).bind(this), 5000);
		},
		
		componentDidMount: function(){
			var that=this;
			
			GEPPETTO.Spinner=this;
			
			//Loading spinner initialization
			GEPPETTO.on(GEPPETTO.Events.Show_spinner, function(label) {
				that.showSpinner(label);
			});
			
			GEPPETTO.on(GEPPETTO.Events.Hide_spinner, function(label) {
				setTimeout(that.hideSpinner, 500);
			});
		},
		
		render: function () {
			if(this.visible){
				return (
		            	<div className="modal fade" id="loading-spinner">
		            		<div className="spinner-backdrop">
			            		<div className="spinner-container">
			            			<div className={this.state.logo + " fa-spin"}></div>
			            			<p id="loadingmodaltext" className="orange">{this.state.text}</p>
			            		</div>
		            		</div>
		            	</div>
		            	);
		    }
			return null;
		}
            
	});
});
