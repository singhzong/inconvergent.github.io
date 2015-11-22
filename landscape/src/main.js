var Ndarray = ndarray.ndarray;
var Delaunay = delaunay.delaunay;

var S;
var camera;
var renderer;
var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var offset; //$container.offset();
var $container;
var controls;

var rinit = 100000;
var xinit = 0;
var yinit = 0;
var recursions = 6;
var nodeRangeInit = rinit;
var heightRangeInit = rinit*0.5;
var proximityInit = 200;

var nodeRangeExp = 1.0;
var heightRangeExp = 1.0;
var proximityExp = 0.1;

window.mouseX = 0;
window.mouseY = 0;

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
  camera.aspect = winWidth/winHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(winWidth,winHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  offset = $container.offset();
  console.log('window', winWidth,winHeight);
}

function generate(uniforms){
  S = new Summit();

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


  uniforms.minMaxHeight = {
    type: '2f',
    value: landscape.minMax
  };

  S.init(landscape.vertNum, landscape.triangleNum);
  S.addVertices(landscape.vertices);
  S.addNormals(landscape.normals);
  S.addTriangles(landscape.triangles);
}

// yes, yes, i just did this.
$.when(
  $.ajax({
    url: 'shaders/landscape.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/landscape.vert',
    dataType: 'text'
  })
).done(function(fragment, vertex){

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
    $container.append(renderer.domElement);

    camera = new THREE.PerspectiveCamera(
      100,
      winWidth/winHeight,
      1,
      1000000
    );

    scene = new THREE.Scene();

    var camTarget = new THREE.Vector3(0,0,0);
    var camStart = new THREE.Vector3(0,-rinit,rinit);

    camera.position.x = camStart.x;
    camera.position.y = camStart.y;
    camera.position.z = camStart.z;
    camera.rotation.z = 0;
    camera.lookAt(camTarget);

    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);

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
      controls.addEventListener('change',render);
      controls.target.x = camTarget.x;
      controls.target.y = camTarget.y;
      controls.target.z = camTarget.z;
    }

    // INIT

    var uniforms = {
      itt: {
        type: 'f',
        value:  0
      }
    };

    var shaderMat = new THREE.ShaderMaterial({
        vertexShader: vertex[0],
        fragmentShader: fragment[0],
        uniforms: uniforms,
        transparent: true
    });
    shaderMat.side = THREE.DoubleSide;

    generate(uniforms);
    S.addToScene(camera,scene,shaderMat);

    windowAdjust();


    // ANIMATE

    function animate(){
      itt += 1;
      requestAnimationFrame(animate);
      uniforms.itt.value = itt;

      if (controls){
        controls.update();
      }
      render();
    }

    function render(){
      renderer.render(scene, camera);
    }

    // START
    animate();
  });
});
