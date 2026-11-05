import test from "node:test";
import assert from "node:assert/strict";
import { createTextEffect } from "../src/index.js";
import { sourcePresentation } from "../src/internal/renderer-utils.js";
class Style {
  values = new Map();
  priorities = new Map();
  setProperty(k, v, p = "") {
    this.values.set(k, v);
    this.priorities.set(k, p);
  }
  getPropertyValue(k) {
    return this.values.get(k) || "";
  }
  getPropertyPriority(k) {
    return this.priorities.get(k) || "";
  }
  removeProperty(k) {
    this.values.delete(k);
    this.priorities.delete(k);
  }
  get position() {
    return this.getPropertyValue("position");
  }
}
function fixture() {
  const host = { style: new Style(), contains: () => true };
  const element = {
    nodeType: 1,
    isConnected: true,
    children: [],
    parentElement: host,
    style: new Style(),
    classList: {
      items: new Set(),
      contains(k) {
        return this.items.has(k);
      },
      add(k) {
        this.items.add(k);
      },
      remove(k) {
        this.items.delete(k);
      },
    },
  };
  return { host, element };
}
test("public lifecycle restores shared hosts, disconnects, rejects duplicates and makes disposed calls inert", () => {
  const originals = {
    document: globalThis.document,
    getComputedStyle: globalThis.getComputedStyle,
    MutationObserver: globalThis.MutationObserver,
  };
  const observers = [];
  let destroyed = 0,
    refreshed = 0;
  globalThis.document = {};
  globalThis.getComputedStyle = () => ({
    position: "static",
    color: "rgb(20,30,40)",
  });
  globalThis.MutationObserver = class {
    constructor(fn) {
      this.fn = fn;
      observers.push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  };
  const effect = {
    name: "fixture",
    kind: "gpu",
    mount() {
      return {
        supported: true,
        setIntensity() {},
        setDetail() {},
        setFlow() {},
        setFrozen() {},
        pulse() {},
        refresh() {
          refreshed++;
        },
        destroy() {
          destroyed++;
        },
      };
    },
  };
  try {
    const { host, element } = fixture(),
      second = fixture().element;
    second.parentElement = host;
    const a = createTextEffect(element, { effect }),
      b = createTextEffect(second, { effect });
    assert.equal(host.style.position, "relative");
    assert.throws(() => createTextEffect(element, { effect }), /already/);
    a.destroy();
    a.destroy();
    a.refresh();
    assert.equal(destroyed, 1);
    assert.equal(refreshed, 0);
    assert.equal(host.style.position, "relative");
    assert(observers[0].disconnected);
    b.destroy();
    assert.equal(host.style.position, "");
    assert.equal(destroyed, 2);
    const next = createTextEffect(element, { effect });
    next.destroy();
    assert.throws(
      () =>
        createTextEffect(element, {
          effect: {
            mount() {
              throw Error("mount failure");
            },
          },
        }),
      /mount failure/,
    );
    assert.equal(host.style.position, "");
  } finally {
    for (const [name, value] of Object.entries(originals)) {
      if (value === undefined) delete globalThis[name];
      else globalThis[name] = value;
    }
  }
});
test("presentation cleanup restores exact inline color and priority", () => {
  const { element } = fixture();
  element.style.setProperty("color", "var(--brand)", "important");
  const source = sourcePresentation(element);
  source.hide();
  source.hide();
  assert.equal(element.style.getPropertyValue("color"), "transparent");
  source.restore();
  source.restore();
  assert.equal(element.style.getPropertyValue("color"), "var(--brand)");
  assert.equal(element.style.getPropertyPriority("color"), "important");
  assert(!element.classList.contains("material-source"));
});

test("letter spacing refreshes the renderer and restores the original inline value", () => {
  const original = Object.fromEntries(["document", "CSS", "getComputedStyle", "MutationObserver"].map(k => [k, globalThis[k]]));
  const { element } = fixture();
  element.style.setProperty("letter-spacing", "0.02em", "important");
  let refreshes = 0;
  globalThis.document = {};
  globalThis.CSS = { supports: (name, value) => name === "letter-spacing" && /^(normal|-?[\d.]+(?:px|em))$/.test(value) };
  globalThis.getComputedStyle = () => ({ position: "relative", color: "rgb(20,30,40)" });
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  const noop = () => {};
  const effect = { mount: () => ({ refresh: () => refreshes++, destroy: noop, setIntensity: noop, setDetail: noop, setFlow: noop, setFrozen: noop }) };
  try {
    const fx = createTextEffect(element, { effect, letterSpacing: "0.1em" });
    assert.equal(element.style.getPropertyValue("letter-spacing"), "0.1em");
    fx.setLetterSpacing(-2);
    assert.equal(element.style.getPropertyValue("letter-spacing"), "-2px");
    assert.equal(refreshes, 1);
    assert.throws(() => fx.setLetterSpacing(Infinity), TypeError);
    fx.destroy();
    assert.equal(element.style.getPropertyValue("letter-spacing"), "0.02em");
    assert.equal(element.style.getPropertyPriority("letter-spacing"), "important");
    fx.setLetterSpacing(4);
    assert.equal(refreshes, 1);
    assert.throws(() => createTextEffect(element, { effect: { mount() { throw Error("failed"); } }, letterSpacing: 8 }));
    assert.equal(element.style.getPropertyValue("letter-spacing"), "0.02em");
  } finally { Object.assign(globalThis, original); }
});
