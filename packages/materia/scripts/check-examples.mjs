// Local docs/examples check. Node 22 + Chrome; no Puppeteer/runtime dependency.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,cp,mkdir,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const packageRoot=fileURLToPath(new URL('../',import.meta.url)),repo=resolve(packageRoot,'../..');
const temp=await mkdtemp(join(tmpdir(),'living-type-examples-')),consumer=join(temp,'consumer');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const run=(cmd,args,cwd=packageRoot)=>execFileSync(cmd,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
const chromePath=process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
let chrome,server;const sessions=[];
const report={scope:'Source/website/installed documentation examples; headless Chrome/SwiftShader, not hardware or full accessibility certification.',baseCommit:run('git',['rev-parse','HEAD'],repo).trim(),version:'0.1.0-alpha.1',tests:[],inputs:{}};
try{
 const raw=run('npm',['pack','--json','--pack-destination',temp]);let packed;
 for(let i=raw.lastIndexOf('\n[');i>=0&&!packed;i=raw.lastIndexOf('\n[',i-1)){try{packed=JSON.parse(raw.slice(i+1))[0]}catch{}}
 packed??=JSON.parse(raw)[0];assert(packed.filename);report.package={files:packed.files.length,size:packed.size,integrity:packed.integrity,sha256:createHash('sha256').update(await readFile(join(temp,packed.filename))).digest('hex')};
 assert(!packed.files.some(f=>f.path.startsWith('examples/')||/\.(jpg|webm|woff2)$/.test(f.path)));
 await mkdir(consumer);await writeFile(join(consumer,'package.json'),JSON.stringify({type:'module',private:true}));
 run('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(temp,packed.filename)],consumer);
 await cp(join(packageRoot,'examples'),join(consumer,'examples'),{recursive:true});
 for(const name of ['minimal','stack']){
  const main=await readFile(join(packageRoot,'examples',name,'main.js'),'utf8');
  run(process.execPath,[join(packageRoot,'node_modules/typescript/bin/tsc'),'--noEmit','--strict','--allowJs','--checkJs','--target','es2022','--module','NodeNext','--moduleResolution','NodeNext',join(consumer,'examples',name,'main.js')]);
  await build({stdin:{contents:main,resolveDir:consumer},bundle:true,format:'esm',outfile:join(consumer,'examples',name,'main.js'),logLevel:'silent'});
  const html=(await readFile(join(consumer,'examples',name,'index.html'),'utf8')).replace(/<script type="importmap">[\s\S]*?<\/script>/,'');
  await writeFile(join(consumer,'examples',name,'index.html'),html);
 }
 report.strictJsExamples=2;
 server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const base=url.pathname.startsWith('/consumer/')?consumer:repo;const rel=url.pathname.startsWith('/consumer/')?url.pathname.slice('/consumer'.length):url.pathname;let file=resolve(base,'.'+rel);if(!file.startsWith(base+'/')){res.writeHead(403).end();return}if((await stat(file)).isDirectory())file=join(file,'index.html');res.setHeader('Content-Type',extname(file)==='.js'?'text/javascript':extname(file)==='.css'?'text/css':extname(file)==='.md'?'text/plain':'text/html');res.end(await readFile(file))}catch{res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 chrome=spawn(chromePath,['--headless=new','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=0','--user-data-dir='+join(temp,'chrome'),'about:blank'],{stdio:'ignore'});
 let port;for(let i=0;i<100&&!port;i++){try{port=Number((await readFile(join(temp,'chrome/DevToolsActivePort'),'utf8')).split('\n')[0])}catch{await pause(100)}}assert(port,'Chrome did not start; set CHROME');
 report.browser=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();delete report.browser.webSocketDebuggerUrl;
 async function page({reduced=false,noGL=false,noJS=false}={}){
  const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});let id=0;const pending=new Map(),errors=[],requests=[];
  ws.onmessage=({data})=>{const m=JSON.parse(data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+' '+(m.params.exceptionDetails.exception?.description||''));else if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url)};
  const send=(method,params={})=>new Promise((r,j)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);j(Error('CDP timeout '+method))},15000);pending.set(n,m=>{clearTimeout(timer);m.error?j(Error(JSON.stringify(m.error))):r(m.result)});ws.send(JSON.stringify({id:n,method,params}))});
  const evaluate=async(expression)=>{const v=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(v.exceptionDetails)throw Error(v.exceptionDetails.exception?.description||v.exceptionDetails.text);return v.result?.value};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
  if(noJS)await send('Emulation.setScriptExecutionDisabled',{value:true});
  else await send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const req=requestAnimationFrame.bind(window),cancel=cancelAnimationFrame.bind(window),set=new Set();window.__pending=set;window.requestAnimationFrame=fn=>{let id=req(t=>{set.delete(id);fn(t)});set.add(id);return id};window.cancelAnimationFrame=id=>{set.delete(id);cancel(id)};${noGL?"const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'||type==='webgl2'?null:old.call(this,type,...args)};":''}})();`});
  let closed=false;const out={send,evaluate,errors,requests,async close(){if(closed)return;closed=true;try{await send('Page.close')}catch{}ws.close()}};sessions.push(out);return out;
 }
 async function navigate(p,url,ready=true){await p.send('Page.navigate',{url});for(let i=0;i<120;i++){const ok=await p.evaluate(ready?"document.querySelector('[data-status]')?.textContent.startsWith('Mounted.')":"document.readyState==='complete'");if(ok)return;await pause(50)}throw Error('Example did not become ready: '+url+' '+p.errors.join('\n'))}
 for(const delivery of ['source','website','installed'])for(const name of ['minimal','stack']){
  const prefix=delivery==='source'?'/packages/materia/examples/':delivery==='website'?'/public/type-lab/examples/':'/consumer/examples/';const url=origin+prefix+name+'/';
  const p=await page();await navigate(p,url);
  const mounted=await p.evaluate(`(()=>{const c=document.querySelector('canvas'),gl=c.getContext('webgl'),ext=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),canvases:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth>innerWidth+1,decorative:c.getAttribute('aria-hidden')==='true'&&getComputedStyle(c).pointerEvents==='none'}})()`);
  assert(/SwiftShader/.test(mounted.renderer)&&mounted.canvases===1&&!mounted.overflow&&mounted.decorative);
  if(process.env.EXAMPLE_SCREENSHOTS){await mkdir(process.env.EXAMPLE_SCREENSHOTS,{recursive:true});const shot=await p.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile(join(process.env.EXAMPLE_SCREENSHOTS,delivery+'-'+name+'.png'),Buffer.from(shot.data,'base64'));}
  const tested=await p.evaluate(`(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),click=key=>document.querySelector('[data-'+key+']').click();const input=document.querySelector('[data-copy]'),heading=document.querySelector('[data-heading]'),host=document.querySelector('[data-host]');input.focus();input.value='Updated words 한글';input.dispatchEvent(new Event('input',{bubbles:true}));await wait(120);const content=heading.textContent===input.value&&document.activeElement===input;const originalWidth=document.querySelector('canvas').width;host.style.width='280px';await wait(160);const nextWidth=document.querySelector('canvas').width;const resized=nextWidth>0&&nextWidth!==originalWidth&&nextWidth<=280*devicePixelRatio;click('pause');await wait(150);const frozen=__pending.size===0&&document.querySelector('[data-pause]').getAttribute('aria-pressed')==='true';click('mount');await wait(120);const keptPause=__pending.size===0;const layer=document.querySelector('[data-layer]');if(layer){layer.value='.6';layer.dispatchEvent(new Event('input',{bubbles:true}));}click('destroy');await wait(100);const native=heading.style.color===''&&document.querySelectorAll('canvas').length===0;const cycles=[];for(let i=0;i<5;i++){click('mount');await wait(30);click('destroy');await wait(30);cycles.push({canvases:document.querySelectorAll('canvas').length,pending:__pending.size})}const module=await import(location.href+'main.js');module.disposeExample();module.disposeExample();input.value='Ignored after dispose';input.dispatchEvent(new Event('input',{bubbles:true}));click('mount');await wait(80);return{content,resized,frozen,keptPause,native,layerUpdated:!!layer,cycles,disposed:__pending.size===0&&document.querySelectorAll('canvas').length===0&&heading.textContent==='Updated words 한글'}})()`);
  assert(tested.content&&tested.resized&&tested.frozen&&tested.keptPause&&tested.native&&tested.disposed&&tested.cycles.every(x=>x.canvases===0&&x.pending===0));assert.equal(tested.layerUpdated,name==='stack');assert.deepEqual(p.errors,[]);assert(p.requests.every(u=>u.startsWith(origin)||u.startsWith('data:')),'example requested external resources');
  report.tests.push({delivery,example:name,status:'passed',mounted,tested});await p.close();
 }
 for(const name of ['minimal','stack'])for(const mode of ['reduced','noGL','noJS']){
  const p=await page({reduced:mode==='reduced',noGL:mode==='noGL',noJS:mode==='noJS'});await navigate(p,origin+'/public/type-lab/examples/'+name+'/',mode!=='noJS');await pause(250);
  const state=await p.evaluate(`(()=>{const h=document.querySelector('[data-heading]');return{text:h.textContent,color:getComputedStyle(h).color,canvases:document.querySelectorAll('canvas').length,pending:window.__pending?.size??null,status:document.querySelector('[data-status]').textContent,sourceVisible:getComputedStyle(h).color!=='rgba(0, 0, 0, 0)'&&h.getBoundingClientRect().height>0}})()`);
  if(mode==='reduced')assert(state.pending===0);else assert(state.canvases===0&&state.sourceVisible);if(mode==='noGL')assert(state.status.includes('unavailable'));
  let livePreference=null;if(mode==='reduced'){await p.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(150);const resumed=await p.evaluate("({status:document.querySelector('[data-status]').textContent,pending:__pending.size})");assert(resumed.status.includes('System motion allowed.'));if(name==='stack')assert(resumed.pending>0);await p.evaluate("document.querySelector('[data-pause]').click()");await p.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await p.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(150);const paused=await p.evaluate("({pending:__pending.size,pressed:document.querySelector('[data-pause]').getAttribute('aria-pressed')})");assert(paused.pending===0&&paused.pressed==='true');livePreference={resumed,explicitPauseRetained:paused};}assert.deepEqual(p.errors,[]);report.tests.push({delivery:'website',example:name,mode,status:'passed',state,livePreference});await p.close();
 }
 // Context loss restores native source while the initial support result remains unchanged.
 const lost=await page();await navigate(lost,origin+'/public/type-lab/examples/minimal/');const loss=await lost.evaluate(`(async()=>{const c=document.querySelector('canvas');c.getContext('webgl').getExtension('WEBGL_lose_context').loseContext();await new Promise(r=>setTimeout(r,100));const h=document.querySelector('[data-heading]');return{hidden:c.hidden,sourceVisible:getComputedStyle(h).color!=='rgba(0, 0, 0, 0)',status:document.querySelector('[data-status]').textContent}})()`);assert(loss.hidden&&loss.sourceVisible&&loss.status.includes('Initial renderer available'));report.contextLoss=loss;await lost.evaluate("document.querySelector('[data-mount]').click()");await pause(150);report.explicitRemount=await lost.evaluate("({canvases:document.querySelectorAll('canvas').length,visible:document.querySelector('canvas')?.hidden===false})");assert(report.explicitRemount.canvases===1&&report.explicitRemount.visible);await lost.close();
 const keys=await readFile(join(packageRoot,'src/index.d.ts'),'utf8');report.documentedMethods=[...keys.split('export interface TextEffectController {')[1].split('\n}')[0].matchAll(/^\s+([A-Za-z]+)\(/gm)].map(x=>x[1]);
 for(const rel of ['.github/workflows/pages.yml','packages/materia/scripts/sync-demo.mjs','packages/materia/examples/minimal/index.html','packages/materia/examples/stack/index.html','packages/materia/README.md','packages/materia/package.json','public/type-lab/api.md','public/type-lab/agent-guide.md','packages/materia/examples/minimal/main.js','packages/materia/examples/stack/main.js','packages/materia/examples/example.css','packages/materia/scripts/check-docs.mjs','packages/materia/scripts/check-examples.mjs'])report.inputs[rel]=createHash('sha256').update(await readFile(join(repo,rel))).digest('hex');
 report.result='PASS';console.log(JSON.stringify(report,null,2));if(process.env.EXAMPLE_REPORT)await writeFile(process.env.EXAMPLE_REPORT,JSON.stringify(report,null,2)+'\n');
}finally{for(const s of sessions)try{await s.close()}catch{}chrome?.kill();if(server)await new Promise(r=>server.close(r))}
