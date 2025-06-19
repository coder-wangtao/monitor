import { InitOptions } from '@monitor/types';
import { setSilentFlag } from '@monitor/utils';

export function handleOptions(paramOptions: InitOptions): void {
  //setSilentFlag 给全局添加已设置的标识，防止重复设置
  setSilentFlag(paramOptions);
  //设置用户行为的配置项
}
