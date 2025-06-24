import { EventTypes, StatusCode } from '@monitor/common';
import { ErrorTarget, HttpData, RouteHistory } from '@monitor/types';
import { httpTransform, resourceTransform } from './transfromData';
import { options } from './options';
import { breadCrumb } from './breadcrumb';
import { transportData } from './reportData';
import ErrorStackParser from 'error-stack-parser';
import {
  getErrorUid,
  getTimestamp,
  hashMapExist,
  parseUrlToObj,
  unknownToString,
} from '@monitor/utils';

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

  handleError(ev: ErrorTarget): void {
    const target = ev.target;
    if (!target || (ev.target && !ev.target.localName)) {
      // vue和react捕获的报错使用ev解析，异步错误使用ev.error解析
      const stackFrame = ErrorStackParser.parse(!target ? ev : ev.error)[0];
      const { fileName, columnNumber, lineNumber } = stackFrame;
      const errorData = {
        type: EventTypes.ERROR,
        status: StatusCode.ERROR,
        time: getTimestamp(),
        message: ev.message,
        fileName,
        line: lineNumber,
        column: columnNumber,
      };
      breadCrumb.push({
        type: EventTypes.ERROR,
        category: breadCrumb.getCategory(EventTypes.ERROR),
        data: errorData,
        time: getTimestamp(),
        status: StatusCode.ERROR,
      });
      const hash: string = getErrorUid(
        `${EventTypes.ERROR}-${ev.message}-${fileName}-${columnNumber}`
      );
      // 开启repeatCodeError第一次报错才上报
      if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(hash))) {
        return transportData.send(errorData);
      }
    }
    //资源加载报错
    if (target?.localName) {
      const data = resourceTransform(target);
      breadCrumb.push({
        type: EventTypes.RESOURCE,
        category: breadCrumb.getCategory(EventTypes.RESOURCE),
        status: StatusCode.ERROR,
        time: getTimestamp(),
        data,
      });
      return transportData.send({
        ...data,
        type: EventTypes.RESOURCE,
        status: StatusCode.ERROR,
      });
    }
  },

  handleHistory(data: RouteHistory): void {
    const { from, to } = data;
    //定义parsedFrom变量,值为relative
    const { relative: parsedFrom } = parseUrlToObj(from);
    const { relative: parsedTo } = parseUrlToObj(to);
    breadCrumb.push({
      type: EventTypes.HISTORY,
      category: breadCrumb.getCategory(EventTypes.HISTORY),
      data: {
        from: parsedFrom ? parsedFrom : '/',
        to: parsedTo ? parsedTo : '/',
      },
      time: getTimestamp(),
      status: StatusCode.OK,
    });
  },

  handleUnhandledRejection(ev: PromiseRejectionEvent): void {
    const stackFrame = ErrorStackParser.parse(ev.reason)[0];
    const { fileName, columnNumber, lineNumber } = stackFrame;
    const message = unknownToString(ev.reason.message || ev.reason.stack);
    const data = {
      type: EventTypes.UNHANDLEDREJECTION,
      status: StatusCode.ERROR,
      time: getTimestamp(),
      message,
      fileName,
      line: lineNumber,
      column: columnNumber,
    };
    breadCrumb.push({
      type: EventTypes.UNHANDLEDREJECTION,
      category: breadCrumb.getCategory(EventTypes.UNHANDLEDREJECTION),
      time: getTimestamp(),
      status: StatusCode.ERROR,
      data,
    });
    const hash: string = getErrorUid(
      `${EventTypes.UNHANDLEDREJECTION}-${message}-${fileName}-${columnNumber}`
    );
    // 开启repeatCodeError第一次报错才上报
    if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(hash))) {
      return transportData.send(data);
    }
  },

  handleHashchange(data: HashChangeEvent): void {
    const { oldURL, newURL } = data;
    const { relative: from } = parseUrlToObj(oldURL);
    const { relative: to } = parseUrlToObj(newURL);
    breadCrumb.push({
      type: EventTypes.HASHCHANGE,
      category: breadCrumb.getCategory(EventTypes.HASHCHANGE),
      data: {
        from,
        to,
      },
      time: getTimestamp(),
      status: StatusCode.OK,
    });
  },
};

export { HandleEvents };
