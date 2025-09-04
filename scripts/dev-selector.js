#!/usr/bin/env node
const { execSync } = require('child_process');

// 控制台颜色
const Color = {
  frontend: '\x1b[38;5;32mfrontend 🚀 -->\x1b[0m',
  backend: '\x1b[32mbackend 🚀 -->\x1b[0m',
};

(async () => {
  const { default: inquirer } = await import('inquirer');
  const { project } = await inquirer.prompt([
    {
      type: 'list',
      name: 'project',
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
      execSync(
        `concurrently -n "${Color.frontend},${Color.backend}" "pnpm dev:frontend" "pnpm dev:backend"`,
        { stdio: 'inherit', shell: true }
      );
      break;
  }
})();
