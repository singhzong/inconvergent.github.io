var Ndarray = ndarray.ndarray;
var Delaunay = delaunay.delaunay;

var camera;
var renderer;
var offset; //$container.offset();
var $container;
var controls;
var uniforms;

var mouse = [0, -winHeight*0.5];
var offset;

var S;

var rinit = 100000;
var xinit = 0;
var yinit = 0;
var recursions = 6;
var nodeRangeInit = rinit;
var heightRangeInit = rinit*0.5;
var proximityInit = 400;

var nodeRangeExp = 1.0;
var heightRangeExp = 1.5;
var proximityExp = 0.0;

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var viewRatio = winWidth/winHeight;

var pixelRatio = window.devicePixelRatio || 1;
var viewWinWidth = 2.2*rinit;
var viewWinHeight = viewWinWidth / viewRatio;
console.log('screen ratio', viewRatio, viewWinWidth, viewWinHeight);

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback){
            window.setTimeout(callback,1000/60);
          };
})();


$(function() {
  var timer_id;
  $(window).resize(function() {
      clearTimeout(timer_id);
      timer_id = setTimeout(function() {
        windowAdjust();
      }, 300);
  });
});



function windowAdjust() {

  winWidth = window.innerWidth;
  winHeight = window.innerHeight;
  offset = $container.offset();
  pixelRatio = window.devicePixelRatio || 1;

  uniforms.pixelRatio.value = pixelRatio;
  uniforms.window.value = [winWidth, winHeight];

  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(winWidth,winHeight);

  camera.aspect = winWidth/winHeight;
  camera.updateProjectionMatrix();

  console.log('window', winWidth,winHeight);
  console.log('pixel ratio', pixelRatio);

  viewRatio = window.innerWidth/window.innerHeight;
  viewWinWidth = 2*rinit;
  viewWinHeight = viewWinHeight / viewRatio;
  console.log('screen ratio', viewRatio, viewWinWidth, viewWinHeight);
}

function generate(){
  var s = new Summit();

  var landscape = UnstructuredLandscape(
    xinit,
    yinit,
    rinit,
    nodeRangeInit,
    heightRangeInit,
    proximityInit,
    nodeRangeExp,
    heightRangeExp,
    proximityExp,
    recursions
  );


  s.init(landscape.vertNum, landscape.triangleNum);
  s.addVertices(landscape.vertices);
  s.addTriangles(landscape.triangles);
  s.geometry.computeFaceNormals();
  s.geometry.computeVertexNormals();
  s.minMaxHeightWidth = landscape.minMaxHeightWidth;

  return s;
}

