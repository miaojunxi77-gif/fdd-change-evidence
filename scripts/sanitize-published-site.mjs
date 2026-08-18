import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? "out");
const textExtensions = new Set([
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".txt",
  ".xml",
  ".css",
  ".map",
]);

const replacements = [
  [/连续年度\s*DeepSeek\s*清洗结果/gi, "连续年度清洗结果"],
  [/跨期\s*DeepSeek\s*v4\.5\s*生产结果/gi, "跨期生产结果"],
  [/本次\s*DeepSeek\s*生产共准备/gi, "本次生产分析共准备"],
  [/本轮\s*DeepSeek\s*生产结果/gi, "本轮生产分析结果"],
  [/成功的\s*DeepSeek\s*v4\.5\s*生产比较/gi, "成功的生产比较"],
  [/至少含一条\s*DeepSeek\s*保守变化/gi, "至少含一条保守变化"],
  [/来自\s*DeepSeek\s*跨期生产包/gi, "来自跨期生产包"],
  [/scored\s+with\s+DeepSeek\s*v4\.5\s+production/gi, "scored with the production analysis pipeline"],
  [/DeepSeek\s*v4\.5\s*跨期包/gi, "跨期结果包"],
  [/DeepSeek\s*v4\.5\s*生产比较/gi, "生产比较"],
  [/DeepSeek\s*v4\.5\s*生产结果/gi, "生产分析结果"],
  [/DeepSeek\s*生产输出/gi, "生产分析结果"],
  [/DeepSeek\s*生产结果/gi, "生产分析结果"],
  [/DeepSeek\s*生产共准备/gi, "生产分析共准备"],
  [/DeepSeek\s*保守变化/gi, "保守变化"],
  [/DeepSeek\s*跨期生产包/gi, "跨期生产包"],
  [/DeepSeek\s*清洗后/gi, "清洗后"],
  [/DEEPSEEK\s*CROSS-PERIOD\s*V4\.5/gi, "CROSS-PERIOD QUALITY REVIEW"],
  [/DEEPSEEK\s*CONSERVATIVE\s*GATES/gi, "CONSERVATIVE QUALITY GATES"],
  [/DeepSeek\s*consecutive\s*\+\s*cross-period/gi, "consecutive + cross-period"],
  [/prepared\s+DeepSeek\s+jobs/gi, "prepared comparison jobs"],
  [/cleaned\s+DeepSeek\s+output/gi, "cleaned production output"],
  [/DeepSeek\s+analysis-ready\s+result/gi, "Analysis-ready result"],
  [/DeepSeek\s+cleaned\s+export/gi, "cleaned export"],
  [/deepseek_api_v4_5_production/gi, "production_scoring"],
  [/deepseek-v4-flash-0731/gi, "production_classifier"],
  [/deepseek_postprocess_validated/gi, "postprocess_validated"],
  [/deepseek_postprocess_text_match/gi, "postprocess_text_match"],
  [/deepseek_cleaned_export/gi, "cleaned_export"],
  [/deepseek-chat/gi, "validation_classifier"],
  [/deepseek_api_4/gi, "api_scoring"],
  [/DeepSeek\s*v4\.5/gi, "production model"],
  [/DeepSeek/gi, "analysis"],
  [/v4\.5/gi, ""],
];

const forbidden = /deepseek|deep-seek|v4\.5/i;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) paths.push(...(await walk(fullPath)));
    else paths.push(fullPath);
  }
  return paths;
}

function sanitizeText(input) {
  let output = input;
  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

function sanitizeName(name) {
  return name
    .replace(/deepseek/gi, "analysis")
    .replace(/deep-seek/gi, "analysis")
    .replace(/v4\.5/gi, "");
}

await stat(root);

let changedFiles = 0;
let replacementCount = 0;
for (const file of await walk(root)) {
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const before = await readFile(file, "utf8");
  const after = sanitizeText(before);
  if (after !== before) {
    const beforeMatches = before.match(/deepseek|deep-seek|v4\.5/gi)?.length ?? 0;
    replacementCount += beforeMatches;
    await writeFile(file, after, "utf8");
    changedFiles += 1;
  }
}

async function renameTree(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) await renameTree(fullPath);
    const nextName = sanitizeName(entry.name);
    if (nextName !== entry.name) {
      await rename(fullPath, path.join(dir, nextName));
    }
  }
}

await renameTree(root);

const remaining = [];
for (const file of await walk(root)) {
  const relative = path.relative(root, file);
  if (forbidden.test(relative)) remaining.push(`path:${relative}`);
  if (!textExtensions.has(path.extname(file).toLowerCase())) continue;
  const content = await readFile(file, "utf8");
  if (forbidden.test(content)) remaining.push(`content:${relative}`);
}

if (remaining.length > 0) {
  console.error("Published-site sanitization failed; model-name references remain:");
  for (const item of remaining.slice(0, 50)) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Published-site sanitization complete: ${changedFiles} files changed, ${replacementCount} model-name references removed.`);
