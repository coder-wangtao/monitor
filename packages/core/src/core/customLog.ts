import ErrorStackParser from 'error-stack-parser';
import { transportData } from './reportData';
import { breadcrumb } from './breadcrumb';
import { EventTypes, StatusCode } from '@monitor/common';
import { isError, getTimestamp, unknownToString } from '@monitor/utils';

// 自定义上报事件
export function log({ message = 'customMsg', error = '', type = EventTypes.CUSTOM }: any): void {
  try {
    let errorInfo = {};
    if (isError(error)) {
      const result = ErrorStackParser.parse(!error.target ? error : error.error || error.reason)[0];

      errorInfo = {
        ...result,
        line: result.lineNumber,
        column: result.columnNumber,
      };
    }
    breadcrumb.push({
      type,
      status: StatusCode.ERROR,
      category: breadcrumb.getCategory(EventTypes.CUSTOM),
      data: unknownToString(message),
      time: getTimestamp(),
    });
    transportData.send({
      type,
      status: StatusCode.ERROR,
      message: unknownToString(message),
      time: getTimestamp(),
      ...errorInfo,
    });
  } catch (err) {
    // console.log('上报自定义事件时报错：', err);
  }
}
