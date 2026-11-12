import {createTextEffect} from '@materia/text';
import {recipes} from './definitions.js';
// All functions in this file are application helpers, not Type/Space exports.
/** @param {string} selector */
const need=selector=>{const node=document.querySelector(selector);if(!(node instanceof HTMLElement))throw Error('Missing '+selector);return node;};
const picker=/** @type {HTMLSelectElement} */(need('#recipe'));
const copy=/** @type {HTMLTextAreaElement} */(need('#copy'));
const font=/** @type {HTMLSelectElement} */(need('#font'));
const state=need('#state'),pause=need('#pause'),native=need('#native');
const signal=/** @type {HTMLInputElement} */(need('#signal'));
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
/** @type {{dispose:()=>void,select:(id:string)=>void,snapshot:()=>object}|undefined} */
let app;
export function mountRecipes(){
 if(app)return app;
 const events=new AbortController();let disposed=false,generation=0,nativeChoice=false,frozen=false,selected='launch',loading=false,reason='';
 /** @type {import('@materia/text').TextEffectController|null} */
 let fx=null;
 /** @type {import('@strata-ui/core').SceneController|null} */
 let space=null;
 const panel=()=>need('[data-recipe="'+selected+'"]');
 const target=()=>{const n=panel().querySelector('[data-text]');if(!(n instanceof HTMLElement))throw Error('Missing text');return n;};
 const tooLong=()=>Array.from(target().textContent||'').length>120;
 const teardown=()=>{fx?.destroy();fx=null;space?.destroy();space=null;};
 const paint=()=>{
  for(const id of ['replay','pause','native','remount'])/** @type {HTMLButtonElement} */(need('#'+id)).disabled=disposed;
  pause.textContent=frozen?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(frozen));
  native.textContent=nativeChoice?'Enable decoration':'Use native text';native.setAttribute('aria-pressed',String(nativeChoice));
  state.textContent=disposed?'Recipes disposed. Native source retained.':loading?'Loading selected recipe…':fx?`Mounted ${selected}. Initial renderer ${fx.supported?'available':'unavailable; native text retained'}. ${frozen?'User paused.':''}`:`Native text: ${reason||'decoration off'}.`;
 };
 const mount=async()=>{
  const current=++generation;teardown();loading=false;
  reason=nativeChoice?'explicit static choice':reduced.matches?'reduced motion':tooLong()?'display text exceeds 120 code points':'';
  if(disposed||reason){paint();return;}
  loading=true;paint();
  try{
   const spec=recipes[/** @type {keyof typeof recipes} */(selected)];
   const effect=await spec.load();
   const spatial=selected==='spatial'?await import('@strata-ui/core'):null;
   if(disposed||current!==generation)return;
   if(spatial){const root=panel().querySelector('.scene');if(!(root instanceof HTMLElement))throw Error('Missing panel scene');space=spatial.createScene(root,{compactWidth:1600});}
   const element=target(),host=element.closest('.type-host');if(!(host instanceof HTMLElement))throw Error('Missing text host');
   fx=createTextEffect(element,{effect,host,strength:spec.strength,scale:spec.scale,auto:spec.auto,frozen});
   if(selected==='poster')fx.setLayer(1,{enabled:signal.checked});
   loading=false;paint();
   // Fonts/styles may settle later. Never refresh a replacement or disposed controller.
   const owned=fx;void document.fonts.ready.then(()=>{if(!disposed&&current===generation&&fx===owned)owned.refresh();});
  }catch(error){if(disposed||current!==generation)return;teardown();loading=false;reason='enhancement unavailable; source retained';paint();}
 };
 const select=/** @param {string} id */id=>{
  if(disposed||!(id in recipes))return;
  selected=id;picker.value=id;
  for(const node of document.querySelectorAll('[data-recipe]'))if(node instanceof HTMLElement)node.hidden=node.dataset.recipe!==id;
  copy.value=target().textContent||'';font.value=target().style.fontFamily.replaceAll(' ','')||'system-ui';
  void mount();
 };
 const listen=/** @param {HTMLElement} node @param {string} type @param {()=>void} fn */(node,type,fn)=>node.addEventListener(type,fn,{signal:events.signal});
 listen(picker,'change',()=>select(picker.value));
 listen(copy,'input',()=>{const wasLong=tooLong();target().textContent=copy.value;if(tooLong()!==wasLong)void mount();});
 listen(font,'change',()=>{target().style.fontFamily=font.value;fx?.refresh();});
 listen(pause,'click',()=>{frozen=!frozen;fx?.setFrozen(frozen);paint();});
 listen(native,'click',()=>{nativeChoice=!nativeChoice;void mount();});
 listen(need('#remount'),'click',()=>void mount());
 listen(need('#replay'),'click',()=>fx?.pulse());
 listen(signal,'change',()=>{if(selected==='poster')fx?.setLayer(1,{enabled:signal.checked});});
 for(const control of document.querySelectorAll('[data-action]'))if(control instanceof HTMLElement)listen(control,'click',()=>{
  const p=control.closest('[data-recipe]');if(!(p instanceof HTMLElement))return;
  const text=p.querySelector('[data-text]'),result=p.querySelector('[data-result]');
  if(p.dataset.recipe==='launch'&&result)result.textContent='Preview selected locally';
  if(p.dataset.recipe==='navigation'){if(result)result.textContent='Guide opened';const details=p.querySelector('details');if(details)details.open=true;}
  if(p.dataset.recipe==='status'&&text)text.textContent='Changes saved';
  if(p.dataset.recipe==='data'&&text)text.textContent=Math.min(99,(parseInt(text.textContent||'42',10)||42)+7)+'%';
  if(p.dataset.recipe==='spatial')space?.focus('notes');
  if(p.dataset.recipe===selected){copy.value=target().textContent||'';fx?.pulse();}
 });
 reduced.addEventListener('change',()=>void mount(),{signal:events.signal});
 document.fonts.addEventListener('loadingdone',()=>fx?.refresh(),{signal:events.signal});
 const dispose=()=>{if(disposed)return;disposed=true;++generation;events.abort();teardown();loading=false;paint();for(const node of document.querySelectorAll('[data-recipe]'))if(node instanceof HTMLElement)node.hidden=false;app=undefined;};
 window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{signal:events.signal});
 app={dispose,select,snapshot:()=>({selected,loading,reason,nativeChoice,frozen,supported:fx?.supported??null,space:space?.state??null,generation})};
 const initial=location.hash.slice(1);select(initial in recipes?initial:'launch');return app;
}
export const disposeRecipes=()=>app?.dispose();
export const snapshotRecipes=()=>app?.snapshot()??null;
mountRecipes();
