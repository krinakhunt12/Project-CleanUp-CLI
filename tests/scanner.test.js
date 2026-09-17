import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { scanDirectory, categorize, getScanSummary } from '../src/scanner/index.js';

let testDir;

beforeEach(async () => {
  testDir = join(tmpdir(), `test-scan-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
});

afterEach(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe('scanDirectory', () => {
  it('should find node_modules directory', async () => {
    const nmDir = join(testDir, 'node_modules');
    await mkdir(nmDir, { recursive: true });
    await writeFile(join(nmDir, 'test.js'), 'module.exports = {};');

    const candidates = await scanDirectory(testDir);
    expect(candidates.some(c => c.name === 'node_modules')).toBe(true);
  });

  it('should find multiple cleanup targets', async () => {
    await mkdir(join(testDir, 'node_modules'), { recursive: true });
    await mkdir(join(testDir, 'dist'), { recursive: true });
    await mkdir(join(testDir, 'build'), { recursive: true });
    await mkdir(join(testDir, '__pycache__'), { recursive: true });
    await mkdir(join(testDir, '.cache'), { recursive: true });

    const candidates = await scanDirectory(testDir);
    expect(candidates.length).toBe(5);
  });

  it('should not find non-cleanup directories', async () => {
    await mkdir(join(testDir, 'src'), { recursive: true });
    await mkdir(join(testDir, 'lib'), { recursive: true });

    const candidates = await scanDirectory(testDir);
    expect(candidates.length).toBe(0);
  });

  it('should filter by targets', async () => {
    await mkdir(join(testDir, 'node_modules'), { recursive: true });
    await mkdir(join(testDir, 'dist'), { recursive: true });

    const candidates = await scanDirectory(testDir, { targets: ['node_modules'] });
    expect(candidates.length).toBe(1);
    expect(candidates[0].name).toBe('node_modules');
  });

  it('should calculate directory sizes', async () => {
    const nmDir = join(testDir, 'node_modules');
    await mkdir(nmDir, { recursive: true });
    await writeFile(join(nmDir, 'package.json'), '{"name":"test"}');

    const candidates = await scanDirectory(testDir);
    const nmCandidate = candidates.find(c => c.name === 'node_modules');
    expect(nmCandidate.size).toBeGreaterThan(0);
  });

  it('should throw on non-existent directory', async () => {
    await expect(scanDirectory('/nonexistent/path/abc123')).rejects.toThrow('Directory not found');
  });
});

describe('categorize', () => {
  it('should categorize node_modules as nodejs', () => {
    expect(categorize('node_modules')).toBe('nodejs');
  });

  it('should categorize venv as python', () => {
    expect(categorize('venv')).toBe('python');
  });

  it('should categorize dist as build', () => {
    expect(categorize('dist')).toBe('build');
  });

  it('should categorize .next as framework', () => {
    expect(categorize('.next')).toBe('framework');
  });

  it('should return other for unknown names', () => {
    expect(categorize('random-folder')).toBe('other');
  });
});

describe('getScanSummary', () => {
  it('should return correct summary', async () => {
    await mkdir(join(testDir, 'node_modules'), { recursive: true });
    await writeFile(join(testDir, 'node_modules', 'test.js'), 'test');

    const candidates = await scanDirectory(testDir);
    const summary = getScanSummary(candidates);

    expect(summary.total).toBe(1);
    expect(summary.totalSize).toBeGreaterThan(0);
    expect(summary.byCategory.nodejs).toBeDefined();
    expect(summary.byCategory.nodejs.length).toBe(1);
  });
});
