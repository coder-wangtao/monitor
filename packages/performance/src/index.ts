import { EventTypes } from '@monitor/common';
import { BasePlugin, SdkBase } from '@monitor/types';

export default class WebPerformance extends BasePlugin {
  constructor() {
    super(EventTypes.PERFORMANCE);
    this.type == EventTypes.PERFORMANCE;
  }
  bindOptions() {}

  core({ transportData }: SdkBase) {
    // 获取FCP、LCP、TTFB、FID等指标
    // getWebVitals(res:any) => {
    // });
  }
  transform() {}
}
