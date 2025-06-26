import { EventTypes, StatusCode } from '@monitor/common';
import { BasePlugin, SdkBase } from '@monitor/types';
import { getResource, getWebVitals } from './core/performance';
import { _global, getTimestamp, on, setFlag } from '@monitor/utils';

export default class WebPerformance extends BasePlugin {
  constructor() {
    super(EventTypes.PERFORMANCE);
    this.type == EventTypes.PERFORMANCE;
  }
  bindOptions() {}

  core({ transportData }: SdkBase) {
    // 获取FCP、LCP、TTFB、FID等指标
    getWebVitals((res: any) => {
      // name指标名称、rating 评级、value数值
      const { name, rating, value } = res;
      transportData.send({
        type: EventTypes.PERFORMANCE,
        status: StatusCode.OK,
        time: getTimestamp(),
        name,
        rating,
        value,
      });
    });

    const observer = new PerformanceObserver(list => {
      for (const long of list.getEntries()) {
        transportData.send({
          type: EventTypes.PERFORMANCE,
          name: 'longtask',
          longTask: long,
          time: getTimestamp(),
          status: StatusCode.OK,
        });
      }
    });
    observer.observe({ entryTypes: ['longtask'] });

    on(_global, 'load', function () {
      //上报资源列表
      transportData.send({
        type: EventTypes.PERFORMANCE,
        name: 'resourceList',
        time: getTimestamp(),
        status: StatusCode.OK,
        resourceList: getResource(),
      });
      //上报内存情况, safari、firefox不支持该属性
      if (performance.memory) {
        transportData.send({
          type: EventTypes.PERFORMANCE,
          name: 'memory',
          time: getTimestamp(),
          status: StatusCode.OK,
          memory: {
            jsHeapSizeLimit: performance.memory && performance.memory.jsHeapSizeLimit,
            totalJSHeapSize: performance.memory && performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory && performance.memory.usedJSHeapSize,
          },
        });
      }
    });
  }
  transform() {}
}
