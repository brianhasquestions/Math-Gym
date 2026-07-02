// Validate EVERY topic in the manifest. Usage: node validate.mjs [--quiet-warnings]
import { readFileSync } from "node:fs";
import path from "node:path";
import { validateTopic, REPO } from "./harness.mjs";

const quiet = process.argv.includes("--quiet-warnings");
const manifest = JSON.parse(readFileSync(path.join(REPO, "content/manifest.json"), "utf8"));

let topics = 0, problems = 0, failures = 0, warningCount = 0;
for (const subject of manifest.subjects) {
  for (const t of subject.topics) {
    topics++;
    const file = path.join(REPO, t.file);
    const { errors, warnings, topic } = validateTopic(file);
    problems += topic ? (topic.problems || []).length : 0;
    warningCount += warnings.length;
    if (errors.length) {
      failures++;
      console.log(`FAIL ${t.id}`);
      for (const e of errors) console.log(`   ERROR ${e}`);
    }
    if (!quiet) for (const w of warnings) console.log(`   warn  ${t.id}: ${w}`);
  }
}
console.log(`\n${topics} topics, ${problems} seed problems, ${failures} failing, ${warningCount} warnings.`);
process.exit(failures ? 1 : 0);
