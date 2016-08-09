#extension GL_OES_standard_derivatives: enable

uniform float itt;
uniform float mode;
uniform vec2 window;
uniform float pixelRatio;
uniform vec2 mouse;

varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLight;


/* ASHIMA
functions below are from:
  https://github.com/ashima/webgl-noise/blob/master/src/noise2D.glsl
They are under a separate licence from the rest of this file.
*/
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v)
  {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
// First corner
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

// Other corners
  vec2 i1;
  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
  //i1.y = 1.0 - i1.x;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  // x0 = x0 - 0.0 + 0.0 * C.xx ;
  // x1 = x0 - i1 + 1.0 * C.xx ;
  // x2 = x0 - 1.0 + 2.0 * C.xx ;
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

// Permutations
  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

// Gradients: 41 points uniformly over a line, mapped onto a diamond.
// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt( a0*a0 + h*h );
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

// Compute final noise value at P
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
/*ASHIMA END*/


//vec3 banding(vec3 I, vec3 c, float d){
  //float rnd = snoise(vec2(d, 1.0));
  //if (mod(floor(d/2.0 + rnd),4.0)<0.001){
    //return c;
  //}
  //return I;
//}

float opacityBanding(float I, float c, float d){
  float rnd = snoise(vec2(d, 1.0));
  rnd = 0.0;
  if (mod(floor(d/2.0 + rnd*2.0),4.0)<0.001){
    return c;
  }
  return I;
}

vec3 diffmap(float a){
  float fw = fwidth(a);
  return vec3(0.5 + 0.5*dFdx(a)/fw,0.5 + 0.5*dFdy(a)/fw,fw);
}

vec3 hsv2rgb(vec3 c){
  // http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}



void main(){

  float opacity = 1.0;
  vec3 I = vec3(0.0,0.0,1.0);

  float vdist;
  float ldist;

  vec3 C;
  vec3 V;
  vec3 L;
  vec3 N;

  ldist = length(vLight);
  vdist = length(vView);

  N = normalize(vNormal);
  L = normalize(vLight);
  V = normalize(vView);

  if (mode < 1.0){ // *0*

    //opacity = 0.7;
    I = hsv2rgb(vec3(0.5+0.05*(0.5-snoise(vec2(1.0,vdist))),0.8,0.36));
    opacity = 0.7+(0.5-snoise(vec2(itt,vdist/10.0)/10.0))*0.2;

  }
  else if (mode < 2.0){ // *1* // render height difference map
    I = diffmap(vPosition.z);
  }
  else if (mode < 3.0){ // *2* // render depth difference map
    I = diffmap(vdist);
  }

  gl_FragColor = vec4(
    I,
    opacity
  );
}
