var Ndarray = ndarray.ndarray;

var camera;
var renderer;
var offset; //$container.offset();
var $container;
var controls;
var uniforms;

//var mouse = [0, -winHeight*0.5];
var offset;

var P;

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var viewRatio = winWidth/winHeight;
var pixelRatio = window.devicePixelRatio || 1;

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
  console.log('screen ratio', viewRatio);
}


$.when(
  $.ajax({
    url: 'shaders/pillar.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/pillar.vert',
    dataType: 'text'
  })
).done(function(
  pillarFrag,
  pillarVert
){

  if (!Detector.webgl){
    Detector.addGetWebGLMessage();
  }

  $(document).ready(function(){
    console.log('start');

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

    camera = new THREE.PerspectiveCamera(
      40,
      winWidth/winHeight,
      1,
      5000
    );

    // SCENES

    scene = new THREE.Scene();

    var camTarget = new THREE.Vector3(0,0,0);
    var camStart = new THREE.Vector3(100,-100,100);

    camera.position.x = camStart.x;
    camera.position.y = camStart.y;
    camera.position.z = camStart.z;
    camera.lookAt(camTarget);

    camera.aspect = viewRatio;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(winWidth,winHeight);

    scene.add(camera);

    controls = new THREE.OrbitControls(camera);

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
      //screenTexture: {
        //type: "t",
        //value: null
      //},
      window: {
        type: '2f',
        value: [winWidth, winHeight]
      },
      //mouse: {
        //type: '2f',
        //value: mouse
      //},
      light: {
        type: '4f',
        value: [0.0, 2000, 1000, 0.7]
      },
      pixelRatio: {
        type: 'f',
        value: pixelRatio
      }
    };

    // TEXTURES

    //var depthTexture = new THREE.WebGLRenderTarget(
      //Math.floor(winWidth*pixelRatio),
      //Math.floor(winHeight*pixelRatio), {
        //minFilter: THREE.LinearFilter,
        //magFilter: THREE.NearestFilter,
        //format: THREE.RGBAFormat
      //}
    //);

    // MATERIALS
    //
    var basicMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true
    });
    basicMaterial.side = THREE.DoubleSide;

    var pillarMaterial = new THREE.ShaderMaterial({
        vertexShader: pillarVert[0],
        fragmentShader: pillarFrag[0],
        uniforms: uniforms,
        transparent: true
    });
    pillarMaterial.side = THREE.DoubleSide;

    P = generate(camera, scene, pillarMaterial);

    windowAdjust();

    //var plane = new THREE.PlaneBufferGeometry(
      //200,
      //200
    //);
    //quad = new THREE.Mesh(plane, basicMaterial);
    //scene.add(quad);

    // ANIMATE

    function animate(){
      itt += 1;
      requestAnimationFrame(animate);
      uniforms.itt.value = itt;

      if (controls){
        controls.update();
      }

      //uniforms.mouse.value = mouse;

      //renderer.setClearColor(new THREE.Color(0x808080), 1.0);
      renderer.render(scene, camera);
    }

    // START
    animate();
  });
});
