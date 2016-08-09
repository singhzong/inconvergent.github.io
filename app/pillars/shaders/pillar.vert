attribute vec3 color;
varying vec3 vPosition;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLight;
uniform float itt;
//uniform vec2 mousePos;
uniform vec4 light;

//mat3 m3( mat4 mIn ){
  //mat3 mOut;
  //mOut[0][0] = mIn[0][0];
  //mOut[0][1] = mIn[0][1];
  //mOut[0][2] = mIn[0][2];
  //mOut[1][0] = mIn[1][0];
  //mOut[1][1] = mIn[1][1];
  //mOut[1][2] = mIn[1][2];
  //mOut[2][0] = mIn[2][0];
  //mOut[2][1] = mIn[2][1];
  //mOut[2][2] = mIn[2][2];
  //return mOut;
//}

void main(){

  vec3 pos = position;
  float scale = 100.0;

  //if (pos.z>10.0){
    //pos.z = (cos(pos.y * itt/scale) * sin(pos.x * itt/scale))*100.0;
  //}

  vPosition = vec3(modelMatrix * vec4(pos,1.));
  vNormal = vec3(modelMatrix * vec4(normal,1.));
  vView = vPosition - cameraPosition;
  vLight = vPosition - light.xyz;


  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
}
