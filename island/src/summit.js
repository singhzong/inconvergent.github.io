function Summit(){

  this.init = function init(vertexNum, trianglesNum){

    var tnum = trianglesNum;
    var vnum = vertexNum;

    this.tnum = tnum;
    this.vnum = vnum;

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

  this.addVertices = function addVertices(verts){
    var i;
    for (i=0;i<verts.shape[0];i++){
      this.ndposition.set(i,0,verts.get(i,0));
      this.ndposition.set(i,1,verts.get(i,1));
      this.ndposition.set(i,2,verts.get(i,2));
    }

    this.geometry.attributes.position.needsUpdate = true;
    //this.geometry.attributes.color.needsUpdate = true;
  };

  this.addTriangles = function addTriangles(triangles){
    var i;
    for (i=0;i<triangles.length;i++){
      this.ndindex.set(i,0,triangles[i][0]);
      this.ndindex.set(i,1,triangles[i][1]);
      this.ndindex.set(i,2,triangles[i][2]);
    }

    this.geometry.attributes.index.needsUpdate = true;
  };
}
