import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const assetsDirectory = new URL('../dist/assets/', import.meta.url);
const limits = {
  largestJavaScript: 430_000,
  totalJavaScript: 1_350_000,
  totalCss: 130_000,
};

const files = await readdir(assetsDirectory);
const assets = await Promise.all(
  files.map(async (file) => ({
    file,
    bytes: (await stat(join(assetsDirectory.pathname, file))).size,
  })),
);
const javascript = assets.filter(({ file }) => file.endsWith('.js'));
const css = assets.filter(({ file }) => file.endsWith('.css'));
const largestJavaScript = Math.max(...javascript.map(({ bytes }) => bytes));
const totalJavaScript = javascript.reduce((sum, { bytes }) => sum + bytes, 0);
const totalCss = css.reduce((sum, { bytes }) => sum + bytes, 0);
const measurements = { largestJavaScript, totalJavaScript, totalCss };
const failures = Object.entries(measurements).filter(
  ([name, bytes]) => bytes > limits[name],
);

for (const [name, bytes] of Object.entries(measurements)) {
  console.log(
    `${name}: ${Math.round(bytes / 1000)} kB / ${Math.round(limits[name] / 1000)} kB`,
  );
}
if (failures.length) {
  throw new Error(
    `Bundle budget exceeded: ${failures.map(([name]) => name).join(', ')}`,
  );
}
