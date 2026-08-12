#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import {
  access,
  mkdir,
  readFile,
  readdir,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultWikiRoot = path.resolve(scriptDirectory, '..');
const defaultVaultRoot = path.resolve(defaultWikiRoot, '..', '..');

const SKIPPED_DIRECTORIES = new Set([
  '.git',
  '.obsidian',
  'build',
  'dist',
  'generated',
  'node_modules',
  'state',
  'target',
  'tests',
  'tools',
]);
const REQUIRED_METADATA = ['wiki_id', 'title', 'kind', 'authority', 'status', 'owner', 'summary'];
const AUTHORITIES = new Set(['canonical', 'derived', 'evidence', 'mixed']);
const OWNERS = new Set(['human', 'llm']);

function toPosix(value) {
  return value.replaceAll('\\', '/');
}

function normalized(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('en-US').trim();
}

function stripMarkdownExtension(value) {
  return value.replace(/\.md$/i, '');
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function parseArguments(argv) {
  const options = {
    json: false,
    vaultRoot: defaultVaultRoot,
    wikiRoot: defaultWikiRoot,
    limit: 10,
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') {
      options.json = true;
    } else if (argument === '--wiki-root') {
      options.wikiRoot = path.resolve(requiredOptionValue(argv, ++index, argument));
    } else if (argument === '--vault-root') {
      options.vaultRoot = path.resolve(requiredOptionValue(argv, ++index, argument));
    } else if (argument === '--limit') {
      options.limit = Number.parseInt(requiredOptionValue(argv, ++index, argument), 10);
      if (!Number.isInteger(options.limit) || options.limit < 1) {
        throw new Error('--limit must be a positive integer');
      }
    } else if (argument.startsWith('--')) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }

  const [command, ...args] = positional;
  if (!command) {
    throw new Error('Usage: wiki.mjs <build|route|neighbors|snapshot|freshness|lint|reconcile|hook> [args] [--json]');
  }
  if (!isInside(options.vaultRoot, options.wikiRoot)) {
    throw new Error('--wiki-root must be inside --vault-root');
  }
  return { command, args, options };
}

function requiredOptionValue(argv, index, option) {
  const value = argv[index];
  if (!value || value.startsWith('--')) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function walkMarkdown(root, { skipOperational = false } = {}) {
  const files = [];
  if (!(await exists(root))) return files;

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = toPosix(path.relative(root, absolute));
      if (entry.isDirectory()) {
        if (entry.name.startsWith('.') || SKIPPED_DIRECTORIES.has(entry.name)) continue;
        await visit(absolute);
      } else if (entry.isFile() && entry.name.toLocaleLowerCase('en-US').endsWith('.md')) {
        if (skipOperational && relative === 'index.md') continue;
        files.push(absolute);
      }
    }
  }

  await visit(root);
  return files;
}

function parseScalar(rawValue) {
  const value = rawValue.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const body = value.slice(1, -1);
    return value.startsWith('"')
      ? body.replaceAll('\\"', '"').replaceAll('\\n', '\n').replaceAll('\\\\', '\\')
      : body.replaceAll("''", "'");
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  return value;
}

function parseInlineList(rawValue) {
  const inner = rawValue.trim().slice(1, -1);
  if (!inner.trim()) return [];
  const values = [];
  let current = '';
  let quote = null;
  for (let index = 0; index < inner.length; index += 1) {
    const character = inner[index];
    if ((character === '"' || character === "'") && inner[index - 1] !== '\\') {
      quote = quote === character ? null : quote ?? character;
      current += character;
    } else if (character === ',' && quote === null) {
      values.push(parseScalar(current));
      current = '';
    } else {
      current += character;
    }
  }
  values.push(parseScalar(current));
  return values;
}

