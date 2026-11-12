# Living Type

Part of **Living Things — Libraries for a living web**. Formerly **Materia**. Existing repository URLs, package names, imports and APIs remain unchanged.


Interactive text effects for the web. Zero runtime dependencies, selective imports, and a visual layer editor.

[Live playground](https://mmaxence.github.io/materia/) · [Package API](https://mmaxence.github.io/materia/package-demo.html) · [Library documentation](packages/materia/README.md)

## Integrate

The [versioned package contract](packages/materia/README.md) and [agent guide](public/type-lab/agent-guide.md) cover source/local tarballs, public exports, cleanup and native fallback. Asset-free runnable examples live in [minimal](packages/materia/examples/minimal/index.html) and [stack](packages/materia/examples/stack/index.html). Serve this repository with `python3 -m http.server 4399` to open those source paths. The runtime package excludes the examples and showcase assets. Local documentation updates are not automatically deployed.

## Develop

```sh
npm ci --prefix packages/materia
npm test --prefix packages/materia
npm run typecheck --prefix packages/materia
npm run sync-demo --prefix packages/materia
npm run check:docs --prefix packages/materia
npm run check:examples --prefix packages/materia # needs Chrome; set CHROME if required
python3 packages/materia/scripts/serve-demo.py
```

Open http://127.0.0.1:4399/. GitHub Pages serves `public/type-lab` through Actions.

## By Maxence

I build small tools for a more expressive web. **Living Type** explores living typography; **[Living Object](https://mmaxence.github.io/solids/)** brings lightweight interactive 3D forms to the browser.

[Personal site](https://mmaxence.me/) · [GitHub](https://github.com/mmaxence)

## Status

Experimental alpha. Not published to npm.

## License

Living Type source code and documentation are licensed under the [MIT License](LICENSE), copyright (c) 2026 Maxence Mauduit. See [asset and dependency notices](NOTICES.md) for exclusions and separately licensed materials.
