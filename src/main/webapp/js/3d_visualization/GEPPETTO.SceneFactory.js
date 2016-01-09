/**
 * GEPPETTO Visualisation engine built on top of ThreeJS. Displays a scene as defined on org.geppetto.core. Factory class for creating and updating ThreeJS objects
 * 
 * @author matteo@openworm.org (Matteo Cantarelli)
 * @author Jesus R. Martinez (jesus@metacell.us)
 */
define(function(require)
{
	return function(GEPPETTO)
	{
		var $ = require('jquery'), _ = require('underscore'), Backbone = require('backbone');
		require('three');
		require('vendor/ColladaLoader');
		require('vendor/OBJLoader');
		require('GEPPETTO.Resources')(GEPPETTO);

		GEPPETTO.SceneFactory =
		{

			buildVisualInstance : function(instance, visualType, index)
			{
				var meshes = GEPPETTO.SceneFactory.generate3DObjects(instance, visualType);
				var position = instance.getVariable().getPosition();
				if (instance.getVariable().getType().getMetaType() == GEPPETTO.Resources.ARRAY_TYPE_NODE)
				{
					if ((instance.getVariable().getType().getDefaultValue().elements != undefined) && 
						(instance.getVariable().getType().getDefaultValue().elements[index] != undefined))
					{
						position = instance.getVariable().getType().getDefaultValue().elements[index].position;
					}
				}
				GEPPETTO.SceneFactory.init3DObject(meshes, instance.getInstancePath(), position);
			},

			/**
			 * Initializes a group of meshes that were created and adds them to the 3D scene
			 * 
			 * @param {Object}
			 *            meshes - The meshes that need to be initialized
			 */
			init3DObject : function(meshes, instancePath, position)
			{
				for ( var m in meshes)
				{
					var mesh = meshes[m];

					mesh.instancePath = instancePath;
					// if the model file is specifying a position for the loaded meshes then we translate them here
					if (position != null)
					{
						p = new THREE.Vector3(position.x, position.y, position.z);
						mesh.position.set(p.x, p.y, p.z);
						mesh.matrixAutoUpdate = false;
						mesh.applyMatrix(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
						mesh.geometry.verticesNeedUpdate = true;
						mesh.updateMatrix();
						// mesh.geometry.translate(position.x, position.y,position.z);
					}
					GEPPETTO.getVARS().scene.add(mesh);
					// keep track of aspects created by storing them in VARS property object
					// under meshes
					GEPPETTO.getVARS().meshes[instancePath] = mesh;
					GEPPETTO.getVARS().meshes[instancePath].visible = true;
					GEPPETTO.getVARS().meshes[instancePath].ghosted = false;
					GEPPETTO.getVARS().meshes[instancePath].defaultOpacity = 1;
					GEPPETTO.getVARS().meshes[instancePath].selected = false;
					GEPPETTO.getVARS().meshes[instancePath].input = false;
					GEPPETTO.getVARS().meshes[instancePath].output = false;

				}
			},

			/**
			 * Updates the scene
			 * 
			 * @param {Object}
			 *            newRuntimeTree - New update received to update the 3D scene
			 */
			updateScene : function(newRuntimeTree)
			{
				var entities = newRuntimeTree;
				// traverse entities in updated tree
				for ( var eindex in entities)
				{
					var entity = entities[eindex];
					// traverse apects of new updated entity
					for ( var a in entity.getAspects())
					{
						var aspect = entity.getAspects()[a];
						var visualTree = aspect.VisualizationTree;
						for ( var vm in visualTree.content)
						{
							var node = visualTree.content[vm];

							if (node != null && typeof node === "object")
							{

								var metaType = node.getMetaType();
								if (metaType == "CompositeNode")
								{
									for ( var gindex in node)
									{
										var vo = node[gindex];
										var voType = vo._metaType;
										if (voType == "ParticleNode" || voType == "SphereNode" || voType == "CylinderNode")
										{
											GEPPETTO.SceneFactory.updateGeometry(vo);
										}
									}
								} else if (metaType == "ParticleNode" || metaType == "SphereNode" || metaType == "CylinderNode")
								{
									GEPPETTO.SceneFactory.updateGeometry(node);
								}
							}
						}
					}
				}
			},

			updateGeometry : function(g)
			{
				var threeObject = GEPPETTO.getVARS().visualModelMap[g.instancePath];
				if (threeObject)
				{
					if (threeObject instanceof THREE.Vector3)
					{
						threeObject.x = g.position.x;
						threeObject.y = g.position.y;
						threeObject.z = g.position.z;
					} else
					{
						// update the position
						threeObject.position.set(g.position.x, g.position.y, g.position.z);
					}
				}
			},

			generate3DObjects : function(instance, visualType, lines, thickness)
			{
				var previous3DObject = GEPPETTO.getVARS().meshes[instance.getInstancePath()];
				if (previous3DObject)
				{
					// if an object already exists for this aspect we remove it. This could happen in case we are changing how an aspect
					// is visualized, e.g. lines over tubes representation
					GEPPETTO.getVARS().scene.remove(previous3DObject);
					var splitMeshes = GEPPETTO.getVARS().splitMeshes;
					for ( var m in splitMeshes)
					{
						if (m.indexOf(instance.getInstancePath()) != -1)
						{
							GEPPETTO.getVARS().scene.remove(splitMeshes[m]);
							splitMeshes[m] = null;
						}
					}

				}
				var materials =
				{
					"mesh" : GEPPETTO.SceneFactory.getMeshPhongMaterial(),
					"line" : GEPPETTO.SceneFactory.getLineMaterial(thickness),
					"particle" : GEPPETTO.SceneFactory.getParticleMaterial()
				};
				var instanceObjects = [];
				threeDeeObjList = GEPPETTO.SceneFactory.walkVisTreeGen3DObjs(instance, visualType, materials, lines);

				// only merge if there are more than one object
				if (threeDeeObjList.length > 1)
				{
					var mergedObjs = GEPPETTO.SceneFactory.merge3DObjects(threeDeeObjList, materials);
					// investigate need to obj.dispose for obj in threeDeeObjList
					if (mergedObjs != null)
					{
						mergedObjs.instancePath = instance.getInstancePath();
						instanceObjects.push(mergedObjs);
					} else
					{
						for ( var obj in threeDeeObjList)
						{
							threeDeeObjList[obj].instancePath = instance.getInstancePath();
							instanceObjects.push(threeDeeObjList[obj]);
						}
					}
				} else if (threeDeeObjList.length == 1)
				{
					// only one object in list, add it to local array and set
					// instance path from aspect
					instanceObjects.push(threeDeeObjList[0]);
					instanceObjects[0].instancePath = instance.getInstancePath();
				}

				return instanceObjects;
			},

			walkVisTreeGen3DObjs : function(instance, visualType, materials, lines)
			{
				var threeDeeObj = null;
				var threeDeeObjList = [];

				if (visualType)
				{
					if (visualType.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE)
					{
						for ( var v in visualType.getVariables())
						{
							var visualValue = visualType.getVariables()[v].getWrappedObj().initialValues[0].value;
							threeDeeObj = GEPPETTO.SceneFactory.visualizationTreeNodeTo3DObj(instance, visualValue, visualType.getVariables()[v].getId(), materials, lines)
							if (threeDeeObj)
							{
								threeDeeObjList.push(threeDeeObj);
							}
						}
					} else
					{
						var visualValue = visualType.getWrappedObj().defaultValue;
						threeDeeObj = GEPPETTO.SceneFactory.visualizationTreeNodeTo3DObj(instance, visualValue, visualType.getId(), materials, lines)
						if (threeDeeObj)
						{
							threeDeeObjList.push(threeDeeObj);
						}
					}

				}
				return threeDeeObjList;
			},

			merge3DObjects : function(objArray, materials)
			{
				var mergedMeshesPaths = [];
				var combined = new THREE.Geometry();
				var ret = null;
				var mergedLines;
				var mergedMeshes;
				objArray.forEach(function(obj)
				{
					if (obj instanceof THREE.Line)
					{
						if (mergedLines === undefined)
						{
							mergedLines = new THREE.Geometry()
						}
						mergedLines.vertices.push(obj.geometry.vertices[0]);
						mergedLines.vertices.push(obj.geometry.vertices[1]);
					} 
					else if(obj.geometry.type=="Geometry"){
						// This catches both Collada an OBJ
						if(objArray.length>1)
						{
							throw Error("Merging of multiple OBJs or Colladas not supported");
						}
						else
						{
							ret = obj;
						}
					}
					else
					{
						if (mergedMeshes === undefined)
						{
							mergedMeshes = new THREE.Geometry()
						}
						obj.geometry.dynamic = true;
						obj.geometry.verticesNeedUpdate = true;
						obj.updateMatrix();
						mergedMeshes.merge(obj.geometry, obj.matrix);
					}
					mergedMeshesPaths.push(obj.instancePath);

				});

				if (mergedLines === undefined)
				{
					// There are no line gemeotries, we just create a mesh for the merge of the solid geometries
					// and apply the mesh material
					ret = new THREE.Mesh(mergedMeshes, materials["mesh"]);
				} else
				{
					ret = new THREE.LineSegments(mergedLines, materials["line"]);
					if (mergedMeshes != undefined)
					{
						// we merge into a single mesh both types of geometries (from lines and 3D objects)
						tempmesh = new THREE.Mesh(mergedMeshes, materials["mesh"]);
						ret.geometry.merge(tempmesh.geometry, tempmesh.matrix);
					}
				}

				if (ret != null && !Array.isArray(ret))
				{
					ret.mergedMeshesPaths = mergedMeshesPaths;
				}

				return ret;

			},

			visualizationTreeNodeTo3DObj : function(instance, node, id, materials, lines)
			{
				var threeObject = null;
				if (lines === undefined)
				{
					// Unless it's being forced we use a threshold to decide whether to use lines or cylinders
					lines = GEPPETTO.SceneController.complexity > 2000;
				}
				switch (node.eClass)
				{
				case GEPPETTO.Resources.PARTICLE:
					threeObject = GEPPETTO.SceneFactory.createParticle(node);
					break;

				case GEPPETTO.Resources.CYLINDER:
					if (lines)
					{
						threeObject = GEPPETTO.SceneFactory.create3DLineFromNode(node, materials["line"]);
					} else
					{
						threeObject = GEPPETTO.SceneFactory.create3DCylinderFromNode(node, materials["mesh"]);
					}
					break;

				case GEPPETTO.Resources.SPHERE:
					if (lines)
					{
						threeObject = GEPPETTO.SceneFactory.create3DLineFromNode(node, materials["line"]);
					} else
					{
						threeObject = GEPPETTO.SceneFactory.create3DSphereFromNode(node, materials["mesh"]);
					}
					break;
				case GEPPETTO.Resources.COLLADA:
					threeObject = GEPPETTO.SceneFactory.loadColladaModelFromNode(node);
					break;
				case GEPPETTO.Resources.OBJ:
					threeObject = GEPPETTO.SceneFactory.loadThreeOBJModelFromNode(node);
					break;
				}
				if (threeObject)
				{
					threeObject.visible = true;
					// TODO: this is empty for collada and obj nodes
					var instancePath = instance.getInstancePath() + "." + id;
					threeObject.instancePath = instancePath;
					threeObject.highlighted = false;

					// TODO: shouldn't that be the vistree? why is it also done at the loadEntity level??
					GEPPETTO.getVARS().visualModelMap[instancePath] = threeObject;
				}
				return threeObject;
			},

			loadColladaModelFromNode : function(node)
			{
				var loader = new THREE.ColladaLoader();
				loader.options.convertUpAxis = true;
				var xmlParser = new DOMParser();
				var responseXML = xmlParser.parseFromString(node.collada, "application/xml");
				var scene = null;
				loader.parse(responseXML, function(collada)
				{
					scene = collada.scene;
					scene.traverse(function(child)
					{
						if (child instanceof THREE.Mesh)
						{
							child.material = GEPPETTO.SceneFactory.getMeshPhongMaterial(40);
							child.name = node.instancePath.split(".VisualizationTree")[0];
							child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
							child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
							child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
							child.geometry.computeVertexNormals();
						}
						if (child instanceof THREE.SkinnedMesh)
						{
							child.material.skinning = true;
							child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
							child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
							child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
							child.geometry.computeVertexNormals();
						}
					});
				});
				return scene;
			},

			loadThreeOBJModelFromNode : function(node)
			{
				var manager = new THREE.LoadingManager();
				manager.onProgress = function(item, loaded, total)
				{
					console.log(item, loaded, total);
				};
				var loader = new THREE.OBJLoader(manager);
				var scene = loader.parse(node.obj);

				scene.traverse(function(child)
				{
					if (child instanceof THREE.Mesh)
					{
						child.material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
						child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
						child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
						child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
						child.geometry.computeVertexNormals();
					}
				});

				return scene;
			},

			createParticle : function(node)
			{
				threeObject = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
				threeObject.visible = true;
				threeObject.instancePath = node.instancePath;
				threeObject.highlighted = false;
				// TODO: does that need to be done?
				GEPPETTO.getVARS().visualModelMap[node.instancePath] = threeObject;

				return threeObject;

			},

			/**
			 * Creates and positions a ThreeJS line object from a Geppetto Cylinder node
			 * 
			 * @param {VisualObjectNode}
			 *            cylNode - a Geppetto Cylinder Node
			 * @param {ThreeJSMaterial}
			 *            material - Material to be used for the Mesh
			 * @returns a ThreeJS line correctly positioned w.r.t the global frame of reference
			 */
			create3DLineFromNode : function(node, material)
			{
				if (node.eClass == GEPPETTO.Resources.CYLINDER)
				{
					bottomBasePos = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
					topBasePos = new THREE.Vector3(node.distal.x, node.distal.y, node.distal.z);

					var axis = new THREE.Vector3();
					axis.subVectors(topBasePos, bottomBasePos);
					var midPoint = new THREE.Vector3();
					midPoint.addVectors(bottomBasePos, topBasePos).multiplyScalar(0.5);

					var geometry = new THREE.Geometry();
					geometry.vertices.push(bottomBasePos);
					geometry.vertices.push(topBasePos);
					var threeObject = new THREE.Line(geometry, material);
					threeObject.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
					threeObject.lookAt(axis);
					threeObject.position.fromArray(midPoint.toArray());

					threeObject.geometry.verticesNeedUpdate = true;
				} else if (node.eClass == GEPPETTO.Resources.SPHERE)
				{
					var sphere = new THREE.SphereGeometry(node.radius, 20, 20);
					threeObject = new THREE.Mesh(sphere, material);
					threeObject.position.set(node.position.x, node.position.y, node.position.z);
					threeObject.geometry.verticesNeedUpdate = true;
				}
				return threeObject;
			},

			/**
			 * Creates and positions a ThreeJS cylinder object from a Geppetto Cylinder node
			 * 
			 * @param {VisualObjectNode}
			 *            cylNode - a Geppetto Cylinder Node
			 * @param {ThreeJSMaterial}
			 *            material - Material to be used for the Mesh
			 * @returns a ThreeJS Cylinder correctly positioned w.r.t the global frame of reference
			 */
			create3DCylinderFromNode : function(cylNode, material)
			{

				bottomBasePos = new THREE.Vector3(cylNode.position.x, cylNode.position.y, cylNode.position.z);
				topBasePos = new THREE.Vector3(cylNode.distal.x, cylNode.distal.y, cylNode.distal.z);

				var axis = new THREE.Vector3();
				axis.subVectors(topBasePos, bottomBasePos);
				var midPoint = new THREE.Vector3();
				midPoint.addVectors(bottomBasePos, topBasePos).multiplyScalar(0.5);

				var c = new THREE.CylinderGeometry(cylNode.topRadius, cylNode.bottomRadius, axis.length(), 6, 1, false);
				c.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
				var threeObject = new THREE.Mesh(c, material);

				threeObject.lookAt(axis);
				threeObject.position.fromArray(midPoint.toArray());

				threeObject.geometry.verticesNeedUpdate = true;
				return threeObject;
			},

			/**
			 * Creates and positions a ThreeJS sphere object
			 * 
			 * @param {VisualObjectNode}
			 *            sphereNode - a Geppetto Sphere Node
			 * @param {ThreeJSMaterial}
			 *            material - Material to be used for the Mesh
			 * @returns a ThreeJS sphere correctly positioned w.r.t the global frame of reference
			 */
			create3DSphereFromNode : function(sphereNode, material)
			{

				var sphere = new THREE.SphereGeometry(sphereNode.radius, 20, 20);
				// sphere.applyMatrix(new THREE.Matrix4().makeScale(-1,1,1));
				threeObject = new THREE.Mesh(sphere, material);
				threeObject.position.set(sphereNode.position.x, sphereNode.position.y, sphereNode.position.z);

				threeObject.geometry.verticesNeedUpdate = true;
				return threeObject;
			},

			getLineMaterial : function(thickness)
			{
				var options =
				{};
				if (thickness)
				{
					options.linewidth = thickness;
				}
				var material = new THREE.LineBasicMaterial(options);
				material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
				material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
				material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
				return material;
			},

			getMeshPhongMaterial : function(shine)
			{
				if (shine == undefined)
				{
					shine = 10;
				}
				var material = new THREE.MeshPhongMaterial(
				{
					opacity : 1,
					shininess : shine,
					shading : THREE.SmoothShading
				});

				material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
				material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
				material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
				return material;
			},

			getParticleMaterial : function()
			{
				var textureLoader = new THREE.TextureLoader();
				var pMaterial = new THREE.PointsMaterial(
				{
					size : 5,
					map : textureLoader.load("geppetto/images/particle.png"),
					blending : THREE.AdditiveBlending,
					depthTest : false,
					transparent : true
				});
				pMaterial.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
				pMaterial.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
				pMaterial.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
				pMaterial.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
				return pMaterial;
			}
		};
	}
});
