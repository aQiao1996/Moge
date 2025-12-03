/**
 * Dayjs 全局配置
 * 统一配置 dayjs 的插件和本地化设置
 *
 * 使用方式：
 * import dayjs from '@/lib/dayjs';
 * dayjs().fromNow(); // "几秒前"
 */

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

// 注册插件
dayjs.extend(relativeTime);

// 设置全局语言为中文
dayjs.locale('zh-cn');

// 导出配置好的 dayjs 实例
export default dayjs;
