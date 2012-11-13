/**
 * @fileoverview Script that runs the particles demo with a mocked-out
 * WebSocket connection (all client-side).
 *
 * The state of the simulation, e.g. particle positions, is stored on the
 * server. The server sends messages to the client via the WebSocket connection
 * updating the positions of the particles. Meanwhile an animation loop runs
 * on the client-side to update the view. As a starting point, we can make the
 * server updates faster than the animation loop updates.  However, we need to
 * think about what happens, if anything, when the server ever lags behind the
 * animation loop.
 *
 * @author gleb.kuznetsov@gmail.com (Gleb Kuznetsov)
 */


(function() {

  //============================================================================
  // Setup the WebSocket connection.
  //============================================================================

  // Mock out the built-in WebSocket constructor.
  window['WebSocket'] = openworm.FakeWebSocketClient;

  // Construct the WebSocket connection.
  var websocket = new WebSocket('');
  websocket.onopen = function(e) {onOpen(e)};
  websocket.onclose = function(e) {onClose(e)};
  websocket.onmessage = function(e) {onMessage(e)};
  websocket.onerror = function(e) {onError(e)};

  function onOpen(e) {
    window.console.log('CONNECTED');
    websocket.send('init_particles');
  }

  function onClose(e) {
    window.console.log('DISCONNECTED');
  }

  function onMessage(e) {
    switch(msg.type) {
      case 'particles_initialized':
        makeParticles(JSON.parse(msg.data));
        break;
      case 'particles_updated':
        updateParticles(JSON.parse(msg.data));
        break;
      default:
        window.console.log('Client does not understand message from server', msg);
        break;
    }
  }

  function onError(e) {
    window.console.log('WebSockets error.');
  }

  //============================================================================
  // Setup the Three.js stuff.
  //============================================================================

  // the main three.js components
  var camera, scene, renderer;

  var HEIGHT;
  var WIDTH;

  var CAMERA_NEAR = 1;
  var CAMERA_FAR = 4000;

  // Reservoir bounds.
  var XMIN = 0;
  var XMAX = 100;
  var YMIN = 0;
  var YMAX = 40;
  var ZMIN = 0;
  var ZMAX = 40;

  var PARTICLE_COUNT = 32 * 32;

  // Whether the animation is playing.
  var show = false;

  // Track mouse state.
  var isMouseDown = false;
  var onMouseDownPosition = new THREE.Vector2();

  // Camera-related params.
  var radius = 100;
  var theta = 45;
  var onMouseDownTheta = 45;
  var phi = 60;
  var onMouseDownPhi = 60;
  var	mouse3D;

  // An array to store our particles in.
  var particles = {};

  $(document).ready(function() {
    init();
  });


  function init() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // Camera params:
    // field of view, aspect ratio for render output, near and far clipping plane.
    camera = new THREE.PerspectiveCamera(80, WIDTH / HEIGHT, 1, 4000);

    // Start the camera back a bit so we can see stuff!
    // default position is 0,0,0.
    camera.position.z = 100;

    //camera.target.position.y = 200;
    //camera.position.y = 100;
    //camera.rotation.z = 10 * Math.PI / 180

    // The scene contains all the 3D object data.
    scene = new THREE.Scene();

    // The camera must be added to the scene.
    scene.add(camera);

    // and the CanvasRenderer figures out what the
    // stuff in the scene looks like and draws it!
    renderer = new THREE.CanvasRenderer();
    renderer.setSize(WIDTH, HEIGHT);

    // the renderer's canvas domElement is added to the body
    document.body.appendChild(renderer.domElement);

    createReservoirFromCubeGeometry();

    // add the mouse move listener
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mousedown', onMouseClick, false);
    renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false );
    renderer.domElement.addEventListener('mousewheel', onDocumentMouseWheel, false);
  }

  function createReservoirFromCubeGeometry() {
    var cubeWidth = XMAX - XMIN;
    var cubeDepth = YMAX - YMIN;
    var cubeHeight = ZMAX - ZMIN;
    var geometry = new THREE.CubeGeometry(cubeWidth, cubeDepth, cubeHeight);
    var material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    });
    var mesh = new THREE.Mesh( geometry, material );
    scene.add(mesh);

    render();
  }


  function render() {
    renderer.render(scene, camera);
  }


  function makeParticles(particlePositionData) {
    var material = new THREE.ParticleCanvasMaterial({
      color : 0xffffff,
      program : particleRender
    });
    for (particleId in particlePositionData) {
      var particlePosition = particlePositionData[particleId];
      var particleView = new THREE.Particle(material);
      particleView.position.x = particlePosition[0];
      particleView.position.y = particlePosition[1];
      particleView.position.z = particlePosition[2];
      particleView.scale.x = particleView.scale.y = 0.3;
      scene.add(particleView);
      particles[particleId] = particleView;
    }
    render();
  }


  /**
   * There isn't a built in circle particle renderer
   * so we have to define our own.
   */
  function particleRender(context) {

    // we get passed a reference to the canvas context
    context.beginPath();

    // and we just have to draw our shape at 0,0 - in this
    // case an arc from 0 to 2Pi radians or 360? - a full circle!
    context.arc(0, 0, 1, 0, Math.PI * 2, true);
    context.fill();
  };


  /**
   * Moves all the particles dependent on mouse position.
   */
  function updateParticles(updatedParticlePositions) {
    if(show) {
      for (particleId in updatedParticlePositions) {
        var particlePosition = updatedParticlePositions[particleId];
        var particleView = particles[particleId]
        particleView.position.x = particlePosition[0];
        particleView.position.y = particlePosition[1];
        particleView.position.z = particlePosition[2];
      }
      render();
    }
  }


  /**
   * Called when the mouse moves.
   */
  function onMouseMove(event) {
    // store the mouseX and mouseY position
    event.preventDefault();

    if ( isMouseDown ) {
      theta = - ( ( event.clientX - onMouseDownPosition.x ) * 0.5 )
          + onMouseDownTheta;
      phi = ( ( event.clientY - onMouseDownPosition.y ) * 0.5 )
          + onMouseDownPhi;

      phi = Math.min( 180, Math.max( 0, phi ) );

      camera.position.x = radius * Math.sin( theta * Math.PI / 360 )
                * Math.cos( phi * Math.PI / 360 );
      camera.position.y = radius * Math.sin( phi * Math.PI / 360 );
      camera.position.z = radius * Math.cos( theta * Math.PI / 360 )
                * Math.cos( phi * Math.PI / 360 );
      camera.lookAt( scene.position );
    }

    render();
  }


  function onMouseClick(event) {
    event.preventDefault();

    if(event.button == 0){
      isMouseDown = true;
      onMouseDownTheta = theta;
      onMouseDownPhi = phi;
      onMouseDownPosition.x = event.clientX;
      onMouseDownPosition.y = event.clientY;
    }

    if(event.button == 2) {
      var msg = show ? 'stop' : 'start';
      websocket.send(msg);
      show = !show;
    }
  }


  function onDocumentMouseWheel( event ) {
    if(event.wheelDeltaY>0) {
      radius += 10; //event.wheelDeltaY;
    } else {
      radius -= 10;
    }

    camera.position.x = radius * Math.sin( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.position.y = radius * Math.sin( phi * Math.PI / 360 );
    camera.position.z = radius * Math.cos( theta * Math.PI / 360 ) * Math.cos( phi * Math.PI / 360 );
    camera.updateMatrix();

    render();
  }


  function onDocumentMouseUp(event) {
    event.preventDefault();
    isMouseDown = false;
    onMouseDownPosition.x = event.clientX - onMouseDownPosition.x;
    onMouseDownPosition.y = event.clientY - onMouseDownPosition.y;
  }

}());