function parseFrontmatter(text) {
  const match = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { metadata: {}, body: text, hasFrontmatter: false };

  const metadata = {};
  const lines = match[1].split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#') || /^\s/.test(line)) continue;
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) continue;
    const [, key, rawValue = ''] = keyMatch;
    if (rawValue.trim() !== '') {
      metadata[key] = rawValue.trim().startsWith('[') && rawValue.trim().endsWith(']')
        ? parseInlineList(rawValue)
        : parseScalar(rawValue);
      continue;
    }

    const list = [];
    let cursor = index + 1;
    while (cursor < lines.length) {
      const listMatch = lines[cursor].match(/^\s+-\s+(.*)$/);
      if (!listMatch) break;
      list.push(parseScalar(listMatch[1]));
      cursor += 1;
    }
    metadata[key] = list;
    index = cursor - 1;
  }
  return { metadata, body: text.slice(match[0].length), hasFrontmatter: true };
}

function asList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (value === undefined || value === null || value === '') return [];
  return [String(value).trim()].filter(Boolean);
}

function extractWikiLinks(text) {
  const links = [];
  const expression = /!?\[\[([^\]]+)\]\]/g;
  for (const match of text.matchAll(expression)) {
    const target = match[1].split('|', 1)[0].split('#', 1)[0].trim();
    if (target) links.push(target);
  }
  return links;
}

function extractMarkdownLinks(text) {
  const links = [];
  const expression = /(?<!!)\[[^\]]*\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of text.matchAll(expression)) {
    let target = match[1].replace(/^<|>$/g, '').split('#', 1)[0].trim();
    try {
      target = decodeURIComponent(target);
    } catch {
      // Preserve malformed escape sequences so lint can report an unresolved link.
    }
    if (target) links.push(target);
  }
  return links;
}

