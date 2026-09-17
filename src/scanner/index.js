import { readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { CATEGORIES } from '../config/categories.js';

const KNOWN_CLEANUP_NAMES = Object.values(CATEGORIES)
  .flatMap(cat => cat.patterns)
  .filter((v, i, a) => a.indexOf(v) === i);

function isCleanupCandidate(name) {
  return KNOWN_CLEANUP_NAMES.includes(name);
}

export async function scanDirectory(rootPath, options = {}) {
  const { targets, recursive = false } = options;
  const resolvedRoot = resolve(rootPath);
  const candidates = [];
  const filterTargets = targets && targets.length > 0 ? targets : KNOWN_CLEANUP_NAMES;

  let entries;
  try {
    entries = await readdir(resolvedRoot, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Directory not found: ${resolvedRoot}`);
    }
    if (err.code === 'EACCES') {
      throw new Error(`Permission denied: ${resolvedRoot}`);
    }
    throw err;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!filterTargets.includes(entry.name)) continue;

    const fullPath = join(resolvedRoot, entry.name);
    const category = categorize(entry.name);

    let size;
    try {
      const stats = await stat(fullPath);
      size = stats.size;
      if (stats.isDirectory()) {
        size = await estimateDirSizeFast(fullPath);
      }
    } catch {
      size = 0;
    }

    candidates.push({
      name: entry.name,
      path: fullPath,
      size,
      category,
      selected: false,
    });

    if (recursive && entry.isDirectory()) {
      try {
        const subEntries = await readdir(fullPath, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (!subEntry.isDirectory()) continue;
          if (!filterTargets.includes(subEntry.name)) continue;

          const subPath = join(fullPath, subEntry.name);
          const subCategory = categorize(subEntry.name);
          let subSize = 0;
          try {
            subSize = await estimateDirSizeFast(subPath);
          } catch {
            subSize = 0;
          }
          candidates.push({
            name: subEntry.name,
            path: subPath,
            size: subSize,
            category: subCategory,
            selected: false,
          });
        }
      } catch {
        // skip inaccessible subdirectories
      }
    }
  }

  return candidates;
}

function estimateDirSizeFast(dirPath) {
  // Use a fast recursive size calculation
  return calculateSize(dirPath);
}

async function calculateSize(dirPath) {
  let totalSize = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const promises = [];
    for (const entry of entries) {
      if (entry.isFile()) {
        promises.push(
          stat(join(dirPath, entry.name))
            .then(s => { totalSize += s.size; })
            .catch(() => {})
        );
      } else if (entry.isDirectory()) {
        promises.push(
          calculateSize(join(dirPath, entry.name)).then(s => { totalSize += s; })
        );
      }
    }
    await Promise.all(promises);
  } catch {
    return 0;
  }
  return totalSize;
}

export function categorize(name) {
  for (const [categoryKey, category] of Object.entries(CATEGORIES)) {
    if (category.patterns.includes(name)) {
      return categoryKey;
    }
  }
  return 'other';
}

export function getScanSummary(candidates) {
  const totalSize = candidates.reduce((sum, c) => sum + c.size, 0);
  const byCategory = {};
  for (const c of candidates) {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c);
  }
  return { total: candidates.length, totalSize, byCategory };
}
