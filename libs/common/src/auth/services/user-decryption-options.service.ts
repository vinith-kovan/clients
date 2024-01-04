import { map } from "rxjs";

import {
  ActiveUserState,
  KeyDefinition,
  StateProvider,
  USER_DECRYPTION_OPTIONS_DISK,
} from "../../platform/state";
import { UserId } from "../../types/guid";
import { InternalUserDecryptionOptionsServiceAbstraction as InternalUserDecryptionOptionsServiceAbstraction } from "../abstractions/user-decryption-options.service.abstraction";
import { UserDecryptionOptions } from "../models/domain/user-decryption-options/user-decryption-options";

export const USER_DECRYPTION_OPTIONS = new KeyDefinition<UserDecryptionOptions>(
  USER_DECRYPTION_OPTIONS_DISK,
  "decryptionOptions",
  {
    deserializer: (decryptionOptions) => UserDecryptionOptions.fromJSON(decryptionOptions),
  },
);

export class UserDecryptionOptionsService
  implements InternalUserDecryptionOptionsServiceAbstraction
{
  private userDecryptionOptionsState: ActiveUserState<UserDecryptionOptions>;

  userDecryptionOptions$;
  hasMasterPassword$;

  constructor(private stateProvider: StateProvider) {
    this.userDecryptionOptionsState = this.stateProvider.getActive(USER_DECRYPTION_OPTIONS);

    this.userDecryptionOptions$ = this.userDecryptionOptionsState.state$;
    this.hasMasterPassword$ = this.userDecryptionOptions$.pipe(
      map((options) => options?.hasMasterPassword ?? false),
    );
  }

  userDecryptionOptionsById$(userId: UserId) {
    return this.stateProvider.getUser(userId, USER_DECRYPTION_OPTIONS).state$;
  }

  // TODO
  async setUserDecryptionOptions(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
