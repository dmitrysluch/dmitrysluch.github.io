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
    let blue = true;
    if (textureAddr == "") {
        textureAddr = "#./fire.jpg";
        blue = false;
    }
    textureAddr = textureAddr.slice(1);
    var texture = new THREE.TextureLoader().load(textureAddr);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 4, 4 );

    /*var*/ signGeometry = await loadSign();
    /*var*/ signMaterial = new THREE.ShaderMaterial({uniforms:{uTime:{value:0}, map : {value: texture}}, vertexShader:vertexShader, fragmentShader:pixelShader});
    signMaterial.transparent = true;

    /*var*/ signMesh = new THREE.Mesh(signGeometry, signMaterial);
    camera.position.z = 14;
    camera.position.x = 0;
    camera.position.y = 0;
    signMesh.position.x = -9;
    signMesh.position.y = -3;
    signMesh.scale.x = 0.15;
    signMesh.scale.y = 0.15;
    signMesh.scale.z = 0.15;
    scene.add(signMesh);
    
    points_ = [[-0.3, 0.3], [0.5, -0.4], [-0.2, 0.5], [-0.7, 0.1], [0.7, -0.3], [-0.2, -0.4], [0.6, 0.2], [0.7, 0.5]];
    points = []
    normals = []
    function calc_points() {
    for (let i = 0; i < 8; ++i) {
        points[i] = new THREE.Vector2(points_[i][0]/2.5 + (Math.sin(i * TIME / 50) + Math.sin(6 * TIME / 50 + 13)) / 10, points_[i][1]/3 + (Math.sin(i * TIME / 50) + Math.cos(6 * TIME / 50 + 13)) / 10);
        normals[i] = new THREE.Vector3(Math.sin(i + TIME / 10 + 1223) + Math.sin(i * i * TIME / 50), Math.cos(i + TIME / 10 + 1223) + Math.sin(i * i * TIME / 50), 1);
    }
    }
    calc_points();
    planeGeom = new THREE.PlaneGeometry();
    var mirrorTexture = new THREE.TextureLoader().load("./mirror.jpg");
    mirrorTexture.wrapS = THREE.RepeatWrapping;
    mirrorTexture.wrapT = THREE.RepeatWrapping;
    mirrorTexture.repeat.set( 4, 4 );
    voronoyMaterial = new THREE.ShaderMaterial({uniforms:{u_points : {type:"v2v", value:points}, u_normals : {type:"v3v", value:normals}, uTime:{value:0}, map:{value:mirrorTexture}}, vertexShader:vertexShader, fragmentShader:pixelShaderVoronoy(blue)});
    backgroundMesh = new THREE.Mesh(planeGeom, voronoyMaterial);
    backgroundMesh.position.z = -10;
    backgroundMesh.scale.x = 80;
    backgroundMesh.scale.y = 80;
    scene.add(backgroundMesh);
    camera.lookAt(0, 0, 0);
    if (DEBUG) {
    CONTROLS = new THREE.OrbitControls(camera);
    CONTROLS.minPolarAngle = Math.PI * 1 / 4;
    CONTROLS.maxPolarAngle = Math.PI * 3 / 4;
    }
    function updateUniforms() {
        calc_points();
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh
                && child.material.type === 'ShaderMaterial') {
                child.material.uniforms.uTime.value = TIME;
                if (child.material.fragmentShader.match(/.*u_normals.*/)) {
                    child.material.uniforms.u_normals.value = normals;
                    child.material.uniforms.u_points.value = points;
                }
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