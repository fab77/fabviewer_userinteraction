/*
Code taken from thecmb.org (Damien George)
*/

var MAIN = (function ($) {
    "use strict";

    var camera, scene, renderer, stats = null;
    var cmbMaterials, materials;
    var sphere;
    var numberOfFace4 = 768;

    var initLng = 0.0, initLat = 0.0, initZ = 850;
    var sceneDirty = true, wantedLat = initLat, wantedLng = initLng, wantedZ = initZ;

    var mouseX = 0, mouseY = 0;
    var mouseHeld = false;

    var doingAnimationLoop = false;
    var projector = new THREE.Projector();
    
    // This function is called at the beginning and every time the user changes the field of view
    // it calls the function animate() which calls render()
    function updateScene(forceUpdate) {
        if (!doingAnimationLoop) {
        	
            if (forceUpdate) {
                sceneDirty = true;
            }
            if (!sceneDirty && (Math.abs(wantedLat - sphere.rotation.x) > 2e-3 || Math.abs(wantedLng - sphere.rotation.y) > 2e-3 || Math.abs(wantedZ - camera.position.z) > 1e-1)) {
                sceneDirty = true;
            }
            if (sceneDirty) {
                doingAnimationLoop = true;
                requestAnimationFrame(animate);
            }
        }
    }

    function animate() {
        doingAnimationLoop = false;
        sceneDirty = false;
        render();
        if (stats !== null) {
            stats.update();
        }
        updateScene();
    }

    function render() {
    	sphere.rotation.y += (wantedLng - sphere.rotation.y) * 0.04;
        sphere.rotation.x += (wantedLat - sphere.rotation.x) * 0.04;
        camera.position.z += (wantedZ - camera.position.z) * 0.06;
                
//        raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY) , camera );
//        var intersects = raycaster.intersectObjects( scene.children );
//    	for ( var i = 0; i < intersects.length; i++ ) {
//    		console.log("picked");
////    		intersects[ i ].object.material.color.set( 0xff0000 );
//    	}
        
        renderer.render(scene, camera);
        var lng = (-sphere.rotation.y + 0.25 * Math.PI) % (2 * Math.PI);
        if (lng < 0) {
            lng += 2 * Math.PI;
        }
        $("#coord").html((lng * 180 / Math.PI).toFixed(2) + "&deg;, " + (sphere.rotation.x * 180 / Math.PI).toFixed(2) + "&deg; galactic");
    }

    // related to user interaction: not important now (I guess)
    function doScroll(dx, dy) {
        var zoomFac = 2e-5 * camera.position.z;
        wantedLng += dx * zoomFac;
        wantedLat += dy * zoomFac;
        if (wantedLat < -0.6 * Math.PI) {
            wantedLat = -0.6 * Math.PI;
        } else if (wantedLat > 0.6 * Math.PI) {
            wantedLat = 0.6 * Math.PI;
        }
        updateScene();
    }

    // related to user interaction: not important now (I guess)
    function doZoom(amount) {
        wantedZ -= amount * wantedZ / 200;
        if (wantedZ < 210) {
            wantedZ = 210;
        }
        if (wantedZ > 1700) {
            wantedZ = 1700;
        }
        updateScene();
    }

    // related to user interaction: not important now (I guess)
    function windowResize(event) {
        $("#heading").css('left', window.innerWidth / 2 - $("#heading").width() / 2);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 4);
        updateScene(true);
    }

    // related to user interaction: not important now (I guess)
    function mouseLeave(event) {
        mouseHeld = false;
    }

    
    
    // related to user interaction: not important now (I guess)
    function mouseDown(event) {
        mouseHeld = true;
        event.preventDefault();
        var mouseVector = new THREE.Vector3();
        mouseVector.x = 2 * (event.clientX / window.innerWidth) - 1;
        mouseVector.y = 1 - 2 * ( event.clientY / window.innerHeight);
        
        
//        var raycaster = projector.pickingRay( mouseVector.clone(), camera );
        
        raycaster.setFromCamera(mouseVector.clone(), camera);
        var intersects = raycaster.intersectObject( sphere );
        for( var i = 0; i < intersects.length; i++ ) {
          var intersection = intersects[ i ],
          obj = intersection.object;
//          console.log("Intersected object", obj);
//          console.log("Intersected object", intersection.point);
          console.log("----------------------");
//          console.log("Intersected object", intersection);
//          console.log("Face index: ", intersection.faceIndex);
          console.log("Face index: ", intersection.face.materialIndex);
//          alert("Face index: "+ intersection.face.materialIndex);
          
          
//          for (var i=0; i<obj.geometry.faces.length;i++){
//        	  console.log(i);
//          }
          
        }
    }
    // related to user interaction: not important now (I guess)
    function mouseUp(event) {
        mouseHeld = false;
    }
    // related to user interaction: not important now (I guess)
    function mouseMove(event) {
        var newMouseX = event.clientX;
        var newMouseY = event.clientY;
        if (mouseHeld) {
            doScroll(newMouseX - mouseX, newMouseY - mouseY);
        }
        mouseX = newMouseX;
        mouseY = newMouseY;
    }
    // related to user interaction: not important now (I guess)
    function mouseWheel(event, delta) {
        doZoom(10 * delta);
    }
    // related to user interaction: not important now (I guess)
    function mouseDoubleClick(event) {
        doZoom(50);
    }

    var global = {};
    var raycaster = new THREE.Raycaster();
    var allSkyGeometry;
    scene = new THREE.Scene();
    
    global.main = function () {
    	
    	
        $("#heading").css('left', window.innerWidth / 2 - $("#heading").width() / 2);

        var container = document.createElement('div');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
        camera.position.set(0, 200, 1800);

        

        var wireEdgeEnabled = false;
        var prefix = "data/dss2/";
        cmbMaterials = [];

        // Generating an array containing one material per texture per Healpix pixel
        for (var i = 0; i < numberOfFace4; i++) {
        	var tex = THREE.ImageUtils.loadTexture(prefix +"Npix"+ i + ".jpg", THREE.UVMapping);
    		tex.needsUpdate = true;
        	var mat  = new THREE.MeshBasicMaterial();	
        	mat.map   = tex;
        	mat.side  = THREE.FrontSide;
        	cmbMaterials.push(mat);
        }
        // Creating the Three.js MeshFaceMaterial 
        materials = new THREE.MeshFaceMaterial(cmbMaterials);
        // Creating the Three.js geometry
        allSkyGeometry = MMISphereGeometry(200);
        // Creating the Three.js Mesh from geometry and materials 
		sphere = new THREE.Mesh(allSkyGeometry, materials);
		
//		I don't know if the following is needed
//		allSkyGeometry.computeBoundingBox();
//        var centroid = new THREE.Vector3();
//        centroid.addVectors( allSkyGeometry.boundingBox.min, allSkyGeometry.boundingBox.max );
//        centroid.multiplyScalar( - 0.5 );
//        centroid.applyMatrix4( sphere.matrixWorld );
	
		sphere.position.x = 0;
        sphere.position.y = 200;
        sphere.position.z = 0;
        sphere.rotation.y = initLng + 2.5;
        sphere.rotation.x = initLat + 1.0;
        // Adding the Mesh to the scene. From now on it is visible.
        scene.add(sphere);
        
        // WIREEDGE. If enabled drwas the Healpix grid on top of the sphere 
        if (wireEdgeEnabled){
	        var egh = new THREE.EdgesHelper( sphere, 0x00ffff );
			egh.material.linewidth = 2;
			scene.add( egh );
        }
        
		// light
        var light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 0, 1).normalize();
        scene.add(light);

        // Canvas rendering
//        renderer = new THREE.CanvasRenderer();
        // WebGL rendering
        renderer = new THREE.WebGLRenderer();
        renderer.setClearColor(0xb8bdc2);
        
        renderer.setSize(window.innerWidth, window.innerHeight - 4);
        container.appendChild(renderer.domElement);

        /*
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);
        */

        var agent = navigator.userAgent.toLowerCase();

        
        window.addEventListener('resize', windowResize, false);

        $(document).mouseleave(mouseLeave);
        $(document).mousedown(mouseDown);
        $(document).mouseup(mouseUp);
        $(document).mousemove(mouseMove);
        $(document).mousewheel(mouseWheel);
        $(document).dblclick(mouseDoubleClick);

        Mousetrap.bind(['left', 'right', 'up', 'down'], function(e, key) { keypressArrow(key); });
        Mousetrap.bind(['=', '+', '-'], function(e, key) { keypressZoom(key); });
        Mousetrap.bind(['r', 'g', 'e', 'x'], function(e, key) { keypressLetter(key); });
        Mousetrap.bind(['d w', 'd f', 'd s 0', 'd s 1', 'd s 2', 'd s 3', 'd s 4'], function(e, key) { keypressDebug(key); });

        $("#resolution .switch").removeClass('active');
        $("#resolution .low").addClass('active');

        $("#channel .switch").removeClass('active');
        $("#channel .cmb").addClass('active');

        
        setInterval(function() { updateScene(true); }, 1000); // update every second for slow loading images
        updateScene(true);
    };

    return global;
}(jQuery));

$(document).ready(MAIN.main);
