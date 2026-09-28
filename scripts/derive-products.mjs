/**
 * Rewrite the model entries of src/data/products.json from the authored
 * sizing rule (scripts/product-rule.mjs). Series metadata (names, materials,
 * sample licences, warranties) is kept as it is; only `models` is replaced.
 *
 *   node scripts/derive-products.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deriveSeriesModels } from './product-rule.mjs';

const DATA_FILE = fileURLToPath(new URL('../src/data/products.json', import.meta.url));

/**
 * @param {object} data the parsed products.json
 * @returns {object} a new object with every series' models re-derived
 */
export function withDerivedModels(data) {
  return {
    ...data,
    series: data.series.map((series) => ({ ...series, models: deriveSeriesModels(series.id) })),
  };
}

const oneLine = (block) => block.replace(/\n\s*/g, ' ').replace('[ ', '[').replace(' ]', ']');

/** One model per line and PE ranges inline, as the file has always been laid out. */
export function formatProducts(data) {
  const json = JSON.stringify(data, null, 2)
    .replace(/\{\n\s+"code"[^}]+\}/g, oneLine)
    .replace(/\[\n\s+\d+,\n\s+\d+\n\s+\]/g, oneLine);
  return `${json}\n`;
}

async function main() {
  const current = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  await writeFile(DATA_FILE, formatProducts(withDerivedModels(current)), 'utf8');
  console.log(`Wrote ${DATA_FILE}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`derive-products failed: ${error.message}`);
    process.exitCode = 1;
  });
}
