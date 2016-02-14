var camera
var renderer
var offset
var $container
var controls
var stats

var winWidth = window.innerWidth;
var winHeight = window.innerHeight;
var viewRatio = winWidth/winHeight;

var rinit = 1000

var pixelRatio = window.devicePixelRatio || 1;
var viewWinWidth = 2.2*rinit;
var viewWinHeight = viewWinWidth / viewRatio;
console.log('screen ratio', viewRatio, viewWinWidth, viewWinHeight);


// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
;(function() {
    var lastTime = 0
    var vendors = ['ms', 'moz', 'webkit', 'o']
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame']
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
                                   || window[vendors[x]+'CancelRequestAnimationFrame']
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime()
            var timeToCall = Math.max(0, 16 - (currTime - lastTime))
            var id = window.setTimeout(function() { callback(currTime + timeToCall) },
              timeToCall)
            lastTime = currTime + timeToCall
            return id
        }

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id)
        }
}())

;(function() {
  var timer_id
  $(window).resize(function() {
      clearTimeout(timer_id)
      timer_id = setTimeout(function() {
        windowAdjust()
      }, 300)
  })
}())

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

$.when(
  $.ajax({
    url: 'shaders/geo.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/geo.vert',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/screen.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/screen.vert',
    dataType: 'text'
  })
).done(function(
  geoFrag,
  geoVert,
  screenFrag,
  screenVert
){

  if (!Detector.webgl){
    Detector.addGetWebGLMessage()
  }

  $(document).ready(function(){

    console.log('start')

    $container = $('#box')

    renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: false
    })
    renderer.autoClear = true
    $container.append(renderer.domElement)

    cameraScreen = new THREE.OrthographicCamera(
      window.innerWidth/-2,
      window.innerWidth/2,
      window.innerHeight/2,
      window.innerHeight/-2,
      0,
      500
    );
    cameraScreen.position.z = 100;

    camera = new THREE.PerspectiveCamera(
      40,
      winWidth/winHeight,
      1,
      5000
    )

    scene = new THREE.Scene()
    sceneScreen = new THREE.Scene();

    var camTarget = new THREE.Vector3(0,0,0)
    var camStart = new THREE.Vector3(0,-1700,800)
    camera.position.x = camStart.x
    camera.position.y = camStart.y
    camera.position.z = camStart.z
    camera.lookAt(camTarget)

    camera.aspect = viewRatio
    camera.updateProjectionMatrix()

    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(winWidth,winHeight)

    scene.add(camera)
    sceneScreen.add(cameraScreen);

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
      normalTexture: {
        type: "t",
        value: null
      },
      depthTexture: {
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
      light: {
        type: '4f',
        value: [0, 5000, 2000, 0.0]
      },
      pixelRatio: {
        type: 'f',
        value: pixelRatio
      }
    }

    // TODO: fix size
    var screenTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        //minFilter: THREE.LinearFilter,
        //magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat }
    )

    var normalTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        //minFilter: THREE.LinearFilter,
        //magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      }
    )

    var depthTexture = new THREE.WebGLRenderTarget(
      Math.floor(winWidth*pixelRatio),
      Math.floor(winHeight*pixelRatio), {
        //minFilter: THREE.LinearFilter,
        //magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat
      }
    )



    controls = new THREE.OrbitControls(camera)
    if (controls){
      controls.rotateSpeed = 1.0
      controls.zoomSpeed = 1.2
      controls.panSpeed = 1.0
      controls.noZoom = false
      controls.noPan = false
      //controls.autoRotate = true
      controls.staticMoving = true
      controls.dynamicDampingFactor = 0.3
      controls.keys = [65,83,68]
      controls.target.x = camTarget.x
      controls.target.y = camTarget.y
      controls.target.z = camTarget.z
    }

    stats = new Stats()
    if (stats){
      stats.domElement.style.position = 'absolute'
      stats.domElement.style.bottom = '0px'
      stats.domElement.style.left = '0px'
      stats.domElement.style.zIndex = 100
      $container.append(stats.domElement)
    }

    var normalMat = new THREE.MeshNormalMaterial()

    var geoMat = new THREE.ShaderMaterial({
        vertexShader: geoVert[0],
        fragmentShader: geoFrag[0],
        uniforms: uniforms,
        transparent: true,
    })
    var screenMaterial = new THREE.ShaderMaterial({
        vertexShader: screenVert[0],
        fragmentShader: screenFrag[0],
        uniforms: uniforms,
        transparent: true
    });

    windowAdjust()

    var screenPlane = new THREE.PlaneBufferGeometry(
      winWidth,
      winHeight
    );
    screenQuad = new THREE.Mesh(screenPlane, screenMaterial);
    screenQuad.position.z = -100;
    sceneScreen.add(screenQuad);

    var numGeo = 15
    var spread = 2000
    var size = 40

    //var sections = 2
    //var geo = new THREE.SphereGeometry(size*0.5, sections, sections)
    var geo = new THREE.CubeGeometry(size,size,size)

    for (var k=0; k<numGeo; k++){
      for (var j=0; j<numGeo; j++){
        for (var i=0; i<numGeo; i++){
          var mesh = new THREE.Mesh(geo, geoMat)
          mesh.position.x = -spread*0.5 + i*spread/numGeo
          mesh.position.y = -spread*0.5 + j*spread/numGeo
          mesh.position.z = -spread*0.5 + k*spread/numGeo
          //mesh.position.z = Math.cos(i/numGeo*Math.PI*10)*500*Math.sin(j/numGeo*Math.PI*10)

          mesh.rotateX(Math.random()*Math.PI*2)
          mesh.rotateY(Math.random()*Math.PI*2)
          //geo.computeFaceNormals()
          //geo.normalsNeedUpdate = true
          //mesh.matrixWorldNeedsUpdate = true
          scene.add(mesh)
        }
      }
    }

    var itt = 0.0
    function animate(){

      itt += 1.0
      uniforms.itt.value = itt

      if (itt%10===0){
        console.log(itt)
      }

      if (controls){
        controls.update()
      }
      if (stats){
        stats.update()
      }

      //renderer.setSize(winWidth,winHeight)
      //renderer.render(scene, camera)

      // render differential map
      renderer.setClearColor(new THREE.Color(0x808080), 1.0)
      uniforms.mode.value = 2.0
      renderer.render(scene, camera, depthTexture, true)
      uniforms.depthTexture.value = depthTexture

      // render normal map
      renderer.setClearColor(new THREE.Color(0x808000), 1.0)
      uniforms.mode.value = 1.0
      renderer.render(scene, camera, normalTexture, true)
      uniforms.normalTexture.value = normalTexture


      renderer.setClearColor(new THREE.Color(0xFFFFFF), 1.0)
      uniforms.screenTexture.value = screenTexture;

      // render scene to texture
      uniforms.mode.value = 0.0
      renderer.render(scene, camera, screenTexture, true)

      //// render texture to screen
      uniforms.mode.value = 0.0;
      renderer.render(scene, camera, screenTexture, true)

      renderer.render(sceneScreen, cameraScreen)

      window.requestAnimationFrame(animate)
    }

    animate()
  })
})

