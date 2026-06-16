import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";

const PUBLIC_DIR = path.resolve("public");
const DECK_EXT = [".txt", ".csv", ".tsv"];

// Turn a folder/file name into a readable title:
//   "imcunit2"  -> "Imcunit 2"
//   "topic7"    -> "Topic 7"
//   "ch_7-quant"-> "Ch 7 Quant"
function prettify(s) {
  return s
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function collectDecks(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(collectDecks(full));
    else if (DECK_EXT.includes(path.extname(e.name).toLowerCase())) out.push(full);
  }
  return out;
}

// Build the library manifest from whatever is in public/.
// Each top-level folder is a unit (its deck files, recursively, are chapters);
// each loose deck file at the root becomes its own single-chapter unit.
function buildManifest() {
  const units = [];
  if (!fs.existsSync(PUBLIC_DIR)) return units;

  for (const e of fs.readdirSync(PUBLIC_DIR, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    if (e.isDirectory()) {
      const files = collectDecks(path.join(PUBLIC_DIR, e.name)).sort((a, b) =>
        a.localeCompare(b)
      );
      if (!files.length) continue;
      units.push({
        name: prettify(e.name),
        chapters: files.map((f) => ({
          name: prettify(path.basename(f)),
          file: path.relative(PUBLIC_DIR, f).split(path.sep).join("/"),
        })),
      });
    } else if (DECK_EXT.includes(path.extname(e.name).toLowerCase())) {
      units.push({
        name: prettify(e.name),
        chapters: [{ name: prettify(e.name), file: e.name }],
      });
    }
  }
  return units;
}

// Generates /decks.json automatically so adding a deck = dropping a file in public/.
function decksManifest() {
  return {
    name: "decks-manifest",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if ((req.url || "").split("?")[0].endsWith("/decks.json")) {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(buildManifest()));
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "decks.json",
        source: JSON.stringify(buildManifest(), null, 2),
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  // GitHub Pages serves the site under /flashr/, but local dev stays at the
  // root so http://localhost:5173/ works directly.
  base: command === "build" ? "/flashr/" : "/",
  plugins: [decksManifest()],
}));
