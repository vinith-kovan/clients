import {
  ActiveUserState,
  KeyDefinition,
  StateProvider,
  USER_DECRYPTION_OPTIONS_DISK,
} from "../../platform/state";
import { InternalUserDecryptionOptionsService as InternalUserDecryptionOptionsService } from "../abstractions/account-decryption-options.service.abstraction";
import { UserDecryptionOptions } from "../models/domain/user-decryption-options/user-decryption-options";

export const USER_DECRYPTION_OPTIONS = new KeyDefinition<UserDecryptionOptions>(
  USER_DECRYPTION_OPTIONS_DISK,
  "decryptionOptions",
  {
    deserializer: (decryptionOptions) => UserDecryptionOptions.fromJSON(decryptionOptions),
  },
);

export class UserDecryptionOptionsService implements InternalUserDecryptionOptionsService {
  private userDecryptionOptionsState: ActiveUserState<UserDecryptionOptions>;

  userDecryptionOptions$;

  constructor(private stateProvider: StateProvider) {
    this.userDecryptionOptionsState = this.stateProvider.getActive(USER_DECRYPTION_OPTIONS);

    this.userDecryptionOptions$ = this.userDecryptionOptionsState.state$;
  }

  // TODO
  async setUserDecryptionOptions(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
