# project-clean-cli

Cross-platform CLI tool to scan and safely clean development project artifacts.

## Features

- **Scan** directories for cleanup candidates (`node_modules`, `dist`, `build`, `.cache`, `venv`, `.next`, `__pycache__`, etc.)
- **Storage analysis** with human-readable sizes per item and totals
- **Dry-run mode** to preview what would be deleted without touching anything
- **Interactive selection** via checkboxes to choose exactly what to delete
- **Category filters** for Node.js, Python, Build, Framework, and Cache
- **JSON output** for scripting and automation
- **Safety checks**: protected system paths, root boundary validation, explicit confirmation

## Installation

```bash
# Run directly with npx
npx project-clean-cli scan ./my-project

# Or install globally
npm install -g project-clean-cli
project-clean scan ./my-project
```

## Commands

### `scan [dir]`

Scan a directory and list cleanup candidates.

```bash
project-clean scan .
project-clean scan /path/to/project --categories nodejs,python
project-clean scan . --recursive
project-clean scan . --json
project-clean scan . --clean
```

| Option | Description |
|--------|-------------|
| `-c, --categories <cats>` | Filter by categories (comma-separated): `nodejs`, `python`, `build`, `framework`, `cache` |
| `-r, --recursive` | Scan subdirectories recursively |
| `--json` | Output results as JSON |
| `--clean` | After scanning, interactively select and clean |

### `clean [dir]`

Scan and interactively clean a directory.

```bash
project-clean clean .
project-clean clean . --dry-run
project-clean clean . --recursive
project-clean clean . --json
```

| Option | Description |
|--------|-------------|
| `-d, --dry-run` | Preview what would be deleted without actually deleting |
| `-r, --recursive` | Scan subdirectories recursively |
| `--json` | Output results as JSON |

## Default Targets

| Category | Patterns |
|----------|----------|
| **Node.js** | `node_modules`, `.npm`, `.yarn`, `.pnpm-store` |
| **Python** | `venv`, `.venv`, `__pycache__`, `.mypy_cache`, `.pytest_cache`, `.tox`, `eggs`, `*.egg-info` |
| **Build** | `dist`, `build`, `.parcel-cache`, `.cache`, `out`, `.output` |
| **Framework** | `.next`, `.nuxt`, `.vue`, `.svelte-kit`, `.turbo`, `.vercel` |
| **Cache** | `.cache`, `.tmp`, `.temp`, `.eslintcache`, `.stylelintcache` |

## Safety Features

- **Dry-run by default in clean mode**: must confirm before any deletion
- **Protected paths**: system directories (`/`, `C:\`, `/usr`, `/bin`, etc.) are blocked
- **Root boundary**: prevents deleting files outside the selected directory
- **Explicit confirmation**: always asks before deleting
- **Path validation**: checks existence and permissions before operations

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint

# Run CLI locally
node bin/cli.js scan .
```

## Project Structure

```
project-clean-cli/
├── bin/
│   └── cli.js              # CLI entry point
├── src/
│   ├── scanner/            # Directory scanning logic
│   ├── cleaner/            # Safe deletion logic
│   ├── config/             # Categories and defaults
│   ├── commands/           # CLI command handlers
│   └── utils/              # Formatting and filesystem helpers
├── tests/                  # Unit tests (Vitest)
├── package.json
└── README.md
```

## Publishing to npm

```bash
# Login to npm
npm login

# Publish (includes bin/ and src/ via "files" field)
npm publish
```

## License

MIT
