'use strict';

// namespace definition
var Viewer3D = Viewer3D || {};


Viewer3D.MonoCamera = ( function () {
    var MonoCameraClass = function (vport) {
        this.vport = vport;

        if ( window.WebGLRenderingContext ) {
            console.log("WebGL available... Yoohoo");
            this.renderer = new THREE.WebGLRenderer();
        } else {
            console.log("WebGL NOT available... :-( Using Canvas");
            this.renderer = new THREE.CanvasRenderer();
        }

        this.renderer.setSize(vport.width, vport.height);
        vport.container.appendChild(this.renderer.domElement);

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
            this.renderer = new THREE.WebGLRenderer();
        } else {
            console.log("WebGL NOT available... :-( Using Canvas");
            this.renderer = new THREE.CanvasRenderer();
        }

        this.width = vport.width;
        this.height = vport.height;
        this.width = this.width % 2 == 0 ? this.width : this.width - 1;


        this.renderer.setSize(this.width, this.height);
        this.renderer.autoClear = false;

        vport.container.appendChild(this.renderer.domElement);

        this.camera1 = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            )

        this.camera1.position.z = 100;
        this.camera1.position.y = 20;

        this.camera2 = new THREE.PerspectiveCamera(
            35,
            this.width / (2 * vport.height),
            1,
            1000
            )

        this.camera2.position.z = 100;
        this.camera2.position.y = 20;

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

    gndgeo = new THREE.BoxGeometry( 50, 0.1, 50 );
    gndmat = new THREE.MeshBasicMaterial( { color: 0xdddddd } );
    gnd = new THREE.Mesh( gndgeo, gndmat );
    gnd.position.y = -1.0;
    objects.add( gnd );

    scene.add(objects);

    var vp = new Viewer3D.Viewport(attrs1);
}

window.onload = main();
// console.log(vp);

