var camera
var renderer
var offset
var $container
var controls
var stats

var mouseX, mouseY, worldMouseX, worldMouseY

var P
var timeout = null

var winWidth = window.innerWidth
var winHeight = window.innerHeight
var viewRatio = winWidth/winHeight
var pixelRatio = window.devicePixelRatio || 1

var resolution = 512
var size = 1500

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
})

function windowAdjust() {

  winWidth = window.innerWidth
  winHeight = window.innerHeight
  offset = $container.offset()
  pixelRatio = window.devicePixelRatio || 1

  renderer.setPixelRatio(pixelRatio)
  renderer.setSize(winWidth,winHeight)

  camera.aspect = winWidth/winHeight
  camera.updateProjectionMatrix()

  console.log('window', winWidth,winHeight)
  console.log('pixel ratio', pixelRatio)

  viewRatio = window.innerWidth/window.innerHeight
  console.log('screen ratio', viewRatio)
}

$.when(
  $.ajax({
    url: 'shaders/geo.frag',
    dataType: 'text'
  }),
  $.ajax({
    url: 'shaders/geo.vert',
    dataType: 'text'
  })
).done(function(
  geoFrag,
  geoVert
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

    camera = new THREE.PerspectiveCamera(
      40,
      winWidth/winHeight,
      1,
      5000
    )

    uniforms = {
      itt: {
        type: 'f',
        value:  0
      },
      mode: {
        type: 'f',
        value: 1.0
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
      kerSize: {
        type: 'f',
        value: 10
      },
      pixelRatio: {
        type: 'f',
        value: pixelRatio
      }
    }

    scene = new THREE.Scene()

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

    windowAdjust()

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
    //planeMat.side = THREE.DoubleSide

    //var plane = new THREE.PlaneBufferGeometry(size,size)
    //var planeMesh = new THREE.Mesh(plane, planeMat)
    //scene.add(planeMesh)
    //

    var numCube = 10
    var spread = 1000
    var size = 20
    for (var k=0; k<numCube; k++){
      for (var j=0; j<numCube; j++){
        for (var i=0; i<numCube; i++){
          var box = new THREE.CubeGeometry(size,size,size)
          var boxMesh = new THREE.Mesh(box, geoMat)
          boxMesh.position.x = -spread*0.5 + i*spread/numCube
          boxMesh.position.y = -spread*0.5 + j*spread/numCube
          boxMesh.position.z = -spread*0.5 + k*spread/numCube
          boxMesh.rotation.x = Math.PI/(i/numCube)
          boxMesh.rotation.y = Math.PI/(j/numCube)
          boxMesh.rotation.z = Math.PI/(k/numCube)
          scene.add(boxMesh)
        }
      }
    }


    renderer.setClearColor(new THREE.Color(0x000000), 1.0)

    var itt = 0
    function animate(){
      itt += 1

      if (itt%10==0){
        console.log(itt)
      }

      if (controls){
        controls.update()
      }
      if (stats){
        stats.update()
      }

      //renderer.setSize(winWidth,winHeight)
      renderer.render(scene, camera)
      window.requestAnimationFrame(animate)
    }

    animate()
  })
})

