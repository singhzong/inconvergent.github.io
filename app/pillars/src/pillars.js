function Pillars(){

  this.init = function init(pillars){

    var tnum = pillars*6;
    var vnum = pillars*6;

    this.tnum = tnum;
    this.vnum = vnum;

    this.nvert = 0;
    this.ntri = 0;

    this.index = new Uint16Array(tnum*3);
    this.position = new Float32Array(vnum*3);
    this.color = new Float32Array(vnum*3);
    this.normal = new Float32Array(vnum*3);

    this.ndindex = Ndarray(this.index,[tnum,3]);
    this.ndposition = Ndarray(this.position,[vnum,3]);
    this.ndcolor = Ndarray(this.color,[vnum,3]);
    this.ndnormal = Ndarray(this.normal,[vnum,3]);

    this.geometry = new THREE.BufferGeometry();

    this.geometry.addAttribute('index', new THREE.BufferAttribute(this.index, 1));
    this.geometry.addAttribute('position', new THREE.BufferAttribute(this.position, 3));
    this.geometry.addAttribute('normal', new THREE.BufferAttribute(this.normal, 3));
    this.geometry.addAttribute('color', new THREE.BufferAttribute(this.color, 3));

    var t;
    var v;
    for (t=0; t<this.tnum; t++){
      this.ndindex.set(t,0,0);
      this.ndindex.set(t,1,0);
      this.ndindex.set(t,2,0);
    }

    for (v=0; v<this.vnum; v++){
      this.ndposition.set(v,0,0);
      this.ndposition.set(v,1,0);
      this.ndposition.set(v,2,0);

      this.ndcolor.set(v,0,0);
      this.ndcolor.set(v,1,0);
      this.ndcolor.set(v,2,0);

      this.ndnormal.set(v,0,0);
      this.ndnormal.set(v,1,0);
      this.ndnormal.set(v,2,0);
    }

    this.geometry.attributes.index.needsUpdate = true;
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;

    this.ntri = 0;
    this.nvert = 0;
  };

  this.addPillar = function addPillar(x,y,w,h,b){

    nvert = this.nvert;
    ntri = this.ntri;
    var shift = Math.random()*Math.PI*2;
    var i, theta, xx, yy;

    for (i=0;i<3;i++){
      theta = shift + i*Math.PI/3.0*2.0;
      xx = x + Math.cos(theta)*w;
      yy = y + Math.sin(theta)*w;
      this.ndposition.set(nvert,0,xx);
      this.ndposition.set(nvert,1,yy);
      this.ndposition.set(nvert,2,b);
      nvert++;
    }

    for (i=0;i<3;i++){
      theta = shift + i*Math.PI/3.0*2.0;
      xx = x + Math.cos(theta)*w;
      yy = y + Math.sin(theta)*w;
      this.ndposition.set(nvert,0,xx);
      this.ndposition.set(nvert,1,yy);
      this.ndposition.set(nvert,2,h);
      nvert++;
    }

    //this.ndposition.set(nvert,0,x);
    //this.ndposition.set(nvert,1,y);
    //this.ndposition.set(nvert,2,h);
    //nvert++;

    this.geometry.attributes.position.needsUpdate = true;
    //this.geometry.attributes.color.needsUpdate = true;


    this.ndindex.set(ntri,0,nvert-3);
    this.ndindex.set(ntri,1,nvert-2);
    this.ndindex.set(ntri,2,nvert-6);
    ntri++;

    this.ndindex.set(ntri,0,nvert-2);
    this.ndindex.set(ntri,1,nvert-5);
    this.ndindex.set(ntri,2,nvert-6);
    ntri++;

    this.ndindex.set(ntri,0,nvert-2);
    this.ndindex.set(ntri,1,nvert-1);
    this.ndindex.set(ntri,2,nvert-4);
    ntri++;

    this.ndindex.set(ntri,0,nvert-2);
    this.ndindex.set(ntri,1,nvert-5);
    this.ndindex.set(ntri,2,nvert-4);
    ntri++;

    this.ndindex.set(ntri,0,nvert-1);
    this.ndindex.set(ntri,1,nvert-3);
    this.ndindex.set(ntri,2,nvert-4);
    ntri++;

    this.ndindex.set(ntri,0,nvert-3);
    this.ndindex.set(ntri,1,nvert-6);
    this.ndindex.set(ntri,2,nvert-4);
    ntri++;

    this.geometry.attributes.index.needsUpdate = true;

    this.nvert = nvert;
    this.ntri = ntri;

  };

  this.makeMesh = function makeMesh(mat){
    this.geometry.computeFaceNormals();
    this.geometry.computeVertexNormals();
    this.mesh = new THREE.Mesh(this.geometry, mat);
    this.mesh.frustumCulled = false;
  };

}

function generate(camera, scene, mat){

  // random
  var steps = 100;
  var n = steps*steps;
  P = new Pillars();
  P.init(n);

  var h = 0;
  var b = 0;
  for (var i=0;i<steps;i++){
    for (var j=0;j<steps;j++){
      //var x = (0.5-Math.random())*200;
      //var y = (0.5-Math.random())*200;
      h += (0.5-Math.random())*2;
      b += (0.5-Math.random())*2;
      //var h = 1000.0;
      //var h = 100.0;
      //
      var x = 200*(0.5-i/steps);
      var y = 200*(0.5-j/steps);
      var w = 0.1;
      P.addPillar(x,y,w,h,b);
    }
  }


  P.makeMesh(mat);
  camera.add(P.mesh);
  scene.add(P.mesh);

  return P;

}

