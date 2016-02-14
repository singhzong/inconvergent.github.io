#extension GL_OES_standard_derivatives: enable

uniform vec2 window;
uniform float pixelRatio;

uniform sampler2D screenTexture;
uniform sampler2D normalTexture;
uniform sampler2D depthTexture;

const float kerSize = 11.0;

vec3 post(vec3 I){

  float cont = 1.6;
  float bright = 0.1;

  I += bright;
  I = (I - 0.5) * max(0.0, cont) + 0.5;
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
      hd = texture2D(fieldTex, xy).xy;
      xy = xy + flip*(hd.xy-0.5)/0.5*mult*pixelRatio;
    }
    xy = here;
  }

  return p/(2.0*kerSize);
}

float BW(vec2 here, sampler2D tex){
  vec3 stp = vec3(1.0,-1.0,0.0)/max(window.x,window.y)/pixelRatio;
  vec2 xy = here;
  vec3 rgb = (texture2D(tex, xy).xyz +
             texture2D(tex, xy+stp.xz).xyz +
             texture2D(tex, xy+stp.yz).xyz +
             texture2D(tex, xy+stp.zx).xyz +
             texture2D(tex, xy+stp.zy).xyz)/5.0;
  return rgb.r*0.2989 + rgb.g*0.5870 + rgb.b*0.1140;
}

vec4 DIFF(vec2 here, sampler2D tex, sampler2D fieldTex){


  vec2 xy = here;
  float bw = BW(here, tex);
  float fw = fwidth(bw);
  //float rad = length(here - vec2(0.5));
  return vec4(vec3(fw), 1.0);
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
    diff = DIFF(here,  screenTexture, normalTexture);
    diff = diff - (1.0-step(0.2, diff))*diff;
    I = post(lic.rgb - 2.0*diff.rgb);
  }

  gl_FragColor = vec4(
    I,
    1.0
  );
}

