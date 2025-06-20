import { addReplaceHandler } from './replace';

export function setupReplace(): void {
  //白屏检测
  addReplaceHandler({
    callback: () => {},
  });
}
