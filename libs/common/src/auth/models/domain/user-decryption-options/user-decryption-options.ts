import { Jsonify } from "type-fest";

import { IdentityTokenResponse } from "../../response/identity-token.response";

import { KeyConnectorUserDecryptionOption } from "./key-connector-user-decryption-option";
import { TrustedDeviceUserDecryptionOption } from "./trusted-device-user-decryption-option";

export class UserDecryptionOptions {
  hasMasterPassword: boolean;
  trustedDeviceOption?: TrustedDeviceUserDecryptionOption;
  keyConnectorOption?: KeyConnectorUserDecryptionOption;

  constructor(init?: Partial<UserDecryptionOptions>) {
    if (init) {
      Object.assign(this, init);
    }
  }

  // TODO: these nice getters don't work because the Account object is not properly being deserialized out of
  // JSON (the Account static fromJSON method is not running) so these getters don't exist on the
  // account decryptions options object when pulled out of state.  This is a bug that needs to be fixed later on
  // get hasTrustedDeviceOption(): boolean {
  //   return this.trustedDeviceOption !== null && this.trustedDeviceOption !== undefined;
  // }

  // get hasKeyConnectorOption(): boolean {
  //   return this.keyConnectorOption !== null && this.keyConnectorOption !== undefined;
  // }

  static fromResponse(response: IdentityTokenResponse): UserDecryptionOptions {
    if (response == null) {
      return null;
    }

    const decryptionOptions = new UserDecryptionOptions();

    if (response.userDecryptionOptions) {
      // If the response has userDecryptionOptions, this means it's on a post-TDE server version and can interrogate
      // the new decryption options.
      const responseOptions = response.userDecryptionOptions;
      decryptionOptions.hasMasterPassword = responseOptions.hasMasterPassword;

      if (responseOptions.trustedDeviceOption) {
        decryptionOptions.trustedDeviceOption = new TrustedDeviceUserDecryptionOption(
          responseOptions.trustedDeviceOption.hasAdminApproval,
          responseOptions.trustedDeviceOption.hasLoginApprovingDevice,
          responseOptions.trustedDeviceOption.hasManageResetPasswordPermission,
        );
      }

      if (responseOptions.keyConnectorOption) {
        decryptionOptions.keyConnectorOption = new KeyConnectorUserDecryptionOption(
          responseOptions.keyConnectorOption.keyConnectorUrl,
        );
      }
    } else {
      // If the response does not have userDecryptionOptions, this means it's on a pre-TDE server version and so
      // we must base our decryption options on the presence of the keyConnectorUrl.
      // Note that the presence of keyConnectorUrl implies that the user does not have a master password, as in pre-TDE
      // server versions, a master password short-circuited the addition of the keyConnectorUrl to the response.
      // TODO: remove this check after 2023.10 release (https://bitwarden.atlassian.net/browse/PM-3537)
      const usingKeyConnector = response.keyConnectorUrl != null;
      decryptionOptions.hasMasterPassword = !usingKeyConnector;
      if (usingKeyConnector) {
        decryptionOptions.keyConnectorOption = new KeyConnectorUserDecryptionOption(
          response.keyConnectorUrl,
        );
      }
    }
    return decryptionOptions;
  }

  static fromJSON(obj: Jsonify<UserDecryptionOptions>): UserDecryptionOptions {
    if (obj == null) {
      return null;
    }

    const decryptionOptions = Object.assign(new UserDecryptionOptions(), obj);

    if (obj.trustedDeviceOption) {
      decryptionOptions.trustedDeviceOption = new TrustedDeviceUserDecryptionOption(
        obj.trustedDeviceOption.hasAdminApproval,
        obj.trustedDeviceOption.hasLoginApprovingDevice,
        obj.trustedDeviceOption.hasManageResetPasswordPermission,
      );
    }

    if (obj.keyConnectorOption) {
      decryptionOptions.keyConnectorOption = new KeyConnectorUserDecryptionOption(
        obj.keyConnectorOption.keyConnectorUrl,
      );
    }

    return decryptionOptions;
  }
}
