import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
const source = new URL("../src/", import.meta.url);
const target = new URL("../../../public/type-lab/lib/", import.meta.url);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await writeFile(new URL('../../../public/type-lab/api.md',import.meta.url),(await readFile(new URL('../README.md',import.meta.url),'utf8')).replaceAll('(src/','(lib/'));
const examples = new URL('../examples/',import.meta.url);
const exampleTarget = new URL('../../../public/type-lab/examples/',import.meta.url);
await rm(exampleTarget,{recursive:true,force:true});
await cp(examples,exampleTarget,{recursive:true});
for (const name of ['minimal','stack']) {
  const file = new URL(name+'/index.html',exampleTarget);
  await writeFile(file,(await readFile(file,'utf8')).replaceAll('../../src/','../../lib/').replaceAll('../../README.md','../../api.md'));
}
await cp(new URL('../package.json',import.meta.url),new URL('../../../public/type-lab/package.json',import.meta.url));
console.log("Synced package source to playground lib/.");

await cp(new URL('../LICENSE',import.meta.url),new URL('../../../public/type-lab/LICENSE',import.meta.url));
