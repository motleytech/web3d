/**
 * Created by nagarajan on 5/13/15.
 */

tjsApp = (function () {
    "use strict";

    if (window.WebGLRenderingContext) {
        console.log("WebGL available... Yoohoo");
    }

    var renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    var scene = new THREE.Scene();
    var camera;
    var projector = new THREE.Projector();
    var mouseVector = new THREE.Vector3();
    var pickedObject = null;
    var pickClone = null;
    var latchPoint = null;
    var mouseMiddleDown = false;
    var mouseLeftDown = false;
    var mouseRightDown = false;

    var stats = new Stats();

    var fov = 35;
    var width = 800;
    var height = 600;
    var offsetx, offsety;

    var objects = new THREE.Object3D();
    var cubes = [];

    function initStats() {
        var style = stats.domElement.style;

        stats.setMode(1);  // 0: fps, 1: ms
        style.position = 'absolute';
        style.right = '0px';
        style.top = '0px';

        document.body.appendChild( stats.domElement );
    };

    function initCamera() {
        camera = new THREE.PerspectiveCamera(
            fov,
            width / height,
            1,
            1000
        );

        camera.position.z = 100;
        camera.position.y = 20;
        scene.add(camera);
    };

    function myRand( a, b ) {
        return a + (b - a) * Math.random();
    }

    function initObjects(numc) {
        var cubegeo, cubemat, cube;
        var gndgeo, gndmat, gnd;

        for (var i=0; i < numc; i++) {
            cubegeo = new THREE.BoxGeometry(myRand(0.5, 1.5), myRand(0.5, 1.5), myRand(0.5, 1.5));
            cubemat = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
            cube = new THREE.Mesh( cubegeo, cubemat );

            cube.position.x = myRand(-25, 25);
            cube.position.y = myRand(  0, 40);
            cube.position.z = myRand(-25, 25);

            objects.add(cube);
            cubes.push(cube);
        }

        gndgeo = new THREE.BoxGeometry( 50, 0.1, 50 );
        gndmat = new THREE.MeshBasicMaterial( {color: 0xdddddd} );
        gnd = new THREE.Mesh( gndgeo, gndmat );
        gnd.position.y = -1.0;
        objects.add( gnd );
    }

    function initPicking(){
        window.addEventListener( 'mousemove', onMouseMove, false);
    }

    function initScene() {
        renderer.setSize(width, height);
        var container = document.getElementById("glcontainer");
        container.appendChild(renderer.domElement);
        var clientarea = container.getClientRects()[0];
        offsetx = clientarea.left;
        offsety = clientarea.top;

        scene.add(objects);

        initCamera();

        initObjects(20);
        initPicking();

        initStats();
        render();
        console.log("exiting initScene");
    };

    function doPicking(evt) {
        mouseVector.x = 2 * ( (evt.clientX - offsetx) / width) - 1;
        mouseVector.y = 1 - 2 * ( (evt.clientY - offsety) / height );

        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera( mouseVector.clone(), camera );
        var intersects = raycaster.intersectObjects( objects.children );
        var newPick = null;

        if (intersects.length > 0) {
            newPick = intersects[0].object;
        }

        if ((newPick !== null) && (newPick !== pickedObject)) {
            pickedObject = newPick;
            refresh();
        } else {
            if ((newPick === null) && (pickedObject !== null)) {
                pickedObject = null;
                refresh();
            }
        }
    }

    function onMouseMove(e) {
        if (mouseMiddleDown) {
            doOrbit(e);
        } else if (mouseLeftDown) {
            doPanning(e);
        } else {
            // no button pressed
            doPicking(e);
        }
    }

    function onMouseMiddleDown(e) {
        // TODO
        // find the latched point coordinates
        // if we have a picked object, get its location
        // if not, calculate the latch location from the
        // objects that are in front of the camera
        // go through each object and do the transform
        //
        mouseMiddleDown = true;
        if (pickedObject) {
            latchPoint = pickedObject.position.clone();
        }
        z = 0
    }

    function onMouseMiddleUp(e) {
        mouseMiddleDown = false;
    }

    function refresh() {
        render();
    }

    function highlightPickedObject(){
        var cloneGeo, cloneMat;
        var pos;

        if ( pickedObject !== null ) {
            scene.remove(pickClone);
            cloneGeo = pickedObject.geometry.clone();
            cloneMat = new THREE.MeshBasicMaterial( {
                color: 0xffffff,
                opacity: 0.75,
                transparent: true
            } );

            pickClone = new THREE.Mesh(cloneGeo, cloneMat);
            pickClone.scale.set(1.01, 1.01, 1.01);
            pos = pickedObject.position;
            pickClone.position.set(pos.x, pos.y, pos.z);
            scene.add(pickClone);
        } else {
            if (pickClone !== null ) {
                scene.remove(pickClone);
                pickClone = null;
            }
        }
    }

    function render() {
        stats.begin();

        highlightPickedObject();
        renderer.render(scene, camera);

        stats.end();
    };

    window.onload = initScene;

    return {
        projector: projector,
        scene: scene
    }
}) ();

console.log("End of app.js");
