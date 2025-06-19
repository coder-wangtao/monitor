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
