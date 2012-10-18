/**
 * @fileoverview Implementation of a fake server which stores the state of the
 * simulation, e.g. particle positions. Once we are using real WebSockets,
 * this role will be played by the Openworm SimulationEngine written in Java.
 *
 * @author gleb.kuznetsov@gmail.com (Gleb Kuznetsov)
 */



/**
 * @constructor
 */
openworm.FakeSimulationServer = function(clientConnection) {
  // Reference to the client for sending messages.
  this.clientConnection_ = clientConnection;

  // Map from particle id to position.
  // For now we only deal with particles positions.
  // TODO(gleb): JSON-ify the communication layer.
  this.particles_ = {};

  // Whether the simulation is running.
  this.running_ = false;

  // The simulation loop that updates the positions of the particles.
  this.simulationLoop_ = null;
};


// Update ~30 times / sec
openworm.FakeSimulationServer.SIMULATION_UPDATE_INTERVAL_MSEC_ = 1000 / 15;


// Boundary variables.
// TODO(gleb): Figure out how to share these properly with the frontend
// rather than just duplicating them.
var XMIN = 0;
var XMAX = 100;
var YMIN = 0;
var YMAX = 40;
var ZMIN = 0;
var ZMAX = 40;


/**
 * Handles a request.
 * @param {string} msg A simple string request message.
 */
openworm.FakeSimulationServer.prototype.request = function(msg) {
  switch(msg) {
    case 'init_particles':
      this.initializeParticles_();
      break;
    case 'start':
      this.startSimulation_();
      break;
    case 'stop':
      this.stopSimulation_();
      break;
    default:
      window.console.log('Unknown request msg to server', msg);
      break;
  }
};


/**
 * Send a message to the client directly.
 * @private
 */
openworm.FakeSimulationServer.prototype.sendMsgToClient_ = function(msg) {
  this.clientConnection_.onmessage(msg);
};


/**
 * Create a bunch of particles at semi-random positions.
 * @private
 */
openworm.FakeSimulationServer.prototype.initializeParticles_ = function() {
  window.console.log('Initializing particles.');

  // Number of particles is DIM_MAX ^ 3.
  var DIM_MAX = 12;

  var x, y, z;
  var r = 2.076;//2.47;

  var idCounter = 0;
  for(var i = 0; i < DIM_MAX; i++) {
    for(var j = 0; j < DIM_MAX; j++) {
      for(var k = 0; k < DIM_MAX; k++) {
        x = (r * i - XMAX / 2);
        y = (r * j - YMAX / 2);
        z = (r * k - ZMAX / 2);
        this.particles_[idCounter++] = [x, y, z];
      }
    }
  }

  msg = {
    'type': 'particles_initialized',
    'data': JSON.stringify(this.particles_),
  }
  this.sendMsgToClient_(msg);
};


/** @private */
openworm.FakeSimulationServer.prototype.startSimulation_ = function() {
  this.running_ = true;
  var updateFn = _.bind(this.updateParticles_, this);
  this.inteval_ = window.setInterval(updateFn,
      openworm.FakeSimulationServer.SIMULATION_UPDATE_INTERVAL_MSEC_);
};


/** @private */
openworm.FakeSimulationServer.prototype.stopSimulation_ = function() {
  this.running_ = false;
  window.clearInterval(this.interval_);
};


/**
 * Update the positions of the particles.
 * @private
 */
openworm.FakeSimulationServer.prototype.updateParticles_ = function() {
  if (!this.running_) {
    return;
  }

  var updatedParticles = {};

  for (particleId in this.particles_) {
    particle = this.particles_[particleId];
    x = (this.scale_(XMIN, XMAX, Math.random()) - XMAX/2);
    y = (this.scale_(YMIN, YMAX, Math.random()) - YMAX/2);
    z = (this.scale_(ZMIN, ZMAX, Math.random()) - ZMAX/2);
    particle = [x, y, z];
    updatedParticles[particleId] = particle;
  }

  msg = {
    'type': 'particles_updated',
    'data': JSON.stringify(updatedParticles)
  };
  this.sendMsgToClient_(msg);

  // TODO(gleb): Maybe try sending one particle at a time as it's updated?
};


/**
 * Helper function for scaling.
 * @private
 */
openworm.FakeSimulationServer.prototype.scale_ = function(min, max, x){
  return min+x *(max-min);
};
