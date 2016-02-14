attribute vec3 color;
varying vec3 vPosition;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLight;
uniform float itt;
uniform vec4 light;

void main(){

  vPosition = vec3(modelMatrix * vec4(position,1.));
  // TODO: find out how this is supposed to be done
  vNormal = vec3(modelMatrix * vec4(normal,0.0));
  //vNormal = normal;

  vView = vPosition - cameraPosition;
  vLight = vPosition - light.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
