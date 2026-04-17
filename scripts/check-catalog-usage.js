#!/usr/bin/env node

/**
 * 检查 workspace 中所有包的依赖是否使用了 catalog: 协议
 * 确保版本统一管理在 pnpm-workspace.yaml 中
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const WORKSPACE_YAML = path.join(ROOT, 'pnpm-workspace.yaml');

function loadWorkspaceConfig() {
  const content = fs.readFileSync(WORKSPACE_YAML, 'utf-8');
  // 简单解析 packages 字段和 catalog 中的包名
  const packagePatterns = [];
  const catalogPackages = new Set();

  let inPackages = false;
  let inCatalog = false;

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (trimmed === 'packages:') {
      inPackages = true;
      inCatalog = false;
      continue;
    }
    if (trimmed.startsWith('catalogs:') || trimmed === 'catalogs:') {
      inPackages = false;
      inCatalog = false;
      continue;
    }
    if (trimmed === 'default:') {
      inCatalog = true;
      continue;
    }
    if (
      /^\w/.test(trimmed) &&
      !trimmed.startsWith('-') &&
      !trimmed.startsWith("'") &&
      !trimmed.startsWith('"')
    ) {
      inPackages = false;
      inCatalog = false;
    }

    if (inPackages && trimmed.startsWith('- ')) {
      packagePatterns.push(trimmed.slice(2));
    }

    if (inCatalog) {
      // 匹配 'package-name': version 或 package-name: version
      const match = trimmed.match(/^['"]?(@?[^'":\s]+(?:\/[^'":\s]+)?)['"]?\s*:/);
      if (match) {
        catalogPackages.add(match[1]);
      }
    }
  }

  return { packagePatterns, catalogPackages };
}

function resolvePackageDirs(patterns) {
  const dirs = [];
  for (const pattern of patterns) {
    const base = pattern.replace('/*', '');
    const fullBase = path.join(ROOT, base);
    if (!fs.existsSync(fullBase)) continue;
    const entries = fs.readdirSync(fullBase, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pkgJsonPath = path.join(fullBase, entry.name, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          dirs.push(pkgJsonPath);
        }
      }
    }
  }
  // 也检查根 package.json
  dirs.push(path.join(ROOT, 'package.json'));
  return dirs;
}

function checkPackageJson(pkgJsonPath, catalogPackages) {
  const content = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  const relativePath = path.relative(ROOT, pkgJsonPath);
  const issues = [];

  for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = content[depType];
    if (!deps) continue;

    for (const [name, version] of Object.entries(deps)) {
      if (version === 'catalog:' || version.startsWith('catalog:')) continue;
      if (version.startsWith('workspace:')) continue;

      if (catalogPackages.has(name)) {
        issues.push({
          file: relativePath,
          depType,
          name,
          version,
          message: `应使用 "catalog:" 而非 "${version}"（该依赖已在 catalog 中定义）`,
        });
      }
    }
  }

  return issues;
}

function main() {
  console.log('🔍 检查 catalog 依赖使用情况...\n');

  const { packagePatterns, catalogPackages } = loadWorkspaceConfig();
  const pkgJsonPaths = resolvePackageDirs(packagePatterns);

  let allIssues = [];

  for (const pkgJsonPath of pkgJsonPaths) {
    const issues = checkPackageJson(pkgJsonPath, catalogPackages);
    allIssues = allIssues.concat(issues);
  }

  if (allIssues.length === 0) {
    console.log('✅ 所有依赖均正确使用 catalog: 协议\n');
    process.exit(0);
  } else {
    console.log(`❌ 发现 ${allIssues.length} 个未使用 catalog: 的依赖:\n`);
    for (const issue of allIssues) {
      console.log(`  ${issue.file} > ${issue.depType} > ${issue.name}`);
      console.log(`    ${issue.message}\n`);
    }
    process.exit(1);
  }
}

main();
