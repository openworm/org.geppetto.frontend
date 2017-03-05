define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/panel/Panel.css";
    document.getElementsByTagName("head")[0].appendChild(link);
	
	var React = require('react');
	
	//http://blog.krawaller.se/posts/a-react-app-demonstrating-css3-flexbox/
	//http://jaketrent.com/post/send-props-to-children-react/
	
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