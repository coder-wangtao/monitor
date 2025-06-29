import { getWebVitals, getResource } from './core/performance';
import { SdkBase, BasePlugin } from '@monitor/types';
import { EventTypes, StatusCode } from '@monitor/common';
import { getTimestamp, _global, on } from '@monitor/utils';

export default class WebPerformance extends BasePlugin {
  type: string;
  constructor() {
    super(EventTypes.PERFORMANCE);
    this.type = EventTypes.PERFORMANCE;
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
        // 上报长任务详情
        transportData.send({
          type: EventTypes.PERFORMANCE,
          name: 'longTask',
          longTask: long,
          time: getTimestamp(),
          status: StatusCode.OK,
        });
      }
    });
    observer.observe({ entryTypes: ['longtask'] });

    on(_global, 'load', function () {
      // 上报资源列表
      transportData.send({
        type: EventTypes.PERFORMANCE,
        name: 'resourceList',
        time: getTimestamp(),
        status: StatusCode.OK,
        resourceList: getResource(),
      });

      // 上报内存情况, safari、firefox不支持该属性
      if ((performance as any).memory) {
        transportData.send({
          type: EventTypes.PERFORMANCE,
          name: 'memory',
          time: getTimestamp(),
          status: StatusCode.OK,
          memory: {
            jsHeapSizeLimit:
              (performance as any).memory && (performance as any).memory.jsHeapSizeLimit,
            totalJSHeapSize:
              (performance as any).memory && (performance as any).memory.totalJSHeapSize,
            usedJSHeapSize:
              (performance as any).memory && (performance as any).memory.usedJSHeapSize,
          },
        });
      }
    });
  }
  transform() {}
}
