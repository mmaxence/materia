// Shader sources are independent of renderer resource ownership.
export const vertex = `attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;
export const fragment = `precision highp float;
varying vec2 uv; uniform sampler2D mask; uniform vec2 size, pointer, velocity; uniform float time, energy, intensity, mode, detail; uniform vec3 color; uniform vec3 traces[8];
float ink(vec2 p){return texture2D(mask,clamp(p,0.,1.)).a;}
float sd(vec2 p){return (texture2D(mask,clamp(p,0.,1.)).r-.5)*64.;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
vec3 palette(float t){return .55+.45*cos(6.28318*(t+vec3(0.,.33,.67)));}
void main(){
 vec2 px=1./size, aspect=vec2(size.x/size.y,1.);vec2 delta=(uv-pointer)*aspect;float r=length(delta);
 float field=exp(-r*r*6.)*energy;
 for(int i=0;i<8;i++){vec2 d=(uv-traces[i].xy)*aspect;field=max(field,exp(-dot(d,d)*38.)*traces[i].z*.8);}
 float power=clamp(field*intensity,0.,1.6);float d=sd(uv);float a=ink(uv);vec3 c=color;
 if(mode<.5){
  float n=noise(uv*size*.035+vec2(time*.13,0.));
  float veins=pow(.5+.5*sin(uv.y*size.y*.20+noise(uv*size*.018)*19.),7.);
  float growth=min(27.,(n*7.+veins*18.)*power);
  float edge=1.-smoothstep(-.6,1.,d-growth);
  a=max(a,edge*(.38+.62*veins));
  c=mix(color,vec3(.35,.16,.08),smoothstep(0.,12.,d)*.45);
 }else if(mode<1.5){
  vec2 q=uv+delta*sin(r*30.-time*5.)*power*.025;
  float dist=sd(q);float bands=sin(dist*1.4-r*18.+time*2.);
  c=mix(color,palette(dist*.035+r*.3-time*.08),min(1.,power));a=ink(q);
  float halo=exp(-abs(dist-3.-sin(time)*2.)*.55)*power*.35;
  a=max(a,halo*(.6+.4*bands));
 }else if(mode<2.5){
  vec2 q=uv-velocity*power*.16;
  q-=delta*sin(r*23.-time*7.)*power*.10;
  a=ink(q);float ghost=ink(q+velocity*power*.06);a=max(a,ghost*power*.12);
 }else if(mode<3.5){
  float angle=atan(delta.y,delta.x);float spikes=pow(.5+.5*cos(angle*27.+noise(uv*12.)*5.),6.);
  float dist=d-min(27.,(4.+spikes*21.)*power*exp(-abs(d)*.025));
  a=1.-smoothstep(-.8,.8,dist);
  vec2 grad=vec2(sd(uv+vec2(px.x,0.))-sd(uv-vec2(px.x,0.)),sd(uv+vec2(0.,px.y))-sd(uv-vec2(0.,px.y)));
  vec3 normal=normalize(vec3(grad*.7,1.));float light=pow(max(0.,dot(normal,normalize(vec3(delta*2.,1.)))),5.);
  c=mix(color,vec3(.72,.85,.76),light*min(1.,power));
 }else if(mode<4.5){
  float wave=sin(d*.72-time*2.5+noise(uv*7.)*2.);
  float rings=pow(.5+.5*wave,12.)*exp(-max(0.,d)*.065);
  a=max(ink(uv)*(1.-min(.82,power*.7)),rings*power*smoothstep(-4.,1.,d)*(1.-smoothstep(22.,31.,d)));
  c=mix(color,vec3(.9,.40,.14),smoothstep(0.,26.,d));
 }else if(mode<5.5){
  vec2 q=uv+vec2(sin(uv.y*45.+time*3.),cos(uv.x*32.-time*2.))*power*.008;
  float dist=sd(q);float heat=clamp(power*.75+noise(uv*7.+time*.15)*.2,0.,1.);
  vec3 thermal=mix(vec3(.19,.12,.56),vec3(.98,.24,.13),smoothstep(.1,.65,heat));thermal=mix(thermal,vec3(1.,.92,.42),smoothstep(.6,1.,heat));
  c=mix(color,thermal,min(1.,power*2.));a=max(ink(q),exp(-abs(dist)*.22)*power*.3);
 }else if(mode<6.5){
  vec2 cell=floor(uv*size/9.);float seed=hash(cell);vec2 center=(cell+.5)*9./size;
  vec2 direction=normalize((center-pointer)*aspect+vec2(.001));
  vec2 source=center-direction/aspect*power*(.025+seed*.095);
  float dotshape=1.-smoothstep(1.2,3.7,length((uv-center)*size));
  float particles=ink(source)*dotshape;
  a=mix(ink(uv),particles,min(1.,power*1.8));c=mix(color,palette(seed*.3+time*.04),min(.65,power*.6));
 }else if(mode<7.5){
  a=ink(uv);vec3 sum=color*a;
  for(int i=1;i<=6;i++){float f=float(i)/6.;vec2 offset=(velocity*.28+vec2(sin(time*2.+f*3.)*.035,cos(time+f*3.)*.025))*power*f;float echo=ink(uv-offset)*power*(1.-f*.65)*.45;vec3 tint=palette(f*.55+time*.06);sum+=tint*echo;a+=echo;}
  c=sum/max(a,.001);a=min(a,1.);
 }
 if(mode>7.5 && mode<12.5){
  // Solids-inspired rounded glyph surface: a height-field bevel, not extrusion.
  vec2 stepUV=px*1.5;
  vec2 grad=vec2(sd(uv+vec2(stepUV.x,0.))-sd(uv-vec2(stepUV.x,0.)),sd(uv+vec2(0.,stepUV.y))-sd(uv-vec2(0.,stepUV.y)))/3.;
  float bevel=exp(-abs(d)*.17);
  vec3 n=normalize(vec3(grad*bevel*2.5,1.));
  vec3 light=normalize(vec3((pointer-.5)*3.+vec2(-.55,.85),.9));
  vec3 view=normalize(vec3((pointer-.5)*.8,1.));
  float diff=max(dot(n,light),0.);float fres=pow(1.-max(dot(n,view),0.),3.);
  float spec=pow(max(dot(reflect(-light,n),view),0.),48.);
  vec3 reflection=reflect(-view,n);float up=clamp(reflection.y*.5+.5,0.,1.);
  float stripe=smoothstep(.3,.36,up)*(1.-smoothstep(.5,.56,up));
  vec3 metal=vec3(.70,.82,.93)*(mix(vec3(.1,.11,.14),vec3(.85,.9,1.),up)+stripe*.35)+spec+fres*.3;
  a=ink(uv);
  if(mode<8.5){
   c=vec3(.35,.78,.86)*(.26+.6*diff)+vec3(.35,.78,.86)*fres*1.1+vec3(spec*.9+fres*.22);
   a*=clamp(.42+.4*fres+.3*spec+bevel*.23,0.,1.);
   c+=vec3(.18,.35,.5)*sin(d*.45+pointer.x*4.)*.15;
  }else if(mode<9.5){c=min(metal,1.);}
  else if(mode<10.5){
   float angle=.52;mat2 rot=mat2(cos(angle),sin(angle),-sin(angle),cos(angle));
   float cellSize=5.5;vec2 g=rot*(uv*size)/cellSize;vec2 cell=floor(g)+.5;
   vec2 center=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*cell*cellSize/size;
   float coverage=ink(center);float lighting=.45+.55*diff;
   a=clamp((sqrt(coverage*lighting)*.62-length(g-cell))*cellSize+.5,0.,1.)*step(.01,coverage);
   c=vec3(.85,.92,.77);
  }else if(mode<11.5){
   vec2 b=mod(floor(uv*size/2.),4.);float threshold=0.;
   // Ordered 4x4 Bayer thresholds, as in Solids' postprocess pipeline.
   if(b.y<1.)threshold=b.x<1.?0.:b.x<2.?8.:b.x<3.?2.:10.;
   else if(b.y<2.)threshold=b.x<1.?12.:b.x<2.?4.:b.x<3.?14.:6.;
   else if(b.y<3.)threshold=b.x<1.?3.:b.x<2.?11.:b.x<3.?1.:9.;
   else threshold=b.x<1.?15.:b.x<2.?7.:b.x<3.?13.:5.;
   float luminance=dot(metal,vec3(.2126,.7152,.0722));
   c=mix(vec3(.16,.21,.30),vec3(.93,.72,.46),step((threshold+.5)/16.,luminance));
  }else{
   float angle=(pointer.x-.5)*3.14;vec2 direction=vec2(cos(angle),sin(angle));
   float reach=28.+power*60.;float beam=0.,total=0.;
   for(int i=-16;i<=16;i++){float f=float(i)/16.;float w=pow(1.-abs(f),2.);beam+=ink(uv+direction*px*reach*f)*w;total+=w;}
   beam/=total;c=vec3(.55,.76,1.);a=max(a,beam*(.65+power*.5));c=mix(c,vec3(1.),ink(uv)*.8);
  }
 }
 if(mode>12.5 && mode<16.5){
  vec2 q=uv;float strength=clamp(power,0.,1.);float block=max(1.,detail);
  bool pixelated=(mode>13.5 && mode<14.5)||mode>15.5;
  bool split=mode<13.5||mode>15.5;
  bool dithered=(mode>14.5 && mode<15.5)||mode>15.5;
  if(pixelated){float cell=mix(1.,block,strength);q=(floor(uv*size/cell)+.5)*cell/size;}
  a=ink(q);c=vec3(.94,.95,1.);
  if(split){
   float offset=detail*strength*(1.+power*.8);
   vec2 direction=normalize(vec2(1.,(pointer.y-.5)*1.4));vec2 shift=direction*px*offset;
   vec3 channels=vec3(ink(q+shift),ink(q),ink(q-shift));
   a=max(channels.r,max(channels.g,channels.b));c=channels/max(a,.001);
  }
  if(dithered){
   float cell=max(1.,detail*.25);vec2 b=mod(floor(uv*size/cell),4.);float threshold=0.;
   if(b.y<1.)threshold=b.x<1.?0.:b.x<2.?8.:b.x<3.?2.:10.;
   else if(b.y<2.)threshold=b.x<1.?12.:b.x<2.?4.:b.x<3.?14.:6.;
   else if(b.y<3.)threshold=b.x<1.?3.:b.x<2.?11.:b.x<3.?1.:9.;
   else threshold=b.x<1.?15.:b.x<2.?7.:b.x<3.?13.:5.;
   float fade=.22+.65*smoothstep(0.,1.,uv.x)+power*.18;
   float coverage=a*mix(1.,fade,strength);
   float screened=step((threshold+.5)/16.,coverage)*step(.001,a);
   a=mix(a,screened,smoothstep(0.,.15,strength));
  }
  if(strength<.001){a=ink(uv);c=vec3(.94,.95,1.);}
 }
 if(mode<7.5 && energy==0. && field<.001){a=ink(uv);c=color;}
 gl_FragColor=vec4(c,clamp(a,0.,1.));
}`;
