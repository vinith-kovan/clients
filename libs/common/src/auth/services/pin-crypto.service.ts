import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { StateService } from "../../platform/abstractions/state.service";
import { EncString } from "../../platform/models/domain/enc-string";
import { UserKey } from "../../platform/models/domain/symmetric-crypto-key";
import {
  PinLockType,
  VaultTimeoutSettingsService,
} from "../../services/vault-timeout/vault-timeout-settings.service";
import { PinCryptoServiceAbstraction } from "../abstractions/pin-crypto.service.abstraction";

export class PinCryptoService implements PinCryptoServiceAbstraction {
  constructor(
    private stateService: StateService,
    private cryptoService: CryptoService,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    private logService: LogService
  ) {}
  async decryptUserKeyWithPin(email: string, pin: string): Promise<UserKey | null> {
    try {
      const pinLockType: PinLockType = await this.vaultTimeoutSettingsService.isPinLockSet();

      const kdf = await this.stateService.getKdfType();
      const kdfConfig = await this.stateService.getKdfConfig();
      let userKeyPin: EncString;
      let oldPinKey: EncString;
      switch (pinLockType) {
        case "PERSISTANT": {
          userKeyPin = await this.stateService.getPinKeyEncryptedUserKey();
          const oldEncryptedPinKey = await this.stateService.getEncryptedPinProtected();
          oldPinKey = oldEncryptedPinKey ? new EncString(oldEncryptedPinKey) : undefined;
          break;
        }
        case "TRANSIENT": {
          userKeyPin = await this.stateService.getPinKeyEncryptedUserKeyEphemeral();
          oldPinKey = await this.stateService.getDecryptedPinProtected();
          break;
        }
        case "DISABLED": {
          throw new Error("Pin is disabled");
        }
        default: {
          // Compile time check for exhaustive switch
          const _exhaustiveCheck: never = pinLockType;
          return _exhaustiveCheck;
        }
      }

      let userKey: UserKey;
      if (oldPinKey) {
        userKey = await this.cryptoService.decryptAndMigrateOldPinKey(
          pinLockType === "TRANSIENT",
          pin,
          email,
          kdf,
          kdfConfig,
          oldPinKey
        );
      } else {
        userKey = await this.cryptoService.decryptUserKeyWithPin(
          pin,
          email,
          kdf,
          kdfConfig,
          userKeyPin
        );
      }

      if (!userKey) {
        return null;
      }

      const protectedPin = await this.stateService.getProtectedPin();
      const decryptedPin = await this.cryptoService.decryptToUtf8(
        new EncString(protectedPin),
        userKey
      );

      if (decryptedPin !== pin) {
        return null;
      }

      return userKey;
    } catch (error) {
      this.logService.error(`Error decrypting user key with pin: ${error}`);
      return null;
    }
  }
}
