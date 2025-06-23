import { EventTypes, StatusCode } from '@monitor/common';
import { HttpData } from '@monitor/types';
import { httpTransform } from './transfromData';
import { options } from './options';
import { breadCrumb } from './breadcrumb';
import { transportData } from './reportData';

const HandleEvents = {
  // 处理xhr、fetch回调
  handleHttp(data: HttpData, type: EventTypes): void {
    const result = httpTransform(data);
    // 添加用户行为，去掉自身上报的接口行为
    if (!data.url.includes(options.dsn)) {
      breadCrumb.push({
        type,
        category: breadCrumb.getCategory(type),
        data: result,
        status: result.status,
        time: data.time,
      });
    }
    if (result.status === 'error') {
      transportData.send({ ...result, status: StatusCode.ERROR });
    }
  },
};

export { HandleEvents };
