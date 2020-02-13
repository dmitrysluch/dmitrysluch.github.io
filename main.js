DEBUG = true
TIME = 0.0

$(async function($){
    /*var*/ scene = new THREE.Scene();
    /*var*/ camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    /*var*/ renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    /*var*/ loadSign = ()=>(new Promise((resolve, reject) =>{
        /*var*/ fontLoader = new THREE.FontLoader();
        fontLoader.load('./fonts/Bebas Neue_Regular.json', (font)=>{
            geometry = new THREE.TextGeometry('REALITY', {
                font: font,
                size: 40,
                height: 2,
                curveSegments: 12,
                bevelEnabled: false,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
            resolve(geometry);
        }, (progress)=>{}, (err)=>{reject(err)});
    }));
    let textureAddr = window.location.hash;
    if (textureAddr == "") textureAddr = "#./fire.jpg";
    textureAddr = textureAddr.slice(1);
    var texture = new THREE.TextureLoader().load(textureAddr);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 4 );

    /*var*/ signGeometry = await loadSign();
    /*var*/ signMaterial = new THREE.ShaderMaterial({uniforms:{uTime:{value:0}, map : {value: texture}}, vertexShader:vertexShader, fragmentShader:pixelShader});
    signMaterial.transparent = true;

    /*var*/ signMesh = new THREE.Mesh(signGeometry, signMaterial);
    camera.position.z = 10;
    signMesh.position.x = -9;
    signMesh.position.y = -3;
    signMesh.scale.x = 0.15;
    signMesh.scale.y = 0.15;
    signMesh.scale.z = 0.15;;
    scene.add(signMesh);
    camera.lookAt(0, 0, 0);
    if (DEBUG) {
    CONTROLS = new THREE.OrbitControls(camera);
    CONTROLS.minPolarAngle = Math.PI * 1 / 4;
    CONTROLS.maxPolarAngle = Math.PI * 3 / 4;
    }
    function updateUniforms() {
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh
                && child.material.type === 'ShaderMaterial') {
                child.material.uniforms.uTime.value = TIME;
                child.material.needsUpdate = true;
            }
        });
    }
    composer = new THREE.EffectComposer(renderer);
    composer.setSize(window.innerWidth, window.innerHeight);

    const renderPass = new THREE.RenderPass(scene, camera);
    renderPass.renderToScreen = false;
    composer.addPass(renderPass);
    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 4, 0.5, 0.25);
bloomPass.renderToScreen = true;
composer.addPass(bloomPass);

    function animate() {
        requestAnimationFrame( animate );
        if (DEBUG) CONTROLS.update();
        updateUniforms();
        composer.render();
        //renderer.render( scene, camera );
        TIME += 0.02;
    }
    animate();
})