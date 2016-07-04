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

define(function(require) {

	var React = require('react'),
		ReactDOM = require('react-dom'),
		GEPPETTO = require('geppetto');
	
	return React.createClass({		
		mixins: [require('jsx!mixins/bootstrap/modal')],

		getDefaultProps: function() {
			return {
				text :'Loading Experiment'
			};
		},
		
		componentDidMount: function(){
			GEPPETTO.once('hide:spinner', this.hide);
			setTimeout((function(){
				if(this.isMounted()){
					this.props.text = 'Loading is taking longer than usual, either a big project is being loaded or bandwidth is limited';
					this.forceUpdate();

					// this.setProps({text: 'Loading is taking longer than usual, either a big project is being loaded or bandwidth is limited'});
				}
			}).bind(this), 20000);
			
			setTimeout((function(){
				if(this.isMounted()){
					this.props.text = GEPPETTO.Resources.SPOTLIGHT_HINT;
					this.forceUpdate();

					// this.setProps({text: GEPPETTO.Resources.SPOTLIGHT_HINT});
				}
			}).bind(this), 3000);
		},
				
		render: function () {
            return (
            	<div className="modal fade" id="loading-spinner">
            		<div className="spinner-backdrop">
	            		<div className="spinner-container">
	            			<div className="gpt-gpt_logo fa-spin"></div>
	            			<p id="loadingmodaltext" className="orange">{this.props.text}</p>
	            		</div>
            		</div>
            	</div>
            	);
        }		
	});
});
