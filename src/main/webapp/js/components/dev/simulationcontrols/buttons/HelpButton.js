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

    var React = require('react'),
        ReactDOM = require('react-dom'),
    	GEPPETTO = require('geppetto');
    	$ = require('jquery'),
        HelpModal = require('jsx!../../help/HelpModal');

    return React.createClass({
        mixins: [require('mixins/Button')],
        
        componentDidMount: function() {
        	
        	GEPPETTO.on('simulation:show_helpwindow',function(){
        		ReactDOM.render(React.createFactory(HelpModal)({show:true}), document.getElementById('modal-region'));

				$("#help-modal").css("margin-right", "-20px");
				$('#help-modal').css('max-height', $(window).height() * 0.7);
				$('#help-modal .modal-body').css('max-height', $(window).height() * 0.5);
            });
        	
            GEPPETTO.on('simulation:hide_helpwindow',function(){
            	GEPPETTO.ComponentFactory.addComponent('LOADINGSPINNER', {show : true, keyboard : false, logo: "gpt-gpt_logo"}, document.getElementById("modal-region"));
            });
        },

        getDefaultProps: function() {
            return {
                label: 'Help',
                id: 'genericHelpBtn',
                className: 'pull-right help-button',
                icon:'fa fa-info-circle',
                onClick: function(){ GEPPETTO.Console.executeImplicitCommand("G.showHelpWindow(true)"); }
            }
        }
    });
});
