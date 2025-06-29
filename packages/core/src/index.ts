import {
  subscribeEvent,
  notify,
  transportData,
  breadcrumb,
  options,
  handleOptions,
  log,
  setupReplace,
  HandleEvents,
} from './core/index';
import { _global, getFlag, setFlag, nativeTryCatch } from '@monitor/utils';
import { SDK_VERSION, SDK_NAME, EventTypes } from '@monitor/common';
import { InitOptions, VueInstance, ViewModel, ErrorTarget } from '@monitor/types';

function init(options: InitOptions) {
  if (!options.dsn || !options.apiKey) {
    return console.error(`web-see 缺少必须配置项：${!options.dsn ? 'dsn' : 'apikey'} `);
  }
  if (!('fetch' in _global) || options.disabled) return;
  // 初始化配置
  handleOptions(options);
  setupReplace();
}

function install(Vue: VueInstance, options: InitOptions) {
  //判断 是否首次加载
  if (getFlag(EventTypes.VUE)) return;
  setFlag(EventTypes.VUE, true);

  const handler = Vue.config.errorHandler;
  // vue项目在Vue.config.errorHandler中上报错误
  Vue.config.errorHandler = function (err: ErrorTarget, vm: ViewModel, info: string): void {
    console.log(err);
    HandleEvents.handleError(err);
    if (handler) handler.apply(null, [err, vm, info]);
  };

  init(options);
}

// react项目在ErrorBoundary中上报错误
function errorBoundary(err: ErrorTarget): void {
  if (getFlag(EventTypes.REACT)) return;
  setFlag(EventTypes.REACT, true);
  HandleEvents.handleError(err);
}

function use(plugin: any, option: any) {
  const instance = new plugin(option);
  if (
    !subscribeEvent({
      callback: data => {
        instance.transform(data);
      },
      type: instance.type,
    })
  )
    return;

  nativeTryCatch(() => {
    instance.core({ transportData, breadcrumb, options, notify });
  });
}

export default {
  SDK_VERSION,
  SDK_NAME,
  init,
  install,
  errorBoundary,
  use,
  log,
};
