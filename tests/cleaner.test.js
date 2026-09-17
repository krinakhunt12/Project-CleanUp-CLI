import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { cleanFolders, validateCleanupTarget } from '../src/cleaner/index.js';

let testDir;

beforeEach(async () => {
  testDir = join(tmpdir(), `test-clean-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe('validateCleanupTarget', () => {
  it('should validate path within root', async () => {
    const target = join(testDir, 'node_modules');
    await mkdir(target, { recursive: true });

    const result = await validateCleanupTarget(target, testDir);
    expect(result.valid).toBe(true);
  });

  it('should reject path outside root', async () => {
    const outside = join(tmpdir(), 'outside-root');
    await mkdir(outside, { recursive: true });

    const result = await validateCleanupTarget(outside, testDir);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('outside');
  });

  it('should reject non-existent path', async () => {
    const result = await validateCleanupTarget('/nonexistent/path', testDir);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not exist');
  });
});

describe('cleanFolders - dry run', () => {
  it('should not delete anything in dry run mode', async () => {
    const target = join(testDir, 'node_modules');
    await mkdir(target, { recursive: true });
    await writeFile(join(target, 'test.js'), 'test');

    const results = await cleanFolders(
      [{ name: 'node_modules', path: target, size: 100 }],
      { rootPath: testDir, dryRun: true }
    );

    expect(results[0].status).toBe('would-delete');
    expect(results[0].dryRun).toBe(true);

    // Verify the folder still exists
    await access(target);
  });
});

describe('cleanFolders - actual deletion', () => {
  it('should delete target folder', async () => {
    const target = join(testDir, 'node_modules');
    await mkdir(target, { recursive: true });
    await writeFile(join(target, 'test.js'), 'test');

    const results = await cleanFolders(
      [{ name: 'node_modules', path: target, size: 100 }],
      { rootPath: testDir, dryRun: false }
    );

    expect(results[0].status).toBe('deleted');

    // Verify the folder is gone
    let exists = true;
    try {
      await access(target);
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });

  it('should skip protected paths', async () => {
    const results = await cleanFolders(
      [{ name: 'usr', path: '/usr', size: 0 }],
      { rootPath: testDir, dryRun: false }
    );

    expect(results[0].status).toBe('skipped');
  });

  it('should skip paths outside root', async () => {
    const results = await cleanFolders(
      [{ name: 'outside', path: '/tmp/outside', size: 0 }],
      { rootPath: testDir, dryRun: false }
    );

    expect(results[0].status).toBe('skipped');
  });
});
