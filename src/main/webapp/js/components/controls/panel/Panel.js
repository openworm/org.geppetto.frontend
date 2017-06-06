define(function (require) {

	var React = require('react');
	require("./Panel.less")
	var defaultChildStyle = {'alignSelf': 'auto', 'flexGrow': 0, 'order': 0};
	
	var panelComponent = React.createClass({
		
		getInitialState: function() {
			var defaultParentStyle = {'flexDirection':'column','justifyContent':'flex-start','alignItems':'flex-start','flexWrap':'nowrap','alignContent':'flex-start','display':'flex'};
			
			return {
            	parentStyle: $.extend(defaultParentStyle, this.props.parentStyle),
            	items: this.props.items
            };
        },
        
        addChildren: function(items){
        	this.setState({ items: this.state.items.concat(items) });
        },
        
        setChildren: function(items){
        	this.setState({ items: items });
        },
        
        componentWillReceiveProps: function(nextProps) {
  		  this.setState({
  			  items: nextProps.items
  		  });
  		},
        
        setDirection: function(direction){
        	var currentStyle = this.state.parentStyle;
        	currentStyle['flexDirection'] = direction;
        	this.setState({ parentStyle:  currentStyle});
        },
        
        componentDidMount : function(){
        	var comp = $('#' + this.props.id);
        	if (comp.parent().hasClass('dialog')){
        		comp.parent().height(comp.height() + 10);
        		comp.parent().parent().width(comp.width() + 70);
        	}
        },
		
         render: function(){
        	 var itemComponents = this.state.items.map(function (item) {		            			 
    			 return (<div key={item.props.id} style={defaultChildStyle}>{item}</div>);
    		 });
       	 
             return (
        		 <div className="panelContainer material" id={this.props.id} style={this.state.parentStyle}>
        		 	{itemComponents}
        		 </div>
             );
         }
     });
	
	return panelComponent;
	
});