export function getGlobal(): any {
  return window;
}

const _global = getGlobal();
export { _global };
