/**
 * 原生try函数
 * @param fn try中执行的函数体
 * @param errorFn 报错时执行的函数体，将err传入
 */

export function nativeTryCatch(fn: any, errorFn?: any) {
  try {
    fn();
  } catch (err) {
    errorFn && errorFn(err);
  }
}
