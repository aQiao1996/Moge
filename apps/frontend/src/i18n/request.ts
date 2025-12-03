/**
 * next-intl 国际化配置
 * 支持中文和英文两种语言
 */

import { getRequestConfig } from 'next-intl/server';
import type { Messages } from './messages.type';

export default getRequestConfig(async () => {
  // 默认语言为中文
  const locale = 'zh';

  const messagesModule = (await import(`../../messages/${locale}.json`)) as { default: Messages };

  return {
    locale,
    messages: messagesModule.default,
  };
});
