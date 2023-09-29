import log from "electron-log/renderer";

import { LogLevelType } from "@bitwarden/common/enums";
import { ConsoleLogService as BaseLogService } from "@bitwarden/common/platform/services/console-log.service";

export class ElectronLogRendererService extends BaseLogService {
  constructor(protected filter: (level: LogLevelType) => boolean = null) {
    super(ipc.platform.isDev, filter);
  }

  write(level: LogLevelType, message: string) {
    if (this.filter != null && this.filter(level)) {
      return;
    }

    switch (level) {
      case LogLevelType.Debug:
        log.debug(message);
        break;
      case LogLevelType.Info:
        log.info(message);
        break;
      case LogLevelType.Warning:
        log.warn(message);
        break;
      case LogLevelType.Error:
        log.error(message);
        break;
      default:
        break;
    }
  }
}
