import { EventTypes } from '@monitor/common';
import { RecordScreen } from './../../types/src/core/base';
import { BasePlugin, RecordScreenOption, SdkBase } from '@monitor/types';
import { _support, generateUUID, validateOption } from '@monitor/utils';
import { handleScreen } from './core/recordscreen';

export default class RecordScreen extends BasePlugin {
  recordScreenTime = 10; //默认录屏市场
  recordScreenTypeList: string[] = [
    EventTypes.ERROR,
    EventTypes.UNHANDLEDREJECTION,
    EventTypes.RESOURCE,
    EventTypes.FETCH,
    EventTypes.XHR,
  ]; //录屏事件集合
  constructor(params = {} as RecordScreenOption) {
    super(EventTypes.RECORD_SCREEN);
    this.type = EventTypes.RECORD_SCREEN;
    this.bindOptions(params);
  }
  bindOptions(params: RecordScreenOption): void {
    const { recordScreenTypeList, recordScreenTime } = params;
    validateOption(recordScreenTime, 'recordScreenTime', 'number') &&
      (this.recordScreenTime = recordScreenTime);
    validateOption(recordScreenTypeList, 'recordScreenTypeList', 'array') &&
      (this.recordScreenTypeList = recordScreenTypeList);
  }
  core({ transportData, options }: SdkBase): void {
    //给公共配置上添加开始录屏的标识和录屏列表
    options.silentRecordScreen = true;
    options.recordScreenTypeList = this.recordScreenTypeList;
    //添加初始的recordScreenId
    _support.recordScreenId = generateUUID();
    handleScreen(transportData, this.recordScreenTime);
  }
  transform() {}
}
