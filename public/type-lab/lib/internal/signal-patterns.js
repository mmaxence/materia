// A stable screen-space grid: strength blends the result, never resizes cells.
export const pixelBody = `
 float cell=max(2.,finishScale*1.4);
 vec2 center=(floor(p*size/cell)+.5)*cell/size, offset=vec2(cell*.25)/size;
 vec4 block=(study(center+offset,power)+study(center-offset,power)+study(center+vec2(offset.x,-offset.y),power)+study(center+vec2(-offset.x,offset.y),power))*.25;
 block.a=smoothstep(.08,.72,block.a);
 return mix(study(p,power),block,smoothstep(0.,1.,k));`;
export const ditherBody = `
 float dotSize=max(1.,finishScale*.24);
 vec2 center=(floor(p*size/dotSize)+.5)*dotSize/size, offset=vec2(dotSize*.3)/size;
 vec4 result=study(center,power);
 float coverage=(study(center+offset,power).a+study(center-offset,power).a+study(center+vec2(offset.x,-offset.y),power).a+study(center+vec2(-offset.x,offset.y),power).a)*.25;
 vec2 cell=mod(floor(p*size/dotSize),4.);float t;
 if(cell.y<1.)t=cell.x<1.?0.:cell.x<2.?8.:cell.x<3.?2.:10.;
 else if(cell.y<2.)t=cell.x<1.?12.:cell.x<2.?4.:cell.x<3.?14.:6.;
 else if(cell.y<3.)t=cell.x<1.?3.:cell.x<2.?11.:cell.x<3.?1.:9.;
 else t=cell.x<1.?15.:cell.x<2.?7.:cell.x<3.?13.:5.;
 float tone=coverage*(.6+.25*dot(result.rgb,vec3(.2126,.7152,.0722)));
 result.a=step((t+.5)/16.,tone);
 return mix(study(p,power),result,smoothstep(0.,1.,k));`;
