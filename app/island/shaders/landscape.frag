#extension GL_OES_standard_derivatives: enable

uniform float itt;
uniform float mode;
uniform vec2 window;
uniform float pixelRatio;
uniform vec2 mouse;

varying vec3 vColor;
varying vec3 vPosition;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLight;

uniform sampler2D bgTexture;


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

//float levels(float a, float l){
  //return floor(l*a)/l;
//}

//float bandedLevels(float a, float l){
  //float high = floor(l*a);
  //return mod(high,2.0)*high/l;
//}

vec3 effect(vec3 I, vec3 N, vec3 L, vec3 V){
  vec3 ind = vec3(2.5,2.5,2.0)/50.0;
  vec3 ref = clamp(abs(refract(V,N,1.0)),0.0,1.0);
  vec3 x = I*ref*ind*3.0;
  return clamp(I-x,0.0,1.0);
}

vec3 fog(float vdist, vec3 I, vec3 V, vec3 L, vec3 N, float h){

  vec3 fogColor = vec3(1.0);
  float b = 0.000004;

  //float fogFar = 70000.0;
  //float fogNear = 10000.0;
  //if (vdist>fogFar){
    //return fogColor;
  //}
  //float dens = sqrt(clamp((fogFar-vdist)/(fogFar-fogNear),
                    //0.0,1.0));

  float dens = 1.0-exp(-(vdist*b));
  float VdL = max(dot(V,N),0.0);
  vec3 fc = mix(fogColor,
                vec3(0.8,0.85,0.85),
                1.0-pow(VdL,0.4));
  return mix(I,fc,dens);
}

float getRdV(float lndn, vec3 n, vec3 ln, vec3 vn){
  vec3 r;
  vec3 rn;
  if (lndn>0.0){
    r = clamp(2.0*lndn*n-ln,0.0,1.0);
    rn = normalize(r);
    return clamp(dot(rn,vn),0.0,1.0);
  }
  else{
    return 0.0;
  }
}

vec3 phong(float vdist, float ldist, vec3 c, vec3 v, vec3 l, vec3 n){

  //// ambient
  const vec3 ia = vec3(0.04);
  vec3 ka = c;

  //// diffuse
  const vec3 id = vec3(0.8);
  vec3 kd = c;

  //// specular
  const vec3 is = vec3(0.1);
  vec3 ks = c;
  float shiny = 1.0;

  float ldn = dot(l,n);
  float rdv = getRdV(ldn,n,l,v);

  vec3 D = clamp(ldn,0.0,1.0)*kd*id;
  vec3 A = ka*ia;
  vec3 S = pow(rdv,shiny)*ks*is;

  vec3 I = A+D+S;

  return I;
}

vec3 banding(vec3 I, vec3 c, float d){
  float rnd = snoise(vec2(d, 1.0));
  if (mod(floor(d/2.0 + rnd),4.0)<0.001){
    return c;
  }
  return I;
}

float opacityBanding(float I, float c, float d){
  float rnd = snoise(vec2(d, 1.0));
  if (mod(floor(d/2.0 + rnd),4.0)<0.001){
    return c;
  }
  return I;
}

vec3 diffmap(float a){
  float fw = fwidth(a);
  return vec3(0.5 + 0.5*dFdx(a)/fw,0.5 + 0.5*dFdy(a)/fw,fw);
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

    C = vec3(0.7);
    I = phong(vdist,ldist,C,V,L,N);
    I = banding(I, I*0.3, vdist);
    I = fog(vdist,I,V,L,N,vPosition.z);

    //I = 0.5 + 0.5*L;

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