function stripCodeExamples(text) {
  const withoutFences = text.replace(
    /^[ \t]*(`{3,}|~{3,})[^\r\n]*\r?\n[\s\S]*?^[ \t]*\1[ \t]*(?:\r?\n|$)/gm,
    '',
  );
  return withoutFences.replace(/`[^`\r\n]*`/g, '');
}

function extractKnowledgeLinks(text) {
  const prose = stripCodeExamples(text);
  return [...new Set([...extractWikiLinks(prose), ...extractMarkdownLinks(prose)])];
}

function firstHeading(body) {
  return body.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

async function readNote(file, roots, isWikiNote) {
  const raw = await readFile(file, 'utf8');
  const { metadata, body, hasFrontmatter } = parseFrontmatter(raw);
  const vaultPath = toPosix(path.relative(roots.vaultRoot, file));
  const wikiPath = isWikiNote ? toPosix(path.relative(roots.wikiRoot, file)) : null;
  const title = String(metadata.title ?? firstHeading(body) ?? path.basename(file, path.extname(file))).trim();
  const related = asList(metadata.related).flatMap(extractWikiLinks);
  const bodyLinks = extractKnowledgeLinks(body);
  return {
    absolutePath: file,
    aliases: asList(metadata.aliases),
    authority: metadata.authority === undefined ? null : String(metadata.authority),
    body,
    hasFrontmatter,
    kind: metadata.kind === undefined ? null : String(metadata.kind),
    links: [...new Set([...related, ...bodyLinks])],
    metadata,
    owner: metadata.owner === undefined ? null : String(metadata.owner),
    path: wikiPath,
    sourceRefs: asList(metadata.source_refs),
    status: metadata.status === undefined ? null : String(metadata.status),
    summary: metadata.summary === undefined ? '' : String(metadata.summary),
    title,
    topics: asList(metadata.topics),
    vaultPath,
    wikiId: metadata.wiki_id === undefined ? null : String(metadata.wiki_id),
  };
}

async function loadWiki(options) {
  const files = await walkMarkdown(options.wikiRoot, { skipOperational: true });
  const notes = await Promise.all(files.map((file) => readNote(file, options, true)));
  notes.sort((left, right) => left.path.localeCompare(right.path, 'en'));
  return notes;
}

function addIndexValue(index, key, note) {
  const normalizedKey = normalized(key);
  if (!normalizedKey) return;
  const values = index.get(normalizedKey) ?? [];
  if (!values.some((value) => value.vaultPath === note.vaultPath)) values.push(note);
  values.sort((left, right) => left.vaultPath.localeCompare(right.vaultPath, 'en'));
  index.set(normalizedKey, values);
}

async function createResolutionIndex(options, wikiNotes) {
  const index = new Map();
  const wikiByVaultPath = new Map(wikiNotes.map((note) => [note.vaultPath, note]));
  const files = await walkMarkdown(options.vaultRoot);
  for (const file of files) {
    const vaultPath = toPosix(path.relative(options.vaultRoot, file));
    let note = wikiByVaultPath.get(vaultPath);
    if (!note) note = await readNote(file, options, false);
    const withoutExtension = stripMarkdownExtension(vaultPath);
    addIndexValue(index, vaultPath, note);
    addIndexValue(index, withoutExtension, note);
    addIndexValue(index, path.posix.basename(withoutExtension), note);
    addIndexValue(index, note.title, note);
    for (const alias of note.aliases) addIndexValue(index, alias, note);
    if (note.wikiId) addIndexValue(index, note.wikiId, note);
  }
  return index;
}

function linkCandidates(target, fromNote, options) {
  const cleaned = toPosix(target.trim()).replace(/^\.\//, '');
  const candidates = new Set([cleaned, stripMarkdownExtension(cleaned)]);
  if (fromNote && (target.startsWith('.') || target.includes('/'))) {
    const relativeAbsolute = path.resolve(path.dirname(fromNote.absolutePath), target);
    if (isInside(options.vaultRoot, relativeAbsolute)) {
      const relative = toPosix(path.relative(options.vaultRoot, relativeAbsolute));
      candidates.add(relative);
      candidates.add(stripMarkdownExtension(relative));
    }
  }
  return [...candidates];
}

function resolveWikiLink(target, fromNote, index, options) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return { external: true, matches: [] };
  for (const candidate of linkCandidates(target, fromNote, options)) {
    const matches = index.get(normalized(candidate));
    if (matches?.length) return { external: false, matches };
  }
  return { external: false, matches: [] };
}

function unwrapSourceRef(reference) {
  const wikiLink = reference.match(/^!?\[\[([^\]]+)\]\]$/);
  const target = wikiLink ? wikiLink[1].split('|', 1)[0] : reference;
  return target.split('#', 1)[0].trim();
}

async function resolveSourceRef(reference, fromNote, index, options) {
  const target = unwrapSourceRef(reference);
  if (/^https?:\/\//i.test(target)) return { external: true, reference, target };

  const wikiResolution = resolveWikiLink(target, fromNote, index, options);
  if (wikiResolution.matches.length === 1) {
    const note = wikiResolution.matches[0];
    return { absolutePath: note.absolutePath, external: false, path: note.vaultPath, reference, target };
  }

  const rawCandidates = [];
  const targetPath = target.replaceAll('/', path.sep);
  rawCandidates.push(path.resolve(options.vaultRoot, targetPath));
  rawCandidates.push(path.resolve(path.dirname(fromNote.absolutePath), targetPath));
  if (!path.extname(targetPath)) {
    rawCandidates.push(path.resolve(options.vaultRoot, `${targetPath}.md`));
    rawCandidates.push(path.resolve(path.dirname(fromNote.absolutePath), `${targetPath}.md`));
  }

  for (const candidate of rawCandidates) {
    if (!isInside(options.vaultRoot, candidate)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile() || info.isDirectory()) {
        return {
          absolutePath: candidate,
          external: false,
          kind: info.isDirectory() ? 'directory' : 'file',
          path: toPosix(path.relative(options.vaultRoot, candidate)),
          reference,
          target,
        };
      }
    } catch {
      // Try the next deterministic candidate.
    }
  }
  return { external: false, missing: true, reference, target };
}

async function existingFilesystemTarget(target, fromNote, options) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return false;
  const targetPath = target.replaceAll('/', path.sep);
  const candidates = [
    path.resolve(path.dirname(fromNote.absolutePath), targetPath),
    path.resolve(options.vaultRoot, targetPath.replace(/^[/\\]+/, '')),
  ];
  for (const candidate of candidates) {
    if (!isInside(options.vaultRoot, candidate)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile() || info.isDirectory()) return true;
    } catch {
      // Try the next deterministic candidate.
    }
  }
  return false;
}

