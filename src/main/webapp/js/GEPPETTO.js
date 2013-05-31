/**
 * @fileoverview GEPPETTO Visualisation engine built on top of THREE.js. Displays
 * a scene as defined on org.geppetto.core
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 */

/**
 * Base class
 */

var GEPPETTO = GEPPETTO ||
{
	REVISION : '4dev'
};

/**
 * Global variables
 */
GEPPETTO.debug = true;
GEPPETTO.camera = null;
GEPPETTO.container = null;
GEPPETTO.controls = null;
GEPPETTO.scene = null;
GEPPETTO.renderer = null;
GEPPETTO.stat = null;
GEPPETTO.gui = null;
GEPPETTO.projector = null;
GEPPETTO.keyboard = new THREEx.KeyboardState();
GEPPETTO.jsonscene = null;
GEPPETTO.needsUpdate = false;
GEPPETTO.metadata =
{};
GEPPETTO.customUpdate = null;
GEPPETTO.mouseClickListener = null;
GEPPETTO.rotationMode = false;
GEPPETTO.mouse =
{
	x : 0,
	y : 0
};
GEPPETTO.geometriesMap = null;
GEPPETTO.plots = new Array();

/**
 * Initialize the engine
 */
GEPPETTO.init = function(containerp, updatep)
{
	if (!Detector.webgl)
	{
		Detector.addGetWebGLMessage();
		return false;
	}
	else
	{
		GEPPETTO.container = containerp;
		GEPPETTO.customUpdate = updatep;
		GEPPETTO.setupRenderer();
		GEPPETTO.setupScene();
		GEPPETTO.setupCamera();
		GEPPETTO.setupLights();
		GEPPETTO.setupStats();
		GEPPETTO.setupControls();
		GEPPETTO.setupListeners();
		return true;
	}
};

/**
 * Set a listener for mouse clicks
 * 
 * @param listener
 */
GEPPETTO.setMouseClickListener = function(listener)
{
	GEPPETTO.mouseClickListener = listener;
};

/**
 * Remove the mouse listener (it's expensive don't add it when you don't need it!)
 */
GEPPETTO.removeMouseClickListener = function()
{
	GEPPETTO.mouseClickListener = null;
};

/**
 * Creates a geometry according to its type
 * 
 * @param g
 * @param material
 * @returns a three mesh representing the geometry
 */
GEPPETTO.getThreeObjectFromJSONGeometry = function(g, material)
{
	var threeObject = null;
	switch (g.type)
	{
	case "Particle":
		threeObject = new THREE.Vector3();
		threeObject.x = g.position.x;
		threeObject.y = g.position.y;
		threeObject.z = g.position.z;
		break;
	case "Cylinder":
		var lookAtV = new THREE.Vector3(g.distal.x, g.distal.y, g.distal.z);
		var positionV = new THREE.Vector3(g.position.x, g.position.y, g.position.z);
		threeObject = GEPPETTO.getCylinder(positionV, lookAtV, g.radiusTop, g.radiusBottom, material);
		break;
	case "Sphere":
		threeObject = new THREE.Mesh(new THREE.SphereGeometry(g.radius, 20, 20), material);
		threeObject.position.set(g.position.x, g.position.y, g.position.z);
		break;
	}
	// add the geometry to a map indexed by the geometry id so we can find it
	// for updating purposes
	GEPPETTO.geometriesMap[g.id] = threeObject;
	return threeObject;
};

/**
 * Updates the scene
 */
GEPPETTO.updateScene = function()
{
	if (GEPPETTO.needsUpdate)
	{
		var entities = GEPPETTO.jsonscene.entities;

		for ( var eindex in entities)
		{
			var geometries = entities[eindex].geometries;

			for ( var gindex in geometries)
			{
				GEPPETTO.updateGeometry(geometries[gindex]);
			}

			var entityGeometry = GEPPETTO.geometriesMap[entities[eindex].id];
			if (entityGeometry)
			{
				// if an entity is represented by a particle system we need to
				// mark it as dirty for it to be updated
				if (entityGeometry instanceof THREE.ParticleSystem)
				{
					entityGeometry.geometry.verticesNeedUpdate = true;
				}
			}
		}
		GEPPETTO.needsUpdate = false;
	}
};

