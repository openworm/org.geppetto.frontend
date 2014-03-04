/*******************************************************************************
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
 * GEPPETTO Visualisation engine built on top of THREE.js. Displays
 * a scene as defined on org.geppetto.core
 *
 * @author matteo@openworm.org (Matteo Cantarelli)
 */

var GEPPETTO = GEPPETTO ||
{
	REVISION : '5'
};

(function(){

	/**
	 * Local variables
	 */
	var VARS;
	/**
	 * Initialize the engine
	 */
	GEPPETTO.init = function(containerp)
	{
		GEPPETTO_INIT(this);
		if (!Detector.webgl)
		{
			Detector.addGetWebGLMessage();
			return false;
		}
		else
		{
			VARS = GEPPETTO.Init.initialize(containerp);
			return true;
		}
	};

	/**
	 * Updates the scene
	 */
	GEPPETTO.updateScene = function()
	{
		if (VARS.needsUpdate)
		{
			var entities = VARS.jsonscene.entities;

			for ( var eindex in entities)
			{
				var geometries = entities[eindex].geometries;

				for ( var gindex in geometries)
				{
					GEPPETTO.updateGeometry(geometries[gindex]);
				}

				var entityGeometry = VARS.geometriesMap[entities[eindex].id];
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
			VARS.needsUpdate = false;
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
		var threeObject = VARS.geometriesMap[g.id];
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

		var threeObject = new THREE.Mesh(c, material);

		threeObject.lookAt(cylinderAxis);
		var distance = midPoint.length();

		midPoint.transformDirection(threeObject.matrix);
		midPoint.multiplyScalar(distance);

		threeObject.position.add(midPoint);
		return threeObject;
	};

	/**
	 * @param jsonEntity the id of the entity to light up
	 * @param intensity the lighting intensity from 0 (no illumination) to 1 (full illumination)
	 */
	GEPPETTO.lightUpEntity = function(jsonEntity, intensity)
	{
		if(intensity <0) { intensity = 0; }
		if(intensity >1) { intensity = 1; }

		var getRGB = function(hexString) {
			return {
				r:parseInt(hexString.substr(2,2),16),
				g:parseInt(hexString.substr(4,2),16),
			  b:parseInt(hexString.substr(6,2),16)
			}
		}
		var scaleColor = function(color) {
			return (Math.floor(color + ((255 - color)*intensity))).toString(16);
		}
		var threeObject=GEPPETTO.getThreeObjectFromEntityId(jsonEntity);
		var originalColor = getRGB(threeObject.material.originalColor);
		threeObject.material.color.setHex(
			'0x' + scaleColor(originalColor.r)+scaleColor(originalColor.g)+scaleColor(originalColor.b) );
	};

	/**
	 * @param jsonscene
	 */
	GEPPETTO.populateScene = function(jsonscene)
	{
		this.jsonscene = jsonscene;
		var entities = jsonscene.entities;
		for ( var eindex in entities)
		{
			VARS.scene.add(GEPPETTO.getThreeObjectFromJSONEntity(entities[eindex], eindex, true));
		}

		GEPPETTO.calculateSceneCenter();
		GEPPETTO.updateCamera();
	};

	/**
	 * Compute the center of the scene.
	 */
	GEPPETTO.calculateSceneCenter = function()
	{   
		var aabbMin = null;
		var aabbMax = null;

		VARS.scene.traverse(function(child)
				{
			if(child instanceof THREE.Mesh || child instanceof THREE.ParticleSystem){
				child.geometry.computeBoundingBox();

				//If min and max vectors are null, first values become default min and max
				if(aabbMin == null && aabbMax == null){
					aabbMin = child.geometry.boundingBox.min;
					aabbMax = child.geometry.boundingBox.max;
				}

				//Compare other meshes, particles BB's to find min and max
				else{
					aabbMin.x = Math.min(aabbMin.x, child.geometry.boundingBox.min.x);
					aabbMin.y = Math.min(aabbMin.y, child.geometry.boundingBox.min.y);
					aabbMin.z = Math.min(aabbMin.z, child.geometry.boundingBox.min.z);
					aabbMax.x = Math.max(aabbMax.x, child.geometry.boundingBox.max.x);
					aabbMax.y = Math.max(aabbMax.y, child.geometry.boundingBox.max.y);
					aabbMax.z = Math.max(aabbMax.z, child.geometry.boundingBox.max.z);
				}
			}
				});

		// Compute world AABB center
		VARS.sceneCenter.x = (aabbMax.x + aabbMin.x) * 0.5;
		VARS.sceneCenter.y = (aabbMax.y + aabbMin.y) * 0.5;
		VARS.sceneCenter.z = (aabbMax.z + aabbMin.z) * 0.5;

		// Compute world AABB "radius"
		var diag = new THREE.Vector3();
		diag = diag.subVectors(aabbMax, aabbMin);
		var radius = diag.length() * 0.5;

		// Compute offset needed to move the camera back that much needed to center AABB 
		var offset = radius / Math.tan(Math.PI / 180.0 * VARS.camera.fov * 0.25);

		var camDir = new THREE.Vector3( 0, 0, 1.0 );
  	camDir.multiplyScalar(offset);

		//Store camera position
		VARS.cameraPosition = new THREE.Vector3();
		VARS.cameraPosition.addVectors(VARS.sceneCenter, camDir);
	};

	/**
	 * Update camera with new position and place to lookat
	 */
	GEPPETTO.updateCamera = function()
	{
		// Update camera 
		VARS.camera.rotationAutoUpdate = false;
		VARS.camera.position.set( VARS.cameraPosition.x, VARS.cameraPosition.y, VARS.cameraPosition.z );
		VARS.camera.lookAt(VARS.sceneCenter);
		VARS.camera.up = new THREE.Vector3(0,1,0);
		VARS.camera.rotationAutoUpdate = true;
		VARS.controls.target = VARS.sceneCenter;
	};

	/**
	 * @returns {Boolean}
	 */
	GEPPETTO.isScenePopulated = function()
	{
		return !(_.isEmpty(VARS.geometriesMap));
	};
	
	GEPPETTO.isCanvasCreated = function()
	{
		return VARS.canvasCreated;
	};

	/**
	 * Creates a geometry according to its type
	 *
	 * @param g
	 * @param material
	 * @returns {Mesh} a three mesh representing the geometry
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
		VARS.geometriesMap[g.id] = threeObject;
		return threeObject;
	};

	/**
	 * @param jsonEntity
	 *            the json entity
	 * @param eindex
	 *            the entity index within the json scene
	 * @param mergeSubentities
	 *            true if subentities have to be merged
	 */
	GEPPETTO.getThreeObjectFromJSONEntity = function(jsonEntity, eindex, mergeSubentities)
	{

		var getMeshPhongMaterial = function() {
			var material = new THREE.MeshPhongMaterial(
				{
					opacity : 1,
					ambient : 0x777777,
					shininess : 2,
					shading : THREE.SmoothShading
				});

			material.originalColor = '0x' + (Math.random() * 0xFFFFFF << 0).toString(16);
			material.color.setHex(material.originalColor);
			return material;
		}

		var entityObject = null;
		if (jsonEntity.subentities && jsonEntity.subentities.length > 0)
		{
			// this entity is made of many subentities
			if (mergeSubentities)
			{
				// if mergeSubentities is true then only one resulting entity is
				// created
				// by merging all geometries of the different subentities together
				var combined = new THREE.Geometry();
				for ( var seindex in jsonEntity.subentities)
				{
					var threeObject = GEPPETTO.getThreeObjectFromJSONEntity(jsonEntity.subentities[seindex], eindex, false);
					THREE.GeometryUtils.merge(combined, threeObject);
					threeObject.geometry.dispose();
				}
				entityObject = new THREE.Mesh(combined, getMeshPhongMaterial());
				entityObject.eindex = eindex;
				entityObject.eid = jsonEntity.id;
				entityObject.geometry.dynamic = false;
			}
			else
			{
				entityObject = [];
				for ( var seindex in jsonEntity.subentities)
				{
					var subentity = GEPPETTO.getThreeObjectFromJSONEntity(jsonEntity.subentities[seindex], eindex, false);
					subentity.parentEntityIndex = eindex;
					entityObject.push(subentity);
				}
			}
		}
		else
		{
			// leaf entity it only contains geometries
			var geometries = jsonEntity.geometries;
			if (geometries != null && geometries.length)
			{
				if (geometries[0].type == "Particle")
				{
					// assumes there are no particles mixed with other kind of
					// geometrie hence if the first one is a particle then they all are
					// create the particle variables
					var pMaterial = new THREE.ParticleBasicMaterial(
						{
							size : 5,
							map : THREE.ImageUtils.loadTexture("images/particle.png"),
							blending : THREE.AdditiveBlending,
							depthTest : false,
							transparent : true
						});
				  pMaterial.color = new THREE.Color(0xffffff);
					THREE.ColorConverter.setHSV(pMaterial.color, Math.random(), 1.0, 1.0);
					pMaterial.originalColor = pMaterial.color.getHexString();

					var geometry = new THREE.Geometry();
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
					VARS.geometriesMap[jsonEntity.id] = entityObject;
				}
				else
				{
					var combined = new THREE.Geometry();
					var material = getMeshPhongMaterial();
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
	 * Sets up the HUD display with the scene stat's fps. 
	 */
	GEPPETTO.setupStats = function()
	{
		// Stats
		if ($("#stats").length == 0)
		{
			VARS.stats = new Stats();
			VARS.stats.domElement.style.float = 'right';
			VARS.stats.domElement.style.position = 'absolute';
			VARS.stats.domElement.style.bottom = '0px';
			VARS.stats.domElement.style.right = '0px';
			VARS.stats.domElement.style.zIndex = 100;
			$('#footerHeader').append(VARS.stats.domElement);
		}
	};
	
	GEPPETTO.showStats = function()
	{
		if ($("#stats").length == 0)
		{
			GEPPETTO.setupStats();
		}else{
			$("#stats").show();
		}
	};
	
	GEPPETTO.hideStats = function()
	{
		$("#stats").hide();
	};

	/**
	 * Create a GUI element based on the available metadata
	 */
	GEPPETTO.setupGUI = function()
	{
		var data = !(_.isEmpty(VARS.metadata));

		// GUI
		if (!VARS.gui && data)
		{
			VARS.gui = new dat.GUI({width : 400});
			GEPPETTO.addGUIControls(VARS.gui, VARS.metadata);
		}
		for (f in VARS.gui.__folders)
		{
			// opens only the root folders
			VARS.gui.__folders[f].open();
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
					var folder = parent.addFolder(m);
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
	 * Adds debug axis to the scene
	 */
	GEPPETTO.setupAxis = function()
	{
		// To use enter the axis length
		VARS.scene.add(new THREE.AxisHelper(200));
	};

	/**
	 * Renders objects in the scene
	 */
	GEPPETTO.render = function()
	{
		VARS.renderer.render(VARS.scene, VARS.camera);
	};

	/**
	 * 
	 * @returns {Array} a list of objects intersected by the current mouse coordinates
	 */
	GEPPETTO.getIntersectedObjects = function()
	{
		// create a Ray with origin at the mouse position and direction into the
		// scene (camera direction)
		var vector = new THREE.Vector3(VARS.mouse.x, VARS.mouse.y, 1);
		VARS.projector.unprojectVector(vector, VARS.camera);

		var raycaster = new THREE.Raycaster(VARS.camera.position, vector.sub(VARS.camera.position).normalize());

		var visibleChildren = [];
		VARS.scene.traverse(function(child){
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
	 * @returns {boolean} true if the key is pressed
	 */
	GEPPETTO.isKeyPressed = function(key)
	{
		return VARS.keyboard.pressed(key);
	};

	/**
	 * @returns {Number} A new id
	 */
	GEPPETTO.getNewId = function()
	{
		return VARS.idCounter++;
	};	

	/**
	 * @param entityIndex
	 *            the id of the entity for which we want to display metadata
	 */
	GEPPETTO.showMetadataForEntity = function(entityIndex)
	{
		if (VARS.gui)
		{
			VARS.gui.domElement.parentNode.removeChild(VARS.gui.domElement);
			VARS.gui = null;
		}

		VARS.metadata = jsonscene.entities[entityIndex].metadata;
		VARS.metadata.ID = jsonscene.entities[entityIndex].id;

		GEPPETTO.setupGUI();

	};

	/**
	 * @param newJSONScene
	 *            the id of the entity for which we want to display metadata
	 */
	GEPPETTO.updateJSONScene = function(newJSONScene)
	{
		VARS.jsonscene = newJSONScene;
		VARS.needsUpdate = true;
		GEPPETTO.updateScene();
		if (VARS.customUpdate != null)
		{
			GEPPETTO.customUpdate();
		}
	};

	/**
	 * Animate simulation 
	 */
	GEPPETTO.animate = function()
	{
		VARS.debugUpdate = VARS.needsUpdate; // so that we log only the cycles when we are updating the scene
		if (getSimulationStatus() == 2 && VARS.debugUpdate)
		{
			GEPPETTO.log(UPDATE_FRAME_STARTING);
		}
		VARS.controls.update();
		requestAnimationFrame(GEPPETTO.animate);
		if (VARS.rotationMode)
		{
			var timer = new Date().getTime() * 0.0005;
			VARS.camera.position.x = Math.floor(Math.cos(timer) * 200);
			VARS.camera.position.z = Math.floor(Math.sin(timer) * 200);
		}
		GEPPETTO.render();
		if (VARS.stats)
		{
			VARS.stats.update();
		}
		if (getSimulationStatus() == 2 && VARS.debugUpdate)
		{
			GEPPETTO.log(UPDATE_FRAME_END);
		}
	};

	/**
	 * @param aroundObject
	 *            the object around which the rotation will happen
	 */
	GEPPETTO.enterRotationMode = function(aroundObject)

	{
		VARS.rotationMode = true;
		if (aroundObject)
		{
			VARS.camera.lookAt(aroundObject);
		}
	};

	/**
	 * Exit rotation mode
	 */
	GEPPETTO.exitRotationMode = function()
	{
		VARS.rotationMode = false;
	};

	/**
	 * @param entityId
	 *            the entity id
	 */
	GEPPETTO.getThreeObjectFromEntityId = function(entityId)
	{
		var threeObject=null;
		VARS.scene.traverse(function(child)
		{
			if (child.hasOwnProperty("eid") && child.eid==entityId)
			{
				threeObject = child;
			}
		});
		return threeObject;
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

		VARS.scene.traverse(function(child)
				{
			if (child.hasOwnProperty("eid"))
			{
				if (_.contains(referencedIDs, child.eid))
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
		for (e in VARS.jsonscene.entities)
		{
			if (VARS.jsonscene.entities[e].id === entityId)
			{
				return VARS.jsonscene.entities[e];
			}
		}
		return null;
	};

	/**
	 * @param msg
	 */
	GEPPETTO.log = function(msg)
	{
		if (VARS.debug)
		{
			var d = new Date();
			var curr_hour = d.getHours();
			var curr_min = d.getMinutes();
			var curr_sec = d.getSeconds();
			var curr_msec = d.getMilliseconds();

			console.log(curr_hour + ":" + curr_min + ":" + curr_sec + ":" + curr_msec + ' - ' + msg, "");

		}
	};

	/**
	 * @param category
	 * @param action
	 * @param opt_label
	 * @param opt_value
	 * @param opt_noninteraction
	 */
	GEPPETTO.trackActivity = function(category, action, opt_label, opt_value, opt_noninteraction)
	{
		if(typeof _gaq != 'undefined')
		{
			_gaq.push(['_trackEvent', category, action, opt_label, opt_value, opt_noninteraction]);
		}
	};

})();