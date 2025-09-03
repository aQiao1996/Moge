#!/usr/bin/env node
const { execSync } = require('child_process');

async function selectAndStart() {
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
      execSync('concurrently -n "frontend" "pnpm dev:frontend"', { stdio: 'inherit' });
      break;
    case 'backend':
      execSync('concurrently -n "backend" "pnpm dev:backend"', { stdio: 'inherit' });
      break;
    case 'both':
      execSync(
        'concurrently -n "frontend,backend" "pnpm dev:frontend" "pnpm dev:backend"',
        { stdio: 'inherit' }
      );
      break;
  }
}

selectAndStart();
