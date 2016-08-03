uniform float size;
uniform float hsize;
uniform float vnum;
uniform sampler2D heights;
uniform float texSize;
uniform vec3 light;
uniform vec3 camPos;

varying vec3 vPosition;
varying vec3 vCamera;

attribute vec3 color;
varying vec3 vColor;

varying vec2 texCoord;

void main(){
  vColor = color;
  vCamera = camPos;
  vPosition = position;

  // i cant for the life of me understand why vnum is needed here.
  // position.xy/size E [0,1]
  // texSize > vnum
  texCoord = position.xy/size/texSize*vnum;
  float tmp = texCoord.x;
  texCoord.x = texCoord.y;
  texCoord.y = 1.0-tmp;
  vec3 h = texture2D(heights,texCoord).xyz;
  vPosition.z = clamp(h.z,0.0,1.0)*hsize;

  gl_Position = projectionMatrix *
    modelViewMatrix *
    vec4(vPosition,1.0);
}
