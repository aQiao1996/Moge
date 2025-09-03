import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  /* 纯语法：所有配置文件 & 非 TS */
  {
    files: ['*.config.mjs', '*.config.js'],
    languageOptions: { parserOptions: { project: false } },
    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  /* 基础推荐（无类型） */
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,

  /* 带类型检查：仅 TS 文件 */
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked, // 只给 TS 用
    ],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'import/no-anonymous-default-export': 'off',
    },
  }
);