function isWritable(note) {
  return note.authority === 'derived' && note.owner === 'llm';
}

function publicNote(note) {
  return {
    aliases: note.aliases,
    authority: note.authority,
    kind: note.kind,
    owner: note.owner,
    path: note.path,
    source_refs: note.sourceRefs,
    status: note.status,
    summary: note.summary,
    title: note.title,
    topics: note.topics,
    wiki_id: note.wikiId,
    writable: isWritable(note),
  };
}

function createCatalog(notes) {
  return {
    notes: notes.map(publicNote),
    version: 1,
  };
}

function createGraph(notes, index, options) {
  const wikiByVaultPath = new Map(notes.map((note) => [note.vaultPath, note]));
  const edges = [];
  for (const note of notes) {
    for (const target of note.links) {
      const resolution = resolveWikiLink(target, note, index, options);
      if (resolution.matches.length === 1) {
        const resolved = resolution.matches[0];
        edges.push({
          from: note.wikiId ?? note.path,
          from_path: note.path,
          target,
          to: wikiByVaultPath.get(resolved.vaultPath)?.wikiId ?? null,
          to_path: resolved.vaultPath,
        });
      } else {
        edges.push({
          from: note.wikiId ?? note.path,
          from_path: note.path,
          target,
          to: null,
          to_path: null,
        });
      }
    }
  }
  edges.sort((left, right) =>
    `${left.from_path}\0${left.to_path ?? ''}\0${left.target}`.localeCompare(
      `${right.from_path}\0${right.to_path ?? ''}\0${right.target}`,
      'en',
    ));
  return {
    edges,
    nodes: notes.map((note) => ({
      authority: note.authority,
      path: note.path,
      status: note.status,
      title: note.title,
      wiki_id: note.wikiId,
    })),
    version: 1,
  };
}

