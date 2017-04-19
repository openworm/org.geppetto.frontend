define(['jquery'], function () {

    var THREE = require('three');

    function SceneFactory(viewer) {

        this.viewer = viewer;
        this.linesUserInput=false;
        this.linesUserPreference=undefined;
        this.linesThreshold=2000;
        this.aboveLinesThreshold=false;
        this.wireframe=false;
        this.isAnimated=false;
    }

    SceneFactory.prototype = {

        constructor: SceneFactory,

        
        setLinesUserInput:function(askUser){
            this.linesUserInput=askUser;
        },


        buildScene: function (instances) {
            this.traverseInstances(instances);
            this.viewer.scene.updateMatrixWorld(true);
            this.viewer.resetCamera();
        },


        updateSceneWithNewInstances: function (instances) {
            var updateCamera=false;
            if(Object.keys(Gthis.viewer.meshes).length === 0){
                updateCamera=true;
            }
            for (var g = 0; g < instances.length; g++) {
                // add instance to scene
                this.checkVisualInstance(instances[g]);
            }
            if(updateCamera){
                this.viewer.resetCamera();
            }
        },

        /**
         * Traverse the instances building a visual object when needed
         *
         * @param instances -
         *            skeleton with instances and visual entities
         */
        traverseInstances: function (instances, lines, thickness) {
            for (var j = 0; j < instances.length; j++) {
                this.checkVisualInstance(instances[j], lines, thickness);
            }
        },

        /**
         * Check if we need to create a visual object for a given instance and keeps iterating
         *
         * @param instances -
         *            skeleton with instances and visual entities
         */
        checkVisualInstance: function (instance, lines, thickness) {
            if (instance.hasCapability(GEPPETTO.Resources.VISUAL_CAPABILITY)) {
                //since the visualcapability propagates up through the parents we can avoid visiting things that don't have it
                if ((instance.getType().getMetaType() != GEPPETTO.Resources.ARRAY_TYPE_NODE) && instance.getVisualType()) {
                    this.buildVisualInstance(instance, lines, thickness);
                }
                // this block keeps traversing the instances
                if (instance.getMetaType() == GEPPETTO.Resources.INSTANCE_NODE) {
                    this.traverseInstances(instance.getChildren(), lines, thickness);
                } else if (instance.getMetaType() == GEPPETTO.Resources.ARRAY_INSTANCE_NODE) {
                    this.traverseInstances(instance, lines, thickness);
                }
            }
        },


        buildVisualInstance: function (instance, lines, thickness) {
            var meshes = this.generate3DObjects(instance, lines, thickness);
            this.init3DObject(meshes, instance);
        },

        /**
         * Initializes a group of meshes that were created and adds them to the 3D scene
         *
         * @param {Object}
         *            meshes - The meshes that need to be initialized
         */
        init3DObject: function (meshes, instance) {
            var instancePath = instance.getInstancePath();
            var position = instance.getPosition();
            for (var m in meshes) {
                var mesh = meshes[m];

                mesh.instancePath = instancePath;
                // if the model file is specifying a position for the loaded meshes then we translate them here
                if (position != null) {
                    var p = new THREE.Vector3(position.x, position.y, position.z);
                    mesh.position.set(p.x, p.y, p.z);
                    mesh.matrixAutoUpdate = false;
                    mesh.applyMatrix(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
                    mesh.geometry.verticesNeedUpdate = true;
                    mesh.updateMatrix();
                    // mesh.geometry.translate(position.x, position.y,position.z);
                }
                this.viewer.scene.add(mesh);
                this.viewer.meshes[instancePath] = mesh;
                this.viewer.meshes[instancePath].visible = true;
                this.viewer.meshes[instancePath].ghosted = false;
                this.viewer.meshes[instancePath].defaultOpacity = 1;
                this.viewer.meshes[instancePath].selected = false;
                this.viewer.meshes[instancePath].input = false;
                this.viewer.meshes[instancePath].output = false;

                //Split anything that was splitted before
                if (instancePath in this.viewer.splitMeshes) {
                    var splitMeshes = this.viewer.splitMeshes;
                    var elements = {};
                    for (var splitMesh in splitMeshes) {
                        if (splitMeshes[splitMesh].instancePath == instancePath && splitMesh != instancePath) {
                            visualObject = splitMesh.substring(instancePath.length + 1);
                            elements[visualObject] = "";
                        }
                    }
                    if (Object.keys(elements).length > 0) {
                        this.splitGroups(instance, elements);
                    }
                }
            }
        },

        /**
         *
         * @param instance
         * @param lines
         * @param thickness
         * @returns {Array}
         */
        generate3DObjects: function (instance, lines, thickness) {
            var previous3DObject = this.viewer.meshes[instance.getInstancePath()];
            var color = undefined;
            if (previous3DObject) {
                color=previous3DObject.material.defaultColor;
                // if an object already exists for this aspect we remove it. This could happen in case we are changing how an aspect
                // is visualized, e.g. lines over tubes representation
                this.viewer.scene.remove(previous3DObject);
                var splitMeshes = this.viewer.splitMeshes;
                for (var m in splitMeshes) {
                    if (m.indexOf(instance.getInstancePath()) != -1) {
                        this.viewer.scene.remove(splitMeshes[m]);
                        //splitMeshes[m] = null;
                    }
                }

            }
            var that = this;
            //TODO This can be optimised, no need to create both
            var materials =
            {
                "mesh": that.getMeshPhongMaterial(color),
                "line": that.getLineMaterial(thickness,color)
            };
            var instanceObjects = [];
            var threeDeeObjList = this.walkVisTreeGen3DObjs(instance, materials, lines);

            // only merge if there are more than one object
            if (threeDeeObjList.length > 1) {
                var mergedObjs = this.merge3DObjects(threeDeeObjList, materials);
                // investigate need to obj.dispose for obj in threeDeeObjList
                if (mergedObjs != null) {
                    mergedObjs.instancePath = instance.getInstancePath();
                    instanceObjects.push(mergedObjs);
                } else {
                    for (var obj in threeDeeObjList) {
                        threeDeeObjList[obj].instancePath = instance.getInstancePath();
                        instanceObjects.push(threeDeeObjList[obj]);
                    }
                }
            }
            else if(threeDeeObjList.length==1)
            {
                // only one object in list, add it to local array and set
                instanceObjects.push(threeDeeObjList[0]);
                instanceObjects[0].instancePath = instance.getInstancePath();
            }

            return instanceObjects;
        },

        /**
         *
         * @param instance
         * @param materials
         * @param lines
         * @returns {Array}
         */
        walkVisTreeGen3DObjs: function (instance, materials, lines) {
            var threeDeeObj = null;
            var threeDeeObjList = [];
            var visualType = instance.getVisualType();
            if (visualType == undefined) {
                return threeDeeObjList;
            }
            else {
                if ($.isArray(visualType)) {
                    //TODO if there is more than one visual type we need to display all of them
                    visualType = visualType[0];
                }
            }
            if (visualType.getMetaType() == GEPPETTO.Resources.COMPOSITE_VISUAL_TYPE_NODE) {
                for (var v in visualType.getVariables()) {
                    var visualValue = visualType.getVariables()[v].getWrappedObj().initialValues[0].value;
                    threeDeeObj = this.visualizationTreeNodeTo3DObj(instance, visualValue, visualType.getVariables()[v].getId(), materials, lines);
                    if (threeDeeObj) {
                        threeDeeObjList.push(threeDeeObj);
                    }
                }
            } else {
                var visualValue = visualType.getWrappedObj().defaultValue;
                threeDeeObj = this.visualizationTreeNodeTo3DObj(instance, visualValue, visualType.getId(), materials, lines);
                if (threeDeeObj) {
                    threeDeeObjList.push(threeDeeObj);
                }
            }

            return threeDeeObjList;
        },


        /**
         *
         * @param objArray
         * @param materials
         * @returns {*}
         */
        merge3DObjects: function (objArray, materials) {
            var mergedMeshesPaths = [];
            var ret = null;
            var mergedLines;
            var mergedMeshes;
            objArray.forEach(function (obj) {
                if (obj instanceof THREE.Line) {
                    if (mergedLines === undefined) {
                        mergedLines = new THREE.Geometry()
                    }
                    mergedLines.vertices.push(obj.geometry.vertices[0]);
                    mergedLines.vertices.push(obj.geometry.vertices[1]);
                }
                else if (obj.geometry.type == "Geometry") {
                    // This catches both Collada an OBJ
                    if (objArray.length > 1) {
                        throw Error("Merging of multiple OBJs or Colladas not supported");
                    }
                    else {
                        ret = obj;
                    }
                }
                else {
                    if (mergedMeshes === undefined) {
                        mergedMeshes = new THREE.Geometry()
                    }
                    obj.geometry.dynamic = true;
                    obj.geometry.verticesNeedUpdate = true;
                    obj.updateMatrix();
                    mergedMeshes.merge(obj.geometry, obj.matrix);
                }
                mergedMeshesPaths.push(obj.instancePath);

            });

            if (mergedLines === undefined) {
                // There are no line geometries, we just create a mesh for the merge of the solid geometries
                // and apply the mesh material
                ret = new THREE.Mesh(mergedMeshes, materials["mesh"]);
            } else {
                ret = new THREE.LineSegments(mergedLines, materials["line"]);
                if (mergedMeshes != undefined) {
                    // we merge into a single mesh both types of geometries (from lines and 3D objects)
                    var tempmesh = new THREE.Mesh(mergedMeshes, materials["mesh"]);
                    ret.geometry.merge(tempmesh.geometry, tempmesh.matrix);
                }
            }

            if (ret != null && !Array.isArray(ret)) {
                ret.mergedMeshesPaths = mergedMeshesPaths;
            }

            return ret;

        },


        /**
         *
         * @param instance
         * @param node
         * @param id
         * @param materials
         * @param lines
         * @returns {*}
         */
        visualizationTreeNodeTo3DObj: function (instance, node, id, materials, lines) {
            var threeObject = null;
            
            if (lines === undefined) {
                // Unless it's being forced we use a threshold to decide whether to use lines or cylinders
                if (!this.aboveLinesThreshold) {
                    //Unless we are already above the threshold...
                    this.aboveLinesThreshold = this.complexity > this.linesThreshold;
                    
                    if (this.aboveLinesThreshold) {

                        if(this.linesUserInput && this.linesUserPreference==undefined){

                            //we need to ask the user
                            this.linesUserPreference = confirm("The model you are loading has a complex morphology, would you like to render it using lines instead of 3D shapes? Be careful, choosing to use 3D shapes might crash your browser!");
                            
                            if (this.linesUserPreference) {
                            this.setAllGeometriesType(GEPPETTO.Resources.GeometryTypes.LINES);
                            }	             
                            else{
                            }
                        }
                        else{
                            this.setAllGeometriesType(GEPPETTO.Resources.GeometryTypes.LINES);
                        }
                    }
                }
                
                if(this.aboveLinesThreshold && this.linesUserInput){
                    lines = this.linesUserPreference;
                }
                else{
                    lines = this.aboveLinesThreshold;
                }
            }

            var material = lines ? materials["line"] : materials["mesh"];

            switch (node.eClass) {
                case GEPPETTO.Resources.PARTICLE:
                    threeObject = this.createParticle(node);
                    break;

                case GEPPETTO.Resources.CYLINDER:
                    if (lines) {
                        threeObject = this.create3DLineFromNode(node, material);
                    } else {
                        threeObject = this.create3DCylinderFromNode(node, material);
                    }
                    break;

                case GEPPETTO.Resources.SPHERE:
                    if (lines) {
                        threeObject = this.create3DLineFromNode(node, material);
                    } else {
                        threeObject = this.create3DSphereFromNode(node, material);
                    }
                    break;
                case GEPPETTO.Resources.COLLADA:
                    threeObject = this.loadColladaModelFromNode(node);
                    break;
                case GEPPETTO.Resources.OBJ:
                    threeObject = this.loadThreeOBJModelFromNode(node);
                    break;
            }
            if (threeObject) {
                threeObject.visible = true;
                // TODO: this is empty for collada and obj nodes
                var instancePath = instance.getInstancePath() + "." + id;
                threeObject.instancePath = instancePath;
                threeObject.highlighted = false;

                // TODO: shouldn't that be the vistree? why is it also done at the loadEntity level??
                this.viewer.visualModelMap[instancePath] = threeObject;
            }
            return threeObject;
        },

        /**
         *
         * @param node
         * @returns {*}
         */
        loadColladaModelFromNode: function (node) {
            var loader = new THREE.ColladaLoader();
            loader.options.convertUpAxis = true;
            var scene = null;
            loader.parse(node.collada, function (collada) {
                scene = collada.scene;
                scene.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
                        child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.material.wireframe = this.wireframe;
                        child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.geometry.computeVertexNormals();
                    }
                    if (child instanceof THREE.SkinnedMesh) {
                        child.material.skinning = true;
                        child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
                        child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.material.wireframe = this.wireframe;
                        child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                        child.geometry.computeVertexNormals();
                    }
                });
            });
            return scene;
        },

        /**
         *
         * @param node
         * @returns {*}
         */
        loadThreeOBJModelFromNode: function (node) {
            var manager = new THREE.LoadingManager();
            manager.onProgress = function (item, loaded, total) {
                console.log(item, loaded, total);
            };
            var loader = new THREE.OBJLoader(manager);
            var scene = loader.parse(node.obj);

            scene.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
                    child.material.wireframe = this.wireframe;
                    child.material.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
                    child.material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                    child.material.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
                    child.geometry.computeVertexNormals();
                }
            });

            return scene;
        },

        /**
         *
         * @param node
         * @returns {THREE.Vector3|*}
         */
        createParticle: function (node) {
            threeObject = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
            threeObject.visible = true;
            threeObject.instancePath = node.instancePath;
            threeObject.highlighted = false;
            // TODO: does that need to be done?
            this.viewer.visualModelMap[node.instancePath] = threeObject;

            return threeObject;

        },

        /**
         *
         * @param node
         * @param material
         * @returns {THREE.Line}
         */
        create3DLineFromNode: function (node, material) {
            if (node.eClass == GEPPETTO.Resources.CYLINDER) {
                var bottomBasePos = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
                var topBasePos = new THREE.Vector3(node.distal.x, node.distal.y, node.distal.z);

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
            } else if (node.eClass == GEPPETTO.Resources.SPHERE) {
                var sphere = new THREE.SphereGeometry(node.radius, 20, 20);
                threeObject = new THREE.Mesh(sphere, material);
                threeObject.position.set(node.position.x, node.position.y, node.position.z);
                threeObject.geometry.verticesNeedUpdate = true;
            }
            return threeObject;
        },

        /**
         *
         * @param cylNode
         * @param material
         * @returns {THREE.Mesh}
         */
        create3DCylinderFromNode: function (cylNode, material) {

            var bottomBasePos = new THREE.Vector3(cylNode.position.x, cylNode.position.y, cylNode.position.z);
            var topBasePos = new THREE.Vector3(cylNode.distal.x, cylNode.distal.y, cylNode.distal.z);

            var axis = new THREE.Vector3();
            axis.subVectors(topBasePos, bottomBasePos);
            var midPoint = new THREE.Vector3();
            midPoint.addVectors(bottomBasePos, topBasePos).multiplyScalar(0.5);

            var c = new THREE.CylinderGeometry(cylNode.topRadius, cylNode.bottomRadius, axis.length(), 20, 1, false);
            c.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
            var threeObject = new THREE.Mesh(c, material);

            threeObject.lookAt(axis);
            threeObject.position.fromArray(midPoint.toArray());

            threeObject.geometry.verticesNeedUpdate = true;
            return threeObject;
        },

        /**
         * Modify the origin and radius of a sphere
         * @returns {THREE.Mesh}
         */
        modify3DSphere:function(object,x,y,z,radius){
            // Impossible to change the radius of a Sphere.
            // Removing old object and creating a new one
            this.viewer.scene.remove(object);
            return this.add3DSphere(x,y,z,radius);
        },

        /**
         * Add a 3D sphere to the scene at the given coordinates (4) points. 
         * It could be any geometry really.
         * @returns {THREE.Mesh}
         */
        add3DSphere: function (x,y,z,radius) {
            if (this.aboveLinesThreshold) {
                radius = 1;
            }

            var material= new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
            material.nowireframe=true;
            material.opacity= 0.6;
            material.transparent=true;
            material.color.setHex("0xff0000");
            
            var sphereNode ={radius:radius,position:{x:x, y:y, z:z}}
            var mesh = this.create3DSphereFromNode(sphereNode, material)
            mesh.renderOrder=1;
            mesh.clickThrough=true;
            this.viewer.scene.add(mesh);
            return mesh;
        },


        /**
         * Add a 3D plane to the scene at the given coordinates (4) points. 
         * It could be any geometry really.
         * @returns {THREE.Mesh}
         */
        add3DPlane: function (x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4, textureURL) {

            var geometry=new THREE.Geometry();
            geometry.vertices.push(
                new THREE.Vector3(x1,y1,z1),//vertex0
                new THREE.Vector3(x2,y2,z2),//1
                new THREE.Vector3(x3,y3,z3),//2
                new THREE.Vector3(x4,y4,z4)//3
            );
            geometry.faces.push(
                new THREE.Face3(2,1,0),//use vertices of rank 2,1,0
                new THREE.Face3(3,1,2)//vertices[3],1,2...
            );
            geometry.computeBoundingBox();

            var max = geometry.boundingBox.max,
                min = geometry.boundingBox.min;
            var offset = new THREE.Vector2(0 - min.x, 0 - min.y);
            var range = new THREE.Vector2(max.x - min.x, max.y - min.y);
            var faces = geometry.faces;

            geometry.faceVertexUvs[0] = [];

            for (var i = 0; i < faces.length ; i++) {

                var v1 = geometry.vertices[faces[i].a], 
                    v2 = geometry.vertices[faces[i].b], 
                    v3 = geometry.vertices[faces[i].c];

                geometry.faceVertexUvs[0].push([
                    new THREE.Vector2((v1.x + offset.x)/range.x ,(v1.y + offset.y)/range.y),
                    new THREE.Vector2((v2.x + offset.x)/range.x ,(v2.y + offset.y)/range.y),
                    new THREE.Vector2((v3.x + offset.x)/range.x ,(v3.y + offset.y)/range.y)
                ]);
            }
            geometry.uvsNeedUpdate = true;
            geometry.dynamic = true;

            var material= new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
            material.nowireframe=true;
            if(textureURL!=undefined){
                var loader = new THREE.TextureLoader();
                // load a resource
                loader.load(
                    // resource URL
                    textureURL,
                    // Function when resource is loaded
                    function ( texture ) {
                        //texture.minFilter = THREE.LinearFilter;
                        material.map=texture;
                        texture.flipY = false;
                        material.opacity= 0.3;
                        material.transparent=true;
                        material.needsUpdate = true;
                        
                    },
                    // Function called when download progresses
                    function ( xhr ) {
                        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
                    },
                    // Function called when download errors
                    function ( xhr ) {
                        console.log( 'An error happened' );
                    }
                );
                
            }
            else{
                material.opacity= 0.3;
                material.transparent=true;
                material.color.setHex("0xb0b0b0");
            }
            
            var mesh = new THREE.Mesh(geometry, material);
            mesh.renderOrder=1;
            mesh.clickThrough=true;
            this.viewer.scene.add(mesh);
            return mesh;
        },
        
        /**
         * Modify the coordinates (4) points of an existing plane. 
         * @returns {THREE.Mesh}
         */
        modify3DPlane:function(object,x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4){
            object.geometry.vertices[0].set(x1,y1,z1);
            object.geometry.vertices[1].set(x2,y2,z2);
            object.geometry.vertices[2].set(x3,y3,z3);
            object.geometry.vertices[3].set(x4,y4,z4);
            object.geometry.verticesNeedUpdate = true;
            return object;
        },


        /**
         *
         * @param sphereNode
         * @param material
         * @returns {THREE.Mesh|*}
         */
        create3DSphereFromNode: function (sphereNode, material) {

            var sphere = new THREE.SphereGeometry(sphereNode.radius, 20, 20);
            // sphere.applyMatrix(new THREE.Matrix4().makeScale(-1,1,1));
            var threeObject = new THREE.Mesh(sphere, material);
            threeObject.position.set(sphereNode.position.x, sphereNode.position.y, sphereNode.position.z);

            threeObject.geometry.verticesNeedUpdate = true;
            return threeObject;
        },

        /**
         *
         * @param thickness
         * @returns {THREE.LineBasicMaterial}
         */
        getLineMaterial: function (thickness, color) {
            var options = {};
            if (thickness) {
                options.linewidth = thickness;
            }
            if (color == undefined) {
                color = GEPPETTO.Resources.COLORS.DEFAULT;
            }
            var material = new THREE.LineBasicMaterial(options);
            material.color.setHex(color);
            material.defaultColor = color;
            material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            return material;
        },

        /**
         *
         * @param color
         * @returns {THREE.MeshPhongMaterial}
         */
        getMeshPhongMaterial: function (color) {
            if (color == undefined) {
                color = GEPPETTO.Resources.COLORS.DEFAULT;
            }
            var material = new THREE.MeshPhongMaterial(
                {
                    opacity: 1,
                    shininess: 10,
                    shading: THREE.SmoothShading
                });

            material.color.setHex(color);
            material.defaultColor = color;
            material.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            return material;
        },

        /**
         *
         * @returns {THREE.PointsMaterial}
         */
        getParticleMaterial: function () {
            var textureLoader = new THREE.TextureLoader();
            var pMaterial = new THREE.PointsMaterial(
                {
                    size: 5,
                    map: textureLoader.load("geppetto/images/particle.png"),
                    blending: THREE.AdditiveBlending,
                    depthTest: false,
                    transparent: true
                });
            pMaterial.color.setHex(GEPPETTO.Resources.COLORS.DEFAULT);
            pMaterial.defaultColor = GEPPETTO.Resources.COLORS.DEFAULT;
            pMaterial.opacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            pMaterial.defaultOpacity = GEPPETTO.Resources.OPACITY.DEFAULT;
            return pMaterial;
        }
    
};

    return SceneFactory;
});

