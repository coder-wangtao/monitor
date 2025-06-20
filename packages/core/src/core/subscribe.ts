import { EventTypes } from '@monitor/common';
import { ReplaceCallback, ReplaceHandler } from '@monitor/types';
import { getFlag, setFlag } from '@monitor/utils';

const handlers: { [key in EventTypes]?: ReplaceCallback[] } = {};

//subscribeEvent 设置标识，并将处理的方法放置到handlers中 {xhr:[function]}
export function subscribeEvent(handler: ReplaceHandler): boolean {
  if (!handler || getFlag(handler.type)) return false;
  setFlag(handler.type, true);
  handlers[handler.type] = handlers[handler.type] || [];
  handlers[handler.type]?.push(handler.callback);
  return true;
}
