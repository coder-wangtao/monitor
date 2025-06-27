import { Monitor } from '@monitor/types';
import { UAParser } from 'ua-parser-js'; //获取浏览器和系统的信息
import { variableTypeDetection } from './verifyType';
export function getGlobal(): any {
  return window;
}

const _global = getGlobal();
const uaResult = new UAParser().getResult();
const _support = getGlobalSupport();

export const isBrowserEnv = variableTypeDetection.isWindow(
  typeof window !== 'undefined' ? window : 0
);

export function getGlobalSupport() {
  _global.__monitor__ = _global.__monitor__ || ({} as Monitor);
  return _global.__monitor__;
}

// 获取设备信息
_support.deviceInfo = {
  browserVersion: uaResult.browser.version, // 浏览器版本号 107.0.0.0
  browser: uaResult.browser.name, // 浏览器名字 Chrome
  osVersion: uaResult.os.version, //操作系统版本
  os: uaResult.os.name, //操作系统名称
  ua: uaResult.ua,
  device: uaResult.device.model ? uaResult.device.model : 'Unknown',
  device_type: uaResult.device.type ? uaResult.device.type : 'PC',
};

_support.hasError = false;

//errorMap 存储代码错误的集合
_support.errorMap = new Map();

_support.replaceFlag = _support.replaceFlag || {};
const replaceFlag = _support.replaceFlag;

export function setFlag(replaceType: string, isSet: boolean) {
  if (replaceFlag[replaceFlag]) {
    return;
  }
  replaceFlag[replaceType] = isSet;
}

export function getFlag(replaceType: string) {
  return replaceFlag[replaceType] ? true : false;
}

export { _global, _support };
/**
 *
 * @returns 如果 isChromePackagedApp 为 true，表示代码运行在一个 Chrome 打包应用中（不过要注意，Chrome 打包应用已经被弃用）。
 * 如果 false，则表示当前不是在 Chrome 打包应用环境中，可能是在普通的网页或者扩展中运行。
 */
export function supportsHistory(): boolean {
  const chrome = _global.chrome;
  const isChromePackagedApp = chrome && chrome.app && chrome.app.runtime;
  const hasHistoryApi =
    'history' in _global &&
    !!(_global.history as History).pushState &&
    !!(_global.history as History).replaceState;
  return !isChromePackagedApp && hasHistoryApi;
}
