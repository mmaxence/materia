// Documentation/import parity, with no changes to the runtime's public contract.
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url),site=new URL('../../../public/type-lab/',import.meta.url);
const read=url=>readFile(url,'utf8');
async function files(url){let all=[];for(const entry of await readdir(url,{withFileTypes:true})){if(entry.isDirectory())all.push(...(await files(new URL(entry.name+'/',url))).map(name=>entry.name+'/'+name));else all.push(entry.name)}return all;}
const pkg=JSON.parse(await read(new URL('package.json',root))),api=await read(new URL('README.md',root));
assert.equal(pkg.version,'0.1.0-alpha.1');
assert.equal(await read(new URL('api.md',site)),api.replaceAll('(src/','(lib/'),'API mirror stale: run sync-demo');
assert.deepEqual(JSON.parse(await read(new URL('package.json',site))),pkg);
assert.equal(await read(new URL('LICENSE',site)),await read(new URL('LICENSE',root)));
let mirrored=0;
for(const file of await files(new URL('src/',root))){assert.equal(await read(new URL('lib/'+file,site)),await read(new URL('src/'+file,root)),file+' source mirror differs');mirrored++;}
for(const file of await files(new URL('examples/',root))){let expected=await read(new URL('examples/'+file,root));if(file.endsWith('.html'))expected=expected.replaceAll('../../src/','../../lib/').replaceAll('../../README.md','../../api.md');assert.equal(await read(new URL('examples/'+file,site)),expected,file+' example mirror differs');}
const types=await read(new URL('src/index.d.ts',root));
const controller=types.split('export interface TextEffectController {')[1].split('\n}')[0];
const methods=[...controller.matchAll(/^\s+([A-Za-z]+)\(/gm)].map(x=>x[1]);
for(const method of methods)assert(api.includes(method+'('),'README omits '+method);
assert(api.includes('supported')&&api.includes('0.4–0.95')&&api.includes('0.4–0.9'));
const snippets=[...api.matchAll(/```js\n([\s\S]*?)```/g)];
for(const [,contents]of snippets)await build({stdin:{contents,resolveDir:fileURLToPath(root)},bundle:true,write:false,format:'esm',logLevel:'silent'});
const guide=await read(new URL('agent-guide.md',site));
for (const target of [...guide.matchAll(/\]\((\.[^)]+)\)/g)].map(x=>x[1])) await stat(new URL(target,site));
for(const page of ['examples/minimal/index.html','examples/stack/index.html']){
 const html=await read(new URL(page,site));const map=JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]);
 for(const target of Object.values(map.imports))await read(new URL(target,new URL(page,site)));
 assert(!/fonts\.googleapis|stillwater|<img|https?:\/\//.test(html),'examples must use only local original content');
}
console.log(JSON.stringify({pass:true,version:pkg.version,mirroredSourceFiles:mirrored,documentedMethods:methods.length,compiledReadmeSnippets:snippets.length,sourceAndWebsiteExamples:2}));