/**
 * Updates a THREE geometry from the json one
 * 
 * @param g
 *            the update json geometry
 */
GEPPETTO.updateGeometry = function(g)
{
	var threeObject = GEPPETTO.geometriesMap[g.id];
	if (threeObject)
	{
		if (threeObject instanceof THREE.Vector3)
		{
			threeObject.x = g.position.x;
			threeObject.y = g.position.y;
			threeObject.z = g.position.z;
		}
		else
		{
			// update the position
			threeObject.position.set(g.position.x, g.position.y, g.position.z);
		}
	}

};

/**
 * Creates a cylinder
 * 
 * @param bottomBasePos
 * @param topBasePos
 * @param radiusTop
 * @param radiusBottom
 * @param material
 * @returns a Cylinder translated and rotated in the scene according to the cartesian coordinated that describe it
 */
GEPPETTO.getCylinder = function(bottomBasePos, topBasePos, radiusTop, radiusBottom, material)
{
	var cylinderAxis = new THREE.Vector3();
	cylinderAxis.subVectors(topBasePos, bottomBasePos);

	var cylHeight = cylinderAxis.length();

	var midPoint = new THREE.Vector3();
	midPoint.addVectors(bottomBasePos, topBasePos);
	midPoint.multiplyScalar(0.5);

	var c = new THREE.CylinderGeometry(radiusTop, radiusBottom, cylHeight, 6, 1, false);

	c.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));

	threeObject = new THREE.Mesh(c, material);

	threeObject.lookAt(cylinderAxis);
	var distance = midPoint.length();

	midPoint.transformDirection(threeObject.matrix);
	midPoint.multiplyScalar(distance);

	threeObject.position.add(midPoint);
	return threeObject;
};

/**
 * Print a point coordinates on console
 * 
 * @param string
 * @param point
 */
GEPPETTO.printPoint = function(string, point)
{
	console.log(string + " (" + point.x + ", " + point.y + ", " + point.z + ")");
};

/**
 * @returns
 */
GEPPETTO.setupScene = function()
{
	GEPPETTO.scene = new THREE.Scene();
	GEPPETTO.geometriesMap =
	{};
};

GEPPETTO.populateScene = function(jsonscene)
{
	GEPPETTO.jsonscene = jsonscene;
	var entities = GEPPETTO.jsonscene.entities;
	for ( var eindex in entities)
	{
		GEPPETTO.scene.add(GEPPETTO.getThreeObjectFromJSONEntity(entities[eindex], eindex, true));
	}
};

GEPPETTO.isScenePopulated = function()
{
	for ( var g in GEPPETTO.geometriesMap)
	{
		return true;
	}
	return false;
};

/**
 * @param entity
 * @returns the subentities in which the entity was decomposed
 */
GEPPETTO.divideEntity = function(entity)
{
	var jsonEntities = GEPPETTO.jsonscene.entities;
	var jsonEntity = jsonEntities[entity.eindex];
	var newEntities = [];
	GEPPETTO.scene.remove(entity);

	var entityObject = GEPPETTO.getThreeObjectFromJSONEntity(jsonEntity, entity.eindex, false);
	if (entityObject instanceof Array)
	{
		for ( var e in entityObject)
		{
			GEPPETTO.scene.add(entityObject[e]);
			newEntities.push(entityObject[e]);
		}
	}
	else
	{
		GEPPETTO.scene.add(entityObject);
		newEntities.push(entityObject);
	}

	entity.geometry.dispose();
	return newEntities;
};

/**
 * @param entities
 *            the subentities
 * @returns the resulting parent entity in which the subentities were assembled
 */
