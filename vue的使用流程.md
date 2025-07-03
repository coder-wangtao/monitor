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
