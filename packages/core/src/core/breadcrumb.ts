import { BreadcrumbTypes, EventTypes } from '@monitor/common';
import { BreadcrumbData, InitOptions } from '@monitor/types';
import { getTimestamp, validateOption, _support } from '@monitor/utils';
//用户行为
export class BreadCrumb {
  maxBreadcrumbs = 20; //用户行为存放的最大长度
  beforePushBreadCrumb: unknown = null;
  stack: BreadcrumbData[];
  constructor() {
    this.stack = [];
  }

  /**
   * 添加用户行为栈
   */
  push(data: BreadcrumbData): void {
    if (typeof this.beforePushBreadCrumb === 'function') {
      const result = this.beforePushBreadCrumb(data) as BreadcrumbData;
      if (!result) return;
      this.immediatePush(result);
      return;
    }
    this.immediatePush(data);
  }

  immediatePush(data: BreadcrumbData): void {
    data.time || (data.time = getTimestamp());
    if (this.stack.length >= this.maxBreadcrumbs) {
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
      //接口请求
      case EventTypes.XHR:
      case EventTypes.FETCH:
        return BreadcrumbTypes.HTTP;
      //用户点击
      case EventTypes.CLICK:
        return BreadcrumbTypes.CLICK;
      //路由变化
      case EventTypes.HISTORY:
      case EventTypes.HASHCHANGE:
        return BreadcrumbTypes.ROUTE;
      //加载资源
      case EventTypes.RESOURCE:
        return BreadcrumbTypes.RESOURCE;
      //Js代码报错
      case EventTypes.UNHANDLEDREJECTION:
      case EventTypes.ERROR:
        return BreadcrumbTypes.CODEERROR;
      //用户自定义
      default:
        return BreadcrumbTypes.CUSTOM;
    }
  }

  bindOptions(options: InitOptions): void {
    const { maxBreadcrumbs, beforePushBreadcrumb } = options;
    validateOption(maxBreadcrumbs, 'maxBreadcrumbs', 'number') &&
      (this.maxBreadcrumbs = maxBreadcrumbs || 20);
    validateOption(beforePushBreadcrumb, 'beforePushBreadcrumb', 'function') &&
      (this.beforePushBreadCrumb = beforePushBreadcrumb);
  }
}

const breadCrumb = _support.breadcrumb || (_support.breadcrumb = new BreadCrumb());
export { breadCrumb };
