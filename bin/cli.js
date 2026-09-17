#!/usr/bin/env node

import { Command } from 'commander';
import { scanCommand, cleanCommand } from '../src/commands/clean.js';

const program = new Command();

program
  .name('project-clean')
  .description('Cross-platform CLI tool to scan and safely clean development project artifacts')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a directory for cleanup candidates')
  .argument('[dir]', 'Directory to scan', '.')
  .option('-c, --categories <categories>', 'Filter by categories (comma-separated: nodejs,python,build,framework,cache)')
  .option('-r, --recursive', 'Scan subdirectories recursively')
  .option('--json', 'Output results as JSON')
  .option('--clean', 'After scanning, interactively select and clean')
  .action(scanCommand);

program
  .command('clean')
  .description('Scan and interactively clean a directory')
  .argument('[dir]', 'Directory to clean', '.')
  .option('-d, --dry-run', 'Preview what would be deleted without actually deleting')
  .option('-r, --recursive', 'Scan subdirectories recursively')
  .option('--json', 'Output results as JSON')
  .action(cleanCommand);

program.parse();
