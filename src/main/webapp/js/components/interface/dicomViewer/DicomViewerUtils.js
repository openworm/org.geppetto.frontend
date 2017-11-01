var AMI = require('./ami.min.js');
var CamerasOrthographic = AMI.default.Cameras.Orthographic;
var ControlsOrthographic = AMI.default.Controls.TrackballOrtho;
var HelpersStack = AMI.default.Helpers.Stack;
var ControlsTrackball = AMI.default.Controls.Trackball;
var HelpersLocalizer = AMI.default.Helpers.Localizer;

module.exports = {
    windowResize2D: function (rendererObj) {
        var newWidth = rendererObj.domElement.clientWidth;
        var newHeight = rendererObj.domElement.clientHeight;
        rendererObj.camera.canvas = {
            width: newWidth,
            height: newHeight,
        };
        rendererObj.camera.fitBox(2, 1);
        rendererObj.renderer.setSize(newWidth, newHeight);

        // update info to draw borders properly
        // TODO: Remove once we are sure to remove the dotted line doesn't have any side effect
        // rendererObj.stackHelper.slice.canvasWidth = newWidth;
        // rendererObj.stackHelper.slice.canvasHeight = newHeight;
        rendererObj.stackHelper.slice.canvasWidth = -1;
        rendererObj.stackHelper.slice.canvasHeight = -1;
        rendererObj.localizerHelper.canvasWidth = newWidth;
        rendererObj.localizerHelper.canvasHeight = newHeight;
    },

    windowResize3D: function (rendererObj) {
        var newWidth = rendererObj.domElement.clientWidth;
        var newHeight = rendererObj.domElement.clientHeight;
        rendererObj.camera.aspect = newWidth / newHeight;
        rendererObj.camera.updateProjectionMatrix();
        rendererObj.renderer.setSize(newWidth, newHeight);
    },

    dispose: function (rendererObj) {
    	if(rendererObj.stackHelper!=undefined){
    		rendererObj.stackHelper.dispose();
			if(rendererObj.stackHelper.stack!=undefined){
				rendererObj.stackHelper.stack._rawData.length=0;
				rendererObj.stackHelper.stack._frame.length=0;
				rendererObj.stackHelper.stack=null;	
			}
    	}
    	if(rendererObj.localizerHelper!=undefined){
    	    if (rendererObj.localizerHelper._mesh) {
    	    	rendererObj.localizerHelper.remove(rendererObj.localizerHelper._mesh);
    	    	rendererObj.localizerHelper._mesh.geometry.dispose();
    	    	rendererObj.localizerHelper._mesh.geometry = null;
    	    	rendererObj.localizerHelper._mesh = null;
	    	}
    	}
    },
    
    initHelpersStack: function (rendererObj, stack) {
    	if(rendererObj.stackHelper!=undefined){
    		rendererObj.stackHelper.dispose();
			if(rendererObj.stackHelper.stack!=undefined){
				rendererObj.stackHelper.stack._rawData.length=0;
				rendererObj.stackHelper.stack._frame.length=0;
				rendererObj.stackHelper.stack=null;	
			}
			
    	}
        rendererObj.stackHelper = new HelpersStack(stack);
        rendererObj.stackHelper.bbox.visible = false;
        rendererObj.stackHelper.borderColor = rendererObj.sliceColor;

        // TODO: Remove once we are sure to remove the dotted line doesn't have any side effect
        // rendererObj.stackHelper.slice.canvasWidth = rendererObj.domElement.clientWidth;
        // rendererObj.stackHelper.slice.canvasHeight = rendererObj.domElement.clientHeight;
        rendererObj.stackHelper.slice.canvasWidth = -1;
        rendererObj.stackHelper.slice.canvasHeight = -1;

        // set camera
        let worldbb = stack.worldBoundingBox();
        let lpsDims = new THREE.Vector3(
            (worldbb[1] - worldbb[0]) / 2,
            (worldbb[3] - worldbb[2]) / 2,
            (worldbb[5] - worldbb[4]) / 2
        );

        let box = {
            center: stack.worldCenter().clone(),
            halfDimensions: new THREE.Vector3(lpsDims.x + 5, lpsDims.y + 5, lpsDims.z + 5),
        };

        // init and zoom
        let canvas = {
            width: rendererObj.domElement.clientWidth,
            height: rendererObj.domElement.clientHeight,
        };

        rendererObj.camera.directions =
            [stack.xCosine, stack.yCosine, stack.zCosine];
        rendererObj.camera.box = box;
        rendererObj.camera.canvas = canvas;
        rendererObj.camera.orientation = rendererObj.sliceOrientation;
        rendererObj.camera.update();
        rendererObj.camera.fitBox(2, 1);

        rendererObj.stackHelper.orientation = rendererObj.camera.stackOrientation;
        rendererObj.stackHelper.index =
            Math.floor(rendererObj.stackHelper.orientationMaxIndex / 2);
        rendererObj.scene.add(rendererObj.stackHelper);
    },

    initHelpersLocalizer: function (rendererObj, stack, referencePlane, localizers) {
    	if(rendererObj.localizerHelper!=undefined){
    	    if (rendererObj.localizerHelper._mesh) {
    	    	rendererObj.localizerHelper.remove(rendererObj.localizerHelper._mesh);
    	    	rendererObj.localizerHelper._mesh.geometry.dispose();
    	    	rendererObj.localizerHelper._mesh.geometry = null;
    	    	rendererObj.localizerHelper._mesh = null;
	    	}
    	}
    	rendererObj.localizerHelper = new HelpersLocalizer(
            stack, rendererObj.stackHelper.slice.geometry, referencePlane);

        for (let i = 0; i < localizers.length; i++) {
            rendererObj.localizerHelper['plane' + (i + 1)] = localizers[i].plane;
            rendererObj.localizerHelper['color' + (i + 1)] = localizers[i].color;
        }

        rendererObj.localizerHelper.canvasWidth = rendererObj.domElement.clientWidth;
        rendererObj.localizerHelper.canvasHeight = rendererObj.domElement.clientHeight;

        rendererObj.localizerScene = new THREE.Scene();
        rendererObj.localizerScene.add(rendererObj.localizerHelper);
    },

    updateLocalizer: function (refObj, targetLocalizersHelpers) {
        let refHelper = refObj.stackHelper;
        let localizerHelper = refObj.localizerHelper;
        let plane = refHelper.slice.cartesianEquation();
        localizerHelper.referencePlane = plane;

        // bit of a hack... works fine for this application
        for (let i = 0; i < targetLocalizersHelpers.length; i++) {
            for (let j = 0; j < 4; j++) {
                let targetPlane = targetLocalizersHelpers[i]['plane' + (j + 1)];
                if (targetPlane &&
                    plane.x === targetPlane.x &&
                    plane.y === targetPlane.y &&
                    plane.z === targetPlane.z) {
                    targetLocalizersHelpers[i]['plane' + (j + 1)] = plane;
                }
            }
        }

        // update the geometry will create a new mesh
        localizerHelper.geometry = refHelper.slice.geometry;
    },

    initRenderer2D: function (rendererObj, parentContainer) {
        // renderer
        rendererObj.domElement = parentContainer.getElementsByClassName(rendererObj.domClass)[0];
        rendererObj.domElement.innerHTML = '';
        rendererObj.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        rendererObj.renderer.autoClear = false;
        rendererObj.renderer.localClippingEnabled = true;
        rendererObj.renderer.setSize(rendererObj.domElement.clientWidth, rendererObj.domElement.clientHeight);
        rendererObj.renderer.setClearColor(0x121212, 1);
        rendererObj.renderer.setPixelRatio(window.devicePixelRatio);
        rendererObj.renderer.domElement.id = rendererObj.targetID;
        rendererObj.domElement.appendChild(rendererObj.renderer.domElement);

        // camera
        rendererObj.camera = new CamerasOrthographic(
            rendererObj.domElement.clientWidth / -2,
            rendererObj.domElement.clientWidth / 2,
            rendererObj.domElement.clientHeight / 2,
            rendererObj.domElement.clientHeight / -2,
            1, 1000);

        // controls
        rendererObj.controls = new ControlsOrthographic(
            rendererObj.camera, rendererObj.domElement);
        rendererObj.controls.staticMoving = true;
        rendererObj.controls.noRotate = true;
        rendererObj.controls.noPan = true;
        rendererObj.camera.controls = rendererObj.controls;

        // scene
        rendererObj.scene = new THREE.Scene();
    },

    initRenderer3D: function (renderObj, parentContainer) {
        // renderer
        renderObj.domElement = parentContainer.getElementsByClassName(renderObj.domClass)[0];
        renderObj.domElement.innerHTML = '';

        renderObj.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });
        renderObj.renderer.setSize(renderObj.domElement.clientWidth, renderObj.domElement.clientHeight);
        renderObj.renderer.setClearColor(renderObj.color, 1);
        renderObj.renderer.domElement.id = renderObj.targetID;
        renderObj.domElement.appendChild(renderObj.renderer.domElement);

        // camera
        renderObj.camera = new THREE.PerspectiveCamera(
            45, renderObj.domElement.clientWidth / renderObj.domElement.clientHeight,
            0.1, 100000);
        renderObj.camera.position.x = 250;
        renderObj.camera.position.y = 250;
        renderObj.camera.position.z = 250;

        // controls
        renderObj.controls = new ControlsTrackball(
            renderObj.camera, renderObj.domElement);
        renderObj.controls.rotateSpeed = 5.5;
        renderObj.controls.zoomSpeed = 0.6;
        renderObj.controls.panSpeed = 0.8;
        renderObj.controls.staticMoving = true;
        renderObj.controls.dynamicDampingFactor = 0.3;
        renderObj.controls.minDistance = 80;
        renderObj.controls.maxDistance = 500;

        // scene
        renderObj.scene = new THREE.Scene();

        // light
        renderObj.light = new THREE.DirectionalLight(0xffffff, 1);
        renderObj.light.position.copy(renderObj.camera.position);
        renderObj.scene.add(renderObj.light);

    }
};
