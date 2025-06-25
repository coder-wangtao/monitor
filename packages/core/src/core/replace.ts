import { ReplaceHandler, voidFun } from '@monitor/types';
import { notify, subscribeEvent } from './subscribe';
import { EMethods, EventTypes, HttpType } from '@monitor/common';
import {
  _global,
  getLocationHref,
  getTimestamp,
  on,
  replaceAop,
  supportsHistory,
  throttle,
  variableTypeDetection,
} from '@monitor/utils';
import { transportData } from './reportData';
import { options } from './options';

function isFilterHttpUrl(url: string): boolean {
  return options.filterXhrUrlRegExp && options.filterXhrUrlRegExp.test(url);
}

function replace(type: EventTypes): void {
  switch (type) {
    case EventTypes.XHR:
      xhrReplace();
      break;
    case EventTypes.FETCH:
      fetchReplace();
      break;
    case EventTypes.ERROR:
      listenError();
      break;
    case EventTypes.HISTORY:
      historyReplace();
      break;
    case EventTypes.UNHANDLEDREJECTION:
      unhandledRejectionReplace();
      break;
    case EventTypes.CLICK:
      domReplace();
      break;
    case EventTypes.WHITE_SCREEN:
      whiteScreen();
      break;
  }
}

export function addReplaceHandler(handler: ReplaceHandler): void {
  if (!subscribeEvent(handler)) return;
  replace(handler.type);
}

// const xhr = new XMLHttpRequest();
// // ② 配置请求：open(method, url, async = true, user?, password?)
// xhr.open('GET', '/api/user/profile', true); // true 表示异步
// // ③ 监听结果
// xhr.onload = function () {
//   if (xhr.status === 200) {
//     // 成功：xhr.responseText 是响应字符串
//     console.log('结果：', JSON.parse(xhr.responseText));
//   } else {
//     console.error('HTTP 错误：', xhr.status);
//   }
// };
// xhr.onerror = () => console.error('网络错误'); // 例如断网
// // ④ 发送（GET 没有请求体）
// xhr.send();

function xhrReplace(): void {
  if (!('XMLHttpRequest' in _global)) {
    return;
  }
  const originalXhrProto = XMLHttpRequest.prototype;
  replaceAop(originalXhrProto, 'open', (originalOpen: voidFun) => {
    return function (this: any, ...args: any[]): void {
      this.monitor_xhr = {
        method: variableTypeDetection.isString(args[0]) ? args[0].toUpperCase() : args[0], //获取请求方法 xhr.open('GET', '/api/user/profile', true)
        url: args[1], //获取请求的url
        sTime: getTimestamp(), //开始时间
        type: HttpType.XHR, //类型 xhr
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
        this.monitor_xhr.requestData = args[0]; //获取请求数据
        const eTime = getTimestamp();
        //设置改接口的time,用户行为按照时间排序
        this.monitor_xhr.time = this.monitor_xhr.sTime; //xhr的开始时间
        this.monitor_xhr.Status = status; //xhr的结果的status
        if (['', 'json', 'text'].indexOf(responseType) !== -1) {
          //用户设置handleHttpStatus函数来判断接口是否正确，只有接口报错时才保留response
          if (options.handleHttpStatus && typeof options.handleHttpStatus == 'function') {
            this.monitor_xhr.response = response && JSON.parse(response);
          }
        }
        //接口的执行时长
        this.monitor_xhr.elapsedTime = eTime - this.monitor_xhr.sTime;
        //执行之前注册的xhr回调函数
        notify(EventTypes.XHR, this.monitor_xhr);
      });
      originalSend.apply(this, args);
    };
  });
}

