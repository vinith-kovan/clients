import { ClearClipboard, clearClipboardAlarmName } from "../../autofill/clipboard";
import { uploadEventAlarmName, UploadEventsTask } from "../../tasks/upload-events-tasks";
import { CachedServices } from "../background/service-factories/factory-options";

import { alarmKeys, clearAlarmTime, getAlarmTime } from "./alarm-state";

export const onAlarmListener = async (alarm: chrome.alarms.Alarm) => {
  const serviceCache: CachedServices = {};

  alarmKeys.forEach(async (key) => {
    const executionTime = await getAlarmTime(key);
    if (!executionTime) {
      return;
    }

    const currentDate = Date.now();
    if (executionTime > currentDate) {
      return;
    }

    await clearAlarmTime(key);

    switch (key) {
      case clearClipboardAlarmName:
        ClearClipboard.run();
        break;
      case uploadEventAlarmName:
        UploadEventsTask.run(serviceCache);
        break;
      default:
    }
  });
};
