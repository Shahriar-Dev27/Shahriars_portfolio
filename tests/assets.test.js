import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const readRepoFile = (relativePath) => readFileSync(new URL(relativePath, ROOT), "utf8");

const indexHtml = readRepoFile("index.html");
const scriptJs = readRepoFile("script.js");

const IMAGE_REF = /images\/[A-Za-z0-9_\-./]+?\.(?:png|jpe?g|webp|svg|pdf)/g;

test("every referenced image exists on disk", () => {
  const refs = new Set([
    ...(indexHtml.match(IMAGE_REF) ?? []),
    ...(scriptJs.match(IMAGE_REF) ?? []),
  ]);
  assert.ok(refs.size > 0, "expected to find image references");
  for (const ref of refs) {
    assert.ok(existsSync(new URL(ref, ROOT)), `missing image on disk: ${ref}`);
  }
});

test("no reference to the removed gocart asset", () => {
  for (const file of ["index.html", "script.js", "readme.md", "images/README.md"]) {
    assert.ok(!readRepoFile(file).includes("gocart.png"), `${file} still mentions gocart.png`);
  }
});

test("project images are WebP", () => {
  const images = [...scriptJs.matchAll(/\bimage:\s*"([^"]+)"/g)].map((m) => m[1]);
  assert.equal(images.length, 4, `expected 4 project images, found: ${images.join(", ")}`);
  for (const image of images) {
    assert.ok(image.endsWith(".webp"), `project image is not WebP: ${image}`);
  }
});

test("hero preload matches hero src", () => {
  const preloadTag = indexHtml.match(/<link\b[^>]*rel="preload"[^>]*as="image"[^>]*>/)?.[0];
  assert.ok(preloadTag, "image preload link not found");
  const href = preloadTag.match(/href="([^"]+)"/)?.[1];
  assert.ok(href, "preload link has no href");

  const heroTag = [...indexHtml.matchAll(/<img\b[^>]*>/g)]
    .map((m) => m[0])
    .find((tag) => /class="[^"]*hero__portrait-image--bw[^"]*"/.test(tag));
  assert.ok(heroTag, "hero bw <img> not found");
  const src = heroTag.match(/\bsrc="([^"]+)"/)?.[1];

  assert.equal(href, src);
  assert.ok(href.endsWith(".webp"), `hero preload is not WebP: ${href}`);
});

test("large raster images are WebP", () => {
  const srcs = [...indexHtml.matchAll(/<img\b[^>]*?\bsrc="(images\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 0, "expected <img> tags in index.html");
  for (const src of srcs) {
    if (src.startsWith("images/logo/") || src.endsWith(".svg")) continue;
    assert.ok(src.endsWith(".webp"), `large raster image is not WebP: ${src}`);
  }
});
