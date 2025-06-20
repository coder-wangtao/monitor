import { InitOptions } from '@monitor/types';
import { _global } from '@monitor/utils';
import { handleOptions } from './core/options';

function init(options: InitOptions) {
  if (!options.dsn || !options.apiKey) {
    return console.error(`monitor 缺少必须的配置项：${!options.dsn ? 'dns' : 'apiKey'}`);
  }
  if (!('fetch' in _global) || options.disabled) return;
  //初始化配置
  handleOptions(options);
  setupReplace();
}
