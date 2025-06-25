import ErrorStackParser from 'error-stack-parser';
import { EventTypes, StatusCode } from '@monitor/common';
import { getTimestamp, isError, unknownToString } from '@monitor/utils';
import { breadCrumb } from './breadcrumb';
import { transportData } from './reportData';

//自定义上报事件
export function log({ message = 'customMsg', error = '', type = EventTypes.CUSTOM }: any): void {
  try {
    let errorInfo = {};
    if (isError(error)) {
      const result = ErrorStackParser.parse(!error.target ? error : error.error || error.reason)[0];
      errorInfo = { ...result, line: result.lineNumber, column: result.columnNumber };
    }
    breadCrumb.push({
      type,
      status: StatusCode.ERROR,
      category: breadCrumb.getCategory(EventTypes.CUSTOM),
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
  } catch (error) {
    console.log('上报自定义事件时报错：', error);
  }
}
