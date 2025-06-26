import { Callback } from '@monitor/types';
import { _global, on } from '@monitor/utils';
import { onLCP, onFID, onCLS, onFCP, onTTFB } from 'web-vitals';

let observer: MutationObserver;
let firstScreenPaint = 0; // firstScreenPaint为首屏加载时间
let isOnLoaded = false; // 页面是否渲染完成
let entries: any[] = [];
let timer: number;

function getFirstScreenPaint(callback: Callback) {
  if ('requestIdleCallback' in _global) {
    requestIdleCallback(deadline => {
      if (deadline.timeRemaining() > 0) {
        observeFirstScreenPaint(callback);
      }
    });
  } else {
    observeFirstScreenPaint(callback);
  }
}

//定时器循环监听dom的变化，当document.readyState === 'complete'时，停止监听。
function checkDOMChange(callback: Callback) {
  cancelAnimationFrame(timer);
  timer = requestAnimationFrame(() => {
    if (document.readyState === 'complete') {
      isOnLoaded = true;
    }
    if (isOnLoaded) {
      observer && observer.disconnect();
      // document.readyState === 'complete'时，计算首屏渲染时间
      firstScreenPaint = getRenderTime();
      entries = [];
      callback && callback(firstScreenPaint);
    } else {
      checkDOMChange(callback);
    }
  });
}

function getRenderTime(): number {
  let startTime = 0;
  entries.forEach(entry => {
    if (entry.startTime > startTime) {
      startTime = entry.startTime;
    }
  });
  //  // performance.timing.navigationStart 页面的起始时间
  return startTime - performance.timing.navigationStart;
}

const viewportWidth = _global.innerWidth;
const viewportHeight = _global.innerHeight;
function isInScreen(dom: HTMLElement): boolean {
  const rectInfo = dom.getBoundingClientRect();
  if (
    rectInfo.top < viewportHeight && // 元素顶部在视口高度内
    rectInfo.left < viewportWidth && // 元素左边在视口宽度内
    rectInfo.bottom > 0 && // 元素底部在视口内（大于 0）
    rectInfo.right > 0 // 元素右边在视口内（大于 0）
  ) {
    return true; // 元素部分或完全在屏幕内
  }

  return false; // 元素不在视口内
}

//外部通过callback拿到首屏加载时间
export function observeFirstScreenPaint(callback: Callback): void {
  const ignoreDOMList = ['STYLE', 'SCRIPT', 'LINK']; //这些标签在 DOM 变化时不会被处理。这是为了避免不必要的重新绘制或处理。
  //MutationObserver 监听 DOM 变化：
  observer = new MutationObserver((mutationList: any) => {
    checkDOMChange(callback);
    const entry = { children: [], startTime: 0 };
    for (const mutation of mutationList) {
      // 判断当前 mutation 是否包含新增节点，并且新增的节点是否在屏幕内
      if (mutation.addedNodes.length && isInScreen(mutation.target)) {
        for (const node of mutation.addedNodes) {
          // 忽略 STYLE, SCRIPT, LINK 标签的变化
          if (node.nodeType === 1 && !ignoreDOMList.includes(node.tagName) && isInScreen(node)) {
            entry.children.push(node as never);
          }
        }
      }
    }
    if (entry.children.length) {
      entries.push(entry);
      entry.startTime = new Date().getTime();
    }
  });

  observer.observe(document, {
    childList: true, // 监听添加或删除子节点
    subtree: true, // 监听整个子树
    characterData: true, // 监听元素的文本是否变化
    attributes: true, // 监听元素的属性是否变化
  });
}

/**
 * 是否为Safari浏览器
 * @returns true/false
 */
export function isSafari(): boolean {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
}

