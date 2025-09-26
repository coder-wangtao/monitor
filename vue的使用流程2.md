使用 sdk 插件调用 recordscreen、performance，会走到 core 里的 use 逻辑
monitor.use(performance);
monitor.use(recordscreen, { recordScreentime: 15 });
core 里的 use 逻辑会走 new recordscreen、new performance，调用 recordscreen/performance 的主要逻辑
针对以上 recordscreen，performance，都会有一个 callback,譬如{ recordscreen: [ handleHttpCallback ] }，这相当于一个 subscribe。同时还有一个 notify,去执行 recordscreen 里[]的 handleHttpCallback。

1 performance(走到 performance 逻辑)
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

const { responseStart, navigationStart } = \_global.performance.timing;
const value = responseStart - navigationStart;
1.3.5 TTFB 首字节时间（Time to First Byte）:TTFB 是指浏览器从发起请求到接收到第一个字节的时间，反映了服务器的响应速度，通常用于评估服务器的性能。
TTFB 是通过 responseStart - navigationStart 计算的，表示从发起请求到接收到响应的第一个字节的时间，根据 TTFB 的值判断评分。如果 TTFB 大于 100ms，则为 'poor'，否则为 'good'。

2.recordscreen(走到 recordscreen 逻辑)
2.1 每一个录屏都会有一个 uuid
2.2 录屏主要是用 rrweb 中的 record 方法，rrweb：提供了 record 和 replay 两个方法；record 方法用来记录页面上 DOM 的变化，replay 方法支持根据时间戳去还原 DOM 的变化
2.3 如何只上报报错时的录屏信息呢 ？
2.3.1 window 上设置 hasError、recordScreenId 变量，hasError 用来判断某段时间代码是否报错；recordScreenId 用来记录此次录屏的 id
2.3.2 当页面发生错误需要上报时，先判断是否开启了录屏，如果开启了，将 hasError 设为 true，同时将 window 上的 recordScreenId 存储到此次上报信息的 data 中
2.3.3 rrweb 设置 10s/次 录制快照的频率，每次重置录屏时，判断 hasError 是否为 true（即这段时间内是否发生报错），如果有发生错误，将这次的录屏信息上报，并重置录屏信息和 recordScreenId，重置 hasError 为 false,作为下次录屏使用。
2.3.4 后台报错列表，从本次报错报的 data 中取出 recordScreenId 来播放录屏
2.4 压缩上报数据
2.4.1 如果一直录屏，数据量是巨大的，实测下来，录制 10s 的时长，数据大小约为 8M 左右（页面的不同复杂度、用户不同操作的频率都会造成大小不一样）
2.4.2 官方提供压缩方式(rrweb.pack/rrweb.unpack)，是对每个 event 数据单独进行压缩，实测下来，压缩比不高。
2.4.3 官方更加推荐将多个 event 批量一次性压缩，这样压缩效果更好,sdk 内部使用 pako.js、js-base64 相结合的压缩方式。
2.4.5 压缩的主要逻辑
2.4.5.1 接收任意类型的数据；
2.4.5.2 如果不是字符串或数字，则先转为 JSON 字符串；
2.4.5.3 用 Base64 编码，确保中文等字符不会出问题；
2.4.5.4 再用 pako.gzip 进行压缩；
2.4.5.5 最后返回一个压缩后的 Base64 字符串。
