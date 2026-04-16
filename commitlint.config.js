// 带 Emoji 的提交类型
const emojiTypes = [
  '🎉 init', // 初始化项目
  '🔧 build', // 构建相关
  '🐳 chore', // 辅助工具的变动
  '🐎 ci', // 自动化构建
  '📃 docs', // 文档
  '✨ feat', // 新功能
  '🐞 fix', // 修补bug
  '🌈 style', // 格式（不影响代码运行的变动）
  '🦄 refactor', // 重构（即不是新增功能，也不是修改bug的代码变动）
  '🧪 test', // 增加测试用例
  '↩ revert', // 回滚到上一版本
  '🎈 perf', // 优化相关
];

// 不带 Emoji 的提交类型
const plainTypes = [
  'init', // 初始化项目
  'build', // 构建相关
  'chore', // 辅助工具的变动
  'ci', // 自动化构建
  'docs', // 文档（documentation）
  'feat', // 新功能（feature）
  'fix', // 修补bug
  'style', // 格式（不影响代码运行的变动）
  'refactor', // 重构（即不是新增功能，也不是修改bug的代码变动）
  'test', // 增加测试用例
  'revert', // 回滚到上一版本
  'perf', // 优化相关
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 限制提交类型必须是以下枚举值之一
    'type-enum': [2, 'always', [...emojiTypes, ...plainTypes]],
    // 确保提交信息的 type 不能为空
    'type-empty': [2, 'never'],
    // 确保提交信息的 subject 不能为空
    'subject-empty': [2, 'never'],
  },
  parserPreset: {
    parserOpts: {
      // 自定义解析规则，支持带 Emoji 或不带 Emoji 的 type
      headerPattern: /^(\p{Emoji}\s*\w+|\w+)(?:\(([\w$.\-* ]+)\))?: (.+)$/u,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
};
