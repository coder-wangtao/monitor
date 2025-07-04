import { Callback, IAnyObject } from '@monitor/types';
import { variableTypeDetection } from './verifyType';

export function getTimestamp(): number {
  return Date.now();
}

/**
 *  获取目标的类型
 * @param target 目标
 * @returns 目标的类型
 */
export function typeofAny(target: any): string {
  return Object.prototype.toString.call(target).slice(8, -1).toLocaleLowerCase();
}

/**
 * 判断传入的类型和期待的类型是否一致
 * @param target 目标
 * @param targetName 目标的名字
 * @param expectType 期待的类型
 */
export function validateOption(target: any, targetName: string, expectType: string): any {
  if (!target) return false;
  if (typeofAny(target) === expectType) return true;
  console.error(`monitor: ${targetName}期望传入${expectType}类型，目前是${typeofAny(target)}类型`);
}

/**
 * 获取唯一的uuid
 * @returns 唯一的uuid
 */
export function generateUUID(): string {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

export function getLocationHref(): string {
  if (typeof document === 'undefined' || document.location === null) return '';
  return document.location.href;
}

/**
 * 重写对象上的某个属性
 * @param source 需要被重写的对象
 * @param name 需要被重写对象的key
 * @param replacement 以原有的函数作为参数，执行并重写原有函数
 * @param isForced 是否强制重写（可能原先没有该属性）
 * @returns void
 */
export function replaceAop(
  source: IAnyObject,
  name: string,
  replacement: Callback,
  isForced = false
) {
  if (source === undefined) return;
  if (name in source || isForced) {
    const original = source[name];
    const wrapped = replacement(original);
    if (typeof wrapped === 'function') {
      source[name] = wrapped;
    }
  }
}

/**
 * 添加事件监听器
 * @param target target
 * @param eventName eventName
 * @param handler handler
 * @param options options
 */
export function on(target: any, eventName: string, handler: Callback, options = false) {
  target.addEventListener(eventName, handler, options);
}

/**
 * @param str 目标字符串
 * @param interceptLength 截取的字符串长度
 * @returns 截取字符串
 */
export function interceptStr(str: string, interceptLength: number): string {
  if (variableTypeDetection.isString(str)) {
    return (
      str.slice(0, interceptLength) +
      (str.length > interceptLength ? `截取前${interceptLength}个字符` : '')
    );
  }
  return '';
}

export function unknownToString(target: unknown): string {
  if (variableTypeDetection.isString(target)) {
    return target as string;
  }
  if (variableTypeDetection.isUndefined(target)) {
    return 'undefined';
  }
  return JSON.stringify(target);
}

/**
 * 函数节流
 * fn 需要节流的函数
 * delay 节流的时间间隔
 * 返回一个包含节流功能的函数
 */
export const throttle = (fn: any, delay: number) => {
  let canRun = true;
  return function (this: any, ...args: any[]) {
    if (!canRun) return;
    fn.apply(this, args);
    canRun = false;
    setTimeout(() => {
      canRun = true;
    }, delay);
  };
};
