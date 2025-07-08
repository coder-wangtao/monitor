使用 sdk 插件调用 recordscreen、performance，会走到 core 里的 use 逻辑
monitor.use(performance);
monitor.use(recordscreen, { recordScreentime: 15 });
core 里的 use 逻辑会走 new recordscreen、new performance，调用 recordscreen/performance 的主要逻辑

1 recordscreen(走到 recordscreen 逻辑)
1.1 PerformanceObserver 监听 longTask 上报
1.2 window.onload 监听：performance.getEntriesByType('resource')获取所有资源 list，并过滤掉非静态资源(如：fetch、 xmlhttprequest、beacon)，然后上报。通过 performance.memory 获取内存信息，然后上报。
1.3 由于 web-vitals 不兼容 safari 浏览器，所以当是 safari 浏览器，手写 onLCP, onFID, onCLS, onFCP, onTTFB 等指标，其他浏览器走 web-vitals/['vaɪt(ə)lz]/库中的 onLCP, onFID, onCLS, onFCP, onTTFB。
1.3.1 FID(首次输入延迟)
PerformanceObserver 监听'first-input'事件，根据事件通过 processingStart - startTime 来计算的。startTime 是事件开始的时间，processingStart 是事件开始处理的时间。两者的差值就是用户交互的延迟，即 FID，之后根据延迟值判断评级，若大于 100ms，则为 "poor"，否则为 "good"。上报数据。
1.3.2 FCP(首次内容绘制)
PerformanceObserver 检查是否为'first-contentful-paint'事件，根据 FCP 的时间来判断评分。若 FCP 时间大于 2500ms，则为 poor，否则为 good。上报数据。
1.3.3 LCP(最大内容绘制)：LCP 是一种网页性能指标，用于衡量页面加载过程中的 最大可见内容元素（如图片、视频或文本块）绘制完成的时间
PerformanceObserver 检查是否为'largest-contentful-paint'事件，根据 LCP 的时间来判断评分。若 LCP 时间大于 2500ms，则为 poor，否则为 good。上报数据。
1.3.4 CLS(累计布局偏移)(Cumulative Layout Shift):用于衡量页面在加载过程中的视觉稳定性。具体来说，它衡量了页面中元素的布局变化，越少的布局偏移意味着页面越稳定。
通过监听 PerformanceObserver 中的 layout-shift 事件来捕捉页面的布局变化。通过对会话的管理，代码确保了累积的布局偏移是合理的，评分：若 CLS 值大于 2500，则为 poor，否则为 good。
1.3.5 TTFB 首字节时间（Time to First Byte）:TTFB 是指浏览器从发起请求到接收到第一个字节的时间，反映了服务器的响应速度，通常用于评估服务器的性能。
TTFB 是通过 responseStart - navigationStart 计算的，表示从发起请求到接收到响应的第一个字节的时间，根据 TTFB 的值判断评分。如果 TTFB 大于 100ms，则为 'poor'，否则为 'good'。

2.performance
