import { Observable } from "rxjs";

import { UserDecryptionOptions } from "../models/domain/user-decryption-options/user-decryption-options";

export abstract class UserDecryptionOptionsServiceAbstraction {
  /**
   * Returns what decryption options are available for the current user.
   * Note: this is sent from the server on authentication
   */
  userDecryptionOptions$: Observable<UserDecryptionOptions>;
  /**
   * Whether the current user has a master password.
   * Note: this only checks what is stored on the server, not the local state
   */
  hasMasterPassword$: Observable<boolean>;

  /**
   * Returns the user decryption options for the given user id.
   * @param userId The user id to check.
   */
  abstract userDecryptionOptionsById$(userId: string): Observable<UserDecryptionOptions>;
}

export abstract class InternalUserDecryptionOptionsServiceAbstraction extends UserDecryptionOptionsServiceAbstraction {
  abstract setUserDecryptionOptions(userDecryptionOptions: UserDecryptionOptions): Promise<void>;
}
