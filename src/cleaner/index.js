import { resolve, relative } from 'node:path';
import { pathExists, isProtectedPath, isWithinRoot, removeDir } from '../utils/fs.js';

export async function validateCleanupTarget(targetPath, rootPath) {
  const resolvedTarget = resolve(targetPath);
  const resolvedRoot = resolve(rootPath);

  if (!(await pathExists(resolvedTarget))) {
    return { valid: false, reason: `Path does not exist: ${resolvedTarget}` };
  }

  if (isProtectedPath(resolvedTarget)) {
    return { valid: false, reason: `Cannot delete protected system path: ${resolvedTarget}` };
  }

  if (!isWithinRoot(resolvedTarget, resolvedRoot)) {
    return {
      valid: false,
      reason: `Path is outside the selected root directory: ${relative(resolvedRoot, resolvedTarget)}`,
    };
  }

  return { valid: true };
}

export async function cleanFolders(targets, options = {}) {
  const { dryRun = false, rootPath } = options;
  const resolvedRoot = resolve(rootPath);
  const results = [];

  for (const target of targets) {
    const resolvedTarget = resolve(target.path || target);
    const name = target.name || resolvedTarget;

    const validation = await validateCleanupTarget(resolvedTarget, resolvedRoot);
    if (!validation.valid) {
      results.push({
        name,
        path: resolvedTarget,
        status: 'skipped',
        reason: validation.reason,
        dryRun,
      });
      continue;
    }

    if (dryRun) {
      results.push({
        name,
        path: resolvedTarget,
        status: 'would-delete',
        size: target.size || 0,
        dryRun: true,
      });
      continue;
    }

    try {
      await removeDir(resolvedTarget);
      results.push({
        name,
        path: resolvedTarget,
        status: 'deleted',
        size: target.size || 0,
        dryRun: false,
      });
    } catch (err) {
      results.push({
        name,
        path: resolvedTarget,
        status: 'error',
        reason: err.message,
        dryRun: false,
      });
    }
  }

  return results;
}
