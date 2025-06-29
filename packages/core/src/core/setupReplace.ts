import { breadcrumb } from './index';
import { htmlElementAsString, getTimestamp } from '@monitor/utils';
import { EventTypes, StatusCode } from '@monitor/common';
import { addReplaceHandler } from './replace';
import { HandleEvents } from './handleEvent';

export function setupReplace(): void {
  // 白屏检测
  addReplaceHandler({
    callback: () => {
      HandleEvents.handleWhiteScreen();
    },
    type: EventTypes.WHITE_SCREEN,
  });
  // 重写XMLHttpRequest
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EventTypes.XHR);
    },
    type: EventTypes.XHR,
  });
  // 重写fetch
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EventTypes.FETCH);
    },
    type: EventTypes.FETCH,
  });
  // 捕获错误
  addReplaceHandler({
    callback: error => {
      HandleEvents.handleError(error);
    },
    type: EventTypes.ERROR,
  });
  // 监听history模式路由的变化
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHistory(data);
    },
    type: EventTypes.HISTORY,
  });
  // 添加handleUnhandleRejection事件
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleUnhandleRejection(data);
    },
    type: EventTypes.UNHANDLEDREJECTION,
  });
  // 监听click事件
  addReplaceHandler({
    callback: data => {
      // 获取html信息
      const htmlString = htmlElementAsString(data.data.activeElement as HTMLElement);
      if (htmlString) {
        breadcrumb.push({
          type: EventTypes.CLICK,
          status: StatusCode.OK,
          category: breadcrumb.getCategory(EventTypes.CLICK),
          data: htmlString,
          time: getTimestamp(),
        });
      }
    },
    type: EventTypes.CLICK,
  });
  // 监听hashchange
  addReplaceHandler({
    callback: (e: HashChangeEvent) => {
      HandleEvents.handleHashchange(e);
    },
    type: EventTypes.HASHCHANGE,
  });
}
