function UnstructuredLandscape(
  xInit,
  yInit,
  rInit,
  nodeRangeInit,
  heightRangeInit,
  proximityInit,
  nodeRangeExp,
  heightRangeExp,
  proximityExp,
  recursions
){

  console.log('nodeRangeInit', nodeRangeInit);
  console.log('heightRangeInit', heightRangeInit);
  console.log('proximityInit', proximityInit);

  console.log('nodeRangeExp', nodeRangeExp);
  console.log('heightRangeExp', heightRangeExp);
  console.log('proximityExp', proximityExp);

  var maxN = 65000;
  var attemptsMultiplier = 2.1;

  var ndx = Ndarray(new Float32Array(maxN*3),[maxN,3]);
  var tree = new kdTree([], distance, ['x','y']);

  function getHeightRange(k){
    return heightRangeInit*Math.pow(2,-k*heightRangeExp);
  }
  function getNodeRange(k){
    return nodeRangeInit*Math.pow(2,-k*nodeRangeExp);
  }
  function getProximity(k){
    return proximityInit*Math.pow(2,-k*proximityExp);
  }

  function getNonBlockedCandidatesInDomain(prox,cn){
    var prox2 = prox*prox;
    var r2 = rInit*rInit;
    var doubleR = rInit*2;
    var xcand;
    var ycand;
    while (true){
      xcand = (0.5-Math.random())*doubleR;
      ycand = (0.5-Math.random())*doubleR;
      if (xcand*xcand+ycand*ycand>r2){
        continue;
      }
      xcand += xInit;
      ycand += yInit;

      var near = tree.nearest({x:xcand,y:ycand}, 1, prox2);
      if (near.length<1){
        return [xcand, ycand];
      }
    }
  }

  var currentN = 0;
  var minHeight = 0;
  var maxHeight = 0;

  function set(x,y,z){
    ndx.set(currentN,0,x);
    ndx.set(currentN,1,y);
    ndx.set(currentN,2,z);
    tree.insert({'x':x,'y':y,'z':z});
    currentN++;
    if (z<minHeight){
      minHeight = z;
    }
    if (z>maxHeight){
      maxHeight = z;
    }
  }

  // we need at least one initial node.
  set(0,0,5000);
  set(rInit,0,0);
  set(-rInit,0,0);
  //set(0,rInit,0);
  //set(0,-rInit,0);

  var misses;
  var t = new Date();
  for (var k=0;k<recursions;k++){

    var nodeRange = getNodeRange(k);
    var nodeRange2 = nodeRange*nodeRange;
    var proximity = getProximity(k);
    var heightRange = getHeightRange(k);
    var attempts = Math.pow(2,(k+1)*attemptsMultiplier);
    misses = 0;

    console.log('k', k);
    console.log('attempts', attempts);
    console.log('nodeRange', nodeRange);
    console.log('proximity', proximity);
    console.log('heightRange', heightRange);
    console.log('currentN', currentN);

    for (var localItt=0;localItt<attempts;localItt++){

      var xycand = getNonBlockedCandidatesInDomain(proximity,currentN);
      var near = tree.nearest({x:xycand[0],y:xycand[1]}, 200, nodeRange2);

      if (near.length>0){
        var avg = near.reduce(doSum,0)/near.length;
        var z = avg + heightRange*(0.5-Math.random());
        set(xycand[0],xycand[1],z);
      }
      else{
        misses++;
      }

      // if this happens there is a misconfiguration
      if (currentN>=maxN){
        console.warning('>maxN', maxN, 'k', k);
        // force outer loop to terminate.
        k = recursions+1;
        break;
      }
    }
  }

  var triangles = Delaunay(toTuples(ndx, 2, currentN));
  var normals = getNormals(ndx, currentN, triangles);

  console.log('misses', misses);
  console.log('landscape time: ',new Date()-t);
  console.log('min, max', minHeight, maxHeight);
  console.log('num vertices', currentN);
  console.log('num triangles',triangles.length);
  console.log('num normals', normals.shape);

  return {
    vertices: ndx,
    vertNum: currentN,
    triangles: triangles,
    triangleNum: triangles.length,
    minMax: [minHeight, maxHeight],
    normals: normals
  };
}

function getNormals(vert,vertNum,tri){

  var ndnormal = Ndarray(new Float32Array(vertNum*3),[vertNum,3]);
  tri.forEach(function(t){
    var ta = t[0];
    var tb = t[1];
    var tc = t[2];
    var ax = vert.get(ta,0);
    var ay = vert.get(ta,1);
    var az = vert.get(ta,2);

    var bx = vert.get(tb,0);
    var by = vert.get(tb,1);
    var bz = vert.get(tb,2);

    var cx = vert.get(tc,0);
    var cy = vert.get(tc,1);
    var cz = vert.get(tc,2);

    var ux = cx-ax;
    var uy = cy-ay;
    var uz = cz-az;

    var vx = cx-bx;
    var vy = cy-by;
    var vz = cz-bz;

    var crossx, crossy, crossz;

    crossz = ux*vy-uy*vx;
    crossx = uy*vz-uz*vy;
    crossy = uz*vx-ux*vz;

    if (crossz<0){
      crossz = vx*uy-vy*ux;
      crossx = vy*uz-vz*uy;
      crossy = vz*ux-vx*uz;
    }

    var l = Math.sqrt(crossx*crossx + crossy*crossy + crossz*crossz);
    crossx /= l;
    crossy /= l;
    crossz /= l;
    ndnormal.set(ta,0,crossx+ndnormal.get(ta,0));
    ndnormal.set(ta,1,crossy+ndnormal.get(ta,1));
    ndnormal.set(ta,2,crossz+ndnormal.get(ta,2));

    ndnormal.set(tb,0,crossx+ndnormal.get(tb,0));
    ndnormal.set(tb,1,crossy+ndnormal.get(tb,1));
    ndnormal.set(tb,2,crossz+ndnormal.get(tb,2));

    ndnormal.set(tc,0,crossx+ndnormal.get(tc,0));
    ndnormal.set(tc,1,crossy+ndnormal.get(tc,1));
    ndnormal.set(tc,2,crossz+ndnormal.get(tc,2));

  });
  return ndnormal;
}

function distance(a, b){
  return Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2);
}

function doSum(a,b){
  return a + b[0].z;
}

function toTuples(nd, dim, num){
  var res = [];
  for (var i=0;i<num;i++){
    var row = [];
    for (var j=0;j<dim;j++){
      row.push(nd.get(i,j));
    }
    res.push(row);
  }
  return res;
}

