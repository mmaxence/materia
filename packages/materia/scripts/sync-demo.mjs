import { cp, mkdir, rm } from "node:fs/promises";
const source = new URL("../src/", import.meta.url);
const target = new URL("../../../public/type-lab/lib/", import.meta.url);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log("Synced package source to playground lib/.");
