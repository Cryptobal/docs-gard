import { promises as fs } from "node:fs";
import path from "node:path";

type DocChunk = {
  id: string;
  title: string;
  body: string;
};

type RetrievalChunk = {
  title: string;
  body: string;
  score: number;
};

type DocsCache = {
  loadedAt: number;
  chunks: DocChunk[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: DocsCache | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

function chunkMarkdown(content: string, fileLabel: string): DocChunk[] {
  const lines = content.split("\n");
  const chunks: DocChunk[] = [];

  let currentTitle = fileLabel;
  let buffer: string[] = [];
  let idCounter = 0;

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (!body) return;
    chunks.push({
      id: `${fileLabel}-${idCounter++}`,
      title: currentTitle,
      body: body.slice(0, 2400),
    });
    buffer = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s+/.test(line)) {
      flush();
      currentTitle = line.replace(/^#{1,3}\s+/, "").trim() || fileLabel;
      continue;
    }
    buffer.push(line);
    if (buffer.join("\n").length > 1800) {
      flush();
    }
  }
  flush();

  return chunks;
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "_deprecated") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

async function loadDocsChunks(): Promise<DocChunk[]> {
  const docsDir = path.join(process.cwd(), "docs");
  const files = await listMarkdownFiles(docsDir);
  const chunks: DocChunk[] = [];

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const fileLabel = path.relative(docsDir, file).replace(/\\/g, "/");
    chunks.push(...chunkMarkdown(raw, fileLabel));
  }

  return chunks;
}

async function getChunks(): Promise<DocChunk[]> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) {
    return cache.chunks;
  }
  const chunks = await loadDocsChunks();
  cache = { loadedAt: Date.now(), chunks };
  return chunks;
}

export async function retrieveDocsContext(
  query: string,
  limit = 6,
): Promise<RetrievalChunk[]> {
  const chunks = await getChunks();
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];
  const qSet = new Set(qTokens);

  const scored = chunks
    .map((chunk) => {
      const bodyTokens = tokenize(`${chunk.title}\n${chunk.body}`);
      let overlap = 0;
      for (const token of bodyTokens) {
        if (qSet.has(token)) overlap += 1;
      }
      const titleBoost = qTokens.some((t) => tokenize(chunk.title).includes(t)) ? 4 : 0;
      const score = overlap + titleBoost;
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk, score }) => ({
      title: chunk.title,
      body: chunk.body,
      score,
    }));

  return scored;
}
