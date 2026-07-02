// Validate ONE topic file. Usage:
//   node checkone.mjs <topic.json>                      — full check (generators must be wired)
//   node checkone.mjs <topic.json> --pack <pack.js>     — pre-wiring: merge a fill pack for self-test
import { pathToFileURL } from "node:url";
import path from "node:path";
import { validateTopic } from "./harness.mjs";

const args = process.argv.slice(2);
const file = args[0];
if (!file) { console.error("usage: node checkone.mjs <topic.json> [--pack <pack.js>]"); process.exit(2); }

let extraGens = null;
const pi = args.indexOf("--pack");
if (pi !== -1) {
  const mod = await import(pathToFileURL(path.resolve(args[pi + 1])).href);
  extraGens = mod.fill || mod.default;
  if (!extraGens) { console.error("pack file must export `fill`"); process.exit(2); }
}

const { errors, warnings } = validateTopic(path.resolve(file), { extraGens });
for (const e of errors) console.log(`ERROR ${e}`);
for (const w of warnings) console.log(`warn  ${w}`);
console.log(errors.length ? `\nFAIL (${errors.length} errors)` : `\nOK${warnings.length ? ` (${warnings.length} warnings)` : ""}`);
process.exit(errors.length ? 1 : 0);
