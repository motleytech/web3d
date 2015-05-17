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
            )

        this.camera.position.z = 100;
        this.camera.position.y = 20;

        this.scene = vport.scene;
    }

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
    }

    MonoCameraClass.prototype.render = function () {
        this.renderer.render(this.scene, this.camera);
    }

    return MonoCameraClass;
} ) ();

Viewer3D.StereoCamera = ( function () {
    var StereoCameraClass = function (vport) {
        this.vport = vport;

        if ( window.WebGLRenderingContext ) {
            console.log("WebGL available... Yoohoo");
            this.renderer = new THREE.WebGLRenderer( {alpha: true} );
        } else {
            console.log("WebGL NOT available... :-( Using Canvas");
            this.renderer = new THREE.CanvasRenderer();
        }

        this.width = vport.width;
        this.height = vport.height;
        this.width = this.width % 2 == 0 ? this.width : this.width - 1;


        this.renderer.setSize(this.width, this.height);
        this.renderer.autoClear = false;
        this.renderer.setClearColor(0xeeeeee, 1);

        vport.container.appendChild(this.renderer.domElement);

        this.camera1 = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            )

        this.camera1.position.z = 200;
        this.camera1.position.y = 50;

        this.camera2 = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            )

        this.camera2.position.z = 200;
        this.camera2.position.y = 50;

        this.scene = vport.scene;
    }

    StereoCameraClass.prototype.onResize = function () {
        // get the new width and height
        var width, height, aspect;
        width = this.vport.width;
        width = width % 2 == 0 ? width : width - 1;
        this.width = width;

        height = this.vport.height;
        this.height = height;

        // update renderer size
        this.renderer.setSize(width, height);

        // update camera aspect ratio
        aspect = width / (2 * height);
        this.camera1.aspect = aspect;
        this.camera1.updateProjectionMatrix();
        this.camera2.aspect = aspect;
        this.camera2.updateProjectionMatrix();
    }

    StereoCameraClass.prototype.render = function () {
        this.renderer.clear();
        this.renderer.setViewport(0, 0, this.width/2, this.height);
        this.renderer.render(this.scene, this.camera1);

        this.renderer.setViewport(this.width/2, 0, this.width/2, this.height);
        this.renderer.render(this.scene, this.camera2, undefined, false);
    }

    return StereoCameraClass;
} ) ();



Viewer3D.Viewport = ( function () {
    var ViewportClass = function (attrs) {
        var that = this;

        this.container = attrs.container;
        this.updateViewAttrs();

        function _onResize() {
            that.onResize();
        }
        // subscribe to resize event
        var resizer = new ResizeSensor(this.container, _onResize);

        this.scene = attrs.scene;

        if (attrs.cameraType === 'mono') {
            this.cameraWrap = new Viewer3D.MonoCamera(this);
            this.scene.add(this.cameraWrap.camera);
        } else if (attrs.cameraType === 'stereo') {
            this.cameraWrap = new Viewer3D.StereoCamera(this);
            this.scene.add(this.cameraWrap.camera1);
            this.scene.add(this.cameraWrap.camera2);
        }

        this.render();
    }

    ViewportClass.prototype.updateViewAttrs = function () {
        var crect = this.container.getClientRects()[0];

        this.width = crect.width - 15;
        this.height = crect.height - 15;
        this.offsetx = crect.left;
        this.offsety = crect.top;
    }


    ViewportClass.prototype.onResize = function (el) {
        console.log("resize event works");

        this.updateViewAttrs();
        this.cameraWrap.onResize();
        this.render();
    }

    ViewportClass.prototype.render = function () {
        this.cameraWrap.render();
    }

    return ViewportClass;
} ) ();


Viewer3D.Scene = ( function () {
    return THREE.Scene;
} ) ();


function addGround(objects) {

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
    var lines = [];

    for (var x = 0; x <= 25; x++) {
        offset = 100 * (Math.pow(2, (x / 10)) - 1)
        jump = ((x % 10) * 10 * Math.pow(2, x / 10))
        coord = offset + jump;

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-linelen, 0, coord));
        geometry.vertices.push(new THREE.Vector3(linelen, 0, coord));
        objects.add( new THREE.Line(geometry, material) );

        if (coord !== 0) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(-linelen, 0, -coord));
            geometry.vertices.push(new THREE.Vector3(linelen, 0, -coord));
            objects.add( new THREE.Line(geometry, material) );
        }

        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(coord, 0, -linelen));
        geometry.vertices.push(new THREE.Vector3(coord, 0, linelen));
        objects.add( new THREE.Line(geometry, material) );

        if (coord !== 0) {
            var geometry = new THREE.Geometry();
            geometry.vertices.push(new THREE.Vector3(-coord, 0, -linelen));
            geometry.vertices.push(new THREE.Vector3(-coord, 0, linelen));
            objects.add( new THREE.Line(geometry, material) );
        }

    };

    var rectGeom = new THREE.ShapeGeometry(rectShape);
    var rectMesh = new THREE.Mesh(rectGeom, new THREE.MeshBasicMaterial({
            color: 0xcccccc
        }));

    rectMesh.rotation.x = -Math.PI/2;
    rectMesh.position.y -= 0.01;

    objects.add(rectMesh);
}


function main() {
    var boxgeo, boxmat, box;
    var gndgeo, gndmat, gnd;
    var objects = new THREE.Object3D();
    var scene = new Viewer3D.Scene();

    var attrs1 = {
        container: document.getElementById("explorer1"),
        cameraType: 'stereo',
        scene: scene
    }

    boxgeo = new THREE.BoxGeometry(5, 5, 5);
    boxmat = new THREE.MeshBasicMaterial( { color: 0xff2288 } );
    box = new THREE.Mesh( boxgeo, boxmat );
    box.position.y = 2.5;
    objects.add( box );

    // gndgeo = new THREE.BoxGeometry( 50, 0.1, 50 );
    // gndmat = new THREE.MeshBasicMaterial( { color: 0xdddddd } );
    // gnd = new THREE.Mesh( gndgeo, gndmat );
    // gnd.position.y = -1.0;
    addGround(objects);

    scene.add(objects);

    var vp = new Viewer3D.Viewport(attrs1);
}

window.onload = main;
// console.log(vp);