export function getResource(): PerformanceResourceTiming[] {
  const entries = performance.getEntriesByType('resource');
  // 过滤掉非静态资源的 fetch、 xmlhttprequest、beacon
  let list = entries.filter(entry => {
    return ['fetch', 'xmlhttprequest', 'beacon'].indexOf(entry.initiatorType) === -1;
  });

  if (list.length) {
    list = JSON.parse(JSON.stringify(list));
    list.forEach((entry: any) => {
      entry.isCache = isCache(entry);
    });
  }
  return list;
}

// 判断资源是否来自缓存
export function isCache(entry: PerformanceResourceTiming): boolean {
  return entry.transferSize === 0 || (entry.transferSize !== 0 && entry.encodedBodySize === 0);
}

//这个值通常用于衡量网页的交互响应性能，用户在页面上第一次交互的响应速度，直接影响用户体验。
//该函数通过 PerformanceObserver API 监听首次输入事件，并计算首次输入延迟（FID）。当检测到首次输入事件时，它计算 FID 并通过回调函数返回该值。
//FID：首次输入延迟
export function getFID(callback: Callback): void {
  const entryHandler = (entryList: any) => {
    for (const entry of entryList.getEntries()) {
      observer.disconnect();
      const value = entry.processingStart - entry.startTime;
      callback({
        name: 'FID',
        value,
        rating: value > 100 ? 'poor' : 'good',
      });
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'first-input', buffered: true });
  //buffered: true表示我们希望监听过去的事件，能够获取浏览器缓存的事件。这样，即使页面在加载完成后才开始监听，我们也能捕获之前的事件。
}

//(FCP) :首次内容绘制事件
export function getFCP(callback: Callback): void {
  const entryHandler = (list: any) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        observer.disconnect();
        callback({
          name: 'FCP',
          value: entry.startTime, //FCP 事件的时间戳，即从页面开始加载到首次内容绘制发生的时间，单位是毫秒（ms）。
          rating: entry.startTime > 2500 ? 'poor' : 'good',
        });
      }
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'paint', buffered: true });
}

//LCP:最大内容绘制 这个功能与 首次内容绘制 (FCP) 类似，
// 不过它关注的是页面中 最大可视元素 的绘制时间，而不仅仅是页面的首次内容绘制。
export function getLCP(callback: Callback): void {
  const entryHandler = (list: any) => {
    for (const entry of list.getEntries()) {
      observer.disconnect();
      callback({
        name: 'LCP',
        value: entry.startTime,
        rating: entry.startTime > 2500 ? 'poor' : 'good',
      });
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'largest-contentful-paint', buffered: true });
  //表示我们关注的是最大内容绘制事件，它会返回页面中最大的可视内容（通常是图片、文本等）的绘制时间。
}

