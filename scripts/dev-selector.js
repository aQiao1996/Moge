#!/usr/bin/env node
const { execSync } = require('child_process');

// 为 concurrently 的进程名前缀增加颜色和标识，方便区分前后端日志来源
const Color = {
  frontend: '\x1b[38;5;32mfrontend 🚀 -->\x1b[0m',
  backend: '\x1b[32mbackend 🚀 -->\x1b[0m',
};

(async () => {
  // 使用动态导入兼容 inquirer 的 ESM 导出方式，避免 CommonJS 直接 require 失败
  const { default: inquirer } = await import('inquirer');
  const { project } = await inquirer.prompt([
    {
      type: 'list',
      name: 'project',
      // 启动入口保持单次选择，避免同时传参增加本地开发成本
      message: '选择要启动的项目:',
      choices: [
        { name: '前端 (frontend)', value: 'frontend' },
        { name: '后端 (backend)', value: 'backend' },
        { name: '同时启动前后端', value: 'both' },
      ],
    },
  ]);

  switch (project) {
    case 'frontend':
      // 统一通过 concurrently 启动，保证单项目和双项目场景的输出格式一致
      execSync(`concurrently -n "${Color.frontend}" "pnpm dev:frontend"`, {
        stdio: 'inherit',
        shell: true,
      });
      break;
    case 'backend':
      execSync(`concurrently -n "${Color.backend}" "pnpm dev:backend"`, {
        stdio: 'inherit',
        shell: true,
      });
      break;
    case 'both':
      // 双开时显式指定两个名称，便于在同一个终端里快速定位对应服务输出
      execSync(
        `concurrently -n "${Color.frontend},${Color.backend}" "pnpm dev:frontend" "pnpm dev:backend"`,
        { stdio: 'inherit', shell: true }
      );
      break;
  }
})();
