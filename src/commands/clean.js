import chalk from 'chalk';
import inquirer from 'inquirer';
import { scanDirectory, getScanSummary } from '../scanner/index.js';
import { cleanFolders } from '../cleaner/index.js';
import { CATEGORIES } from '../config/categories.js';
import { formatBytes } from '../utils/format.js';
import { resolve } from 'node:path';

export async function scanCommand(targetDir, options) {
  const rootPath = resolve(targetDir);

  console.log(chalk.cyan(`\nScanning: ${rootPath}\n`));

  const filterCategories = options.categories
    ? options.categories.split(',')
    : null;

  let targets = null;
  if (filterCategories) {
    targets = [];
    for (const cat of filterCategories) {
      if (CATEGORIES[cat]) {
        targets.push(...CATEGORIES[cat].patterns);
      } else if (cat.trim()) {
        targets.push(cat.trim());
      }
    }
  }

  let candidates;
  try {
    candidates = await scanDirectory(rootPath, {
      targets,
      recursive: options.recursive,
    });
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exitCode = 1;
    return;
  }

  if (candidates.length === 0) {
    console.log(chalk.yellow('No cleanup candidates found.'));
    return;
  }

  const summary = getScanSummary(candidates);

  if (options.json) {
    console.log(JSON.stringify({ rootPath, candidates, summary }, null, 2));
    return;
  }

  printScanResults(candidates, summary);

  if (options.clean) {
    await interactiveClean(candidates, rootPath, false);
  }
}

export async function cleanCommand(targetDir, options) {
  const rootPath = resolve(targetDir);

  console.log(chalk.cyan(`\nScanning: ${rootPath}\n`));

  let candidates;
  try {
    candidates = await scanDirectory(rootPath, { recursive: options.recursive });
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exitCode = 1;
    return;
  }

  if (candidates.length === 0) {
    console.log(chalk.yellow('No cleanup candidates found.'));
    return;
  }

  const summary = getScanSummary(candidates);

  if (options.json) {
    console.log(JSON.stringify({ rootPath, candidates, summary }, null, 2));
    return;
  }

  printScanResults(candidates, summary);

  await interactiveClean(candidates, rootPath, options.dryRun);
}

function printScanResults(candidates, summary) {
  console.log(chalk.bold('\nCleanup Candidates:'));
  console.log('─'.repeat(60));

  for (const cat of Object.keys(CATEGORIES)) {
    const items = summary.byCategory[cat];
    if (!items || items.length === 0) continue;

    console.log(chalk.bold.underline(`\n  ${CATEGORIES[cat].label}:`));
    for (const item of items) {
      console.log(
        `    ${chalk.dim('•')} ${chalk.white(item.name.padEnd(20))} ${chalk.yellow(formatBytes(item.size).padStart(12))}  ${chalk.dim(item.path)}`
      );
    }
  }

  const other = summary.byCategory.other;
  if (other && other.length > 0) {
    console.log(chalk.bold.underline('\n  Other:'));
    for (const item of other) {
      console.log(
        `    ${chalk.dim('•')} ${chalk.white(item.name.padEnd(20))} ${chalk.yellow(formatBytes(item.size).padStart(12))}  ${chalk.dim(item.path)}`
      );
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(chalk.bold(`Total: ${summary.total} items  |  Space: ${chalk.yellow(formatBytes(summary.totalSize))}\n`));
}

async function interactiveClean(candidates, rootPath, dryRun) {
  const { selectedItems } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedItems',
      message: 'Select folders to delete:',
      choices: candidates.map(c => ({
        name: `${c.name} (${formatBytes(c.size)}) [${c.category}]`,
        value: c.name,
        checked: false,
      })),
      pageSize: 20,
    },
  ]);

  if (selectedItems.length === 0) {
    console.log(chalk.yellow('\nNo items selected. Nothing was deleted.'));
    return;
  }

  const selectedTargets = candidates.filter(c => selectedItems.includes(c.name));

  if (dryRun) {
    console.log(chalk.cyan(`\n[DRY RUN] Would delete ${selectedTargets.length} items:`));
    for (const t of selectedTargets) {
      console.log(`  ${chalk.dim('•')} ${t.name} (${formatBytes(t.size)})`);
    }
    console.log(chalk.cyan(`\nEstimated space to free: ${formatBytes(selectedTargets.reduce((s, t) => s + t.size, 0))}\n`));
    return;
  }

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: chalk.red(`Delete ${selectedTargets.length} selected items? This cannot be undone.`),
      default: false,
    },
  ]);

  if (!confirmed) {
    console.log(chalk.yellow('\nCleanup cancelled.'));
    return;
  }

  console.log(chalk.cyan('\nCleaning up...\n'));

  const results = await cleanFolders(selectedTargets, { rootPath, dryRun: false });

  let deleted = 0;
  let skipped = 0;
  let errors = 0;
  let freed = 0;

  for (const r of results) {
    if (r.status === 'deleted') {
      deleted++;
      freed += r.size || 0;
      console.log(chalk.green(`  ✓ Deleted: ${r.name}`));
    } else if (r.status === 'skipped') {
      skipped++;
      console.log(chalk.yellow(`  ⚠ Skipped: ${r.name} - ${r.reason}`));
    } else if (r.status === 'error') {
      errors++;
      console.log(chalk.red(`  ✗ Error: ${r.name} - ${r.reason}`));
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(chalk.bold(`Cleanup complete: ${deleted} deleted, ${skipped} skipped, ${errors} errors`));
  console.log(chalk.bold(`Freed: ${chalk.green(formatBytes(freed))}\n`));

  if (options?.json) {
    console.log(JSON.stringify({ results, deleted, skipped, errors, freed }, null, 2));
  }
}
