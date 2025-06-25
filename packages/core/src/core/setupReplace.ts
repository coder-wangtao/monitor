import { EventTypes, StatusCode } from '@monitor/common';
import { HandleEvents } from './handleEvent';
import { addReplaceHandler } from './replace';
import { getTimestamp, htmlElementAsString } from '@monitor/utils';
import { breadCrumb } from './breadcrumb';

export function setupReplace(): void {
  //重写XMLHttpRequest
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EventTypes.XHR);
    },
    type: EventTypes.XHR,
  });

  //重写fetch
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EventTypes.FETCH);
    },
    type: EventTypes.FETCH,
  });
  //错误捕获
  addReplaceHandler({
    callback: error => {
      HandleEvents.handleError(error);
    },
    type: EventTypes.ERROR,
  });
  //监听history模式路由变化
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHistory(data);
    },
    type: EventTypes.HISTORY,
  });
  // 添加handleUnhandledRejection事件
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleUnhandledRejection(data);
    },
    type: EventTypes.UNHANDLEDREJECTION,
  });
  // 监听click事件
  addReplaceHandler({
    callback: data => {
      // 获取html信息
      const htmlString = htmlElementAsString(data.data.activeElement as HTMLElement);
      if (htmlString) {
        breadCrumb.push({
          type: EventTypes.CLICK,
          status: StatusCode.OK,
          category: breadCrumb.getCategory(EventTypes.CLICK),
          data: htmlString,
          time: getTimestamp(),
        });
      }
    },
    type: EventTypes.CLICK,
  });
  //监听hashchange
  addReplaceHandler({
    callback: (e: HashChangeEvent) => {
      HandleEvents.handleHashchange(e);
    },
    type: EventTypes.HASHCHANGE,
  });

  //白屏检测
  addReplaceHandler({
    callback: () => {
      HandleEvents.handleWhiteScreen();
    },
    type: EventTypes.WHITE_SCREEN,
  });
}
