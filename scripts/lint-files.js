#!/usr/bin/env node

const { execFileSync, spawnSync } = require('child_process');
const { extname } = require('path');

const SUPPORTED_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
]);

/**
 * lint 模式说明
 * - changed: 默认模式，检查工作区改动，包含 staged、未暂存和未跟踪文件
 * - staged: 只检查已暂存文件，给 husky / 提交流程使用
 * - all: 检查仓库内全部受 git 管理的源文件，适合手动做全量兜底
 */

/**
 * 执行 git 命令并返回文本结果
 * @param {string[]} args git 参数
 * @returns {string}
 */
function runGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).trim();
}

/**
 * 将命令输出拆分为文件路径数组
 * @param {string} output 命令输出
 * @returns {string[]}
 */
function splitLines(output) {
  if (!output) {
    return [];
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * 获取 staged 文件列表
 * @returns {string[]}
 */
function getStagedFiles() {
  return splitLines(runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']));
}

/**
 * 获取工作区中所有改动文件
 * 包含 staged、未暂存和未跟踪文件，避免开发时漏检。
 * @returns {string[]}
 */
function getWorkspaceFiles() {
  const stagedFiles = getStagedFiles();
  const unstagedFiles = splitLines(runGit(['diff', '--name-only', '--diff-filter=ACMR']));
  const untrackedFiles = splitLines(runGit(['ls-files', '--others', '--exclude-standard']));

  return [...new Set([...stagedFiles, ...unstagedFiles, ...untrackedFiles])];
}

/**
 * 获取仓库内所有源文件（已跟踪 + 未跟踪）
 * @returns {string[]}
 */
function getAllFiles() {
  return splitLines(runGit(['ls-files', '--cached', '--others', '--exclude-standard']));
}

/**
 * 过滤出需要交给 ESLint 的文件
 * @param {string[]} files 文件列表
 * @returns {string[]}
 */
function filterLintFiles(files) {
  return files
    .filter((file) => SUPPORTED_EXTENSIONS.has(extname(file)))
    .sort((left, right) => left.localeCompare(right, 'zh-CN'));
}

/**
 * 根据命令参数解析 lint 模式
 * 三种模式的设计目标：
 * - changed: 开发自检，避免未暂存改动被漏掉
 * - staged: 提交前快检，尽量缩短 pre-commit 耗时
 * - all: 全量巡检，用于手动排查历史问题或大改后的兜底检查
 * @returns {{ mode: 'workspace' | 'staged' | 'all', label: 'changed' | 'staged' | 'all' }}
 */
function resolveMode() {
  const args = new Set(process.argv.slice(2));

  if (args.has('--staged')) {
    return { mode: 'staged', label: 'staged' };
  }

  if (args.has('--all')) {
    return { mode: 'all', label: 'all' };
  }

  return { mode: 'workspace', label: 'changed' };
}

function main() {
  const { mode, label } = resolveMode();

  const files = filterLintFiles(
    mode === 'staged' ? getStagedFiles() : mode === 'all' ? getAllFiles() : getWorkspaceFiles()
  );

  if (files.length === 0) {
    console.log(`✅ ${label} 范围内没有需要 lint 的文件`);
    return;
  }

  console.log(`🔍 正在检查 ${files.length} 个文件 (${label})`);

  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const result = spawnSync(
    command,
    ['exec', 'eslint', '--config', 'eslint.config.mjs', '--no-warn-ignored', ...files],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
    }
  );

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
}

main();
