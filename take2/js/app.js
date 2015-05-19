'use strict';

// namespace definition
var Viewer3D = Viewer3D || {};


Viewer3D.MonoCamera = ( function () {
    var MonoCameraClass = function (vport) {
        this.vport = vport;
        this.position = new THREE.Vector3(0, 20, 100);

        if ( window.WebGLRenderingContext ) {
            console.log("WebGL available... Yoohoo");
            this.renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: true
                });
        } else {
            console.log("WebGL NOT available... :-( Using Canvas");
            this.renderer = new THREE.CanvasRenderer();
        }

        this.renderer.setSize(vport.width, vport.height);
        vport.container.appendChild(this.renderer.domElement);

        this.renderer.setClearColor(0xeeeeee, 1);

        this.camera = new THREE.PerspectiveCamera(
            35,
            vport.width / vport.height,
            1,
            1000
            );

        this.camera.position.copy(this.position);
        this.scene = vport.scene;
    };

    MonoCameraClass.prototype.setPosition = function (pos) {
        this.position.copy(pos);
        this.camera.position.copy(pos);
    };



    MonoCameraClass.prototype.onResize = function () {
        // get the new width and height
        var width, height, aspect;
        width = this.vport.width;
        height = this.vport.height;

        // update renderer size
        this.renderer.setSize(width, height);
        // update camera aspect ratio
        aspect = width / height;
        console.log( "aspect = " + aspect.toString() );
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
    };

    MonoCameraClass.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    };

    MonoCameraClass.prototype.getCurrentCamera = function ( x, y ) {
        return this.camera;
    };

    MonoCameraClass.prototype.getCoordsAndCamera = function (x, y) {
        var x1, y1;
        x1 = 2 * ( x / (this.vport.width)) - 1;
        y1 = 1 - 2 * ( y / this.vport.height );
        return [x1, y1, this.camera, 0];
    };

    return MonoCameraClass;
} ) ();

Viewer3D.StereoCamera = ( function () {
    var StereoCameraClass = function (vport) {
        this.vport = vport;
        this.viewSepWidth = 2;
        this.camSepWidth = 0.1;
        this.position = new THREE.Vector3(0, 50, 200);

        if ( window.WebGLRenderingContext ) {
            console.log("WebGL available... Yoohoo");
            this.renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: true
                });
        } else {
            console.log("WebGL NOT available... :-( Using Canvas");
            this.renderer = new THREE.CanvasRenderer();
        }

        this.width = vport.width;
        this.height = vport.height;
        this.width = this.width % 2 === 0 ? this.width : this.width - 1;

        this.renderer.setSize(this.width + this.viewSepWidth, this.height);
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0xeeeeee, 1);

        vport.container.appendChild(this.renderer.domElement);

        this.cameraL = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            );

        this.cameraL.position.copy(this.position);
        this.cameraL.position.x -= this.camSepWidth;

        this.cameraR = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            );

        this.cameraR.position.copy(this.position);
        this.cameraR.position.x += this.camSepWidth;

        this.scene = vport.scene;
    };

    StereoCameraClass.prototype.onResize = function () {
        // get the new width and height
        var width, height, aspect;
        width = this.vport.width;
        width = width % 2 === 0 ? width : width - 1;
        this.width = width;

        height = this.vport.height;
        this.height = height;

        // update renderer size
        this.renderer.setSize(width + this.viewSepWidth, height);

        // update camera aspect ratio
        aspect = width / (2 * height);
        this.cameraL.aspect = aspect;
        this.cameraL.updateProjectionMatrix();
        this.cameraR.aspect = aspect;
        this.cameraR.updateProjectionMatrix();
    };

    StereoCameraClass.prototype.render = function () {
        this.renderer.clear();
        this.renderer.setViewport(0, 0, this.width/2, this.height);
        // that's right... cameraR draws on the left, and cameraL on the right
        this.renderer.render(this.scene, this.cameraR);

        this.renderer.setViewport(this.width/2 + this.viewSepWidth, 0, this.width/2, this.height);
        this.renderer.render(this.scene, this.cameraL, undefined, false);
    };

    StereoCameraClass.prototype.setPosition = function (pos) {
        this.position.copy(pos);
        this.cameraL.position.copy(pos);
        this.cameraL.position.x -= this.camSepWidth;

        this.cameraR.position.copy(pos);
        this.cameraR.position.x += this.camSepWidth;
    };

    StereoCameraClass.prototype.getCurrentCamera = function ( x, y ) {
        if ( ( y >= 0 ) && ( y <= this.height )) {
            if ( ( x >= 0 ) && ( x <= (this.width / 2)) ) {
                // camera 1
                return this.cameraR;
            } else if ( ( x >= (this.width/2 + this.viewSepWidth) ) &&
                        ( x <= (this.width + this.viewSepWidth)) ) {
                // camera 2
                return this.cameraL;
            }
        }
        return null;

    };

    StereoCameraClass.prototype.getCoordsAndCamera = function (x, y) {
        var x1, y1;
        if ( ( y >= 0 ) && ( y <= this.height )) {
            if ( ( x >= 0 ) && ( x <= (this.width / 2)) ) {
                x1 = 2 * ( x / (this.width/2)) - 1;
                y1 = 1 - 2 * ( y / this.height );
                // camera 1
                return [x1, y1, this.cameraR, this.camSepWidth];
            } else if ( ( x >= (this.width/2 + this.viewSepWidth) ) &&
                        ( x <= (this.width + this.viewSepWidth)) ) {
                x1 = 2 * ( (x - this.width/2 - this.viewSepWidth ) / (this.width/2)) - 1;
                y1 = 1 - 2 * ( y / this.height );
                // camera 2
                return [x1, y1, this.cameraL, -this.camSepWidth];
            }
        }
        return null;
    };

    StereoCameraClass.prototype.getViewportDetails = function (x, y) {
        var el = this.renderer.domElement;
        var left, top, offsetAttrs;
        offsetAttrs = this.renderer.domElement.getClientRects()[0];
        left = offsetAttrs.left;
        top = offsetAttrs.top;

        if ( ( y >= 0 ) && ( y <= this.height )) {
            if ( ( x >= 0 ) && ( x <= (this.width / 2)) ) {
                return [left, top, this.width/2, this.height];
            } else if ( ( x >= (this.width/2 + this.viewSepWidth) ) &&
                        ( x <= (this.width + this.viewSepWidth)) ) {
                return [left + (this.width/2 + this.viewSepWidth), top, this.width/2, this.height];
            }
        }
        return null;
    }

    return StereoCameraClass;
} ) ();


Viewer3D.Picker = ( function () {
    var PickerClass = function (el, scene, cameraWrap, viewer) {
        this.el = el;
        this.scene = scene;
        this.cameraWrap = cameraWrap;
        this.pickedObject = null;
        this.viewer = viewer;
        this.pickClone = null;
        this.leftDown = false;
        this.leftDownPos = null;
        this.middleDown = false;
        this.middleDownPos = null;
        this.dragging = false;
        this.latchPoint = null;
        this.savedCamPosition = null;
        this.panning = false;
        this.orbiting = false;

        var that = this;

        function _onMouseMove ( evt ) {
            that.onMouseMove(evt);
        }

        function _onMouseDown ( evt ) {
            var button = evt.button;

            if ( button === 0 ) {
                that.leftDown = true;
                that.leftDownPos = [evt.clientX, evt.clientY];
            } else if ( button === 1 ) {
                that.middleDown = true;
                that.middleDownPos = [evt.clientX, evt.clientY];
            }
        }

        function _onMouseUp ( evt ) {
            var button = evt.button;

            if ( button === 0 ) {
                that.leftDown = false;
                that.panning = false;
                if (!that.dragging) {
                    that.onMouseLeftClick(evt);
                }
            } else if ( button === 1 ) {
                that.middleDown = false;
                that.orbiting = false;
                if (!that.dragging) {
                    that.onMouseMiddleClick(evt);
                }
            }

            if (!(that.leftDown || that.middleDown)) {
                that.dragging = false;
                that.latchPoint = null;
            }
        }

        el.onmousemove = _onMouseMove;
        el.onmousedown = _onMouseDown;
        el.onmouseup = _onMouseUp;
    };

    PickerClass.prototype.getDragDist = function (p1, p2) {
        var x1, y1, x2, y2;
        x1 = p1[0];
        y1 = p1[1];
        x2 = p2[0];
        y2 = p2[1];
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    };

    PickerClass.prototype.onMouseLeftClick = function (evt) {
        console.log("on left click");
    };

    PickerClass.prototype.onMouseMiddleClick = function (evt) {
        console.log("on middle click");
    };

    PickerClass.prototype.findLatchPoint = function (evt) {
        var camPos = this.cameraWrap.position.clone();
        var pos,
            avgPos = new THREE.Vector3();
        if (this.pickedObject !== null) {
            this.latchPoint = this.pickedObject.position.clone();
            return this.latchPoint;
        } else {
            if (this.scene.theObjects.length === 0) {
                this.latchPoint = new THREE.Vector3(0, 0, 0);
                return this.latchPoint
            }

            var oneByNumPos;
            for (var x1 = this.scene.theObjects.children.length - 1; x1 >= 0; x1--) {
                pos = this.scene.theObjects.children[x1].position;
                avgPos.add(pos);
            };

            oneByNumPos = 1/this.scene.theObjects.children.length;
            avgPos.x = avgPos.x * oneByNumPos;
            avgPos.y = avgPos.y * oneByNumPos;
            avgPos.z = avgPos.z * oneByNumPos;
            this.latchPoint = avgPos;
            return this.latchPoint;
        }
    }

    PickerClass.prototype.setupPanning = function (evt) {
        var offsetx, offsety, offsetAttrs;
        var coordCam;

        // get current camera
        offsetAttrs = this.el.getClientRects()[0];
        offsetx = offsetAttrs.left;
        offsety = offsetAttrs.top;

        coordCam = this.cameraWrap.getCoordsAndCamera(evt.clientX - offsetx,
                                  evt.clientY - offsety);

        this.currentCam = coordCam[2];
        this.camXOffset = coordCam[3];

        if (this.currentCam === null) {
            this.panning = false;
            return;
        }

        this.panning = true;

        // need orig cam position
        this.currentCamPos = this.currentCam.position.clone();
        this.latchPoint = this.findLatchPoint();

        // find camera front vector
        // TODO : we probably don't need camFront - no we do need it.
        // we need it to find point on latch plane (via dot product)
        this.camFront = new THREE.Vector3(0, 0, -1);
        this.camFront.applyQuaternion( this.currentCam.quaternion );

        // dot product with cam-latch vector
        this.latchDist = Math.abs(this.camFront.dot(this.latchPoint.clone().sub( this.currentCamPos )));

        // save the unproject matrix
        // TODO : create once and reuse.
        var matrix = new THREE.Matrix4;
        matrix.multiplyMatrices( this.currentCam.matrixWorld, matrix.getInverse( this.currentCam.projectionMatrix ) );
        this.unprojectMatrix = matrix;

        var vec = new THREE.Vector3(coordCam[0], coordCam[1], 0.5);
        vec.applyProjection( this.unprojectMatrix );
        vec = vec.sub(this.currentCamPos);

        // set the pan starting point
        // its the unproject of the current mouse vector on the latch plane
        var pspUnit, scale;
        pspUnit = vec.normalize();
        scale = this.latchDist / Math.abs(pspUnit.dot(this.camFront));
        this.panStartPoint = this.currentCamPos.clone().add(vec.multiplyScalar(scale));

        var vpDetails = this.cameraWrap.getViewportDetails(evt.clientX - offsetx,
                                  evt.clientY - offsety);
        this.vpLeft = vpDetails[0];
        this.vpTop = vpDetails[1];
        this.vpWidth = vpDetails[2];
        this.vpHeight = vpDetails[3];

        this.doPanning(evt);
    }

    PickerClass.prototype.getViewportCoords = function (evt) {
        var x, y;
        x = evt.clientX - this.vpLeft;
        y = evt.clientY - this.vpTop;

        x = 2 * ( x / this.vpWidth) - 1;
        y = 1 - 2 * ( y / this.vpHeight );

        return [x, y];
    }

    PickerClass.prototype.doPanning = function (evt) {
        // unproject point under mouse and find
        var coords = this.getViewportCoords(evt);
        var mouse3D = new THREE.Vector3(coords[0], coords[1], 0.5);
        mouse3D.applyProjection( this.unprojectMatrix );
        mouse3D = mouse3D.sub(this.currentCamPos);

        var scale;
        mouse3D = mouse3D.normalize();
        scale = this.latchDist / Math.abs(mouse3D.dot(this.camFront));

        // location on latch plane
        mouse3D = this.currentCamPos.clone().add(mouse3D.multiplyScalar(scale));
        var changeOnLatchPlane = mouse3D.sub(this.panStartPoint);
        var newCamPos = this.currentCamPos.clone().sub(changeOnLatchPlane);

        newCamPos.x = newCamPos.x - this.camXOffset;

        this.cameraWrap.setPosition(newCamPos);
        // use latch distance and mouse position to pan
        console.log("panning");
        this.viewer.render();
    };

    PickerClass.prototype.setupOrbiting = function (evt) {
        this.orbiting = true;
        console.log("setting up orbiting");
    };

    PickerClass.prototype.doOrbiting = function (evt) {
        console.log("orbiting");
    };

    PickerClass.prototype.onMouseMove = function (evt) {
        if (this.panning) {
            this.doPanning(evt);
        }
        if (this.orbiting) {
            this.doOrbiting(evt);
        }

        var pos, dist;

        if (this.leftDown) {
            pos = [evt.clientX, evt.clientY];
            dist = this.getDragDist(this.leftDownPos, pos);
            if (this.dragging || (dist >= 3)) {
                this.dragging = true;
                this.setupPanning(evt);
                return;
            }
        }

        if (this.middleDown) {
            pos = [evt.clientX, evt.clientY];
            dist = this.getDragDist(this.middleDownPos, pos);
            if (this.dragging || (dist >= 3)) {
                this.dragging = true;
                this.setupOrbiting(evt);
                return;
            }
        }

        var mouseVector = new THREE.Vector3();
        var offsetx, offsety, offsetAttrs;
        var coordsAndCam;
        var objects = this.scene.theObjects;

        offsetAttrs = this.el.getClientRects()[0];
        offsetx = offsetAttrs.left;
        offsety = offsetAttrs.top;

        coordsAndCam = this.cameraWrap.getCoordsAndCamera(evt.clientX - offsetx,
                                  evt.clientY - offsety);

        if (coordsAndCam === null) {
            this.pickedObject = null;
            return;
        }

        mouseVector.x = coordsAndCam[0];
        mouseVector.y = coordsAndCam[1];

        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( mouseVector.clone(), coordsAndCam[2] );
        var intersects = raycaster.intersectObjects( objects.children );
        var newPick = null;

        if (intersects.length > 0) {
            newPick = intersects[0].object;
        }

        if ((newPick !== null) && (newPick !== this.pickedObject)) {
            this.pickedObject = newPick;
            this.viewer.render();
        } else {
            if ((newPick === null) && (this.pickedObject !== null)) {
                this.pickedObject = null;
                this.viewer.render();
            }
        }
    };

    PickerClass.prototype.highlightPickedObject = function () {
        var cloneGeo, cloneMat;
        var pos, rot;
        var scale = 1.002;

        if ( this.pickedObject !== null ) {
            if (this.pickClone !== null ) {
                this.scene.remove(this.pickClone);
                this.pickClone = null;
            }
            cloneGeo = this.pickedObject.geometry.clone();
            cloneMat = new THREE.MeshBasicMaterial( {
                color: 0xffffff,
                opacity: 0.75,
                transparent: true
            } );

            this.pickClone = new THREE.Mesh(cloneGeo, cloneMat);
            pos = this.pickedObject.position;
            rot = this.pickedObject.rotation;
            this.pickClone.position.set(pos.x, pos.y, pos.z);
            this.pickClone.rotation.set(rot.x, rot.y, rot.z);
            this.pickClone.scale.set(scale, scale, scale);

            this.scene.add(this.pickClone);
        } else {
            if (this.pickClone !== null ) {
                this.scene.remove(this.pickClone);
                this.pickClone = null;
            }
        }
    };

    return PickerClass;
}) ();

Viewer3D.Viewport = ( function () {
    var ViewportClass = function (attrs) {
        var that = this;
        this.scene = attrs.scene;
        this.container = attrs.container;

        this.updateViewAttrs();

        function _onResize() {
            that.onResize();
        }
        // subscribe to resize event
        new ResizeSensor(this.container, _onResize);


        if (attrs.cameraType === 'mono') {
            this.cameraWrap = new Viewer3D.MonoCamera(this);
            this.scene.add(this.cameraWrap.camera);
        } else if (attrs.cameraType === 'stereo') {
            this.cameraWrap = new Viewer3D.StereoCamera(this);
            this.scene.add(this.cameraWrap.cameraL);
            this.scene.add(this.cameraWrap.cameraR);
        }

        this.picker = new Viewer3D.Picker(this.cameraWrap.renderer.domElement,
                                          this.scene,
                                          this.cameraWrap,
                                          this
        );

        this.render();
    };

    ViewportClass.prototype.updateViewAttrs = function () {
        var crect = this.container.getClientRects()[0];

        this.width = crect.width - 15;
        this.height = crect.height - 15;
    };


    ViewportClass.prototype.onResize = function (el) {
        this.updateViewAttrs();
        this.cameraWrap.onResize();
        this.render();
    };

    ViewportClass.prototype.render = function () {
        this.picker.highlightPickedObject();
        this.cameraWrap.render();
    };

    return ViewportClass;
} ) ();


