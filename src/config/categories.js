export const CATEGORIES = {
  nodejs: {
    label: 'Node.js',
    patterns: ['node_modules', '.npm', '.yarn', '.pnpm-store'],
  },
  python: {
    label: 'Python',
    patterns: ['venv', '.venv', '__pycache__', '.mypy_cache', '.pytest_cache', '.tox', 'eggs', '*.egg-info'],
  },
  build: {
    label: 'Build Artifacts',
    patterns: ['dist', 'build', '.parcel-cache', '.cache', 'out', '.output'],
  },
  framework: {
    label: 'Framework',
    patterns: ['.next', '.nuxt', '.vue', '.svelte-kit', '.turbo', '.vercel'],
  },
  cache: {
    label: 'Cache & Temp',
    patterns: ['.cache', '.tmp', '.temp', '.eslintcache', '.stylelintcache'],
  },
};

export const DEFAULT_CLEAN_TARGETS = [
  'node_modules',
  'dist',
  'build',
  '.cache',
  'venv',
  '.next',
  '__pycache__',
];

export const DEFAULT_TARGETS_BY_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORIES).map(([key, cat]) => [key, cat.patterns])
);