GEPPETTO.mergeEntities = function(entities)
{
	var entityObject = null;
	if (entities[0].hasOwnProperty("parentEntityIndex"))
	{
		var jsonEntities = GEPPETTO.jsonscene.entities;
		var entityIndex = entities[0].parentEntityIndex;

		for ( var e in entities)
		{
			GEPPETTO.scene.remove(entities[e]);
			entities[e].geometry.dispose();
		}

		entityObject = GEPPETTO.getThreeObjectFromJSONEntity(jsonEntities[entityIndex], entityIndex, true);
		GEPPETTO.scene.add(entityObject);
	}
	return entityObject;
};

/**
 * @param jsonEntity
 *            the json entity
 * @param eindex
 *            the entity index within the json scene
 * @param mergeSubentities
 *            true if subentities have to be merged
 * @returns the resulting parent entity in which the subentities were assembled
 */
GEPPETTO.getThreeObjectFromJSONEntity = function(jsonEntity, eindex, mergeSubentities)
{
	var entityObject = null;
	if (jsonEntity.subentities && jsonEntity.subentities.length > 0)
	{
		// this entity is made of many subentities
		if (mergeSubentities)
		{
			// if mergeSubentities is true then only one resulting entity is
			// created
			// by merging all geometries of the different subentities together
			var material = new THREE.MeshPhongMaterial(
			{
				opacity : 1,
				ambient : 0x777777,
				specular : 0xbbbb9b,
				shininess : 50,
				shading : THREE.SmoothShading
			});
			material.color.setHex('0x' + (Math.random() * 0xFFFFFF << 0).toString(16));
			var combined = new THREE.Geometry();
			for ( var seindex in jsonEntity.subentities)
			{
				var threeObject = GEPPETTO.getThreeObjectFromJSONEntity(jsonEntity.subentities[seindex], mergeSubentities);
				THREE.GeometryUtils.merge(combined, threeObject);
				threeObject.geometry.dispose();
			}
			entityObject = new THREE.Mesh(combined, material);
			entityObject.eindex = eindex;
			entityObject.eid = jsonEntity.id;
			entityObject.geometry.dynamic = false;
		}
		else
		{
			entityObject = [];
			for ( var seindex in jsonEntity.subentities)
			{
				subentity = GEPPETTO.getThreeObjectFromJSONEntity(jsonEntity.subentities[seindex], mergeSubentities);
				subentity.parentEntityIndex = eindex;
				entityObject.push(subentity);
			}
		}
	}
	else
	{
		// leaf entity it only contains geometries
		var geometries = jsonEntity.geometries;
		if (geometries != null && geometries.length > 0)
		{
			if (geometries[0].type == "Particle")
			{
				// assumes there are no particles mixed with other kind of
				// geometrie hence if the first one is a particle then they all are
				// create the particle variables
				var sprite1 = THREE.ImageUtils.loadTexture("images/particle.png");
				var eMaterial = new THREE.ParticleBasicMaterial(
				{
					size : 5,
					map : sprite1,
					blending : THREE.AdditiveBlending,
					depthTest : false,
					transparent : true
				});
				eMaterial.color = new THREE.Color(0xffffff);
				THREE.ColorConverter.setHSV(eMaterial.color, Math.random(), 1.0, 1.0);
				var bMaterial = new THREE.ParticleBasicMaterial(
				{
					size : 5,
					map : sprite1,
					blending : THREE.AdditiveBlending,
					depthTest : false,
					transparent : true
				});
				bMaterial.color = new THREE.Color(0xffffff);
				THREE.ColorConverter.setHSV(bMaterial.color, Math.random(), 1.0, 1.0);
				var lMaterial = new THREE.ParticleBasicMaterial(
				{
					size : 5,
					map : sprite1,
					blending : THREE.AdditiveBlending,
					depthTest : false,
					transparent : true
				});
				lMaterial.color = new THREE.Color(0xffffff);
				THREE.ColorConverter.setHSV(lMaterial.color, Math.random(), 1.0, 1.0);
				var pMaterial = null;
				if (jsonEntity.id.indexOf("LIQUID") != -1)
				{
					pMaterial = lMaterial;
				}
				else if (jsonEntity.id.indexOf("ELASTIC") != -1)
				{
					pMaterial = eMaterial;
				}
				else if (jsonEntity.id.indexOf("BOUNDARY") != -1)
				{
					pMaterial = bMaterial;
					return entityObject;
				}
				geometry = new THREE.Geometry();
				for ( var gindex in geometries)
				{
					var threeObject = GEPPETTO.getThreeObjectFromJSONGeometry(geometries[gindex], pMaterial);
					geometry.vertices.push(threeObject);
				}
				entityObject = new THREE.ParticleSystem(geometry, pMaterial);
				entityObject.eid = jsonEntity.id;
				// also update the particle system to
				// sort the particles which enables
				// the behaviour we want
				entityObject.sortParticles = true;
				GEPPETTO.geometriesMap[jsonEntity.id] = entityObject;
			}
			else
			{
				var material = new THREE.MeshPhongMaterial(
				{
					opacity : 1,
					ambient : 0x777777,
					specular : 0xbbbb9b,
					shininess : 50,
					shading : THREE.SmoothShading
				});
				material.color.setHex('0x' + (Math.random() * 0xFFFFFF << 0).toString(16));
				var combined = new THREE.Geometry();
				for ( var gindex in geometries)
				{
					var threeObject = GEPPETTO.getThreeObjectFromJSONGeometry(geometries[gindex], material);
					THREE.GeometryUtils.merge(combined, threeObject);
					threeObject.geometry.dispose();
				}
				entityObject = new THREE.Mesh(combined, material);
				entityObject.eindex = eindex;
				entityObject.eid = jsonEntity.id;
				entityObject.geometry.dynamic = false;
			}
		}
	}
	return entityObject;
};
/**
 * 
 */
