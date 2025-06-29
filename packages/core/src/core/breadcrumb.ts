import { EventTypes, BreadcrumbTypes } from '@monitor/common';
import { validateOption, getTimestamp, _support } from '@monitor/utils';
import { BreadcrumbData, InitOptions } from '@monitor/types';

// 创建用户行为类
export class Breadcrumb {
  maxBreadcrumbs = 20; // maxBreadcrumbs控制上报用户行为的最大条数
  beforePushBreadcrumb: unknown = null; //这是一个钩子函数，允许在面包屑数据被加入堆栈之前进行处理。如果提供了此钩子函数，那么每次添加面包屑时都会调用它。
  stack: BreadcrumbData[]; // stack 存储用户行为

  constructor() {
    this.stack = [];
  }
  /**
   * 添加用户行为栈
   */
  push(data: BreadcrumbData): void {
    if (typeof this.beforePushBreadcrumb === 'function') {
      // 执行用户自定义的hook
      const result = this.beforePushBreadcrumb(data) as BreadcrumbData;
      if (!result) return;
      this.immediatePush(result);
      return;
    }
    this.immediatePush(data);
  }

  immediatePush(data: BreadcrumbData): void {
    data.time || (data.time = getTimestamp());
    if (this.stack.length >= this.maxBreadcrumbs) {
      // 超出则删除第一条
      this.shift();
    }
    this.stack.push(data);
    this.stack.sort((a, b) => a.time - b.time);
  }

  shift(): boolean {
    return this.stack.shift() !== undefined;
  }

  clear(): void {
    this.stack = [];
  }

  getStack(): BreadcrumbData[] {
    return this.stack;
  }

  getCategory(type: EventTypes): BreadcrumbTypes {
    switch (type) {
      // 接口请求
      case EventTypes.XHR:
      case EventTypes.FETCH:
        return BreadcrumbTypes.HTTP;

      // 用户点击
      case EventTypes.CLICK:
        return BreadcrumbTypes.CLICK;

      // 路由变化
      case EventTypes.HISTORY:
      case EventTypes.HASHCHANGE:
        return BreadcrumbTypes.ROUTE;

      // 加载资源
      case EventTypes.RESOURCE:
        return BreadcrumbTypes.RESOURCE;

      // Js代码报错
      case EventTypes.UNHANDLEDREJECTION:
      case EventTypes.ERROR:
        return BreadcrumbTypes.CODEERROR;

      // 用户自定义
      default:
        return BreadcrumbTypes.CUSTOM;
    }
  }

  bindOptions(options: InitOptions): void {
    // maxBreadcrumbs 用户行为存放的最大容量
    // beforePushBreadcrumb 添加用户行为前的处理函数
    const { maxBreadcrumbs, beforePushBreadcrumb } = options;
    validateOption(maxBreadcrumbs, 'maxBreadcrumbs', 'number') &&
      (this.maxBreadcrumbs = maxBreadcrumbs || 20);
    validateOption(beforePushBreadcrumb, 'beforePushBreadcrumb', 'function') &&
      (this.beforePushBreadcrumb = beforePushBreadcrumb);
  }
}

const breadcrumb = _support.breadcrumb || (_support.breadcrumb = new Breadcrumb());

export { breadcrumb };