//这段代码实现了 Cumulative Layout Shift (CLS) 的获取，主要用于衡量页面内容的 布局偏移，
// 即用户在加载过程中，看到的内容是否发生了不必要的位移。CLS 越小，说明页面的视觉稳定性越好。
//CLS:衡量页面内容的布局偏移
export function getCLS(callback: Callback): void {
  let clsValue = 0; // 当前最大CLS值
  let sessionValue = 0; // 当前会话中的CLS值
  let sessionEntries: any[] = []; // 当前会话中的布局偏移条目

  const entryHandler = (entryList: any) => {
    for (const entry of entryList.getEntries()) {
      //这行代码判断当前的布局偏移事件是否与用户的输入（如点击、键盘输入等）有关。
      // 如果该布局偏移事件是由用户输入触发的（例如点击按钮后页面移动），则不将其计算在内，因为这些通常不属于布局稳定性的问题。
      if (!entry.hadRecentInput) {
        const firstSessionEntry = sessionEntries[0]; // 会话中的第一个布局偏移条目
        const lastSessionEntry = sessionEntries[sessionEntries.length - 1]; // 会话中的最后一个布局偏移条目

        // 如果当前条目与会话中最后一条记录的时间相隔小于 1 秒，并且
        // 与会话中第一个条目的时间相隔小于 5 秒，那么条目属于当前会话
        if (
          sessionValue &&
          entry.startTime - lastSessionEntry.startTime < 1000 && // 条目时间间隔小于 1 秒
          entry.startTime - firstSessionEntry.startTime < 5000 // 与会话的第一个条目相隔时间小于 5 秒
        ) {
          sessionValue += entry.value; // 将当前条目的偏移值加到当前会话的 CLS 值
          sessionEntries.push(entry); // 将条目加入当前会话
        } else {
          sessionValue = entry.value; // 开始一个新的会话，当前条目的偏移值作为新的会话的初始值
          sessionEntries = [entry]; // 开始新的会话，只有当前条目
        }

        // 如果当前会话的 CLS 值大于已有的最大 CLS 值，则更新最大 CLS 值
        if (sessionValue > clsValue) {
          clsValue = sessionValue; // 更新最大 CLS 值
          observer.disconnect(); // 停止观察性能条目，避免重复计算

          // 调用回调函数，传递 CLS 结果
          callback({
            name: 'CLS',
            value: clsValue,
            rating: clsValue > 2500 ? 'poor' : 'good', // 如果 CLS 超过 2500ms，认为性能较差
          });
        }
      }
    }
  };

  const observer = new PerformanceObserver(entryHandler);
  observer.observe({ type: 'layout-shift', buffered: true });
}
//首字节时间,是衡量网页加载性能的一个重要指标，它表示从用户发出请求到浏览器收到第一个字节的数据所需要的时间。
// 当用户访问一个网站时，整个加载过程可以分为几个阶段，首字节时间主要关注以下几个部分：
// 请求发起：用户输入网址，浏览器发起请求，访问服务器。
// DNS 解析：浏览器需要解析域名，获取对应的 IP 地址。
// 建立连接：浏览器通过 TCP（对于 HTTPS 会有 TLS 握手）与服务器建立连接。
// 服务器处理：服务器接收到请求并开始处理，直到开始返回数据。
// 响应开始：服务器开始发送第一个字节的数据到浏览器，这个时刻就是 TTFB。
export function getTTFB(callback: Callback): void {
  on(_global, 'load', function () {
    const { responseStart, navigationStart } = _global.performance.timing;
    const value = responseStart - navigationStart;
    callback({
      name: 'TTFB',
      value,
      rating: value > 100 ? 'poor' : 'good',
    });
  });
}

export function getWebVitals(callback: Callback): void {
  // web-vitals 不兼容safari浏览器
  if (isSafari()) {
    getFID(res => {
      callback(res);
    });
    getFCP(res => {
      callback(res);
    });
    getLCP(res => {
      callback(res);
    });
    getCLS(res => {
      callback(res);
    });
    getTTFB(res => {
      callback(res);
    });
  } else {
    // 最大内容绘制时间:LCP 测量的是从页面开始加载到页面中最大的可视内容元素（如图片、视频、文字块等）被完全呈现所需的时间。
    onLCP(res => {
      callback(res);
    });
    //首次输入延迟:FID 测量的是用户首次与页面交互（例如点击按钮、链接或输入文本框）到浏览器响应该交互（即执行事件处理程序）之间的延迟时间。
    onFID(res => {
      callback(res);
    });
    //累积布局偏移：CLS 衡量的是页面加载过程中元素的视觉稳定性。它统计的是用户在页面加载过程中看到的所有意外布局偏移的程度。
    onCLS(res => {
      callback(res);
    });
    //(FCP) :首次内容绘制事件:即从页面开始加载到首次内容绘制发生的时间，
    onFCP(res => {
      callback(res);
    });
    ////首字节时间,是衡量网页加载性能的一个重要指标，它表示从用户发出请求到浏览器收到第一个字节的数据所需要的时间。
    onTTFB(res => {
      callback(res);
    });
  }

  //首屏加载时间
  getFirstScreenPaint(res => {
    const data = {
      name: 'FSP',
      value: res,
      rating: res > 2500 ? 'poor' : 'good',
    };
    callback(data);
  });
}