// fetch(url, options?)      // 返回 Promise<Response>
// url：请求地址（字符串或 Request 对象）
// options：可选配置对象，常用字段
// method – 请求方式，默认 GET
// headers – 请求头 Headers | plain object
// body – 请求体（string、FormData、Blob、URLSearchParams、ReadableStream…）
// credentials – omit | same-origin | include（是否带 cookie）
// mode – cors | no-cors | same-origin
// signal – AbortSignal，用于取消
// 返回值：一个 Response 对象的 Promise。必须再调用 response.json() / response.text() / response.blob() 等方法解析主体。
function fetchReplace(): void {
  if (!('fetch' in _global)) {
    return;
  }
  replaceAop(_global, EventTypes.FETCH, originalFetch => {
    return function (url: any, config: Partial<Request> = {}): void {
      const sTime = getTimestamp();
      const method = (config && config.method) || 'GET';
      let fetchData = {
        type: HttpType.FETCH,
        method,
        requestData: config && config.body,
        url,
        response: '',
      };
      //获取配置的headers
      const headers = new Headers(config.headers || {});
      Object.assign(headers, {
        setRequestHeader: headers.set,
      });
      config = Object.assign({}, config, headers);
      return originalFetch.apply(_global, [url, config]).then(
        (res: any) => {
          //克隆一份，防止被标记已消费
          const tempRes = res.clone();
          const eTime = getTimestamp();
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            Status: tempRes.status,
            time: sTime,
          });
          tempRes.text().then((data: any) => {
            //同理，对接口进行过滤
            if (
              (method === EMethods.Post && transportData.isSdkTransportUrl(url)) ||
              isFilterHttpUrl(url)
            ) {
              return;
            }
            //用户设置handleHttpStatus函数来判断接口是否正确，只有接口报错时才保留response
            if (options.handleHttpStatus && typeof options.handleHttpStatus == 'function') {
              fetchData.response = data;
            }
            notify(EventTypes.FETCH, fetchData);
          });
        },
        (err: any) => {
          const eTime = getTimestamp();
          if (
            (method === EMethods.Post && transportData.isSdkTransportUrl(url)) ||
            isFilterHttpUrl(url)
          )
            return;
          fetchData = Object.assign({}, fetchData, {
            elapsedTime: eTime - sTime,
            status: 0,
            time: sTime,
          });
          notify(EventTypes.FETCH, fetchData);
          throw err;
        }
      );
    };
  });
}

function listenError(): void {
  on(
    _global,
    'error',
    function (e: ErrorEvent) {
      console.log(e);
      notify(EventTypes.ERROR, e);
    },
    true
  );
}

// last time route
let lastHref: string = getLocationHref();
function historyReplace(): void {
  //是否支持history
  if (!supportsHistory()) return;
  const oldOnpopstate = _global.onpopstate;
  _global.onpopstate = function (this: any, ...args: any): void {
    const to = getLocationHref();
    const from = lastHref;
    lastHref = to;
    notify(EventTypes.HISTORY, {
      from,
      to,
    });
    oldOnpopstate && oldOnpopstate.apply(this, args);
  };
  function historyReplaceFn(originalHistoryFn: voidFun): voidFun {
    return function (this: any, ...args: any[]): void {
      const url = args.length > 2 ? args[2] : undefined;
      if (url) {
        const from = lastHref;
        const to = String(url);
        lastHref = to;
        notify(EventTypes.HISTORY, {
          from,
          to,
        });
      }
      return originalHistoryFn.apply(this, args);
    };
  }
  replaceAop(_global.history, 'pushState', historyReplaceFn);
  replaceAop(_global.history, 'replaceState', historyReplaceFn);
}

function unhandledRejectionReplace(): void {
  on(_global, EventTypes.UNHANDLEDREJECTION, function (ev: PromiseRejectionEvent) {
    // ev.preventDefault() 阻止默认行为后，控制台就不会再报红色错误
    notify(EventTypes.UNHANDLEDREJECTION, ev);
  });
}

function domReplace(): void {
  if (!('document' in _global)) return;
  //节流，默认0s
  const clickThrottle = throttle(notify, options.throttleDelayTime);
  on(
    _global.document,
    'click',
    function (this: any): void {
      clickThrottle(EventTypes.CLICK, {
        category: 'click',
        data: this,
      });
    },
    true
  );
}

function whiteScreen(): void {
  notify(EventTypes.WHITE_SCREEN);
}
