import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cli = path.resolve(here, '../tools/wiki.mjs');
const fixtures = path.join(here, 'fixtures');

async function makeVault(name = 'valid-vault') {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'llm-wiki-'));
  await cp(path.join(fixtures, name), temp, { recursive: true });
  return { vaultRoot: temp, wikiRoot: path.join(temp, 'docs', 'wiki') };
}

function runJson(command, args, roots, options = {}) {
  const result = spawnSync(
    process.execPath,
    [cli, command, ...args, '--wiki-root', roots.wikiRoot, '--vault-root', roots.vaultRoot, '--json'],
    { encoding: 'utf8', ...options },
  );
  const parsed = result.stdout.trim() ? JSON.parse(result.stdout) : null;
  return { ...result, parsed };
}

async function treeFingerprint(root) {
  const entries = [];
  async function walk(directory) {
    for (const item of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, item.name);
      const relative = path.relative(root, absolute).replaceAll('\\', '/');
      if (item.isDirectory()) {
        entries.push(`d:${relative}`);
        await walk(absolute);
      } else {
        const info = await stat(absolute);
        const body = await readFile(absolute, 'base64');
        entries.push(`f:${relative}:${info.size}:${info.mtimeMs}:${body}`);
      }
    }
  }
  await walk(root);
  return entries;
}

test('route returns the strongest metadata match without writing', async () => {
  const roots = await makeVault();
  const before = await treeFingerprint(roots.vaultRoot);
  const result = runJson('route', ['component ownership'], roots);
  const after = await treeFingerprint(roots.vaultRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.results[0].wiki_id, 'component-guide');
  assert.equal(result.parsed.results[0].writable, true);
  assert.deepEqual(after, before);
});

test('neighbors returns one-hop outgoing links and backlinks', async () => {
  const roots = await makeVault();
  const result = runJson('neighbors', ['component-guide'], roots);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.parsed.outgoing.map((note) => note.wiki_id), ['deployment-policy-conflict']);
  assert.deepEqual(result.parsed.backlinks.map((note) => note.wiki_id), ['deployment-policy-conflict']);
});

test('hook preserves a conflict and injects bounded context', async () => {
  const roots = await makeVault();
  const result = runJson('hook', ['UserPromptSubmit'], roots, {
    input: JSON.stringify({ prompt: 'deployment policy conflict' }),
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.parsed.hookSpecificOutput.additionalContext, /deployment-policy-conflict/);
  assert.match(result.parsed.hookSpecificOutput.additionalContext, /conflicted/);
  assert.match(result.parsed.hookSpecificOutput.additionalContext, /writable=false/);
});

test('snapshot and freshness detect a changed source', async () => {
  const roots = await makeVault();
  const snapshot = runJson('snapshot', [], roots);
  assert.equal(snapshot.status, 0, snapshot.stderr);

  await writeFile(path.join(roots.vaultRoot, 'docs', 'source', 'component.md'), '# changed\n', 'utf8');
  const freshness = runJson('freshness', [], roots);
  assert.equal(freshness.status, 1);
  assert.equal(freshness.parsed.changed[0].path, 'docs/source/component.md');
});

test('lint rejects unsafe owner and authority combinations', async () => {
  const roots = await makeVault('invalid-vault');
  const result = runJson('lint', [], roots);
  assert.equal(result.status, 1);
  assert.ok(result.parsed.errors.some((item) => item.code === 'unsafe-owner-authority'));
});

test('build writes deterministic catalog, graph, and index', async () => {
  const roots = await makeVault();
  const first = runJson('build', [], roots);
  assert.equal(first.status, 0, first.stderr);

  const outputs = [
    path.join(roots.wikiRoot, 'generated', 'catalog.json'),
    path.join(roots.wikiRoot, 'generated', 'graph.json'),
    path.join(roots.wikiRoot, 'index.md'),
  ];
  const before = await Promise.all(outputs.map((file) => readFile(file, 'utf8')));
  const second = runJson('build', [], roots);
  const after = await Promise.all(outputs.map((file) => readFile(file, 'utf8')));

  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(after, before);
  assert.equal(JSON.parse(before[0]).notes.length, 2);
  assert.ok(before[2].includes('[[component-guide|Component ownership guide]]'));
});

test('lint detects generated index drift and passes after build', async () => {
  const roots = await makeVault();
  const stale = runJson('lint', [], roots);
  assert.equal(stale.status, 1);
  assert.ok(stale.parsed.errors.some((item) => item.code === 'index-out-of-sync'));

  execFileSync(process.execPath, [cli, 'build', '--wiki-root', roots.wikiRoot, '--vault-root', roots.vaultRoot]);
  const clean = runJson('lint', [], roots);
  assert.equal(clean.status, 0, clean.stderr);
  assert.equal(clean.parsed.ok, true);
});

test('lint accepts existing non-Markdown links and ignores fenced examples', async () => {
  const roots = await makeVault();
  const note = path.join(roots.wikiRoot, 'component-guide.md');
  await writeFile(path.join(roots.vaultRoot, 'docs', 'source', 'diagram.png'), 'fixture', 'utf8');
  const original = await readFile(note, 'utf8');
  await writeFile(note, `${original}\n[diagram](../source/diagram.png)\n\n\`\`\`yaml\nrelated:\n  - "[[example-only]]"\n\`\`\`\n`, 'utf8');

  runJson('build', [], roots);
  const lint = runJson('lint', [], roots);
  assert.equal(lint.status, 0, JSON.stringify(lint.parsed, null, 2));
});

test('snapshot fingerprints directory sources and detects child changes', async () => {
  const roots = await makeVault();
  const sourceDirectory = path.join(roots.vaultRoot, 'docs', 'source', 'component-tree');
  await mkdir(sourceDirectory, { recursive: true });
  await writeFile(path.join(sourceDirectory, 'a.txt'), 'a\n', 'utf8');
  await writeFile(path.join(sourceDirectory, 'b.txt'), 'b\n', 'utf8');

  const note = path.join(roots.wikiRoot, 'component-guide.md');
  const original = await readFile(note, 'utf8');
  await writeFile(note, original.replace('"docs/source/component.md"', '"docs/source/component-tree"'), 'utf8');

  const snapshot = runJson('snapshot', [], roots);
  assert.equal(snapshot.status, 0, JSON.stringify(snapshot.parsed, null, 2));
  const directory = snapshot.parsed.sources.find((source) => source.path === 'docs/source/component-tree');
  assert.equal(directory.kind, 'directory');
  assert.equal(directory.file_count, 2);

  await writeFile(path.join(sourceDirectory, 'b.txt'), 'changed\n', 'utf8');
  const freshness = runJson('freshness', [], roots);
  assert.equal(freshness.status, 1);
  assert.ok(freshness.parsed.changed.some((source) => source.path === 'docs/source/component-tree'));
});

test('hook ignores unsupported events and malformed JSON safely', async () => {
  const roots = await makeVault();
  const other = runJson('hook', ['Stop'], roots, { input: JSON.stringify({ hook_event_name: 'Stop' }) });
  assert.equal(other.status, 0, other.stderr);
  assert.equal(other.parsed.skipped, true);

  const malformed = runJson('hook', ['UserPromptSubmit'], roots, { input: '{not-json' });
  assert.equal(malformed.status, 0, malformed.stderr);
  assert.equal(malformed.parsed.skipped, true);
});
