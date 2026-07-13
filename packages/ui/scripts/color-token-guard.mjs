#!/usr/bin/env node
/**
 * color-token-guard
 *
 * Fails when a component under `src/` uses a raw Tailwind palette color
 * utility (e.g. `text-gray-500`, `bg-red-600`, `border-zinc-200`) or an
 * arbitrary hex color class (e.g. `bg-[#F3F3F3]`). These do not respond to
 * the `.dark` theme and reintroduce light-mode islands.
 *
 * Use the semantic tokens instead — see the mapping in CONTRIBUTING.md:
 *   text-gray-500  -> text-muted-foreground
 *   text-gray-900  -> text-foreground
 *   bg-white       -> bg-background / bg-card
 *   bg-gray-50/100 -> bg-muted
 *   border-gray-*  -> border-border
 *   text-red-*     -> text-destructive
 *   bg-green-50    -> bg-success-muted   (text-green-* -> text-success)
 *   bg-orange-50   -> bg-warning-muted   (border-orange-* -> border-warning)
 *
 * `base/` (brand primitives / SVG assets) is intentionally exempt.
 * Runs on lint; no test execution — like the frontend's dependency-guard.mjs.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, "..", "src");

// Banned raw palette color utilities (optionally prefixed with a variant such
// as `hover:`, `dark:`, `md:`, `[&>x]:`). Covers text/bg/border/divide/ring.
const PALETTE_RE =
  /(?:^|[\s"'`:([{])(?:[\w[\]&>.:-]+:)?(?:text|bg|border|divide|ring|from|via|to|fill|stroke|outline|shadow|ring-offset|placeholder|caret|accent|decoration)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?![\w-])/;

// Arbitrary hex color utility classes, e.g. bg-[#fff], text-[#0a0a0c].
const ARBITRARY_HEX_RE =
  /(?:text|bg|border|divide|ring|fill|stroke|outline|from|via|to|shadow)-\[#[0-9a-fA-F]{3,8}\]/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
for (const file of walk(SRC_DIR)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (PALETTE_RE.test(line) || ARBITRARY_HEX_RE.test(line)) {
      violations.push({
        file: relative(join(__dirname, "..", ".."), file),
        line: i + 1,
        text: line.trim(),
      });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `\n[31m✖ color-token-guard: ${violations.length} raw palette color utilit${
      violations.length === 1 ? "y" : "ies"
    } found in src/[0m`
  );
  console.error(
    "  Use semantic tokens (text-muted-foreground, bg-card, border-border,\n" +
      "  text-destructive, bg-success-muted, …). See CONTRIBUTING.md.\n"
  );
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}\n    ${v.text}`);
  }
  console.error("");
  process.exit(1);
}

console.log("✓ color-token-guard: no raw palette color utilities in src/");
