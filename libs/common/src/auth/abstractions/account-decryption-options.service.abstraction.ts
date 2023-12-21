import { Observable } from "rxjs";

import { UserDecryptionOptions } from "../models/domain/user-decryption-options/user-decryption-options";

export abstract class UserDecryptionOptionsService {
  userDecryptionOptions$: Observable<UserDecryptionOptions>;
}

export abstract class InternalUserDecryptionOptionsService extends UserDecryptionOptionsService {
  abstract setUserDecryptionOptions(userDecryptionOptions: UserDecryptionOptions): void;
}
