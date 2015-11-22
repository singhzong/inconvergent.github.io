function Grid(){

  this.init = function init(n, renderer, gridShaders, gridCloneShaders){

    console.log('making grid', n);

    this.n = n;
    this.itt = 0;

    this.renderer = renderer;
    this.gridShaders = gridShaders;
    this.gridCloneShaders = gridCloneShaders;

    this.camera = new THREE.OrthographicCamera(
      -n*0.5,
      n*0.5,
      n*0.5,
      -n*0.5,
      0,
      500
    );
    this.camera.position.z = 100;

    this.cameraClone = new THREE.OrthographicCamera(
      -n*0.5,
      n*0.5,
      n*0.5,
      -n*0.5,
      0,
      500
    );
    this.cameraClone.position.z = 100;

    this.scene = new THREE.Scene();
    this.scene.add(this.camera);
    this.sceneClone = new THREE.Scene();
    this.sceneClone.add(this.cameraClone);

    this.texA = new THREE.WebGLRenderTarget(
      n, n, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.FloatType}
    );
    this.texB = this.texA.clone();
    this.texC = this.texA.clone();

    this.uniforms = {
      itt: {
        type: 'f',
        value:  0
      },
      mode: {
        type: 'f',
        value: 0.0
      },
      n: {
        type: 'f',
        value: n
      },
      scale: {
        type: 'f',
        value: 0.99
      },
      mousePos: {
        type: "2f",
        value: [10000,10000]
      },
      mouseScale: {
        type: "f",
        value: 0.5
      },
      texa: {
        type: "t",
        value: null
      },
      texb: {
        type: "t",
        value: null
      }
    };

    this.uniformsClone = {
      tex: {
        type: "t",
        value: null
      },
      n: {
        type: 'f',
        value: n
      },
    };

    this.matGrid = new THREE.ShaderMaterial({
        vertexShader: this.gridShaders.vert,
        fragmentShader: this.gridShaders.frag,
        uniforms: this.uniforms,
        transparent: false
    });

    this.matGridClone = new THREE.ShaderMaterial({
        vertexShader: this.gridCloneShaders.vert,
        fragmentShader: this.gridCloneShaders.frag,
        uniforms: this.uniformsClone,
        transparent: false
    });

    this.plane = new THREE.PlaneBufferGeometry(n, n);
    this.quad = new THREE.Mesh(this.plane, this.matGrid);
    this.scene.add(this.quad);
    this.planeClone = new THREE.PlaneBufferGeometry(n, n);
    this.quadClone = new THREE.Mesh(this.planeClone, this.matGridClone);
    this.sceneClone.add(this.quadClone);

  };
  this.setInitialConditions = function setInitialConditions(){
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.n,this.n);
    this.uniforms.mode.value = -1.0;

    this.renderer.render(this.scene, this.camera, this.texB, true);
    this.renderer.render(this.scene, this.camera, this.texC, true);
    //this.renderer.render(this.scene, this.camera);
    this.uniforms.mode.value = 0.0;
  };

  this.step = function step(){
    this.uniforms.itt.value = this.itt;
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.n,this.n);

    // swap every tex every time
    //this.uniforms.texa.value = this.texB;
    //this.uniforms.texb.value = this.texC;
    //this.renderer.render(this.scene, this.camera, this.texA, true);

    //this.uniformsClone.tex.value = this.texB;
    //this.renderer.render(this.sceneClone, this.cameraClone, this.texC, true);

    //this.uniformsClone.tex.value = this.texA;
    //this.renderer.render(this.sceneClone, this.cameraClone, this.texB, true);

    // alternate swap. in principle this should be the same
    // as the code above.
    if ((this.itt%2 === 0)){
      this.uniforms.texa.value = this.texB;
      this.uniforms.texb.value = this.texC;
      this.renderer.render(this.scene, this.camera, this.texA, true);
      this.uniformsClone.tex.value = this.texA;
      this.renderer.render(this.sceneClone, this.cameraClone, this.texC, true);
    }
    else{
      this.uniforms.texa.value = this.texC;
      this.uniforms.texb.value = this.texB;
      this.renderer.render(this.scene, this.camera, this.texA, true);
      this.uniformsClone.tex.value = this.texA;
      this.renderer.render(this.sceneClone, this.cameraClone, this.texB, true);
    }

    this.itt += 1;
  };

  this.setMousePos = function setMousePos(v, s){
    var p = [v.x,v.y];
    this.uniforms.mousePos.value = p;
    this.uniforms.mouseScale.value = s;
  };

}

