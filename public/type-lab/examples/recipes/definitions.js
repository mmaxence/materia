// Application recipe choices, not new library exports or effect aliases.
const lens=async()=> (await import('@materia/text/optics/chromaticLens')).chromaticLens;
const dither=async()=> (await import('@materia/text/signal/dither')).dither;
export const recipes=Object.freeze({
 launch:{title:'Launch headline',load:lens,strength:.35,scale:12,auto:false},
 editorial:{title:'Editorial emphasis',load:lens,strength:.14,scale:16,auto:false},
 navigation:{title:'Navigation / CTA feedback',load:lens,strength:.22,scale:12,auto:false},
 status:{title:'Readable status change',load:lens,strength:.12,scale:16,auto:false},
 data:{title:'Data highlight',load:dither,strength:.16,scale:14,auto:false},
 poster:{title:'Kinetic poster',async load(){const [{stack},{vortex},{rgbSplit}]=await Promise.all([import('@materia/text/stack'),import('@materia/text/geometry/vortex'),import('@materia/text/signal/rgbSplit')]);return stack([{effect:vortex,strength:.35,scale:12},{effect:rgbSplit,strength:.16,scale:14}]);},strength:.4,scale:12,auto:true},
 localized:{title:'Localized long text',load:lens,strength:.12,scale:16,auto:false},
 spatial:{title:'Text within flat spatial panels',load:lens,strength:.18,scale:14,auto:false},
});
