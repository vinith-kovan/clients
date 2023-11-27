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

    ipc.platform.log(level, message);

    /* eslint-disable no-console */
    switch (level) {
      case LogLevelType.Debug:
        console.debug(message);
        break;
      case LogLevelType.Info:
        console.info(message);
        break;
      case LogLevelType.Warning:
        console.warn(message);
        break;
      case LogLevelType.Error:
        console.error(message);
        break;
      default:
        break;
    }
  }
}
