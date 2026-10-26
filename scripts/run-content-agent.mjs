// Weekly content agent entry point — run via
// .github/workflows/content-agent.yml (or manually: `node
// scripts/run-content-agent.mjs`). Drafts ONE new SEO blog post and writes
// it directly into src/lib/blogPosts.js; the workflow's own git step
// commits the change. See src/lib/contentAgent.js for generation and the
// guardrails that decide whether anything gets written at all.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { getAllPosts } from "../src/lib/blogPosts.js";
import { generatePost, serializePost } from "../src/lib/contentAgent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_POSTS_PATH = path.join(__dirname, "..", "src", "lib", "blogPosts.js");
const INSERT_MARKER = "export const BLOG_POSTS = [";

async function main() {
  const existingPosts = getAllPosts();
  console.log(`Existing posts: ${existingPosts.length}`);

  const post = await generatePost(existingPosts);
  console.log(`Generated: "${post.title}" (${post.slug})`);

  const fileContent = await readFile(BLOG_POSTS_PATH, "utf8");
  const markerIndex = fileContent.indexOf(INSERT_MARKER);
  if (markerIndex === -1) {
    throw new Error(
      "Couldn't find the BLOG_POSTS array marker in blogPosts.js — aborting rather than risk corrupting the file."
    );
  }

  const insertAt = markerIndex + INSERT_MARKER.length;
  const serialized = "\n" + serializePost(post);
  const newContent = fileContent.slice(0, insertAt) + serialized + fileContent.slice(insertAt);

  await writeFile(BLOG_POSTS_PATH, newContent, "utf8");
  console.log(`Wrote new post into ${BLOG_POSTS_PATH}`);
}

main().catch((err) => {
  console.error("Content agent failed — nothing written, nothing will be committed this run:", err);
  process.exit(1);
});
