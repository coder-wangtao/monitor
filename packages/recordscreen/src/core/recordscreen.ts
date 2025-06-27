import { EventTypes, StatusCode } from '@monitor/common';
import { _support, generateUUID, getTimestamp } from '@monitor/utils';
import { record } from 'rrweb';
import { Base64 } from 'js-base64';
import pako from 'pako';

export function handleScreen(transportData: any, recordScreenTime: number): void {
  //events存储录屏信息
  let events: any[] = [];
  record({
    emit(event, isCheckout) {
      if (isCheckout) {
        // 此段时间内发生错误，上报录屏信息
        if (_support.hasError) {
          const recordScreenId = _support.recordScreenId;
          _support.recordScreenId = generateUUID();
          transportData.send({
            type: EventTypes.RECORD_SCREEN,
            recordScreenId,
            time: getTimestamp(),
            status: StatusCode.OK,
            events: zip(events),
          });
          events = [];
          _support.hasError = false;
        } else {
          // 不上报，清空录屏
          events = [];
          _support.recordScreenId = generateUUID();
        }
      }
      events.push(event);
    },
    recordCanvas: true, //表示录制 canvas 内容（例如 WebGL 或游戏界面）。
    // 默认每10s重新制作快照
    checkoutEveryNms: 1000 * recordScreenTime,
  });
}

/**
 * 将任意数据压缩并以 Base64 字符串返回
 */
export function zip(data: any): string {
  if (!data) return data;
  // 判断数据是否需要转为JSON
  const dataJson =
    typeof data !== 'string' && typeof data !== 'number' ? JSON.stringify(data) : data;
  // 使用Base64.encode处理字符编码，兼容中文
  //调用第三方库 Base64.encode 把 dataJson 编码成 Base64 字符串，存入 str
  const str = Base64.encode(dataJson as string);
  //使用 pako.gzip 对 str 做 Gzip 压缩；默认返回 Uint8Array（二进制数据）
  const binaryString = pako.gzip(str);
  //把 Uint8Array 转成普通数组 arr，其中每个元素是一个 0-255 的整数
  const arr = Array.from(binaryString);
  let s = '';
  // String.fromCharCode(item); });
  // 遍历 arr 中的每个字节：String.fromCharCode(item) 将字节值转换为对应的单字节字符.
  // 逐个拼接到 s；最终 s 是一串二进制字符组成的“伪字符串”
  arr.forEach((item: any) => {
    s += String.fromCharCode(item);
  });
  //再次使用 Base64（这里是浏览器原生 btoa 封装）对二进制字符串 s 进行编码，得到最终的 Base64 文本 并返回
  return Base64.btoa(s);
}
