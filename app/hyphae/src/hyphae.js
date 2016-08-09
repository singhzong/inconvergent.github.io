window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame ||
          function(callback){
            window.setTimeout(callback,1000/60);
          };
})();

var PI = Math.PI;
var PII = Math.PI*2;

var FRONT = '#222222';

var CTX;
var SIZE = 700;
var MID = SIZE/2;

var BORDER = 10;

var XMIN = BORDER;
var XMAX = SIZE-BORDER;
var YMIN = BORDER;
var YMAX = SIZE-BORDER;
var RADMAX = 300;

var SEARCH_ANGLE_MAX = PI*1.1;

var NUMLIM = 10000;
var FAILED = 1000;
var MAXFAILED = 200000;
var CKMAX = 8;
var NUM = 0;

var RADSCALE = 0.97;

var SPEEDUP = 150;

var F = [];

var SEEDS = 6;
var INITRAD = 250;
var NODERAD = 10;

// data arrays
var BYTES = 32/8; 
var XBUF = new ArrayBuffer(NUMLIM*BYTES);
var YBUF = new ArrayBuffer(NUMLIM*BYTES);
var THETABUF = new ArrayBuffer(NUMLIM*BYTES);
var GENBUF = new ArrayBuffer(NUMLIM*BYTES);
var RADBUF = new ArrayBuffer(NUMLIM*BYTES);
var PBUF = new ArrayBuffer(NUMLIM*BYTES);
var CKBUF = new ArrayBuffer(NUMLIM*BYTES);
var CBUF = new ArrayBuffer(NUMLIM*BYTES);
var DBUF = new ArrayBuffer(NUMLIM*BYTES);
var PBUF = new ArrayBuffer(NUMLIM*BYTES);

var X = new Float32Array(XBUF);
var Y = new Float32Array(YBUF);
var THETA = new Float32Array(THETABUF);
var GEN = new Int32Array(GENBUF);
var CK = new Int32Array(CKBUF);
var P = new Int32Array(PBUF);
var D = new Int32Array(DBUF);
var P = new Int32Array(PBUF);
var RAD = new Int32Array(RADBUF);

var ITT = 0;

$(document).ready(function(){

  $('<canvas>').attr({
    id: 'inconvergent'
  }).css({
    width: SIZE + 'px',
    height: SIZE + 'px' 
  }).attr({
    width: SIZE,
    height: SIZE 
  }).appendTo('#box');

  var C = $('#inconvergent') ;
  CTX = C[0].getContext("2d");

  C.click(function(){
    init_canvas();
    nullify();
    init();
  });

  init_canvas();
  nullify();
  init();

  (function animloop(){
    requestAnimFrame(animloop);

    //console.time('run');
    for (var k=0;k<SPEEDUP;k++){
      run();
    }
    //console.timeEnd('run');

    if (FAILED>MAXFAILED){
      init_canvas();
      nullify();
      init();
    }

  })();
});

function init_canvas(){

  init();
  CTX.fillStyle = 'rgb(255,255,255)';
  CTX.fillRect(0,0,SIZE,SIZE);
  CTX.fillStyle = FRONT;
  CTX.strokeStyle = FRONT;
  //CTX.webkitImageSmoothingEnabled = false;
}

function nullify(){
  NUM = 0;
  FAILED = 0;
  ITT = 0;

  for(var i = 0;i<NUMLIM;i++){
    X[i] = 0;
    Y[i] = 0;
    THETA[i] = 0;
    GEN[i] = -100;
    D[i] = -100;
    P[i] = -100;
    RAD[i] = 0;
    CK[i] = 0;
  }
}

function draw(x1,y1,x2,y2,r){

  var dx = x1-x2;
  var dy = y1-y2;
  var dd = Math.sqrt(dx*dx+dy*dy);

  var n = Math.floor(dd);
  if (n<2){ n = 2; }

  var a = Math.atan2(dy,dx);
  var sx = dd/n*Math.cos(a);
  var sy = dd/n*Math.sin(a);

  var xx = x1;
  var yy = y1;
  for (var i=0;i<n;i++){

    var rscale = r*(0.6+Math.random()*0.4);
    CTX.beginPath();
    CTX.arc(xx,yy,rscale,0,PII,true);
    CTX.closePath();
    CTX.fill();

    xx -= sx;
    yy -= sy;
  }
}

function init(){

  for (var i=0;i<SEEDS;i++){
    var the = Math.random()*PII;
    var r = NODERAD;
    var cdist = INITRAD*Math.random();
    var y = SIZE/2 + Math.sin(the)*cdist;
    var x = SIZE/2 + Math.cos(the)*cdist;
    X[i] = x;
    Y[i] = y;
    RAD[i] = r;
    THETA[i] = Math.random()*PII;
    GEN[i] = 1;

    NUM++;
  }
}

function run(){

  ITT++;

  k = Math.floor(Math.random()*NUM);

  if (CK[k]>CKMAX){
    // node is dead
    FAILED++;
    return;
  }

  //var r = NODERAD;
  //var theta = THETA[k] + 0.5*(PI*(0.5-Math.random()));

  var gen;
  if (D[k]>-1){
    gen = GEN[k]+1;
  }
  else {
    gen = GEN[k];
  }

  var r;
  if (D[k]>-1){
    r = RAD[k]*RADSCALE;
  }
  else{
    r = RAD[k];
  }

  if (r<2){
    // node is too small
    CK[k] = CKMAX+100;
    FAILED++;
    return;
  }

  var theta_rnd = (0.5-Math.random())*SEARCH_ANGLE_MAX;
  var theta = THETA[k] + (1-1/Math.pow(gen+1,0.7))*theta_rnd;

  var x = X[k] + Math.sin(theta)*r;
  var y = Y[k] + Math.cos(theta)*r;

  // outside canvas
  //if (x>XMAX||x<XMIN||y>YMAX||y<YMIN){
    //CK[k] = CKMAX+100;
    //return;
  //}

  var centerdist = Math.sqrt(Math.pow(MID-x,2)+Math.pow(MID-y,2));
  if (centerdist>RADMAX){
    // outside circle
    CK[k] = CKMAX+100;
    FAILED++;
    return;
  }

  for (i=0;i<NUM;i++){

    if (i==k || i==P[k]){
      // parent node can not block
      continue;
    }

    var nx = X[i]-x;
    var ny = Y[i]-y;
    var dist = Math.sqrt(nx*nx+ny*ny);
    if (dist*2<=RAD[i]+r){
      CK[k] += 1;
      // blocked by other node
      FAILED++;
      return;
    }
  }

  X[NUM] = x;
  Y[NUM] = y;
  RAD[NUM] = r;
  THETA[NUM] = theta;
  GEN[NUM] = gen;
  P[NUM] = k;

  if (D[k]<0){
    D[k] = NUM;
  }

  draw(X[k],Y[k],x,y,r*0.3);

  NUM++;
}

