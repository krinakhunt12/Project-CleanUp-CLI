import { stat, readdir, access, rm } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { platform } from 'node:os';

export const PROTECTED_PATHS = (() => {
  const paths = [
    resolve('/'),
    resolve(process.env.SYSTEMROOT || 'C:\\Windows'),
    resolve('/System'),
    resolve('/Library'),
    resolve('/bin'),
    resolve('/sbin'),
    resolve('/usr'),
    resolve('/etc'),
  ];
  if (platform() === 'win32') {
    paths.push('C:\\', 'D:\\', 'E:\\');
  }
  return paths.map(p => resolve(p).toLowerCase());
})();

export function isProtectedPath(targetPath) {
  const resolved = resolve(targetPath).toLowerCase();
  return PROTECTED_PATHS.some(p => resolved === p || resolved.startsWith(p + '\\') || resolved.startsWith(p + '/'));
}

export function isWithinRoot(targetPath, rootPath) {
  const resolvedTarget = resolve(targetPath).toLowerCase();
  const resolvedRoot = resolve(rootPath).toLowerCase();
  return resolvedTarget === resolvedRoot || resolvedTarget.startsWith(resolvedRoot + '\\') || resolvedTarget.startsWith(resolvedRoot + '/');
}

export async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function getDirSize(dirPath) {
  let totalSize = 0;
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirSize(fullPath);
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch {
    return 0;
  }
  return totalSize;
}

export async function removeDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
}
