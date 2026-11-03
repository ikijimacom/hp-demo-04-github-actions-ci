"use strict";

// index.html の中身を確かめるテスト。
// 追加のパッケージは使わず、Node.js に最初から入っている
// node:test / node:assert / node:fs / node:path だけで書いています。

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

// 開始タグを探して、属性をオブジェクトにして返す小さな道具。
function findTags(tagName) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>`, "gi");
  return [...html.matchAll(pattern)].map((match) => parseAttributes(match[1]));
}

function parseAttributes(source) {
  const attributes = {};
  const pattern = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function textOf(tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, "gi");
  return [...html.matchAll(pattern)].map((match) =>
    match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
  );
}

test("doctype が書かれている", () => {
  assert.match(html, /^<!doctype html>/i);
});

test("html 要素の言語が日本語になっている", () => {
  const [htmlTag] = findTags("html");
  assert.equal(htmlTag.lang, "ja");
});

test("文字コードが utf-8 になっている", () => {
  const metas = findTags("meta");
  assert.ok(metas.some((meta) => meta.charset?.toLowerCase() === "utf-8"));
});

test("スマホ向けの viewport が設定されている", () => {
  const viewport = findTags("meta").find((meta) => meta.name === "viewport");
  assert.ok(viewport, "viewport の meta がない");
  assert.match(viewport.content, /width=device-width/);
});

test("ページの説明 (description) が空でない", () => {
  const description = findTags("meta").find((meta) => meta.name === "description");
  assert.ok(description, "description の meta がない");
  assert.ok(description.content.trim().length > 0);
});

test("タイトルが「コハクの好きなもの」になっている", () => {
  assert.deepEqual(textOf("title"), ["コハクの好きなもの"]);
});

test("読み込む CSS と JavaScript のファイルが実際にある", () => {
  const stylesheets = findTags("link").filter((link) => link.rel === "stylesheet");
  const scripts = findTags("script").filter((script) => script.src);

  assert.ok(stylesheets.length > 0, "CSS が読み込まれていない");
  assert.ok(scripts.length > 0, "JavaScript が読み込まれていない");

  for (const file of [...stylesheets.map((l) => l.href), ...scripts.map((s) => s.src)]) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} が見つからない`);
  }
});

test("script は defer つきで読み込まれている", () => {
  for (const script of findTags("script").filter((s) => s.src)) {
    assert.ok("defer" in script, `${script.src} に defer がない`);
  }
});

test("h1 はページに1つだけ", () => {
  assert.equal(findTags("h1").length, 1);
});

test("main 要素が1つある", () => {
  assert.equal(findTags("main").length, 1);
});

test("好きなもののカードが3枚ある", () => {
  assert.deepEqual(textOf("h3"), ["月あかりソーダ", "雲の切符", "ねむり星のラジオ"]);
});

test("id が重複していない", () => {
  const ids = [...html.matchAll(/\sid="([^"]*)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);
});

test("aria-labelledby が指す id が存在する", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]*)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/aria-labelledby="([^"]*)"/g)) {
    assert.ok(ids.has(match[1]), `id="${match[1]}" が見つからない`);
  }
});

test("説明ボタンは正しい初期状態になっている", () => {
  const ids = new Set([...html.matchAll(/\sid="([^"]*)"/g)].map((match) => match[1]));
  const buttons = findTags("button");

  assert.equal(buttons.length, 3);
  for (const button of buttons) {
    assert.equal(button.type, "button", "type=\"button\" がない");
    assert.equal(button["aria-expanded"], "false", "最初は閉じた状態にする");
    assert.ok(ids.has(button["aria-controls"]), `aria-controls="${button["aria-controls"]}" の先がない`);
    // JavaScript が動かないときはボタンを出さず、説明文をそのまま見せる
    assert.ok("hidden" in button, "ボタンは最初 hidden にしておく");
  }
});

test("説明文は HTML の段階では隠されていない", () => {
  const details = findTags("p").filter((p) => p.class === "detail");
  assert.equal(details.length, 3);
  for (const detail of details) {
    assert.ok(!("hidden" in detail), `${detail.id} が最初から hidden になっている`);
  }
});

test("img 要素があれば alt が付いている", () => {
  for (const img of findTags("img")) {
    assert.ok("alt" in img, `${img.src} に alt がない`);
  }
});

test("架空であることがフッターに書かれている", () => {
  const [footer] = textOf("footer");
  assert.match(footer, /架空/);
});
