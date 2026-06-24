// Guards against repeating the exact mistake that broke this site's CSS
// cascade once already (see plans/001-cascade-layers.md and
// plans/006-fix-layer-order-inversion.md): app/globals.css must establish
// layer order purely through @import ... layer(name) sequence. A bare
// `@layer name1, name2, ...;` order statement mixed into the same file is
// NOT safe — Next.js's bundler hoists @import-sourced content ahead of it,
// silently inverting the intended priority with no build error. This script
// catches that shape (and a reordering of the imports) before it ships.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const GLOBALS_PATH = path.join(ROOT, "..", "app", "globals.css");
const EXPECTED_LAYER_ORDER = ["base", "components", "layout"];

function fail(message) {
  console.error(`\nverify-css-layers: ${message}\n`);
  process.exit(1);
}

const css = readFileSync(GLOBALS_PATH, "utf8");

// 1. No bare `@layer name1, name2, ...;` order statement allowed anywhere.
//    (A real @layer rule with a block, e.g. `@layer base { ... }`, is fine —
//    only the no-block "order statement" form is the unsafe one.)
const bareLayerStatement = /@layer\s+[\w\s,.-]+;/;
if (bareLayerStatement.test(css)) {
  fail(
    "app/globals.css contains a bare `@layer name1, name2, ...;` order " +
      "statement. This exact shape caused a sitewide regression once " +
      "already (invisible button text, collapsed type scale) because " +
      "Next.js's bundler reorders @import-sourced content ahead of it. " +
      "Establish layer order purely through @import ... layer(name) " +
      "sequence instead — see plans/006-fix-layer-order-inversion.md."
  );
}

// 2. Every @import must be layer-scoped, in the expected order.
const importLayerPattern = /@import\s+["'][^"']+["']\s+layer\((\w+)\)/g;
const foundOrder = [...css.matchAll(importLayerPattern)].map((m) => m[1]);

if (foundOrder.length === 0) {
  fail(
    "app/globals.css has no `@import ... layer(name)` rules at all — " +
      "expected the cascade-layer import chain to still be in place."
  );
}

const orderMatches =
  foundOrder.length === EXPECTED_LAYER_ORDER.length &&
  foundOrder.every((name, i) => name === EXPECTED_LAYER_ORDER[i]);

if (!orderMatches) {
  fail(
    `app/globals.css's @import layer() order is [${foundOrder.join(", ")}], ` +
      `expected [${EXPECTED_LAYER_ORDER.join(", ")}]. Layer priority is ` +
      "lowest-to-highest in import order — reordering these changes which " +
      "rules win in a conflict."
  );
}

console.log("verify-css-layers: OK");