// yes, yes, i just did this.
$.when(
  $.ajax({
    url: 'shaders/screen.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/screen.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/landscape.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/landscape.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/bg.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/bg.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/water.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/water.vert',
    dataType: 'text'
  })
).done(function(
  screenVert,
  screenFrag,
  landscapeFrag,
  landscapeVert,
  bgFrag,
  bgVert,
  waterFrag,
  waterVert
){

  if (!Detector.webgl){
    Detector.addGetWebGLMessage();
  }

  $(document).ready(function(){
    console.log('start');

    $('body').on('touchmove mousemove touchstart',function(e) {
      mouse = [
        winWidth*0.5-e.pageX+offset.left,
        winHeight*0.5-e.pageY+offset.top
      ];
    });

    // RENDERER, SCENE AND CAMERA

    $container = $('#box');
    var itt = 0;

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: false
    });
    renderer.autoClear = true;
    $container.append(renderer.domElement);

    // CAMERAS
    //
    //if (window.innerWidth/window.innerHeight>1){
      //var ratio = window.innerWidth/window.innerHeight;
      //var width = 2*rinit;
      //var height = width / ratio;
      //console.log('landscape', ratio, width, height);
    //}
    //else{
    //}


    cameraScreen = new THREE.OrthographicCamera(
      window.innerWidth/-2,
      window.innerWidth/2,
      window.innerHeight/2,
      window.innerHeight/-2,
      0,
      500
    );
    cameraScreen.position.z = 100;

    cameraBg = new THREE.OrthographicCamera(
      window.innerWidth/-2,
      window.innerWidth/2,
      window.innerHeight/2,
      window.innerHeight/-2,
      0,
      500
    );
    cameraBg.position.z = 100;

    //camera = new THREE.PerspectiveCamera(
      //40,
      //winWidth/winHeight,
      //1,
      //rinit*3
    //);
    //
    //
    camera = new THREE.OrthographicCamera(
      viewWinWidth/-2,
      viewWinWidth/2,
      viewWinHeight/2,
      viewWinHeight/-2,
      -rinit*4,
      rinit*4
    );

    // SCENES

    scene = new THREE.Scene();
    sceneScreen = new THREE.Scene();
    sceneBg = new THREE.Scene();

    var camTarget = new THREE.Vector3(0,0,0);
    var camStart = new THREE.Vector3(0,-rinit*1.3,0);

    camera.position.x = camStart.x;
    camera.position.y = camStart.y;
    camera.position.z = camStart.z;
    camera.rotation.x = Math.PI*0.5;
    //camera.lookAt(camTarget);

    camera.aspect = viewRatio;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(winWidth,winHeight);

    scene.add(camera);
    sceneScreen.add(cameraScreen);
    sceneBg.add(cameraBg);

    //controls = new THREE.OrbitControls(camera);

    if (controls){
      controls.rotateSpeed = 1.0;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 1.0;
      controls.noZoom = false;
      controls.noPan = false;
      //controls.autoRotate = true;
      controls.staticMoving = true;
      controls.dynamicDampingFactor = 0.3;
      controls.keys = [65,83,68];
      controls.target.x = camTarget.x;
      controls.target.y = camTarget.y;
      controls.target.z = camTarget.z;
    }

    // INIT

    uniforms = {
      itt: {
        type: 'f',
        value:  0
      },
      mode: {
        type: 'f',
        value: 0.0
      },
      screenTexture: {
        type: "t",
        value: null
      },
      heightTexture: {
        type: "t",
        value: null
      },
      depthTexture: {
        type: "t",
        value: null
      },
      bgTexture: {
        type: "t",
        value: null
      },
      window: {
        type: '2f',
        value: [winWidth, winHeight]
      },
      viewWindow: {
        type: '2f',
        value: [viewWinWidth, viewWinHeight]
      },
      mouse: {
        type: '2f',
        value: mouse
      },
      light: {
        type: '4f',
        value: [0.0, -2*rinit, 100000, 0.7]
      },
      kerSize: {
        type: 'f',
        value: 10
      },
      pixelRatio: {
        type: 'f',
        value: pixelRatio
      }
    };

    // TEXTURES

    // TODO: fix size
    var screenTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat }
    );

    var heightTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      }
    );

    var depthTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      }
    );

    var bgTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      }
    );

    // MATERIALS
    //
    //var waterMaterial = new THREE.MeshBasicMaterial({
      //color: 0xFF0000
    //});
    //waterMaterial.side = THREE.DoubleSide;

    var landscapeMaterial = new THREE.ShaderMaterial({
        vertexShader: landscapeVert[0],
        fragmentShader: landscapeFrag[0],
        uniforms: uniforms,
        transparent: true
    });
    landscapeMaterial.side = THREE.DoubleSide;

    var waterMaterial = new THREE.ShaderMaterial({
        vertexShader: waterVert[0],
        fragmentShader: waterFrag[0],
        uniforms: uniforms,
        transparent: true
    });
    waterMaterial.side = THREE.DoubleSide;

    var bgMaterial = new THREE.ShaderMaterial({
        vertexShader: bgVert[0],
        fragmentShader: bgFrag[0],
        uniforms: uniforms,
        transparent: true
    });
    bgMaterial.side = THREE.DoubleSide;

    var screenMaterial = new THREE.ShaderMaterial({
        vertexShader: screenVert[0],
        fragmentShader: screenFrag[0],
        uniforms: uniforms,
        transparent: true
    });


    S = generate();
    S.mesh = new THREE.Mesh(S.geometry, landscapeMaterial);
    S.mesh.frustumCulled = false;
    camera.add(S.mesh);
    scene.add(S.mesh);
    var heightDiff = S.minMaxHeightWidth[1]-S.minMaxHeightWidth[0];

    windowAdjust();


    // WATER QUAD
    var waterPlane = new THREE.PlaneBufferGeometry(
      4*rinit,
      4*rinit
    );
    waterQuad = new THREE.Mesh(waterPlane, waterMaterial);
    waterQuad.position.z = -2*rinit ;
    waterQuad.position.y = -1.1*rinit;
    waterQuad.rotation.x = Math.PI*0.5;
    scene.add(waterQuad);

    // SCREEN QUAD
    var screenPlane = new THREE.PlaneBufferGeometry(
      winWidth,
      winHeight
    );
    screenQuad = new THREE.Mesh(screenPlane, screenMaterial);
    screenQuad.position.z = -100;
    sceneScreen.add(screenQuad);

    // BG QUAD
    var bgPlane = new THREE.PlaneBufferGeometry(
      winWidth,
      winHeight
    );
    bgQuad = new THREE.Mesh(bgPlane, bgMaterial);
    bgQuad.position.z = -200;
    sceneBg.add(bgQuad);


    // ANIMATE

    function animate(){
      itt += 1;
      requestAnimationFrame(animate);
      uniforms.itt.value = itt;

      if (controls){
        controls.update();
      }

      S.mesh.rotation.z += 0.01;

      uniforms.mouse.value = mouse;

      // render differential maps
      renderer.setClearColor(new THREE.Color(0x808080), 1.0);
      uniforms.mode.value = 2.0;
      //renderer.render(scene, camera, heightTexture, true);
      renderer.render(scene, camera, depthTexture, true);

      //uniforms.heightTexture.value = heightTexture;
      uniforms.depthTexture.value = depthTexture;

      uniforms.mode.value = 1.0;

      // render background
      renderer.setClearColor(new THREE.Color(0x000000), 1.0);
      renderer.render(sceneBg, cameraBg, bgTexture, true);
      uniforms.bgTexture.value = bgTexture;

      uniforms.screenTexture.value = screenTexture;

      // render scene to texture
      renderer.setClearColor(new THREE.Color(0xFFFFFF), 0.0);
      uniforms.mode.value = 0.0;
      renderer.render(scene, camera, screenTexture, true);

      // render texture to screen
      renderer.render(sceneScreen, cameraScreen);
    }

    // START
    animate();
  });
});
