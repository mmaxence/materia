export const explorationShader = `
mat2 turn(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
float glyph(vec2 p){return ink(p)*step(0.,p.x)*step(p.x,1.)*step(0.,p.y)*step(p.y,1.);}
vec4 study(vec2 p,float strength){
 vec2 px=1./size,aspect=vec2(size.x/size.y,1.);vec2 delta=(p-pointer)*aspect;
 float radius=length(delta),k=clamp(strength,0.,1.35),s=clamp(detail,1.,24.);
 float original=glyph(p),a=original;vec3 c=color;vec2 q=p;
 if(mode<17.5){
  vec2 bend=delta/aspect*exp(-radius*3.)*k*.42;
  vec3 rgb=vec3(glyph(p-bend*.75),glyph(p-bend),glyph(p-bend*1.3));
  a=max(rgb.r,max(rgb.g,rgb.b));c=rgb/max(a,.001);
 }else if(mode<18.5){
  float slat=mod(floor(p.x*size.x/(2.+s*.45)),2.)*2.-1.;
  q.x+=slat*k*(.008+abs(pointer.x-.5)*.035);
  a=glyph(q);c*=1.-k*.23*(slat*.5+.5);
 }else if(mode<19.5){
  float freq=12.+s*1.2;vec2 wave=vec2(cos(p.y*freq+time*1.3)+sin((p.x+p.y)*freq*.7-time),sin(p.x*freq-time*.9));
  q+=wave*px*12.*k;a=glyph(q);
  float caustic=pow(.5+.5*sin(wave.x*3.+wave.y*2.),7.);
  c=mix(color,vec3(.39,.84,.96)+caustic*.6,min(1.,k*.9));
 }else if(mode<20.5){
  float d=sd(p);float halo=0.;vec3 sum=color*original;
  for(int i=1;i<=6;i++){float f=float(i);float ring=exp(-abs(d-f*(1.+s*.12)*k)*1.5)*k*(1.-f*.11)*smoothstep(-.5,1.,d);halo+=ring;sum+=palette(f*.13-time*.04)*ring;}
  a=original+halo;c=sum/max(a,.001);
 }else if(mode<21.5){
  float sectors=4.+floor(s*.3);float angle=atan(delta.y,delta.x),sector=6.28318/sectors;
  angle=abs(mod(angle+sector*.5,sector)-sector*.5);
  vec2 folded=vec2(cos(angle),sin(angle))*radius;
  q=pointer+mix(delta,turn(time*.12)*folded,min(1.,k))/aspect;a=glyph(q);
  c=mix(color,palette(radius*2.+time*.03),min(.65,k*.6));
 }else if(mode<22.5){
  float depth=(.3+.7*(1.-smoothstep(-5.,1.,sd(p))))*k;vec2 parallax=vec2(1.+(pointer.x-.5)*2.,(pointer.y-.5))*px*(4.+s)*depth;
  vec3 rgb=vec3(glyph(p-parallax),glyph(p+parallax),glyph(p+parallax));a=max(rgb.r,rgb.g);c=rgb/max(a,.001);
 }else if(mode<23.5){
  float angle=k*(1.2+s*.09)*exp(-radius*1.6);q=pointer+turn(angle)*delta/aspect;a=glyph(q);
 }else if(mode<24.5){
  float f=10.+s*1.7;float fold=sin((p.x-pointer.x)*f);
  q.x+=fold*k*.035;q.y+=(.5+.5*cos((p.x-pointer.x)*f))*k*.03;
  a=glyph(q);c*=1.-k*.22*(.5+.5*cos((p.x-pointer.x)*f));
 }else if(mode<25.5){
  vec2 grid=p*size/(18.+s*2.);vec2 cell=floor(grid),local=fract(grid);float first=100.,second=100.;vec2 winner=vec2(0.);
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 o=vec2(float(x),float(y));vec2 id=cell+o;vec2 seed=vec2(hash(id),hash(id+17.));vec2 v=o+seed-local;float d=dot(v,v);if(d<first){second=first;first=d;winner=id;}else if(d<second)second=d;}
  vec2 drift=vec2(hash(winner+3.),hash(winner+27.))-.5;q+=drift*k*.08;
  a=glyph(q)*(1.-k*(1.-smoothstep(.01,.09,second-first))*.85);c*=.7+.3*hash(winner);
 }else if(mode<26.5){
  float warp=1.+k*.8/(.2+radius*3.);q=pointer+delta*warp/aspect;
  a=glyph(q);c=mix(color,vec3(.86,.59,.96),k*.35);
 }else if(mode<27.5){
  float height=7.+s;float y=p.y*size.y;float id=floor(y/height),local=fract(y/height)-.5;
  float fold=k*(.35+.3*sin(id*.7+time*1.2));float scale=max(.25,1.-fold);
  q.y=(id+.5+local/scale)*height/size.y;q.x+=fold*.026*sin(id);
  a=glyph(q)*step(abs(local),scale*.5);c*=1.-fold*.55;
 }else if(mode<28.5){
  vec2 grid=p*vec2(14.,6.)*(.5+s*.06),id=floor(grid),f=fract(grid);f=f*f*(3.-2.*f);
  vec2 a0=vec2(hash(id),hash(id+21.)),a1=vec2(hash(id+vec2(1,0)),hash(id+vec2(1,0)+21.));
  vec2 b0=vec2(hash(id+vec2(0,1)),hash(id+vec2(0,1)+21.)),b1=vec2(hash(id+1.),hash(id+22.));
  q+=(mix(mix(a0,a1,f.x),mix(b0,b1,f.x),f.y)-.5)*k*.08+velocity*k*.06;a=glyph(q);
 }else if(mode<29.5){
  float n=noise(p*size/(2.+s*.35));float eaten=sd(p)+k*(pow(n,2.)*20.+1.);
  a=1.-smoothstep(-.7,.7,eaten);float hot=exp(-abs(eaten)*1.2)*k;
  c=mix(color,vec3(1.,.37,.08),min(1.,hot));
 }else if(mode<30.5){
  vec2 grid=floor(p*size/(4.+s*.4));float growth=(3.+hash(grid)*19.)*k;
  float d=sd(p);a=1.-smoothstep(-.6,.6,d-min(27.,growth));
  c=mix(color,vec3(.55,.9,.83)*(.6+.4*hash(grid+8.)),min(1.,k));
 }else if(mode<31.5){
  float d=sd(p),growth=min(26.,k*(7.+s*.6));a=1.-smoothstep(-.6,.6,d-growth);
  float rim=exp(-abs(d-growth)*.7);c=mix(color,vec3(.36,.78,.87)+rim*.3,min(1.,k));
 }else if(mode<32.5){
  q+=delta/aspect*k*.15;float cell=3.+s*.3;vec2 g=q*size/cell;
  float horizontal=1.-smoothstep(.12,.28,abs(fract(g.y)-.5));float vertical=1.-smoothstep(.12,.28,abs(fract(g.x)-.5));
  float checker=mod(floor(g.x)+floor(g.y),2.);float weave=max(horizontal*(.55+.45*checker),vertical*(1.-checker*.45));
  a=glyph(q)*mix(1.,weave,min(1.,k*1.5));c=mix(color,vec3(.86,.67,.42),k*.6);
 }else if(mode<33.5){
  float width=2.+s*.45;float col=floor(p.x*size.x/width);q.x=(col+.5)*width/size.x;
  float bar=step(hash(vec2(col,2.))*.6+.15,fract(p.x*size.x/width));
  q.y+=k*(hash(vec2(col,7.))-.5)*.12;a=mix(original,glyph(q)*bar,min(1.,k*1.4));
 }else if(mode<34.5){
  float band=floor(p.y*size.y/(2.+s*.3));float drift=(hash(vec2(band,floor(time*5.)))-.5)*k*.10;
  q.x+=drift+velocity.x*k*.08;vec3 rgb=vec3(glyph(q+px*vec2(k*6.,0)),glyph(q),glyph(q-px*vec2(k*6.,0)));
  a=max(rgb.r,max(rgb.g,rgb.b));c=rgb/max(a,.001);c*=1.-k*.25*mod(band,2.);
 }else if(mode<35.5){
  vec2 cell=floor(p*size/vec2(12.+s*2.,6.+s));float seed=hash(cell);
  q+=vec2(floor((seed-.5)*8.)*.026,0.)*k;
  q=mix(q,(floor(q*size/4.)+.5)*4./size,min(1.,k));a=glyph(q);c=mix(color,palette(seed*.6),k*.5);
 }else if(mode<36.5){
  float angle=atan(delta.y,delta.x);float sweep=fract(angle/6.28318-time*.16);
  float gate=.12+.88*smoothstep(.15,.75,sweep);float rings=.65+.35*sin(radius*(60.+s*4.));
  q=pointer+delta*(1.+k*.12*sin(angle*6.+time))/aspect;
  a=glyph(q)*mix(1.,gate*rings,min(1.,k));c=mix(color,vec3(.42,1.,.67),min(1.,k));
 }else if(mode<37.5){
  vec3 sum=color*original;float total=original;
  for(int i=1;i<=7;i++){float f=float(i);float zoom=1.+f*k*(.025+s*.002);float ghost=glyph(pointer+(p-pointer)*zoom)*k*(1.-f*.105)*.6;sum+=palette(f*.12)*ghost;total+=ghost;}
  a=total;c=sum/max(total,.001);
 }else{
  vec2 offset=vec2(cos(time*.7),sin(time*.5))*px*(2.+s)*k;
  float difference=abs(glyph(p-offset)-glyph(p+offset));a=mix(original,difference,min(1.,k));
  c=mix(color,vec3(.72,.56,1.),min(1.,k));
 }
 // Effects return exactly to native-mask appearance at rest.
 if(k<.001)return vec4(color,original);
 return vec4(c,clamp(a,0.,1.));
}
`;