GEPPETTO.setupCamera = function()
{
	// Camera
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	GEPPETTO.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	GEPPETTO.scene.add(GEPPETTO.camera);
	GEPPETTO.camera.position.set(0, 150, 400);
	GEPPETTO.camera.lookAt(GEPPETTO.scene.position);
	GEPPETTO.projector = new THREE.Projector();
};

/**
 * 
 */
GEPPETTO.setupControls = function()
{
	// Controls
	GEPPETTO.controls = new THREE.TrackballControls(GEPPETTO.camera, GEPPETTO.renderer.domElement);
	GEPPETTO.controls.noZoom = false;
	GEPPETTO.controls.noPan = false;
	GEPPETTO.controls.addEventListener('change', GEPPETTO.render);
};

/**
 * 
 */
GEPPETTO.setupStats = function()
{
	// Stats
	if ($("#stats").length == 0)
	{
		GEPPETTO.stats = new Stats();
		GEPPETTO.stats.domElement.style.position = 'absolute';
		GEPPETTO.stats.domElement.style.bottom = '0px';
		GEPPETTO.stats.domElement.style.right = '0px';
		GEPPETTO.stats.domElement.style.zIndex = 100;
		GEPPETTO.container.appendChild(GEPPETTO.stats.domElement);
	}

};

/**
 * 
 */
GEPPETTO.setupLights = function()
{
	// Lights

	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(1, 1, 1);
	GEPPETTO.scene.add(light);
	light = new THREE.DirectionalLight(0xffffff);
	light.position.set(-1, -1, -1);
	GEPPETTO.scene.add(light);
	light = new THREE.AmbientLight(0x222222);
	GEPPETTO.scene.add(light);

};

/**
 * Create a GUI element based on the available metadata
 */
GEPPETTO.setupGUI = function()
{
	var data = false;
	for ( var m in GEPPETTO.metadata)
	{
		data = true;
		break;
	}

	// GUI
	if (!GEPPETTO.gui && data)
	{
		GEPPETTO.gui = new dat.GUI(
		{
			width : 400
		});
		GEPPETTO.addGUIControls(GEPPETTO.gui, GEPPETTO.metadata);
	}
	for (f in GEPPETTO.gui.__folders)
	{
		// opens only the root folders
		GEPPETTO.gui.__folders[f].open();
	}

};

