/*******************************************************************************
 *
 * Copyright (c) 2011, 2016 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *      OpenWorm - http://openworm.org/people.html
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 *******************************************************************************/



define(function (require) {

    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = "geppetto/js/components/dev/panel/Panel.css";
    document.getElementsByTagName("head")[0].appendChild(link);
	
	var React = require('react');
	
	//http://blog.krawaller.se/posts/a-react-app-demonstrating-css3-flexbox/
	//http://jaketrent.com/post/send-props-to-children-react/
	
	var defaultParentStyle = {'flexDirection':'column','justifyContent':'flex-start','alignItems':'flex-start','flexWrap':'nowrap','alignContent':'flex-start'};
	var defaultChildStyle = {'alignSelf': 'auto', 'flexGrow': 0, 'order': 0, 'display': 'inline-block'};
	
	var panelComponent = React.createClass({
		
		getInitialState: function() {
            return {
            	parentStyle: this.props.parentStyle,
            	items: this.props.items
            };
        },
        
        getDefaultProps: function(){
        	return {
            	parentStyle: defaultParentStyle,
            	items: []
            };
        },
        
        addChildren: function(items){
        	this.setState({ items: this.state.items.concat(items) });
        },
        
        setDirection: function(direction){
        	var currentStyle = this.state.parentStyle;
        	currentStyle['flexDirection'] = direction;
        	this.setState({ parentStyle:  currentStyle});
        },
		
         render: function(){
        	 var itemComponents = this.state.items.map(function (item) {		            			 
    			 return (<div key={item.props.id} style={defaultChildStyle}>{item}</div>);
    		 });
        	 
             return (
        		 <div className="panelContainer" style={this.props.parentStyle}>
        		 	{itemComponents}
        		 </div>
             );
         }
     });
	
	return panelComponent;
	
});