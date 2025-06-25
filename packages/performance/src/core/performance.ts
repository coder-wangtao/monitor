import { Callback } from '@monitor/types';

/**
 * 是否为Safari浏览器
 * @returns true/false
 */
export function isSafari(): boolean {
  return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
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
  }
}
