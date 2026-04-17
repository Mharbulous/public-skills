#!/usr/bin/env node
/**
 * Promote a hardened skill by replacing the original with the hardened version.
 *
 * Usage: node promote-skill.mjs <hardened-skill-dir>
 *
 * The script infers the original skill directory by stripping the '-hardened' suffix.
 *
 * Operations:
 * 1. Validates both directories exist
 * 2. Updates SKILL.md frontmatter (removes '-hardened' from name field)
 * 3. Replaces all internal references to '<name>-hardened' with '<name>'
 * 4. Deletes the original skill directory
 * 5. Renames the hardened directory to the original name
 *
 * Outputs JSON to stdout:
 * {
 *   "action": "promoted" | "error",
 *   "original": "skills/foo",
 *   "hardened": "skills/foo-hardened",
 *   "filesUpdated": ["SKILL.md"],
 *   "filesDeleted": ["skills/foo/SKILL.md", ...],
 *   "message": "..."
 * }
 */
import { readdirSync, readFileSync, writeFileSync, rmSync, renameSync, existsSync, statSync } from 'fs';
import { resolve, join, basename, dirname } from 'path';

const hardenedDir = process.argv[2];

if (!hardenedDir) {
  console.log(JSON.stringify({ action: 'error', message: 'Usage: node promote-skill.mjs <hardened-skill-dir>' }));
  process.exit(1);
}

const resolvedHardened = resolve(hardenedDir);
const hardenedName = basename(resolvedHardened);

if (!hardenedName.endsWith('-hardened')) {
  console.log(JSON.stringify({ action: 'error', message: `Directory must end with '-hardened', got: ${hardenedName}` }));
  process.exit(1);
}

const originalName = hardenedName.replace(/-hardened$/, '');
const parentDir = dirname(resolvedHardened);
const resolvedOriginal = join(parentDir, originalName);

// Validate both exist
if (!existsSync(resolvedHardened) || !statSync(resolvedHardened).isDirectory()) {
  console.log(JSON.stringify({ action: 'error', message: `Hardened directory not found: ${resolvedHardened}` }));
  process.exit(1);
}

if (!existsSync(resolvedOriginal) || !statSync(resolvedOriginal).isDirectory()) {
  console.log(JSON.stringify({ action: 'error', message: `Original directory not found: ${resolvedOriginal}` }));
  process.exit(1);
}

// Collect all files in hardened dir (recursive)
function walkDir(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// Collect files that were in the original (for reporting)
const originalFiles = walkDir(resolvedOriginal).map(f => f.replace(/\\/g, '/'));

// Update references in all text files in the hardened dir
const hardenedFiles = walkDir(resolvedHardened);
const textExts = new Set(['.md', '.js', '.mjs', '.cjs', '.ts', '.py', '.sh', '.yaml', '.yml', '.json']);
const filesUpdated = [];

for (const filePath of hardenedFiles) {
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  if (!textExts.has(ext)) continue;

  const content = readFileSync(filePath, 'utf-8');
  // Replace references: hardenedName -> originalName (both in paths and name fields)
  const updated = content.replaceAll(hardenedName, originalName);

  if (updated !== content) {
    writeFileSync(filePath, updated, 'utf-8');
    filesUpdated.push(filePath.replace(/\\/g, '/').replace(resolvedHardened.replace(/\\/g, '/'), ''));
  }
}

// Delete original directory
rmSync(resolvedOriginal, { recursive: true, force: true });

// Rename hardened -> original
renameSync(resolvedHardened, resolvedOriginal);

console.log(JSON.stringify({
  action: 'promoted',
  original: resolvedOriginal.replace(/\\/g, '/'),
  hardened: resolvedHardened.replace(/\\/g, '/'),
  filesUpdated,
  filesDeleted: originalFiles,
  message: `Promoted ${hardenedName} -> ${originalName}`
}));
