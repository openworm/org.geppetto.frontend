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
openworm.FakeSimulationServer = function(clientConnection)
{
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



/**
 * Handles a request.
 * 
 * @param {string}
 *            msg A simple string request message.
 */
openworm.FakeSimulationServer.prototype.request = function(msg)
{
	switch (msg)
	{
	case 'init_scene':
		this.getScene_();
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
 * 
 * @private
 */
openworm.FakeSimulationServer.prototype.sendMsgToClient_ = function(msg)
{
	this.clientConnection_.onmessage(msg);
};


/** @private */
openworm.FakeSimulationServer.prototype.startSimulation_ = function()
{
	this.running_ = true;
	var updateFn = _.bind(this.getScene_, this);
	this.inteval_ = window.setInterval(updateFn, openworm.FakeSimulationServer.SIMULATION_UPDATE_INTERVAL_MSEC_);
};

/** @private */
openworm.FakeSimulationServer.prototype.stopSimulation_ = function()
{
	this.running_ = false;
	window.clearInterval(this.interval_);
};

/**
 * Update the positions of the particles.
 * 
 * @private
 */
openworm.FakeSimulationServer.prototype.getScene_ = function()
{
	var scene = {};

	scene.entities = [];
	
	scene.entities[0] = this.generateParticleEntity("e0",-100,100,0,20,-15,15,20);
	scene.entities[1] = this.generateParticleEntity("e1",-200,200,-5,0,-200,200,30);

	msg = {
		'type' : 'scene_updated',
		'data' : scene
	};
	this.sendMsgToClient_(msg);
};

openworm.FakeSimulationServer.prototype.generateParticleEntity=function(id,XMIN,XMAX,YMIN,YMAX,ZMIN,ZMAX,DIM_MAX)
{
	entity = {};
	geometries=[];
	entity.geometries=geometries;
	entity.id=id;
	
	for ( var i = 0; i < DIM_MAX; i++)
	{
		for ( var j = 0; j < DIM_MAX; j++)
		{
			for ( var k = 0; k < DIM_MAX; k++)
			{
				geometry = {};
				geometry.type = "Particle";
				geometry.id=id+".p."+i+"."+j+"."+k;
				geometry.position = {};
				geometry.position.x = (this.scale_(XMIN, XMAX, Math.random()));
				geometry.position.y = (this.scale_(YMIN, YMAX, Math.random()));
				geometry.position.z = (this.scale_(ZMIN, ZMAX, Math.random()));
				geometries.push(geometry);
			}
		}
	}
	return entity;
};

/**
 * Helper function for scaling.
 * 
 * @private
 */
openworm.FakeSimulationServer.prototype.scale_ = function(min, max, x)
{
	return min + x * (max - min);
};
