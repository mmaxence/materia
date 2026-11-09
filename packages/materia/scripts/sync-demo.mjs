import { cp, mkdir, rm } from "node:fs/promises";
const source = new URL("../src/", import.meta.url);
const target = new URL("../../../public/type-lab/lib/", import.meta.url);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
await cp(new URL('../README.md',import.meta.url),new URL('../../../public/type-lab/api.md',import.meta.url));
await cp(new URL('../package.json',import.meta.url),new URL('../../../public/type-lab/package.json',import.meta.url));
console.log("Synced package source to playground lib/.");

await cp(new URL('../LICENSE',import.meta.url),new URL('../../../public/type-lab/LICENSE',import.meta.url));
