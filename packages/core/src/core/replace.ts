import { ReplaceHandler, voidFun } from '@monitor/types';
import { subscribeEvent } from './subscribe';
import { EMethods, EventTypes, HttpType } from '@monitor/common';
import { _global, getTimestamp, on, replaceAop, variableTypeDetection } from '@monitor/utils';
import { transportData } from './reportData';
import { options } from './options';

function isFilterHttpUrl(url: string): boolean {
  return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}

function replace(type: EventTypes): void {
  switch (type) {
    case EventTypes.XHR:
      xhrReplace();
  }
}

export function addReplaceHandler(handler: ReplaceHandler): void {
  if (!subscribeEvent(handler)) return;
  replace(handler.type);
}

function xhrReplace(): void {
  if (!('XMLHttpRequest' in _global)) {
    return;
  }
  const originalXhrProto = XMLHttpRequest.prototype;
  replaceAop(originalXhrProto, 'open', (originalOpen: voidFun) => {
    return function (this: any, ...args: any[]): void {
      this.monitor_xhr = {
        method: variableTypeDetection.isString(args[0]) ? args[0].toUpperCase() : args[0],
        url: args[1],
        sTime: getTimestamp(),
        type: HttpType.XHR,
      };

      originalOpen.apply(this, args);
    };
  });
  replaceAop(originalXhrProto, 'send', (originalSend: voidFun) => {
    return function (this: any, ...args: any[]): void {
      const { method, url } = this.monitor_xhr;
      // 监听loaded事件，接口成功或失败都会执行
      on(this, 'loadend', function (this: any) {
        //isSdkTransportUrl 判断当前接口是否为上报的接口
        //isFilterHttpUrl 判断当前接口是否为需要过滤掉的接口
        if (
          (method === EMethods.Post && transportData.isSdkTransportUrl(url)) ||
          isFilterHttpUrl(url)
        )
          return;
        const { responseType, response, status } = this;
      });
    };
  });
}
