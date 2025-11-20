import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 全局忽略文件 - 与 .gitignore 保持一致
  {
    ignores: [
      '.DS_Store',
      'node_modules/',
      'dist/',
      '**/dist/**',
      '.next/',
      'test/', // Already present, but adding it explicitly for clarity for backend test
      'apps/backend/test/',
      '**/*.log',
      'tests/**/coverage/',
      'tests/e2e/reports',
      'selenium-debug.log',
      '.idea',
      '.vscode',
      '*.suo',
      '*.ntvs*',
      '*.njsproj',
      '*.sln',
      '*.local',
      'tsconfig.tsbuildinfo',
      'stats.html',
      'docs/.vitepress/cache',
      '.history/',
      'apps/frontend/.next/',
      'apps/backend/generated/prisma/',
      'apps/frontend/next-env.d.ts',
      '.claude/',
    ],
  },

  /* 纯语法：所有配置文件 & 非 TS */
  {
    files: ['*.config.mjs', '*.config.js'], // 匹配配置文件（如 webpack.config.js、vite.config.ts 等）
    languageOptions: { parserOptions: { project: false } }, // 关闭 TypeScript 项目解析
    rules: {
      '@typescript-eslint/await-thenable': 'off', // 关闭 TS 特有的 await-thenable 规则
      '@typescript-eslint/no-unsafe-call': 'off', // 关闭 TS 的不安全调用检查
    },
  },

  /* 基础推荐（无类型） */
  eslint.configs.recommended, // ESLint 官方推荐的基础规则（如 no-console、no-unused-vars 等）
  eslintPluginPrettierRecommended, // Prettier 插件的推荐配置（集成 Prettier 格式化规则）

  /* 带类型检查：仅 TS 文件 */
  {
    files: ['**/*.{ts,tsx}'], // 仅匹配 TS/TSX 文件
    extends: [...tseslint.configs.recommendedTypeChecked], // 继承 TS ESLint 的类型检查推荐规则
    languageOptions: {
      parserOptions: { projectService: true }, // 启用 TS 项目服务（增强类型推断）
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // 警告显式使用 any 类型
      '@typescript-eslint/no-floating-promises': 'error', // 错误：未处理的 Promise（防止异步遗漏）
      '@typescript-eslint/no-unsafe-argument': 'warn', // 警告不安全的函数参数（如 any 类型传入严格类型函数）
      'import/no-anonymous-default-export': 'off', // 关闭匿名默认导出的警告
    },
  }
);
