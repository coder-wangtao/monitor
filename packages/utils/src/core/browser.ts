import { EventTypes } from '@monitor/common';
import { _support, setFlag } from './global';

/**
 * 将传入的 HTML 元素转换为一个简单的 HTML 字符串表示。具体来说，它会提取元素的标签名、类名、ID 以及内部文本，拼接成一个 HTML 字符串。
 * @param target html节点
 * @returns 字符串
 */
//const divElement = document.getElementById('container');
//console.log(htmlElementAsString(divElement));  // 输出: <div id="container" class='box red'>Hello, world!</div>
export function htmlElementAsString(target: HTMLElement) {
  const tagName = target.tagName.toLocaleLowerCase();
  if (tagName === 'body') {
    return '';
  }
  let classNames = target.classList.value;
  classNames = classNames !== '' ? ` class='${classNames}'` : '';
  const id = target.id ? ` id="${target.id}"` : '';
  const innerText = target.innerText;
  return `<${tagName}${id}${classNames !== '' ? classNames : ''}>${innerText}</${tagName}>`;
}

export function setSilentFlag({
  silentXhr = true,
  silentFetch = true,
  silentClick = true,
  silentHistory = true,
  silentError = true,
  silentHashchange = true,
  silentUnhandledrejection = true,
  silentWhiteScreen = false,
}): void {
  setFlag(EventTypes.XHR, !silentXhr);
  setFlag(EventTypes.FETCH, !silentFetch);
  setFlag(EventTypes.CLICK, !silentClick);
  setFlag(EventTypes.HISTORY, !silentHistory);
  setFlag(EventTypes.ERROR, !silentError);
  setFlag(EventTypes.HASHCHANGE, !silentHashchange);
  setFlag(EventTypes.UNHANDLEDREJECTION, !silentUnhandledrejection);
  setFlag(EventTypes.WHITE_SCREEN, !silentWhiteScreen);
}

/**
 * 将地址字符串转换成对象，
 * @param url 输入：'https://github.com/wangtao/monitor?token=123&name=11'
 * @returns 输出：{
 *                 "host": "github.com",
 *                  "path": "/xy-sea/web-see",
 *                  "protocol": "https",
 *                  "relative": "/xy-sea/web-see?token=123&name=11"
 *                }
 */
export function parseUrlToObj(url: string) {
  if (!url) {
    return {};
  }
  const match = url.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
  if (!match) {
    return {};
  }
  const query = match[6] || '';
  const fragment = match[8] || '';
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    relative: match[5] + query + fragment,
  };
}

//对每一个错误详情，生成唯一的编码
export function getErrorUid(input: string): string {
  return window.btoa(encodeURIComponent(input));
}

export function hashMapExist(hash: string): boolean {
  const exist = _support.errorMap.has(hash);
  if (!exist) {
    _support.errorMap.set(hash, true);
  }
  return exist;
}
