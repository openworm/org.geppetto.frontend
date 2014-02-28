/*******************************************************************************
 * The MIT License (MIT)
 *
 * Copyright (c) 2011, 2013 OpenWorm.
 * http://openworm.org
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the MIT License
 * which accompanies this distribution, and is available at
 * http://opensource.org/licenses/MIT
 *
 * Contributors:
 *     	OpenWorm - http://openworm.org/people.html
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
/**
 * Listener class for widgets. Receives updates from Geppetto that need to be transmitted to all widgets. 
 * 
 * @constructor
 * 
 * @author Jesus R Martinez (jesus@metacell.us)
 */

var WIDGET_EVENT_TYPE = {
		DELETE : "delete",
		UPDATE: "update"
};

WidgetsListener =  {

		_subscribers : [],

		/**
		 * Subscribes widget controller class to listener
		 * 
		 * @param obj - Controller Class subscribing
		 * @returns {Boolean}
		 */
		subscribe : function(obj){

			var addController = true;
			for( var i = 0, len = this._subscribers.length; i < len; i++ ) {
				if( this._subscribers[ i ] === obj ) {
					addController = false;
				}
			}
			if(addController){
				this._subscribers.push( obj );

				GEPPETTO.Console.debugLog( 'added new observer' );
			}
		},

		/**
		 * Unsubscribe widget controller class
		 * 
		 * @param obj - Controller class to be unsubscribed from listener
		 * 
		 * @returns {Boolean}
		 */
		unsubscribe : function(obj){
			for( var i = 0, len = this._subscribers.length; i < len; i++ ) {
				if( this._subscribers[ i ] === obj ) {
					this._subscribers.splice( i, 1 );
					GEPPETTO.Console.log( 'removed existing observer' );
					return true;
				}
			}
			return false;
		},

		/**
		 * Update all subscribed controller classes of the changes
		 * 
		 * @param newData 
		 */
		update : function(arguments){
			for( var i = 0, len = this._subscribers.length; i < len; i++ ) {
				this._subscribers[ i ].update( arguments );
			}
		}

};