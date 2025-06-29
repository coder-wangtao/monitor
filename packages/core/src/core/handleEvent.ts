import ErrorStackParser from 'error-stack-parser';
import {
  openWhiteScreen,
  transportData,
  breadcrumb,
  resourceTransform,
  httpTransform,
  options,
} from './index';
import { EventTypes, StatusCode } from '@monitor/common';
import {
  getErrorUid,
  hashMapExist,
  getTimestamp,
  parseUrlToObj,
  unknownToString,
} from '@monitor/utils';
import { ErrorTarget, RouteHistory, HttpData } from '@monitor/types';

const HandleEvents = {
  // 处理xhr、fetch回调
  handleHttp(data: HttpData, type: EventTypes): void {
    const result = httpTransform(data);
    // 添加用户行为，去掉自身上报的接口行为
    if (!data.url.includes(options.dsn)) {
      breadcrumb.push({
        type,
        category: breadcrumb.getCategory(type),
        data: result,
        status: result.status,
        time: data.time,
      });
    }

    if (result.status === 'error') {
      // 上报接口错误
      transportData.send({ ...result, type, status: EventTypes.ERROR });
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
      breadcrumb.push({
        type: EventTypes.ERROR,
        category: breadcrumb.getCategory(EventTypes.ERROR),
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

    // 资源加载报错
    if (target?.localName) {
      // 提取资源加载的信息
      const data = resourceTransform(target);
      breadcrumb.push({
        type: EventTypes.RESOURCE,
        category: breadcrumb.getCategory(EventTypes.RESOURCE),
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
    // 定义parsedFrom变量，值为relative
    const { relative: parsedFrom } = parseUrlToObj(from);
    const { relative: parsedTo } = parseUrlToObj(to);
    breadcrumb.push({
      type: EventTypes.HISTORY,
      category: breadcrumb.getCategory(EventTypes.HISTORY),
      data: {
        from: parsedFrom ? parsedFrom : '/',
        to: parsedTo ? parsedTo : '/',
      },
      time: getTimestamp(),
      status: StatusCode.OK,
    });
  },

  handleHashchange(data: HashChangeEvent): void {
    const { oldURL, newURL } = data;
    const { relative: from } = parseUrlToObj(oldURL);
    const { relative: to } = parseUrlToObj(newURL);
    breadcrumb.push({
      type: EventTypes.HASHCHANGE,
      category: breadcrumb.getCategory(EventTypes.HASHCHANGE),
      data: {
        from,
        to,
      },
      time: getTimestamp(),
      status: StatusCode.OK,
    });
  },

  handleUnhandleRejection(ev: PromiseRejectionEvent): void {
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

    breadcrumb.push({
      type: EventTypes.UNHANDLEDREJECTION,
      category: breadcrumb.getCategory(EventTypes.UNHANDLEDREJECTION),
      time: getTimestamp(),
      status: StatusCode.ERROR,
      data,
    });

    const hash: string = getErrorUid(
      `${EventTypes.UNHANDLEDREJECTION}-${message}-${fileName}-${columnNumber}`
    );
    // 开启repeatCodeError第一次报错才上报
    if (!options.repeatCodeError || (options.repeatCodeError && !hashMapExist(hash))) {
      transportData.send(data);
    }
  },

  handleWhiteScreen(): void {
    openWhiteScreen((res: any) => {
      // 上报白屏检测信息
      transportData.send({
        type: EventTypes.WHITE_SCREEN,
        time: getTimestamp(),
        ...res,
      });
    }, options);
  },
};

export { HandleEvents };
