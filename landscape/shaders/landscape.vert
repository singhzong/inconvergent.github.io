attribute vec3 color;
varying vec3 vPosition;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vLight;
varying float vZ;
varying float vZp;
uniform float itt;
uniform vec2 mousePos;
uniform vec2 minMaxHeight;

void main(){

  vLight = vec3(0.0,
                20000.0,
                20000.0*20000.0);

  vPosition = position;
  float heightDiff = (minMaxHeight.y - minMaxHeight.x);
  float z = (vPosition.z - minMaxHeight.x);
  float nZ = z/heightDiff;
  vPosition.z = z;
  vNormal = normalize(normal); // pun, ahoy!
  vZ = nZ;

  gl_Position = projectionMatrix *
    modelViewMatrix *
    vec4(vPosition,1.0);
}
