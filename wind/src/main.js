var camera;
var renderer;
var offset;
var $container;
var controls;
var stats;

var mouseX, mouseY, worldMouseX, worldMouseY;

var P;
var timeout = null;

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var viewRatio = winWidth/winHeight;
var pixelRatio = window.devicePixelRatio || 1;

var resolution = 512;
var size = 1500;

var eventQueue = [];

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
    url: 'shaders/grid.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/grid.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/gridClone.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/gridClone.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/plane.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/plane.vert',
    dataType: 'text'
  })
).done(function(
  gridFrag,
  gridVert,
  gridCloneFrag,
  gridCloneVert,
  planeFrag,
  planeVert
){

  if (!Detector.webgl){
    Detector.addGetWebGLMessage();
  }

  $(document).ready(function(){

    console.log('start');

    $container = $('#box');

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: false
    });
    renderer.autoClear = true;
    $container.append(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
      40,
      winWidth/winHeight,
      1,
      5000
    );

    scene = new THREE.Scene();

    var camTarget = new THREE.Vector3(0,0,0);
    var camStart = new THREE.Vector3(0,-1700,800);
    camera.position.x = camStart.x;
    camera.position.y = camStart.y;
    camera.position.z = camStart.z;
    camera.lookAt(camTarget);

    camera.aspect = viewRatio;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(winWidth,winHeight);

    scene.add(camera);

    windowAdjust();

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

    //stats = new Stats();
    if (stats){
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.bottom = '0px';
      stats.domElement.style.left = '0px';
      stats.domElement.style.zIndex = 100;
      $container.append(stats.domElement);
    }

    var planeMat = new THREE.ShaderMaterial({
        vertexShader: planeVert[0],
        fragmentShader: planeFrag[0],
        transparent: true,
    });
    planeMat.side = THREE.DoubleSide;

    var plane = new THREE.PlaneBufferGeometry(size,size);
    var quad = new THREE.Mesh(plane, planeMat);
    scene.add(quad);

    renderer.setClearColor(new THREE.Color(0xAA0000), 1.0);

    var itt = 0;
    function animate(){
      itt += 1;
      console.log(itt);
      window.requestAnimFrame(animate);

      if (controls){
        controls.update();
      }
      if (stats){
        stats.update();
      }

      renderer.setSize(winWidth,winHeight);
      renderer.render(scene, camera);
    }

    animate();
  });
});
