import { EventTypes } from '@monitor/common';
import { HandleEvents } from './handleEvent';
import { addReplaceHandler } from './replace';

export function setupReplace(): void {
  //重写XMLHttpRequest
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EventTypes.XHR);
    },
    type: EventTypes.XHR,
  });

  //重写fetch
  addReplaceHandler({
    callback: data => {
      HandleEvents.handleHttp(data, EventTypes.FETCH);
    },
    type: EventTypes.FETCH,
  });
}
