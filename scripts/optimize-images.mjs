/**
 * Generates compressed WebP siblings of the large in-use PNG images.
 *
 *   npm install --no-save sharp@0.35.5 && node scripts/optimize-images.mjs
 *
 * The PNG files are the masters and are never modified or deleted; this script only writes the
 * .webp outputs listed in JOBS. sharp is not a project dependency (no build step), so install it
 * with --no-save when you need to regenerate.
 */

import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

const SHOT = Object.freeze({ width: 1600, withoutEnlargement: true });

/**
 * One entry per image. Paths are relative to the repo root; resize is a sharp resize() options
 * object or null; webp, if present, replaces the default lossy encoder options.
 */
export const JOBS = Object.freeze([
  { src: "images/projects/velune.png", out: "images/projects/velune.webp", resize: SHOT },
  { src: "images/projects/A-Day-in-Dhaka.png", out: "images/projects/A-Day-in-Dhaka.webp", resize: SHOT },
  { src: "images/projects/BizStudio.png", out: "images/projects/BizStudio.webp", resize: SHOT },
  { src: "images/projects/CareCompass.png", out: "images/projects/CareCompass.webp", resize: SHOT },
  { src: "images/developer-placeholder.png", out: "images/developer-placeholder.webp", resize: null },
  {
    src: "images/socialpage.png",
    out: "images/socialpage.webp",
    resize: { width: 800, withoutEnlargement: true },
  },
  { src: "images/Certificate/Certificate_img.png", out: "images/Certificate/Certificate_img.webp", resize: null },
  {
    src: "images/logo/Vite.js.png",
    out: "images/logo/Vite.js.webp",
    resize: { width: 56, height: 56, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } },
    // Tiny saturated logo: 4:2:0 chroma subsampling bleeds colour around the bolt, so keep it lossless.
    webp: { lossless: true, effort: 6 },
  },
]);

/**
 * Encode one job: lossy WebP first, falling back to lossless if lossy is not smaller than the source.
 * Writes the output file and returns sizes and dimensions.
 */
export async function encode(job) {
  const srcAbs = path.join(ROOT, job.src);
  const outAbs = path.join(ROOT, job.out);
  if (!outAbs.endsWith(".webp")) throw new Error(`refusing to write non-.webp output: ${job.out}`);
  const srcBytes = (await stat(srcAbs)).size;

  const pipeline = () => {
    const img = sharp(srcAbs);
    return job.resize ? img.resize(job.resize) : img;
  };

  let { data, info } = await pipeline()
    .webp(job.webp ?? { quality: 80, alphaQuality: 90, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  if (data.length >= srcBytes) {
    const lossless = await pipeline().webp({ lossless: true, effort: 6 }).toBuffer({ resolveWithObject: true });
    if (lossless.data.length < data.length) ({ data, info } = lossless);
  }

  await writeFile(outAbs, data);
  return { src: job.src, out: job.out, srcBytes, outBytes: data.length, width: info.width, height: info.height };
}

/** Source dimensions, for the report line. */
async function dimsOf(rel) {
  const m = await sharp(path.join(ROOT, rel)).metadata();
  return `${m.width}x${m.height}`;
}

async function main() {
  let totalSrc = 0;
  let totalOut = 0;
  for (const job of JOBS) {
    const srcDims = await dimsOf(job.src);
    const r = await encode(job);
    totalSrc += r.srcBytes;
    totalOut += r.outBytes;
    const pct = Math.round((1 - r.outBytes / r.srcBytes) * 100);
    console.log(
      `${r.src}  ${srcDims}  ${r.srcBytes} -> ${r.out}  ${r.width}x${r.height}  ${r.outBytes}  (-${pct}%)`,
    );
    if (r.outBytes >= r.srcBytes) {
      console.error(`WARN: ${r.out} is not smaller than ${r.src}`);
      process.exitCode = 1;
    }
  }
  const totalPct = Math.round((1 - totalOut / totalSrc) * 100);
  console.log(`TOTAL  ${totalSrc} -> ${totalOut}  (-${totalPct}%)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
