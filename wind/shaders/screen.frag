#extension GL_OES_standard_derivatives: enable

uniform vec2 window;
uniform float pixelRatio;

uniform sampler2D screenTexture;
uniform sampler2D normalTexture;
uniform sampler2D depthTexture;

const float kerSize = 10.0;

vec3 post(vec3 I){

  float cont = 1.4;
  float bright = 0.01;

  // brightness
  I += bright;

  // contrast
  I = (I - 0.5) * max(0.0, cont) + 0.5;

  //
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

vec4 DIFF(vec2 here, sampler2D tex, sampler2D fieldTex){

  vec2 xy = here;
  vec3 nrm = texture2D(fieldTex, xy).xyz;
  vec3 t = texture2D(tex, xy).xyz;
  return vec4(nrm*t, 1.0);
}



void main(){

  vec3 I;
  vec4 rgba;
  vec2 here = gl_FragCoord.xy/window/pixelRatio;

  if (here.x<0.5){
    I = texture2D(screenTexture, here).xyz;
  }else{
    //rgba = LIC(here, screenTexture, depthTexture, -0.001);
    rgba = DIFF(here,  screenTexture, normalTexture);
    //I = post(rgba.rgb);
    I = rgba.rgb;
  }

  gl_FragColor = vec4(
    I,
    1.0
  );
}

