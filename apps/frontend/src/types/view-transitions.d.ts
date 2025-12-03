/**
 * View Transitions API 类型声明
 * 实验性 Web API，用于创建平滑的页面过渡效果
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
 */

interface ViewTransition {
  /**
   * 一个 Promise，当 transition 准备好执行动画时 resolve
   */
  readonly ready: Promise<void>;

  /**
   * 一个 Promise，当 transition 动画完成时 resolve
   */
  readonly finished: Promise<void>;

  /**
   * 一个 Promise，当新的页面视图创建完成时 resolve
   */
  readonly updateCallbackDone: Promise<void>;

  /**
   * 跳过 transition 动画
   */
  skipTransition: () => void;
}

interface Document {
  /**
   * 启动一个视图过渡动画
   * @param callback 更新 DOM 的回调函数
   * @returns ViewTransition 对象
   */
  startViewTransition(callback: () => void | Promise<void>): ViewTransition;
}
