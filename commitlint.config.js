module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 限制提交类型必须是以下枚举值之一
    'type-enum': [
      2,
      'always',
      [
        '🎉 init', // 初始化项目
        '🔧 build', // 构建相关
        '🐳 chore', // 辅助工具的变动
        '🐎 ci', // 自动化构建
        '📃 docs', // 文档（documentation）
        '✨ feat', // 新功能（feature）
        '🐞 fix', // 修补bug
        '🌈 style', // 格式（不影响代码运行的变动）
        '🦄 refactor', // 重构（即不是新增功能，也不是修改bug的代码变动）
        '🧪 test', // 增加测试用例
        '↩ revert', // 回滚到上一版本
        '🎈 perf', // 优化相关
      ],
    ],
    // 确保提交信息的 type 不能为空
    'type-empty': [2, 'never'],
    // 确保提交信息的 subject 不能为空
    'subject-empty': [2, 'never'],
  },
  parserPreset: {
    parserOpts: {
      // 自定义解析规则，支持 Emoji 开头的 type
      // 我这里只是为了配合 vscode 插件 git-commit-plugin 使用，一般公司应该不会需要 Emoji
      headerPattern: /^(\p{Emoji}\s*\w+)(?:\(([\w$.\-* ]+)\))?: (.+)$/u,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
};
