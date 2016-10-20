/**
 * @author Eberhard Graether / http://egraether.com/
 */
var THREE = window.THREE || require('three-js')();

THREE.TrackballControls = function ( object, domElement ) {

	var _this = this;
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM: 4, TOUCH_PAN: 5 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;

	// API

	this.enabled = true;

	this.screen = { width: 0, height: 0, offsetLeft: 0, offsetTop: 0 };
	this.radius = ( this.screen.width + this.screen.height ) / 4;

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.logDecimalPlaces = 3;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals
	this.cameraByConsoleLock = true;
	this.cameraChanged = false;

	this.target = new THREE.Vector3();

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector3(),
	_rotateEnd = new THREE.Vector3(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events

	var changeEvent = { type: 'change' };


	// methods

	this.handleResize = function () {

		this.screen.width = window.innerWidth;
		this.screen.height = window.innerHeight;

		this.screen.offsetLeft = 0;
		this.screen.offsetTop = 0;

		this.radius = ( this.screen.width + this.screen.height ) / 4;

	};

	this.handleEvent = function ( event ) {

		if ( typeof this[ event.type ] == 'function' ) {

			this[ event.type ]( event );

		}

	};

	this.getMouseOnScreen = function ( clientX, clientY ) {

		return new THREE.Vector2(
			( clientX - _this.screen.offsetLeft ) / _this.radius * 0.5,
			( clientY - _this.screen.offsetTop ) / _this.radius * 0.5
		);

	};

	this.getMouseProjectionOnBall = function ( clientX, clientY ) {

		var mouseOnBall = new THREE.Vector3(
			( clientX - _this.screen.width * 0.5 - _this.screen.offsetLeft ) / _this.radius,
			( _this.screen.height * 0.5 + _this.screen.offsetTop - clientY ) / _this.radius,
			0.0
		);

		var length = mouseOnBall.length();

		if ( length > 1.0 ) {

			mouseOnBall.normalize();

		} else {

			mouseOnBall.z = Math.sqrt( 1.0 - length * length );

		}

		_eye.copy( _this.object.position ).sub( _this.target );

		var projection = _this.object.up.clone().setLength( mouseOnBall.y );
		projection.add( _this.object.up.clone().cross( _eye ).setLength( mouseOnBall.x ) );
		projection.add( _eye.setLength( mouseOnBall.z ) );

		return projection;

	};

	this.unsetCameraByConsoleLock = function () {
		_this.cameraByConsoleLock = false;
	}

	this.setCameraByConsole = function () {
		if (_this.cameraByConsoleLock)
			return;

		// Decimal places;
		var places = _this.logDecimalPlaces;

		var p = _this.object.position.toArray();

		GEPPETTO.Console.executeCommand('G.setCameraPosition('+p[0].toFixed(places)+
																												 ','+p[1].toFixed(places)+
																												 ','+p[2].toFixed(places)+
																												 ')');

		var u = _this.object.rotation.toArray();
		var l = _eye.length();

		GEPPETTO.Console.executeCommand('G.setCameraRotation('+u[0].toFixed(places)+
																												 ','+u[1].toFixed(places)+
																												 ','+u[2].toFixed(places)+
																												 ','+l.toFixed(places)+
																												 ')');

		_this.cameraByConsoleLock = true;
		_this.cameraChanged = false;
	}

	this.allSteady = function () {
		var u = _this.lastUp;
		var p = _this.lastPosition;
		var nu = _this.object.up.toArray();
		var np = _this.object.position.toArray();

		var threshold = 1/(10*_this.logDecimalPlaces);

		var steady = Math.abs(u[0]+u[1]+u[2] - (nu[0]+nu[1]+nu[2])) < threshold &&
								 Math.abs(p[0]+p[1]+p[2] - (np[0]+np[1]+np[2])) < threshold;

		// Console logging is unlocked, this means
		// we had an input event
		if (!_this.cameraByConsoleLock) {
			// If the camera moved, set cameraChanged
			// if not, keep it
			if (!steady) {
				_this.cameraChanged = true;
			}
		}

		return steady;
	}

	this.rotateCamera = function () {
		var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );

		// Verify if we do have and rotation to apply
		// e.g.: angle isn't 0
		if ( angle ) {
			// Around where do we want to rotate the camera by `angle` degrees?
			var axis = ( new THREE.Vector3() ).crossVectors( _rotateStart, _rotateEnd ).normalize();
			// Blank quaternion
			var quaternion = new THREE.Quaternion();

			// _this.rotateSpeed contains a fraction, for example:
			// 1/60 if we want to fully rotate after 60 interactions.
			angle *= _this.rotateSpeed;

			quaternion.setFromAxisAngle( axis, -angle );

			// Rotate _eye by the angle around the axis
			_eye.applyQuaternion( quaternion );
			_this.object.up.applyQuaternion( quaternion );

			_rotateEnd.applyQuaternion( quaternion );

			if ( _this.staticMoving ) {

				_rotateStart.copy( _rotateEnd );

			} else {

				quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
				_rotateStart.applyQuaternion( quaternion );

			}

		}

	};

	this.zoomCamera = function () {

		if ( _state === STATE.TOUCH_ZOOM ) {

			var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );

		} else {

			var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;

			if ( factor !== 1.0 && factor > 0.0 ) {

				_eye.multiplyScalar( factor );

				if ( _this.staticMoving ) {

					_zoomStart.copy( _zoomEnd );

				} else {

					_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;

				}

			}

		}

	};

	this.panCamera = function () {

		var mouseChange = _panEnd.clone().sub( _panStart );

		if ( mouseChange.lengthSq() ) {

			mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );

			var pan = _eye.clone().cross( _this.object.up ).setLength( mouseChange.x );
			pan.add( _this.object.up.clone().setLength( mouseChange.y ) );

			_this.object.position.add( pan );
			_this.target.add( pan );

			if ( _this.staticMoving ) {

				_panStart = _panEnd;

			} else {

				_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );

			}

		}

	};

	// Keeps the trackball radius between
	// _this.maxDistance and _this.minDistance
	this.checkDistances = function () {

		// Zoom or Panning disabled
		if ( !_this.noZoom || !_this.noPan ) {

			// Length of the camera's position vector is > than _this.maxDistance?
			if ( _this.object.position.lengthSq() > _this.maxDistance * _this.maxDistance ) {

				// Clamp the vector to _this.maxDistance
				_this.object.position.setLength( _this.maxDistance );

			}

			//    Is the trackball radius < _this.minDistance?
			// or Is the distance from the camera to the trackball's center < _this.minDistance?
			// or Is the distance from the camera to the target < _this.minDistance?
			// (all explanations are equivalent)
			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {

				// The camera position = trackball's center + _eye, with the detail
				// that _eye is clampped to _this.minDistance
				// e.g.: set the trackball radius to _this.minDistance
				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );

			}

		}

	};

	this.update = function () {
		// Saves the lastUp & lastPosition coordinates to use them
		// later to calculate the delta change after applying rotation/zoom/pan,
		// which is used by allSteady() to find if the scene is steady
		// or moving
		_this.lastUp = _this.object.up.toArray();
		_this.lastPosition = _this.object.position.toArray();

		// eye = camera position - center of the trackball
		// e.g.: eye = vector from the center of the trackball to the camera
		// position
		_eye.subVectors( _this.object.position, _this.target );

		if ( !_this.noRotate ) {

			_this.rotateCamera();

		}

		if ( !_this.noZoom ) {

			_this.zoomCamera();

		}

		if ( !_this.noPan ) {

			_this.panCamera();

		}

		// Put the camera at the center of the trackball + the eye vector
		_this.object.position.addVectors( _this.target, _eye );

		// Keeps the trackball radius between _this.minDistance & _this.maxDistance
		_this.checkDistances();

		// Turns the camera to the center of the trackball
		_this.object.lookAt( _this.target );

		// Has the camera moved?
		if ( lastPosition.distanceToSquared( _this.object.position ) > 0 ) {
			// Fire an event telling it moved
			_this.dispatchEvent( changeEvent );

			// Save the new position
			lastPosition.copy( _this.object.position );
		}

		// Has the camera stopped moving? (&& has the camera started moving)
		if (_this.allSteady() && _this.cameraChanged) {
			// Log the camera's position
			_this.setCameraByConsole();
		}
	};

	this.setPosition = function (x, y, z) {
		_this.object.position.set(x, y, z);

		var u = _this.object.rotation.toArray();
		var l = _eye.length();

		_this.setRotation(u[0], u[1], u[2], l);
	}

	this.setRotation = function (x, y, z, radius) {
		_state = STATE.NONE;
		_prevState = STATE.NONE;

		var base = new THREE.Vector3(0,0,-1);
		base.applyEuler(new THREE.Euler(x,y,z));
		base.multiplyScalar(radius);

		_this.target.addVectors(_this.object.position, base);
		_this.object.up.copy( _this.up0 );
		_this.object.up.applyEuler(new THREE.Euler(x,y,z));

		_eye.subVectors(_this.object.position, _this.target);

		_this.object.lookAt (_this.target);

		_this.dispatchEvent(changeEvent);
	}

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_eye.subVectors( _this.object.position, _this.target );

		_this.object.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	};

	// listeners

	function keydown( event ) {
		_this.cameraByConsoleLock = true;

		if ( _this.enabled === false ) return;

		window.removeEventListener( 'keydown', keydown );

		_prevState = _state;

		if ( _state !== STATE.NONE ) {

			return;

		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {

			_state = STATE.ROTATE;

		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {

			_state = STATE.ZOOM;

		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {

			_state = STATE.PAN;

		}

	}

	function keyup( event ) {

		if ( _this.enabled === false ) return;

		_state = _prevState;

		window.addEventListener( 'keydown', keydown, false );

	}

	function mousedown( event ) {
		_this.cameraByConsoleLock = true;

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.NONE ) {

			_state = event.button;

		}

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomStart = _zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panStart = _panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

	}

	function mousemove( event ) {
		_this.cameraByConsoleLock = true;

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateEnd = _this.getMouseProjectionOnBall( event.clientX, event.clientY );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panEnd = _this.getMouseOnScreen( event.clientX, event.clientY );

		}

	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );

		_this.unsetCameraByConsoleLock();
	}

	function mousewheel( event ) {
		_this.cameraByConsoleLock = true;

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta / 40;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail / 3;

		}

		_zoomStart.y += delta * 0.01;

		_this.unsetCameraByConsoleLock();
	}

	function touchstart( event ) {
		_this.cameraByConsoleLock = true;

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:
				_state = STATE.TOUCH_ZOOM;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );
				break;

			case 3:
				_state = STATE.TOUCH_PAN;
				_panStart = _panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchmove( event ) {
		_this.cameraByConsoleLock = true;

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				_rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy )
				break;

			case 3:
				_panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_rotateStart = _rotateEnd = _this.getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

			case 2:
				_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
				break;

			case 3:
				_panStart = _panEnd = _this.getMouseOnScreen( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;

		}

		_state = STATE.NONE;

		_this.unsetCameraByConsoleLock();
	}

	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousedown', mousedown, false );

	this.domElement.addEventListener( 'mousewheel', mousewheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

	this.domElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );

	window.addEventListener( 'keydown', keydown, false );
	window.addEventListener( 'keyup', keyup, false );

	this.handleResize();

	//Addition
	this.resetSTATE = function()
	{
		_state = STATE.NONE;
	};

	this.incrementRotationEnd = function(valX, valY, valZ)
	{
		if (_rotateStart.x === 0 && _rotateStart.y === 0 && _rotateStart.z === 0)
		{
			_rotateStart = new THREE.Vector3(0.1,0.1,0.1);
		}
		_rotateEnd = new THREE.Vector3(_rotateStart.x + valX, _rotateStart.y + valY, _rotateStart.z + valZ);
		_prevState = _state;
		_state = STATE.ROTATE;
		_this.noRotate = false;

		_this.unsetCameraByConsoleLock();
	};

	this.incrementPanEnd = function(valX, valY)
	{
		_panEnd = new THREE.Vector2(_panStart.x + valX, _panStart.y + valY);
		_prevState = _state;
		_state = STATE.PAN;
		_this.noPan = false;

		_this.unsetCameraByConsoleLock();
	};

	this.incrementZoomEnd = function(val)
	{
		_zoomEnd.y = _zoomStart.y + val;
		_prevState = _state;
		_state = STATE.ZOOM;
		_this.noZoom = false;

		_this.unsetCameraByConsoleLock();
	};
};


THREE.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );
