'use strict';

// namespace definition
var Viewer3D = Viewer3D || {};


Viewer3D.MonoCamera = ( function () {
    var MonoCameraClass = function (vport) {
        this.vport = vport;

        if ( window.WebGLRenderingContext ) {
            console.log("WebGL available... Yoohoo");
            this.renderer = new THREE.WebGLRenderer( {alpha: true} );
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

        this.camera.position.z = 100;
        this.camera.position.y = 20;

        this.scene = vport.scene;
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

    return MonoCameraClass;
} ) ();

Viewer3D.StereoCamera = ( function () {
    var StereoCameraClass = function (vport) {
        this.vport = vport;
        this.sepWidth = 2;

        if ( window.WebGLRenderingContext ) {
            console.log("WebGL available... Yoohoo");
            this.renderer = new THREE.WebGLRenderer( {alpha: true} );
        } else {
            console.log("WebGL NOT available... :-( Using Canvas");
            this.renderer = new THREE.CanvasRenderer();
        }

        this.width = vport.width;
        this.height = vport.height;
        this.width = this.width % 2 === 0 ? this.width : this.width - 1;

        this.renderer.setSize(this.width + this.sepWidth, this.height);
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0xeeeeee, 1);

        vport.container.appendChild(this.renderer.domElement);

        this.camera1 = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            );

        this.camera1.position.z = 200;
        this.camera1.position.y = 50;

        this.camera2 = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            );

        this.camera2.position.z = 200;
        this.camera2.position.y = 50;

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
        this.renderer.setSize(width + this.sepWidth, height);

        // update camera aspect ratio
        aspect = width / (2 * height);
        this.camera1.aspect = aspect;
        this.camera1.updateProjectionMatrix();
        this.camera2.aspect = aspect;
        this.camera2.updateProjectionMatrix();
    };

    StereoCameraClass.prototype.render = function () {
        this.renderer.clear();
        this.renderer.setViewport(0, 0, this.width/2, this.height);
        this.renderer.render(this.scene, this.camera1);

        this.renderer.setViewport(this.width/2 + this.sepWidth, 0, this.width/2, this.height);
        this.renderer.render(this.scene, this.camera2, undefined, false);
    };

    StereoCameraClass.prototype.getCoordsAndCamera = function (x, y) {
        var x1, y1;
        if ( ( y >= 0 ) && ( y <= this.height )) {
            if ( ( x >= 0 ) && ( x <= (this.width / 2)) ) {
                x1 = 2 * ( x / (this.width/2)) - 1;
                y1 = 1 - 2 * ( y / this.height );
                // camera 1
                return [x1, y1, this.camera1];
            } else if ( ( x >= (this.width/2 + this.sepWidth) ) &&
                        ( x <= (this.width + this.sepWidth)) ) {
                x1 = 2 * ( (x - this.width/2 - this.sepWidth ) / (this.width/2)) - 1;
                y1 = 1 - 2 * ( y / this.height );
                // camera 2
                return [x1, y1, this.camera2];
            }
        }
        return null;
    };

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
                if (!that.dragging) {
                    that.onMouseLeftClick(evt);
                }
            } else if ( button === 1 ) {
                that.middleDown = false;
                if (!that.dragging) {
                    that.onMouseMiddleClick(evt);
                }
            }

            if (!(that.leftDown || that.middleDown)) {
                that.dragging = false;
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

    PickerClass.prototype.doPanning = function (evt) {
        if (this.latchPoint === null) {
            this.latchPoint = this.findLatchPoint();
            // move camera such that latch point moves exactly same distances
        }
        console.log("panning");
    };

    PickerClass.prototype.doOrbit = function (evt) {
        console.log("orbiting");
    };

    PickerClass.prototype.onMouseMove = function (evt) {
        var pos, dist;

        if (this.leftDown) {
            pos = [evt.clientX, evt.clientY];
            dist = this.getDragDist(this.leftDownPos, pos);
            if (this.dragging || (dist >= 3)) {
                this.dragging = true;
                this.doPanning(evt);
                return;
            }
        }

        if (this.middleDown) {
            pos = [evt.clientX, evt.clientY];
            dist = this.getDragDist(this.middleDownPos, pos);
            if (this.dragging || (dist >= 3)) {
                this.dragging = true;
                this.doOrbit(evt);
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
            this.scene.add(this.cameraWrap.camera1);
            this.scene.add(this.cameraWrap.camera2);
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
    rectMesh.position.y -= 0.1;

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

