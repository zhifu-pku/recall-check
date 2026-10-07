import { readFile, stat } from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const readJson = async (name) =>
  JSON.parse(await readFile(new URL(name, root), 'utf8'));
const manifest = await readJson('manifest.json');
const pkg = await readJson('package.json');
const lock = await readJson('package-lock.json');
const versions = await readJson('versions.json');

assert.equal(manifest.id, 'recall-check');
assert.equal(manifest.name, 'Recall Check');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(pkg.name, manifest.id);
assert.equal(pkg.version, manifest.version);
assert.equal(lock.version, manifest.version);
assert.equal(lock.packages[''].version, manifest.version);
assert.equal(versions[manifest.version], manifest.minAppVersion);
assert.equal(manifest.author, 'Zhi Fu');
assert.equal(pkg.author, manifest.author);
assert.equal(pkg.license, 'MIT');
assert.ok(
  manifest.description.length <= 250 && manifest.description.endsWith('.'),
);
if (process.env.RELEASE_TAG)
  assert.equal(process.env.RELEASE_TAG, manifest.version);

for (const name of [
  'main.js',
  'manifest.json',
  'styles.css',
  'README.md',
  'LICENSE',
]) {
  const file = await stat(new URL(name, root));
  assert.ok(
    file.isFile() && file.size > 0,
    `${name} must exist and be nonempty`,
  );
}
const bundle = await readFile(new URL('main.js', root), 'utf8');
assert.ok(
  !bundle.includes('sourceMappingURL='),
  'Production bundle must not contain a source map',
);
console.log(
  `Release metadata and artifacts verified: ${manifest.name} ${manifest.version}, author ${manifest.author}.`,
);
