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
 * Simulation State object, keeps track of new values for state and receives updates for it. 
 * Subscribe objects received new data. 
 * 
 * @author Jesus R Martinez (jesus@metacel.us)
 */
function State(stateName, stateValue) {
	this.name = stateName;
	this.value = stateValue;	
	this._subscribers = [];	
};

/**
 * Update subscribed widgets to state with new values
 * 
 * @param newValue - new value for simulation state
 */
State.prototype.update = function(newValue){
	this.value = newValue;
	
	//var args = Array.prototype.slice.call( this.value, 0 );
	for( var i = 0, len = this._subscribers.length; i < len; i++ ) {		
		this._subscribers[ i ].updateDataSet(this.name, [this.value]);
	};
};

/**
 * Confirm widget is subscribed to state
 * 
 * @param object - widget to confirm subscription
 * @returns {Boolean} - True if subscribed, false otherwise
 */
State.prototype.isSubscribed = function(object){
	for(var i =0, len = this._subscribers.length; i<len; i++){
		if(this._subscribers[i] == object){
			return true;
		}
	}
	
	return false;
};
/**
 * Subscribes widget controller class to listener
 * 
 * @param obj - Controller Class subscribing
 * @returns {Boolean}
 */
State.prototype.subscribe = function(obj){

	this._subscribers.push( obj );	
};

/**
 * Unsubscribe widget controller class
 * 
 * @param obj - Controller class to be unsubscribed from listener
 * 
 * @returns {Boolean}
 */
State.prototype.unsubscribe = function(obj){
	for( var i = 0, len = this._subscribers.length; i < len; i++ ) {
		if( this._subscribers[ i ] === obj ) {
			this._subscribers.splice( i, 1 );
			return true;
		};
	}
	return false;
};