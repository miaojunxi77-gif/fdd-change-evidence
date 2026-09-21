import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("public/data/item20-geography");
const parseJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const summary = await parseJson(path.join(root, "summary.json"));
const brandIndex = await parseJson(path.join(root, "brand-index.json"));
const brandDir = path.join(root, "brands");
const shardNames = (await readdir(brandDir)).filter((name) => name.endsWith(".json")).sort();

if (summary.counts.canonicalBrandYears !== 11644) throw new Error("Unexpected canonical brand-year count");
if (summary.counts.stateRankingRows !== 185783) throw new Error("Unexpected state-ranking count");
if (brandIndex.length !== summary.counts.uniqueChains) throw new Error("Brand index does not match unique-chain count");
if (shardNames.length !== 64) throw new Error(`Expected 64 brand shards; found ${shardNames.length}`);

const indexIds = new Set();
let brandYears = 0;
let rankingRows = 0;
for (const entry of brandIndex) {
  if (indexIds.has(entry.id)) throw new Error(`Duplicate index ID ${entry.id}`);
  indexIds.add(entry.id);
  if (!shardNames.includes(`${entry.bucket}.json`)) throw new Error(`Missing shard ${entry.bucket}`);
}

for (const shardName of shardNames) {
  const shardPath = path.join(brandDir, shardName);
  const bytes = (await stat(shardPath)).size;
  if (bytes >= 350000) throw new Error(`${shardName} exceeds the safe upload boundary`);
  const shard = await parseJson(shardPath);
  for (const [canonicalId, years] of Object.entries(shard)) {
    if (!indexIds.has(canonicalId)) throw new Error(`Shard ID missing from index: ${canonicalId}`);
    for (const detail of Object.values(years)) {
      brandYears += 1;
      rankingRows += (detail.f?.length ?? 0) + (detail.c?.length ?? 0);
    }
  }
}

if (brandYears !== summary.counts.canonicalBrandYears) throw new Error(`Expected 11,644 brand-years; found ${brandYears}`);
if (rankingRows !== summary.counts.stateRankingRows) throw new Error(`Expected 185,783 ranking rows; found ${rankingRows}`);

const manifestPath = path.join(root, "package", "manifest.json");
const manifest = await parseJson(manifestPath);
const packageHash = createHash("sha256");
let packageBytes = 0;
for (const part of manifest.parts) {
  const payload = await readFile(path.join(root, "package", part));
  packageHash.update(payload);
  packageBytes += payload.length;
}
if (packageBytes !== manifest.bytes) throw new Error("Package byte count does not match manifest");
if (packageHash.digest("hex") !== manifest.sha256) throw new Error("Package checksum does not match manifest");

console.log(JSON.stringify({
  brandShards: shardNames.length,
  brandYears,
  rankingRows,
  packageParts: manifest.parts.length,
  packageBytes,
}));
