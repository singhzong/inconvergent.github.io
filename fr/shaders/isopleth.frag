uniform float size;
uniform float hsize;
uniform sampler2D heights;
uniform float texSize;
uniform vec3 light;

uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying vec3 vPosition;
varying vec3 vCamera;
varying vec2 texCoord;
varying vec3 vColor;
varying vec3 vNormal;


float levels(float f, float l){
  return (ceil(f*l)/l);
}

float rand(vec2 co){
  return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453);
}

float getRdV(float LndNn, vec3 Nn, vec3 Ln, vec3 Vn){
  vec3 R;
  vec3 Rn;
  if (LndNn>0.0){
    R = clamp(2.0*LndNn*Nn-Ln,0.0,1.0);
    Rn = normalize(R);
    //return clamp(levels(dot(Rn,Vn),100.0),0.0,1.0);
    return clamp(dot(Rn,Vn),0.0,1.0);
  }
  else{
    return 0.0;
  }
}

vec3 getNormal(sampler2D heights, vec2 texCoord){
  vec3 s = vec3(size,size,hsize);
  vec3 off = vec3(-1.0/texSize,0.0,1.0/texSize);
  vec3 rl = texture2D(heights,texCoord+off.zy).xyz-
    texture2D(heights,texCoord+off.xy).xyz;
  vec3 tb = texture2D(heights,texCoord+off.yz).xyz-
      texture2D(heights,texCoord+off.yx).xyz;
  vec3 norm = normalize(cross(rl/s,tb/s));
  return norm;
}

vec3 effect(vec3 I, vec3 Nn, vec3 Ln, vec3 Vn){
  vec3 index = vec3(2.0,0.5,0.0)/50.0;
  vec3 ref = clamp(abs(refract(Vn,Nn,1.0)),0.0,1.0);
  vec3 x = I*ref*index*5.0;
  return clamp(I-x,0.0,1.0);
}


vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

// ASHIMA
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

vec3 applyFog(vec3 I, vec3 V){

  float Vdist = length(V);

  if (Vdist>fogFar){
    return fogColor;
  }
  if (Vdist>fogNear){
    float fogRange = fogFar-fogNear;
    float d = fogFar-Vdist;
    float dens = sqrt(d/fogRange);
    return I*dens+(1.0-dens)*(fogColor);
  }
  return I;
}


void main(){

  vec3 h = texture2D(heights,texCoord).xyz;

  vec3 c = vColor*(1.0-h.z) + (h.z);

  // ambient
  const vec3 ia = vec3(0.00);
  vec3 ka = c;

  // diffuse
  const vec3 id = vec3(0.7);
  vec3 kd = c;

  // specular
  const vec3 is = vec3(0.1);
  vec3 ks = c;
  float shiny = 30.0;

  // attenuation
  float iatt = size*9400.0;
  float atta = 0.23;
  float attb = 0.2;
  float attc = 0.0;

  vec3 Nn = getNormal(heights,texCoord);
  vec3 L = light-vPosition;
  vec3 Ln = normalize(L);
  vec3 V = vCamera-vPosition;
  vec3 Vn = normalize(V);

  float Ldist = length(L);

  float att = iatt/(atta*pow(Ldist,2.0)+attb*Ldist+attc);
  float LndNn = dot(Ln,Nn);
  float RndVn = getRdV(LndNn,Nn,Ln,Vn);

  float rnd = (0.5-snoise(vPosition.xy))*0.2;

  vec3 D = clamp(levels(LndNn+rnd,5.0),0.0,1.0)*kd*id;
  vec3 A = ka*ia;
  vec3 S = pow(RndVn,shiny)*ks*is;
  vec3 I = A+att*(D+S);
  I = effect(I,Nn,Ln,Vn);
  I = applyFog(I*I,V);

  gl_FragColor = vec4(
    I,
    1.0
  );
}