/**
 * @param gui
 * @param metadatap
 */
GEPPETTO.addGUIControls = function(parent, current_metadata)
{
	if (current_metadata.hasOwnProperty("ID"))
	{
		parent.add(current_metadata, "ID").listen();
	}
	for ( var m in current_metadata)
	{
		if (m != "ID")
		{
			if (typeof current_metadata[m] == "object")
			{
				folder = parent.addFolder(m);
				// recursive call to populate the GUI with sub-metadata
				GEPPETTO.addGUIControls(folder, current_metadata[m]);
			}
			else
			{
				parent.add(current_metadata, m).listen();
			}
		}
	}
};

/**
 * 
 */
GEPPETTO.setupRenderer = function()
{
	GEPPETTO.renderer = new THREE.WebGLRenderer(
	{
		antialias : true
	});
	GEPPETTO.renderer.setClearColor(0x000000, 1);
	GEPPETTO.renderer.setSize(window.innerWidth, window.innerHeight);
	GEPPETTO.container.appendChild(GEPPETTO.renderer.domElement);
};

/**
 * Adds debug axis to the scene
 */
GEPPETTO.setupAxis = function()
{
	// To use enter the axis length
	GEPPETTO.scene.add(new THREE.AxisHelper(200));
};

/**
 * 
 */
GEPPETTO.setupListeners = function()
{
	// when the mouse moves, call the given function
	GEPPETTO.renderer.domElement.addEventListener('mousemove', GEPPETTO.onDocumentMouseMove, false);
	GEPPETTO.renderer.domElement.addEventListener('mousedown', GEPPETTO.onDocumentMouseDown, false);
	window.addEventListener('resize', GEPPETTO.onWindowResize, false);
};

GEPPETTO.onWindowResize = function()
{

	GEPPETTO.camera.aspect = window.innerWidth / window.innerHeight;
	GEPPETTO.camera.updateProjectionMatrix();

	GEPPETTO.renderer.setSize(window.innerWidth, window.innerHeight);

};

/**
 * 
 */
GEPPETTO.render = function()
{
	GEPPETTO.renderer.render(GEPPETTO.scene, GEPPETTO.camera);
};

/**
 * We store the mouse coordinates
 * 
 * @param event
 */
GEPPETTO.onDocumentMouseMove = function(event)
{
	// the following line would stop any other event handler from firing
	// (such as the mouse's TrackballControls)
	// event.preventDefault();

	// update the mouse variable
	GEPPETTO.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	GEPPETTO.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

};

/**
 * If a listener for click events was defined we call it
 * 
 * @param event
 */
GEPPETTO.onDocumentMouseDown = function(event)
{
	if (GEPPETTO.mouseClickListener)
	{
		GEPPETTO.mouseClickListener(GEPPETTO.getIntersectedObjects(), event.which);
	}
};

/**
 * @returns a list of objects intersected by the current mouse coordinates
 */
GEPPETTO.getIntersectedObjects = function()
{
	// create a Ray with origin at the mouse position and direction into the
	// scene (camera direction)
	var vector = new THREE.Vector3(GEPPETTO.mouse.x, GEPPETTO.mouse.y, 1);
	GEPPETTO.projector.unprojectVector(vector, GEPPETTO.camera);

	var raycaster = new THREE.Raycaster(GEPPETTO.camera.position, vector.sub(GEPPETTO.camera.position).normalize());

	var visibleChildren = [];
	GEPPETTO.scene.traverse(function(child)
	{
		if (child.visible)
		{
			visibleChildren.push(child);
		}
	});

	// returns an array containing all objects in the scene with which the ray
	// intersects
	return raycaster.intersectObjects(visibleChildren);
};

