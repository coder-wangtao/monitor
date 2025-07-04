1.Vue 使用插件的方式注册(Vue.use),监控 sdk 提供 install 方法
2.vue 项目在 Vue.config.errorHandler 中上报错误
3.init 监控 sdk，走 sdk 的逻辑
3.1 初始化各种配置
3.2 重写 XMLHttpRequest、重写 fetch、捕获错误、监听 history 模式路由的变化、添加 handleUnhandleRejection 事件、监听 click 事件、监听 hashchange、白屏检测
3.3 针对以上每一项，都会有一个 callback,譬如{ fetch: [ handleHttpCallback ] }，这相当于一个 subscribe。同时还有一个 notify,去执行 fetch 里[]的 handleHttpCallback。

3.4 重写 XMLHttpRequest
3.4.1 重写 XMLHttpRequest 原型上的 open 方法，重写 XMLHttpRequest 原型上的 send 方法，做一些指标收集，再通过 apply 调用 XMLHttpRequest 原型上的 open、send 方法(AOP 编程),最后监听 XMLHttpRequest 实例上的 loadend 事件，处理一些指标：时间、request、response、status。最后 notify 调用之前存入的 callback,并且把收集到的指标传进去。
3.4.2 走到 handleCallback 中，首先会存储用户的行为栈；如果接口出错，调用后台接口上报错误。
3.4.3 走到上报错误的逻辑，优先使用 sendBeacon 上报，若数据量大，（sendBeacon 没有返回值，则证明上报失败），再使用图片打点上报和 fetch 上报。上报的时候会做一个消息队列，会把上报的函数添加到这个队列中，优先使用 requestIdleCallback，其次使用微任务，此时 isFlushing 为 true,新添加进来的上报函数不会走 requestIdleCallback/微任务。等 requestIdleCallback/微任务开始执行，isFlushing 为 false，此时新添加进来的上报函数不会继续走 requestIdleCallback/微任务。

3.5 重写 fetch
3.5.1 重写 window 上的 fetch 方法，做一些指标收集，再通过 apply 调用 window 上原来的 fetch 方法，无论接口正确或者接口错误，最后 notify 调用之前存入的 callback,并且把收集到的指标传进去。
3.5.2 走到 handleCallback 中，首先会存储用户的行为栈；如果接口出错，调用后台接口上报错误。
3.5.3 走到上报错误的逻辑，优先使用 sendBeacon 上报，若数据量大，（sendBeacon 没有返回值，则证明上报失败），再使用图片打点上报和 fetch 上报。上报的时候会做一个消息队列，会把上报的函数添加到这个队列中，优先使用 requestIdleCallback，其次使用微任务，此时 isFlushing 为 true,新添加进来的上报函数不会走 requestIdleCallback/微任务。等 requestIdleCallback/微任务开始执行，isFlushing 为 false，此时新添加进来的上报函数不会继续走 requestIdleCallback/微任务。

3.6 window.onerror 捕获错误
3.6.1 window.onerror 捕获到错误，通过 notify 调用之前存入的 callback,并且把收集到的指标传进去。
3.6.2 走到 handleCallback 中，首先使用 error-stack-parser 解析错误信心，获取错误的文件名、行号、列号，其次再会存储用户的行为栈；对每一个错误使用 window.btoa 生成唯一的编码。之后会在 window 上搞一个 map,记录错误的唯一编码，通过这个 map 判断第一次报错才上报。
3.6.3 走到上报错误的逻辑，优先使用 sendBeacon 上报，若数据量大，（sendBeacon 没有返回值，则证明上报失败），再使用图片打点上报和 fetch 上报。上报的时候会做一个消息队列，会把上报的函数添加到这个队列中，优先使用 requestIdleCallback，其次使用微任务，此时 isFlushing 为 true,新添加进来的上报函数不会走 requestIdleCallback/微任务。等 requestIdleCallback/微任务开始执行，isFlushing 为 false，此时新添加进来的上报函数不会继续走 requestIdleCallback/微任务。

3.7 监听 history 模式路由的变化
3.7.1 重写 window.onpopstate,获取上一次的路由和当前路由，再 notify 调用之前存入的 callback,并且把收集到的指标传进去。
3.7.2 走到 handleCallback 中，会存储用户的行为栈。
3.7.3 最后再通过 apply 调用 window 原来的 window.onpopstate

3.8 添加 handleUnhandleRejection 事件
3.8.1 window.unhandledrejection 捕获到错误，通过 notify 调用之前存入的 callback,并且把收集到的错误传进去。
3.8.2 走到 handleCallback 中，首先使用 error-stack-parser 解析错误信心，获取错误的文件名、行号、列号，其次再会存储用户的行为栈；对每一个错误使用 window.btoa 生成唯一的编码。之后会在 window 上搞一个 map,记录错误的唯一编码，通过这个 map 判断第一次报错才上报。
3.8.3 走到上报错误的逻辑，优先使用 sendBeacon 上报，若数据量大，（sendBeacon 没有返回值，则证明上报失败），再使用图片打点上报和 fetch 上报。上报的时候会做一个消息队列，会把上报的函数添加到这个队列中，优先使用 requestIdleCallback，其次使用微任务，此时 isFlushing 为 true,新添加进来的上报函数不会走 requestIdleCallback/微任务。等 requestIdleCallback/微任务开始执行，isFlushing 为 false，此时新添加进来的上报函数不会继续走 requestIdleCallback/微任务。

3.9 监听 click 事件
3.9.1 监听 document.click 事件，在 document.click 事件回调函数中执行 notify，这个 notify 会做一个节流操作，通过 notify 调用之前存入的 callback,并且把收集到的信息(将传入的 HTML 元素转换为一个简单的 HTML 字符串表示)传入进去。
3.9.2 走到 handleCallback 中，会存储用户的行为栈。

3.10 监听 hashchange
3.10.1 在 window.onhashchange 回调中，用 notify 调用之前存入的 callback,并且把收集到的指标传进去。
3.10.2 走到 handleCallback 中，会存储用户的行为栈。

3.11 添加白屏检测
3.11.1 直接通过 notify 调用之前存入的 callback。
3.11.2 走到 handleCallback 中