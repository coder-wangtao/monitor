使用 sdk 插件调用 recordscreen、performance，会走到 core 里的 use 逻辑
monitor.use(performance);
monitor.use(recordscreen, { recordScreentime: 15 });
core 里的 use 逻辑会走 new recordscreen、new performance，调用 recordscreen/performance 的主要逻辑

1.recordscreen

2.performance