/**
 * @param key
 *            the pressed key
 * @returns true if the key is pressed
 */
GEPPETTO.isKeyPressed = function(key)
{
	return GEPPETTO.keyboard.pressed(key);
};

PLOT = function(entityId, variable)
{
	this.entityId = entityId;
	this.variable = variable;
	this.values = new Array();
	this.defaultBuffer = 500;// 500 values are stored by default
	this.dialog = null;
	this.flot = null;
	this.addValue = function()
	{
		/*
		 * if (values.length >= 500) { value.splice(0, 1); } values[values.length + 1] = value;
		 */
		this.flot.setData([ this.getRandomData() ]);
		this.flot.draw();
		with (this)
		{
			setTimeout(function()
			{
				addValue();
			}, 30);
		}
	};
	this.show = function()
	{
		this.dialog = GEPPETTO.createDialog("dialog" + this.entityId + this.variable, this.entityId + "." + this.variable);
		this.dialog.append("<div class='plot' id='plot" + this.entityId + this.variable + "'></div>");
		this.flot = $.plot("#plot" + this.entityId + this.variable, [ this.getRandomData() ],
		{
			series :
			{
				shadowSize : 0
			// Drawing is faster without shadows
			},
			yaxis :
			{
				min : 0,
				max : 100
			},
			xaxis :
			{
				show : false
			}
		});
	};
	this.dispose = function()
	{
		this.values = null;
	};
	this.getRandomData = function()
	{

		if (this.values.length > 0)
			this.values = this.values.slice(1);

		// Do a random walk

		while (this.values.length < this.defaultBuffer)
		{

			var prev = this.values.length > 0 ? this.values[this.values.length - 1] : 50, y = prev + Math.random() * 10 - 5;

			if (y < 0)
			{
				y = 0;
			}
			else if (y > 100)
			{
				y = 100;
			}

			this.values.push(y);
		}

		// Zip the generated y values with the x values

		var res = [];
		for ( var i = 0; i < this.values.length; ++i)
		{
			res.push([ i, this.values[i] ]);
		}

		return res;
	};
};

GEPPETTO.createDialog = function(id, title)
{
	return $("<div id=" + id + " class='dialog' title='" + title + "'></div>").dialog(
	{
		resizable : true,
		draggable : true,
		height : 370,
		width : 430,
		modal : false
	});
};

GEPPETTO.addPlot = function(entityId, variable)
{
	var plot = new PLOT(entityId, variable);
	GEPPETTO.plots.push(plot);
	plot.show();
	plot.addValue();
};

GEPPETTO.removePlot = function(entityId, variable)
{
};

/**
 * @param entityIndex
 *            the id of the entity for which we want to display metadata
 */
GEPPETTO.showMetadataForEntity = function(entityIndex)
{
	if (GEPPETTO.gui)
	{
		GEPPETTO.gui.domElement.parentNode.removeChild(GEPPETTO.gui.domElement);
		GEPPETTO.gui = null;
	}

	GEPPETTO.metadata = GEPPETTO.jsonscene.entities[entityIndex].metadata;
	GEPPETTO.metadata.ID = GEPPETTO.jsonscene.entities[entityIndex].id;

	GEPPETTO.setupGUI();

};

/**
 * @param newJSONScene
 *            the id of the entity for which we want to display metadata
 */
GEPPETTO.updateJSONScene = function(newJSONScene)
{
	GEPPETTO.jsonscene = newJSONScene;
	GEPPETTO.needsUpdate = true;
	GEPPETTO.updateScene();
	GEPPETTO.customUpdate();
};

/**
 * 
 */
