#extension GL_OES_standard_derivatives: enable

uniform vec2 window;
uniform float pixelRatio;

uniform sampler2D screenTexture;
uniform sampler2D normalTexture;
uniform sampler2D depthTexture;

const float kerSize = 10.0;

vec3 post(vec3 I){

  float cont = 1.6;
  float bright = 0.1;

  I += bright;
  I = (I - 0.5) * max(0.0, cont) + 0.5;
  //I = pow(I,vec3(1.2));

  return  I;
}

vec4 LIC(vec2 here, sampler2D tex, sampler2D fieldTex, float mult){

  vec2 hd;

  vec2 xy = here;
  //float eps = 0.0001;
  vec4 p = vec4(0.0, 0.0, 0.0, 0.0);

  for (float flip=-1.0;flip<2.0;flip+=2.0){
    for (float i=0.0;i<kerSize;i++){
      p += texture2D(tex, xy);
      //p += naiveReflect(xy, tex);
      hd = texture2D(fieldTex, xy).xy;
      xy = xy + flip*(hd.xy-0.5)/0.5*mult*pixelRatio;
    }
    xy = here;
  }

  return p/(2.0*kerSize);
}

vec4 DIFF(vec2 here, sampler2D tex, sampler2D fieldTex, float bw){

  vec2 xy = here;
  //vec3 t = texture2D(tex, xy).xyz;
  float fw = fwidth(bw);
  //float rad = length(here - vec2(0.5));
  return vec4(vec3(fw), 1.0);
  //return vec4(t+fw*texture2D(fieldTex, xy).a, 1.0);
}

float BW(vec2 here, sampler2D tex){
  vec2 xy = here;
  vec3 rgb = texture2D(tex, xy).xyz;
  return rgb.r*0.2989 + rgb.g*0.5870 + rgb.b*0.1140;
}



void main(){

  vec3 I;
  vec4 rgba;
  vec4 lic;
  vec4 diff;
  vec2 here = gl_FragCoord.xy/window/pixelRatio;

  if (here.x<0.0){
    I = texture2D(screenTexture, here).xyz;
  }else{
    lic = LIC(here, screenTexture, depthTexture, -0.001);
    float bw = BW(here, screenTexture);
    diff = DIFF(here,  screenTexture, normalTexture, bw);
    diff = diff - (1.0-step(0.3, diff))*diff;
    I = post(lic.rgb - 2.0*diff.rgb);
  }

  gl_FragColor = vec4(
    I,
    1.0
  );
}

