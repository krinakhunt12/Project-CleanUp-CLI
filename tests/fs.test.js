import { describe, it, expect } from 'vitest';
import { isProtectedPath, isWithinRoot } from '../src/utils/fs.js';
import { resolve } from 'node:path';

describe('isProtectedPath', () => {
  it('should protect root path', () => {
    expect(isProtectedPath('/')).toBe(true);
  });

  it('should protect C:\\ on Windows', () => {
    expect(isProtectedPath('C:\\')).toBe(true);
  });

  it('should not protect normal paths', () => {
    expect(isProtectedPath('/tmp/test')).toBe(false);
  });
});

describe('isWithinRoot', () => {
  it('should return true for paths within root', () => {
    expect(isWithinRoot('/tmp/test/subdir', '/tmp/test')).toBe(true);
  });

  it('should return true for root itself', () => {
    expect(isWithinRoot('/tmp/test', '/tmp/test')).toBe(true);
  });

  it('should return false for paths outside root', () => {
    expect(isWithinRoot('/tmp/outside', '/tmp/test')).toBe(false);
  });
});
