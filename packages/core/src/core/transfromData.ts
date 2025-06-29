import { HttpCode, StatusCode } from '@monitor/common';
import { HttpData, ResourceError, ResourceTarget } from '@monitor/types';
import { options } from './options';
import { fromHttpStatus, getTimestamp, interceptStr } from '@monitor/utils';

export function httpTransform(data: HttpData): HttpData {
  let message: any = '';
  const { elapsedTime, time, method = '', type, Status = 200, response, requestData } = data;
  let status: StatusCode;
  if (Status === 0) {
    status = StatusCode.ERROR;
    message =
      elapsedTime <= options.overTime * 1000
        ? `请求失败，Status的值为:${Status}`
        : `请求失败，接口超时`;
  } else if ((Status as number) < HttpCode.BAD_REQUEST) {
    status = StatusCode.OK;
    if (options.handleHttpStatus && typeof options.handleHttpStatus == 'function') {
      if (options.handleHttpStatus(data)) {
        status = StatusCode.OK;
      } else {
        status = StatusCode.ERROR;
        message = `接口报错，报错信息为：${
          typeof response === 'object' ? JSON.stringify(response) : response
        }`;
      }
    }
  } else {
    status = StatusCode.ERROR;
    message = `请求失败，Status值为：${Status},${fromHttpStatus(Status as number)}`;
  }

  message = `${data.url}；${message}`;
  return {
    url: data.url,
    time,
    status,
    elapsedTime,
    message,
    requestData: {
      httpType: type as string,
      method,
      data: requestData || '',
    },
    response: {
      Status,
      data: status === StatusCode.ERROR ? response : null,
    },
  };
}

export function resourceTransform(target: ResourceTarget): ResourceError {
  return {
    time: getTimestamp(),
    message:
      (interceptStr(target.src as string, 120) || interceptStr(target.href as string, 120)) +
      '; 资源加载失败',
    name: target.localName as string,
  };
}
