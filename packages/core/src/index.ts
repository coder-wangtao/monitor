import { ErrorTarget, InitOptions, ViewModel, VueInstance } from '@monitor/types';
import { _global, getFlag, nativeTryCatch, setFlag } from '@monitor/utils';
import { handleOptions } from './core/options';
import {
  breadCrumb,
  HandleEvents,
  notify,
  setupReplace,
  subscribeEvent,
  transportData,
} from './core';
import { EventTypes, SDK_NAME, SDK_VERSION } from '@monitor/common';
import { log } from './core/customLog';

function init(options: InitOptions) {
  if (!options.dsn || !options.apiKey) {
    return console.error(`monitor 缺少必须的配置项：${!options.dsn ? 'dns' : 'apiKey'}`);
  }
  if (!('fetch' in _global) || options.disabled) return;
  //初始化配置
  handleOptions(options);
  setupReplace();
}

function install(Vue: VueInstance, options: InitOptions) {
  if (getFlag(EventTypes.VUE)) return;
  setFlag(EventTypes.VUE, true);
  // 是 Vue 提供的全局错误处理器，用于捕获 Vue 组件内部的错误。
  const handler = Vue.config.errorHandler;
  //vue项目在vei.config.errorHandler中上报错误
  Vue.config.errorHandler = function (err: ErrorTarget, vm: ViewModel, info: string): void {
    console.log(err);
    HandleEvents.handleError(err);
    if (handler) handler.apply(null, [err, vm, info]);
  };
  init(options);
}

//REACT项目在ErrorBoundary中上报错误
function errorBoundary(err: ErrorTarget): void {
  //TODO:待定
  // if (getFlag(EventTypes.REACT)) return;
  // setFlag(EventTypes.REACT, true);
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
  ) {
    return;
  }

  nativeTryCatch(() => {
    instance.core({ transportData, breadCrumb, option, notify });
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