function escapeTable(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function renderIndex(notes) {
  const lines = [
    '---',
    'wiki_generated: true',
    '---',
    '',
    '# LLM Wiki Index',
    '',
    '> Generated by `node docs/wiki/tools/wiki.mjs build`. Do not edit by hand.',
    '',
    '| Note | Kind | Authority | Status | Owner |',
    '|---|---|---|---|---|',
  ];
  const sorted = [...notes].sort((left, right) =>
    left.title.localeCompare(right.title, 'ko') || left.path.localeCompare(right.path, 'en'));
  for (const note of sorted) {
    const target = stripMarkdownExtension(note.path);
    lines.push(`| [[${target}|${escapeTable(note.title)}]] | ${escapeTable(note.kind)} | ${escapeTable(note.authority)} | ${escapeTable(note.status)} | ${escapeTable(note.owner)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeIfChanged(file, content) {
  let current = null;
  try {
    current = await readFile(file, 'utf8');
  } catch {
    // Missing output is created below.
  }
  if (current === content) return false;
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, 'utf8');
  return true;
}

async function wikiContext(options) {
  const notes = await loadWiki(options);
  const index = await createResolutionIndex(options, notes);
  return { index, notes };
}

async function buildCommand(options) {
  const { notes, index } = await wikiContext(options);
  const outputs = [
    ['generated/catalog.json', stableJson(createCatalog(notes))],
    ['generated/graph.json', stableJson(createGraph(notes, index, options))],
    ['index.md', renderIndex(notes)],
  ];
  const changed = [];
  for (const [relative, content] of outputs) {
    if (await writeIfChanged(path.join(options.wikiRoot, ...relative.split('/')), content)) changed.push(relative);
  }
  return {
    data: { changed, notes: notes.length, outputs: outputs.map(([relative]) => relative) },
    status: 0,
  };
}

function queryTokens(query) {
  return normalized(query).match(/[\p{L}\p{N}_.-]+/gu) ?? [];
}

function scoreNote(note, query) {
  const phrase = normalized(query);
  const tokens = queryTokens(query);
  const fields = {
    aliases: normalized(note.aliases.join(' ')),
    body: normalized(note.body),
    id: normalized(note.wikiId),
    path: normalized(note.path),
    summary: normalized(note.summary),
    title: normalized(note.title),
    topics: normalized(note.topics.join(' ')),
  };
  let score = 0;
  if (fields.title === phrase) score += 250;
  if (note.aliases.some((alias) => normalized(alias) === phrase)) score += 220;
  if (fields.id === phrase) score += 240;
  if (stripMarkdownExtension(fields.path) === stripMarkdownExtension(phrase)) score += 210;
  if (phrase && fields.title.includes(phrase)) score += 100;
  if (phrase && fields.aliases.includes(phrase)) score += 80;
  if (phrase && fields.summary.includes(phrase)) score += 35;
  for (const token of tokens) {
    if (fields.title.includes(token)) score += 24;
    if (fields.aliases.includes(token)) score += 18;
    if (fields.topics.includes(token)) score += 14;
    if (fields.id.includes(token) || fields.path.includes(token)) score += 10;
    if (fields.summary.includes(token)) score += 7;
    if (fields.body.includes(token)) score += 2;
  }
  return score;
}

async function routeCommand(args, options) {
  const query = args.join(' ').trim();
  if (!query) throw new Error('route requires a query');
  const notes = await loadWiki(options);
  const results = notes
    .map((note) => ({ note, score: scoreNote(note, query) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.note.path.localeCompare(right.note.path, 'en'))
    .slice(0, options.limit)
    .map(({ note, score }) => ({ ...publicNote(note), score }));
  return { data: { query, results }, status: 0 };
}

async function readStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

function promptFromHookPayload(payload) {
  for (const candidate of [payload?.prompt, payload?.user_prompt, payload?.message, payload?.input]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return '';
}

async function hookCommand(args, options) {
  const requestedEvent = String(args[0] ?? '').trim();
  let payload;
  try {
    const raw = await readStdin();
    payload = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return { data: { reason: 'invalid-json', skipped: true }, status: 0 };
  }

  const event = requestedEvent || String(payload?.hook_event_name ?? payload?.hookEventName ?? '').trim();
  if (normalized(event) !== normalized('UserPromptSubmit')) {
    return { data: { event, reason: 'unsupported-event', skipped: true }, status: 0 };
  }

  const prompt = promptFromHookPayload(payload);
  if (!prompt) return { data: { event, reason: 'missing-prompt', skipped: true }, status: 0 };

  const routed = await routeCommand([prompt], { ...options, limit: Math.min(options.limit, 3) });
  const lines = [
    '[Project LLM Wiki auto-route]',
    `Query: ${prompt}`,
  ];
  if (routed.data.results.length === 0) {
    lines.push('No matching Wiki note. Search docs/wiki with rg before assuming project facts.');
  } else {
    lines.push('Routed notes (read the relevant files before acting):');
    for (const result of routed.data.results) {
      lines.push(
        `- ${result.wiki_id ?? '-'} | docs/wiki/${result.path} | `
        + `authority=${result.authority ?? '-'} owner=${result.owner ?? '-'} status=${result.status ?? '-'} writable=${result.writable}`,
      );
      if (result.summary) lines.push(`  summary: ${result.summary}`);
    }
  }
  lines.push('Check source_refs and freshness for material claims; expand only one link/backlink hop when needed.');
  lines.push('Do not resolve conflicts or edit canonical/mixed/evidence notes. Write only derived+llm durable deltas, then reconcile.');

  return {
    data: {
      hookSpecificOutput: {
        additionalContext: lines.join('\n'),
        hookEventName: 'UserPromptSubmit',
      },
    },
    status: 0,
  };
}

function findNote(notes, selector) {
  const sought = normalized(selector);
  const matches = notes.filter((note) => [
    note.wikiId,
    note.title,
    note.path,
    stripMarkdownExtension(note.path),
    path.posix.basename(stripMarkdownExtension(note.path)),
    ...note.aliases,
  ].some((candidate) => normalized(candidate) === sought));
  if (matches.length === 0) throw new Error(`Wiki note not found: ${selector}`);
  if (matches.length > 1) throw new Error(`Wiki note selector is ambiguous: ${selector}`);
  return matches[0];
}

function sortPublicNotes(notes) {
  return notes.map(publicNote).sort((left, right) =>
    left.title.localeCompare(right.title, 'ko') || left.path.localeCompare(right.path, 'en'));
}

async function neighborsCommand(args, options) {
  const selector = args.join(' ').trim();
  if (!selector) throw new Error('neighbors requires a wiki_id, title, or path');
  const { notes, index } = await wikiContext(options);
  const target = findNote(notes, selector);
  const wikiByVaultPath = new Map(notes.map((note) => [note.vaultPath, note]));

  const outgoing = new Map();
  for (const link of target.links) {
    const resolution = resolveWikiLink(link, target, index, options);
    if (resolution.matches.length === 1) {
      const neighbor = wikiByVaultPath.get(resolution.matches[0].vaultPath);
      if (neighbor && neighbor.path !== target.path) outgoing.set(neighbor.path, neighbor);
    }
  }

  const backlinks = new Map();
  for (const candidate of notes) {
    if (candidate.path === target.path) continue;
    const linksToTarget = candidate.links.some((link) => {
      const resolution = resolveWikiLink(link, candidate, index, options);
      return resolution.matches.length === 1 && resolution.matches[0].vaultPath === target.vaultPath;
    });
    if (linksToTarget) backlinks.set(candidate.path, candidate);
  }

  return {
    data: {
      backlinks: sortPublicNotes([...backlinks.values()]),
      outgoing: sortPublicNotes([...outgoing.values()]),
      target: publicNote(target),
    },
    status: 0,
  };
}

async function sha256(file) {
  const hash = createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

async function directoryFingerprint(directory) {
  const entries = [];
  let size = 0;

  async function visit(current) {
    const children = await readdir(current, { withFileTypes: true });
    children.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const child of children) {
      if (child.name.startsWith('.')) continue;
      const absolute = path.join(current, child.name);
      if (child.isDirectory()) {
        if (SKIPPED_DIRECTORIES.has(child.name)) continue;
        await visit(absolute);
      } else if (child.isFile()) {
        const relative = toPosix(path.relative(directory, absolute));
        const info = await stat(absolute);
        entries.push(`${relative}\t${await sha256(absolute)}\n`);
        size += info.size;
      }
    }
  }

  await visit(directory);
  const hash = createHash('sha256');
  for (const entry of entries) hash.update(entry, 'utf8');
  return { file_count: entries.length, kind: 'directory', sha256: hash.digest('hex'), size };
}

async function collectSources(notes, index, options) {
  const sources = new Map();
  const missing = [];
  const external = [];
  for (const note of notes) {
    for (const reference of note.sourceRefs) {
      const resolved = await resolveSourceRef(reference, note, index, options);
      if (resolved.external) {
        external.push({ from: note.path, reference, target: resolved.target });
      } else if (resolved.missing) {
        missing.push({ from: note.path, reference, target: resolved.target });
      } else if (!sources.has(resolved.path)) {
        if (resolved.kind === 'directory') {
          sources.set(resolved.path, {
            path: resolved.path,
            ...await directoryFingerprint(resolved.absolutePath),
          });
        } else {
          const info = await stat(resolved.absolutePath);
          sources.set(resolved.path, {
            kind: 'file',
            path: resolved.path,
            sha256: await sha256(resolved.absolutePath),
            size: info.size,
          });
        }
      }
    }
  }
  const byKey = (left, right) => `${left.from ?? ''}\0${left.path ?? left.target}`.localeCompare(`${right.from ?? ''}\0${right.path ?? right.target}`, 'en');
  return {
    external: external.sort(byKey),
    missing: missing.sort(byKey),
    sources: [...sources.values()].sort((left, right) => left.path.localeCompare(right.path, 'en')),
  };
}

async function snapshotCommand(options) {
  const { notes, index } = await wikiContext(options);
  const collected = await collectSources(notes, index, options);
  if (collected.missing.length > 0) {
    return { data: { ...collected, written: false }, status: 1 };
  }
  const state = { sources: collected.sources, version: 1 };
  const stateFile = path.join(options.wikiRoot, 'state', 'sources.json');
  const changed = await writeIfChanged(stateFile, stableJson(state));
  return {
    data: {
      external: collected.external,
      missing: [],
      sources: collected.sources,
      state: 'state/sources.json',
      written: changed,
    },
    status: 0,
  };
}

async function readSnapshot(options) {
  const file = path.join(options.wikiRoot, 'state', 'sources.json');
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    return { file, snapshot: parsed };
  } catch (error) {
    if (error?.code === 'ENOENT') return { file, snapshot: null };
    throw new Error(`Cannot read source snapshot: ${error.message}`);
  }
}

async function freshnessCommand(options) {
  const { notes, index } = await wikiContext(options);
  const collected = await collectSources(notes, index, options);
  const { snapshot } = await readSnapshot(options);
  const recorded = new Map((snapshot?.sources ?? []).map((source) => [source.path, source]));
  const currentPaths = new Set(collected.sources.map((source) => source.path));
  const changed = [];
  const current = [];
  const untracked = [];

  for (const source of collected.sources) {
    const baseline = recorded.get(source.path);
    if (!baseline) untracked.push(source);
    else if (baseline.sha256 !== source.sha256) changed.push({ ...source, previous_sha256: baseline.sha256 });
    else current.push(source);
  }
  const retired = [...recorded.values()]
    .filter((source) => !currentPaths.has(source.path))
    .sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const fresh = Boolean(snapshot)
    && changed.length === 0
    && collected.missing.length === 0
    && untracked.length === 0;
  return {
    data: {
      changed,
      current,
      external: collected.external,
      fresh,
      missing: collected.missing,
      retired,
      snapshot_missing: !snapshot,
      untracked,
    },
    status: fresh ? 0 : 1,
  };
}

function issue(code, note, detail = {}) {
  return { code, path: note?.path ?? null, ...detail };
}

function sortIssues(issues) {
  return issues.sort((left, right) =>
    `${left.code}\0${left.path ?? ''}\0${left.target ?? left.field ?? ''}`.localeCompare(
      `${right.code}\0${right.path ?? ''}\0${right.target ?? right.field ?? ''}`,
      'en',
    ));
}

async function lintCommand(options) {
  const { notes, index } = await wikiContext(options);
  const errors = [];
  const warnings = [];
  const ids = new Map();

  for (const note of notes) {
    for (const field of REQUIRED_METADATA) {
      if (note.metadata[field] === undefined || note.metadata[field] === null || note.metadata[field] === '') {
        errors.push(issue('missing-metadata', note, { field }));
      }
    }
    if (note.wikiId) {
      const duplicates = ids.get(note.wikiId) ?? [];
      duplicates.push(note);
      ids.set(note.wikiId, duplicates);
    }
    if (note.authority && !AUTHORITIES.has(note.authority)) {
      errors.push(issue('invalid-authority', note, { authority: note.authority }));
    }
    if (note.owner && !OWNERS.has(note.owner)) {
      errors.push(issue('invalid-owner', note, { owner: note.owner }));
    }
    if (note.owner === 'llm' && note.authority !== 'derived') {
      errors.push(issue('unsafe-owner-authority', note, { authority: note.authority, owner: note.owner }));
    }
    if (note.authority === 'derived' && note.sourceRefs.length === 0) {
      errors.push(issue('missing-source-refs', note));
    }
  }

  for (const [wikiId, duplicates] of ids) {
    if (duplicates.length > 1) {
      for (const note of duplicates) errors.push(issue('duplicate-wiki-id', note, { wiki_id: wikiId }));
    }
  }

  const wikiByVaultPath = new Map(notes.map((note) => [note.vaultPath, note]));
  const degrees = new Map(notes.map((note) => [note.path, 0]));
  for (const note of notes) {
    for (const target of note.links) {
      const resolution = resolveWikiLink(target, note, index, options);
      if (resolution.external) continue;
      if (resolution.matches.length === 0) {
        if (!(await existingFilesystemTarget(target, note, options))) {
          errors.push(issue('broken-link', note, { target }));
        }
      } else if (resolution.matches.length > 1) {
        errors.push(issue('ambiguous-link', note, { matches: resolution.matches.map((match) => match.vaultPath), target }));
      } else {
        const neighbor = wikiByVaultPath.get(resolution.matches[0].vaultPath);
        if (neighbor && neighbor.path !== note.path) {
          degrees.set(note.path, degrees.get(note.path) + 1);
          degrees.set(neighbor.path, degrees.get(neighbor.path) + 1);
        }
      }
    }
    for (const reference of note.sourceRefs) {
      const resolved = await resolveSourceRef(reference, note, index, options);
      if (resolved.missing) errors.push(issue('missing-source', note, { reference, target: resolved.target }));
    }
  }

  for (const note of notes) {
    if (degrees.get(note.path) === 0) warnings.push(issue('orphan-note', note));
  }

  const expectedIndex = renderIndex(notes);
  const indexFile = path.join(options.wikiRoot, 'index.md');
  let actualIndex = null;
  try {
    actualIndex = await readFile(indexFile, 'utf8');
  } catch {
    // Report a single synchronization issue below.
  }
  if (actualIndex !== expectedIndex) errors.push(issue('index-out-of-sync', null, { expected: 'run wiki.mjs build' }));

  sortIssues(errors);
  sortIssues(warnings);
  return {
    data: {
      errors,
      notes: notes.length,
      ok: errors.length === 0,
      policy: 'Only authority=derived and owner=llm notes are auto-writable.',
      warnings,
    },
    status: errors.length === 0 ? 0 : 1,
  };
}

async function reconcileCommand(options) {
  const build = await buildCommand(options);
  const freshness = await freshnessCommand(options);
  const lint = await lintCommand(options);
  const ok = freshness.status === 0 && lint.status === 0;
  return {
    data: {
      build: build.data,
      freshness: freshness.data,
      lint: lint.data,
      ok,
    },
    status: ok ? 0 : 1,
  };
}

function humanOutput(command, data) {
  if (command === 'route') {
    if (data.results.length === 0) return `No Wiki matches for: ${data.query}`;
    return data.results.map((result) =>
      `${result.score}\t${result.wiki_id ?? '-'}\t${result.title}\t${result.status ?? '-'}\t${result.path}`).join('\n');
  }
  if (command === 'neighbors') {
    const outgoing = data.outgoing.map((note) => note.title).join(', ') || '-';
    const backlinks = data.backlinks.map((note) => note.title).join(', ') || '-';
    return [`Target: ${data.target.title}`, `Outgoing: ${outgoing}`, `Backlinks: ${backlinks}`].join('\n');
  }
  return JSON.stringify(data, null, 2);
}

async function dispatch(command, args, options) {
  switch (command) {
    case 'build': return buildCommand(options);
    case 'route': return routeCommand(args, options);
    case 'neighbors': return neighborsCommand(args, options);
    case 'snapshot': return snapshotCommand(options);
    case 'freshness': return freshnessCommand(options);
    case 'lint': return lintCommand(options);
    case 'reconcile': return reconcileCommand(options);
    case 'hook': return hookCommand(args, options);
    default: throw new Error(`Unknown command: ${command}`);
  }
}

let parsed;
try {
  parsed = parseArguments(process.argv.slice(2));
  const result = await dispatch(parsed.command, parsed.args, parsed.options);
  process.stdout.write(parsed.options.json ? stableJson(result.data) : `${humanOutput(parsed.command, result.data)}\n`);
  process.exitCode = result.status;
} catch (error) {
  const payload = { error: error.message };
  if (parsed?.options?.json || process.argv.includes('--json')) process.stdout.write(stableJson(payload));
  else process.stderr.write(`wiki: ${error.message}\n`);
  process.exitCode = 2;
}
