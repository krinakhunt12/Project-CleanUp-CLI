import { describe, it, expect } from 'vitest';
import { CATEGORIES, DEFAULT_CLEAN_TARGETS } from '../src/config/categories.js';

describe('CATEGORIES', () => {
  it('should have nodejs category', () => {
    expect(CATEGORIES.nodejs).toBeDefined();
    expect(CATEGORIES.nodejs.patterns).toContain('node_modules');
  });

  it('should have python category', () => {
    expect(CATEGORIES.python).toBeDefined();
    expect(CATEGORIES.python.patterns).toContain('venv');
    expect(CATEGORIES.python.patterns).toContain('__pycache__');
  });

  it('should have build category', () => {
    expect(CATEGORIES.build).toBeDefined();
    expect(CATEGORIES.build.patterns).toContain('dist');
    expect(CATEGORIES.build.patterns).toContain('build');
  });

  it('should have framework category', () => {
    expect(CATEGORIES.framework).toBeDefined();
    expect(CATEGORIES.framework.patterns).toContain('.next');
  });

  it('should have cache category', () => {
    expect(CATEGORIES.cache).toBeDefined();
    expect(CATEGORIES.cache.patterns).toContain('.cache');
  });
});

describe('DEFAULT_CLEAN_TARGETS', () => {
  it('should include common targets', () => {
    expect(DEFAULT_CLEAN_TARGETS).toContain('node_modules');
    expect(DEFAULT_CLEAN_TARGETS).toContain('dist');
    expect(DEFAULT_CLEAN_TARGETS).toContain('build');
    expect(DEFAULT_CLEAN_TARGETS).toContain('.cache');
    expect(DEFAULT_CLEAN_TARGETS).toContain('venv');
    expect(DEFAULT_CLEAN_TARGETS).toContain('.next');
    expect(DEFAULT_CLEAN_TARGETS).toContain('__pycache__');
  });
});
