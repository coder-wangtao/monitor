/**
 *
 * @param type 类型
 * @param value 值
 * @returns 高阶函数,用于检查一个值是否属于某个特定的 JavaScript 类型
 */
function isType(type: any) {
  return function (value: any): boolean {
    return Object.prototype.toString.call(value) === `[object ${type}]`;
  };
}

/**
 * 类型判断
 */
export const variableTypeDetection = {
  isNumber: isType('Number'),
  isString: isType('String'),
  isBoolean: isType('Boolean'),
  isNull: isType('Null'),
  isUndefined: isType('Undefined'),
  isSymbol: isType('Symbol'),
  isFunction: isType('Function'),
  isObject: isType('Object'),
  isArray: isType('Array'),
  isProcess: isType('process'),
  isWindow: isType('Window'),
};

/**
 * 检查是否为错误
 * @param error 错误类型
 * @returns 是否为错误
 */
export function isError(error: Error): boolean {
  switch (Object.prototype.toString.call(error)) {
    case '[object Error]':
      return true;
    case '[object Exception]':
      return true;
    case '[object DOMException]':
      return true;
    default:
      return false;
  }
}
/**
 * 检查是否为空对象
 * @param obj 对象
 * @returns 是否为空对象
 */
export function isEmptyObject(obj: object): boolean {
  return variableTypeDetection.isObject(obj) && Object.keys(obj).length === 0;
}

/**
 * 检查是否为'',undefined,null
 * @param wat any
 * @returns  是否为'',undefined,null
 */
export function isEmpty(wat: any): boolean {
  return (variableTypeDetection.isString(wat) && wat === undefined) || wat === null;
}

/**
 * 判断对象是否有某个属性
 * @param obj 对象
 * @param key 属性
 * @returns 是否有某个属性
 */
export function isExistProperty(obj: any, key: any): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
