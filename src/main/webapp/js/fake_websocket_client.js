/**
 * @fileoverview Implementation of a fake WebSocket client which provides the
 * same API as the built-in Javascript WebSocket object.
 *
 * @author gleb.kuznetsov@gmail.com (Gleb Kuznetsov)
 */


/**
 * @constructor
 * @implements {WebSocket}
 */
openworm.FakeWebSocketClient = function() {
  // Clients must implement these.
  this.onopen = null;
  this.onerror = null;
  this.onclose = null;
  this.onmessage = null;

  // Open
  this.server_ = new openworm.FakeSimulationServer(this);

  // The native WebSocket connects upon construction so do that here as well.
  var connect = _.bind(function() {
    window.console.log('Connecting...');
    this.onopen();
  }, this);
  window.setTimeout(connect, openworm.FakeWebSocketClient.CONNECTION_DELAY_MSEC);
};


// Simulate a delay connecting.
openworm.FakeWebSocketClient.CONNECTION_DELAY_MSEC = 1000;


/** @override */
openworm.FakeWebSocketClient.prototype.send = function(msg) {
  window.console.log('Sending msg', msg);
  this.server_.request(msg);
};