Viewer3D.Scene = ( function () {
    return THREE.Scene;
} ) ();


function addGround(pick, nonpick) {

    // create the rectangle
    var rectLengthBy2 = 50,
        rectWidthBy2 = 50;
    var rectShape = new THREE.Shape();
    rectShape.moveTo(-rectLengthBy2, -rectWidthBy2);
    rectShape.lineTo(rectLengthBy2, -rectWidthBy2);
    rectShape.lineTo(rectLengthBy2, rectWidthBy2);
    rectShape.lineTo(-rectLengthBy2, rectWidthBy2);
    rectShape.lineTo(-rectLengthBy2, -rectWidthBy2);

    // create the lines
    var offset, jump, coord;
    var geometry = new THREE.Geometry();

    var material = new THREE.LineBasicMaterial({
        color: 0xaaaaaa
    });

    var linelen = 500;

    for (var x = 0; x <= 25; x++) {
        offset = 100 * (Math.pow(2, Math.floor(x / 10)) - 1)
        jump = ((x % 10) * 10 * Math.pow(2, Math.floor(x / 10)))
        coord = offset + jump;

        geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-linelen, 0, coord));
        geometry.vertices.push(new THREE.Vector3(linelen, 0, coord));
        nonpick.add( new THREE.Line(geometry, material) );

        if (coord !== 0) {
            geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(-linelen, 0, -coord));
            geometry.vertices.push(new THREE.Vector3(linelen, 0, -coord));
            nonpick.add( new THREE.Line(geometry, material) );
        }

        geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(coord, 0, -linelen));
        geometry.vertices.push(new THREE.Vector3(coord, 0, linelen));
        nonpick.add( new THREE.Line(geometry, material) );

        if (coord !== 0) {
            geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(-coord, 0, -linelen));
            geometry.vertices.push(new THREE.Vector3(-coord, 0, linelen));
            nonpick.add( new THREE.Line(geometry, material) );
        }

    }

    var rectGeom = new THREE.ShapeGeometry(rectShape);
    var rectMesh = new THREE.Mesh(rectGeom, new THREE.MeshBasicMaterial({
            color: 0xcccccc
        }));

    rectMesh.rotation.x = -Math.PI/2;
    rectMesh.position.y -= 0.2;

    nonpick.add(rectMesh);
}


function main() {
    var boxgeo, boxmat, box;
    var pickableObjects = new THREE.Object3D();
    var nonPickableObjects = new THREE.Object3D();

    var scene = new Viewer3D.Scene();

    var attrs1 = {
        container: document.getElementById("explorer1"),
        cameraType: 'stereo',
        scene: scene
    };

    boxgeo = new THREE.BoxGeometry(5, 5, 5);
    boxmat = new THREE.MeshBasicMaterial( { color: 0xff2288 } );
    box = new THREE.Mesh( boxgeo, boxmat );
    box.position.y = 2.5;
    pickableObjects.add( box );

    addGround(pickableObjects, nonPickableObjects);
    scene.theObjects = pickableObjects;

    scene.add(pickableObjects);
    scene.add(nonPickableObjects);

    new Viewer3D.Viewport(attrs1);
}

window.onload = main;