GEPPETTO.animate = function()
{
	debugUpdate = true;// GEPPETTO.needsUpdate; //so that we log only the cycles when we are updating the scene
	if (GEPPETTO.Simulation.getStatus() == 2 && debugUpdate)
	{
		GEPPETTO.log("Starting update frame");
	}
	GEPPETTO.controls.update();
	requestAnimationFrame(GEPPETTO.animate);
	if (GEPPETTO.rotationMode)
	{
		var timer = new Date().getTime() * 0.0005;
		GEPPETTO.camera.position.x = Math.floor(Math.cos(timer) * 200);
		GEPPETTO.camera.position.z = Math.floor(Math.sin(timer) * 200);
	}
	GEPPETTO.render();
	if (GEPPETTO.stats)
	{
		GEPPETTO.stats.update();
	}
	if (GEPPETTO.Simulation.getStatus() == 2 && debugUpdate)
	{
		GEPPETTO.log("End update frame");
	}
};

/**
 * @param aroundObject
 *            the object around which the rotation will happen
 */
GEPPETTO.enterRotationMode = function(aroundObject)

{
	GEPPETTO.rotationMode = true;
	if (aroundObject)
	{
		GEPPETTO.camera.lookAt(aroundObject);
	}
};

/**
 * 
 */
GEPPETTO.exitRotationMode = function()
{
	GEPPETTO.rotationMode = false;
};

/**
 * @param entityId
 *            the entity id
 */
GEPPETTO.getThreeReferencedObjectsFrom = function(entityId)
{
	var entity = GEPPETTO.getJSONEntityFromId(entityId);
	var referencedIDs = [];
	var threeObjects = [];
	for (r in entity.references)
	{
		referencedIDs.push(entity.references[r].entityId);
	}

	GEPPETTO.scene.traverse(function(child)
	{
		if (child.hasOwnProperty("eid"))
		{
			if (GEPPETTO.isIn(child.eid, referencedIDs))
			{
				threeObjects.push(child);
				var index = referencedIDs.indexOf(child.eid);
				referencedIDs.splice(index, 1);
			}
		}
	});

	return threeObjects;
};

/**
 * @param entityId
 *            the entity id
 */
GEPPETTO.getJSONEntityFromId = function(entityId)
{
	for (e in GEPPETTO.jsonscene.entities)
	{
		if (GEPPETTO.jsonscene.entities[e].id == entityId)
		{
			return GEPPETTO.jsonscene.entities[e];
		}
	}
};

/**
 * @param e
 *            the element to be checked
 * @param array
 *            the array to be checked
 */
GEPPETTO.isIn = function(e, array)
{
	var found = false;
	for ( var i = 0; i < array.length; i++)
	{
		if (array[i] == e)
		{
			found = true;
			break;
		}
	}
	return found;
};

GEPPETTO.log = function(msg)
{
	if (GEPPETTO.debug)
	{
		var d = new Date();
		var curr_hour = d.getHours();
		var curr_min = d.getMinutes();
		var curr_sec = d.getSeconds();
		var curr_msec = d.getMilliseconds();

		console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec + ' - ' + msg, "");

	}
};

// ============================================================================
// Application logic.
// ============================================================================

$(document).ready(function()
{
	// Toolbar controls

	$("#w").click(function(event)
	{
		GEPPETTO.controls.incrementPanEnd(-0.01, 0);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.controls.incrementPanEnd(0, -0.01);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.controls.incrementPanEnd(0.01, 0);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.controls.incrementPanEnd(0, 0.01);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.setupCamera();
		GEPPETTO.setupControls();
	});

	$("#rw").click(function(event)
	{
		GEPPETTO.controls.incrementRotationEnd(-0.01, 0, 0);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.controls.incrementRotationEnd(0, 0, 0.01);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.controls.incrementRotationEnd(0.01, 0, 0);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.controls.incrementRotationEnd(0, 0, -0.01);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	}).next().click(function(event)
	{
		GEPPETTO.setupCamera();
		GEPPETTO.setupControls();
	});

	$("#zo").click(function(event)
	{
		GEPPETTO.controls.incrementZoomEnd(+0.01);

	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	});

	$("#zi").click(function(event)
	{
		GEPPETTO.controls.incrementZoomEnd(-0.01);
	}).mouseup(function(event)
	{
		GEPPETTO.controls.resetSTATE();
	});

});
