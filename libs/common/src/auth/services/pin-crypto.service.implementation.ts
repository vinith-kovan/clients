import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { StateService } from "../../platform/abstractions/state.service";
import { KdfType } from "../../platform/enums";
import { EncString } from "../../platform/models/domain/enc-string";
import { UserKey } from "../../platform/models/domain/symmetric-crypto-key";
import {
  PinLockType,
  VaultTimeoutSettingsService,
} from "../../services/vault-timeout/vault-timeout-settings.service";
import { PinCryptoServiceAbstraction } from "../abstractions/pin-crypto.service.abstraction";
import { KdfConfig } from "../models/domain/kdf-config";

export class PinCryptoService implements PinCryptoServiceAbstraction {
  constructor(
    private stateService: StateService,
    private cryptoService: CryptoService,
    private vaultTimeoutSettingsService: VaultTimeoutSettingsService,
    private logService: LogService,
  ) {}
  async decryptUserKeyWithPin(email: string, pin: string): Promise<UserKey | null> {
    try {
      const pinLockType: PinLockType = await this.vaultTimeoutSettingsService.isPinLockSet();

      const { pinKeyEncryptedUserKey, oldPinKeyEncryptedMasterKey } =
        await this.getPinKeyEncryptedKeys(pinLockType);

      const kdf: KdfType = await this.stateService.getKdfType();
      const kdfConfig: KdfConfig = await this.stateService.getKdfConfig();
      let userKey: UserKey;
      if (oldPinKeyEncryptedMasterKey) {
        userKey = await this.cryptoService.decryptAndMigrateOldPinKey(
          pinLockType === "TRANSIENT",
          pin,
          email,
          kdf,
          kdfConfig,
          oldPinKeyEncryptedMasterKey,
        );
      } else {
        userKey = await this.cryptoService.decryptUserKeyWithPin(
          pin,
          email,
          kdf,
          kdfConfig,
          pinKeyEncryptedUserKey,
        );
      }

      if (!userKey) {
        this.logService.error(`User key null after pin key decryption.`);
        return null;
      }

      const pinValid = await this.validatePin(userKey, pin);

      if (!pinValid) {
        this.logService.error(`Pin key decryption successful but pin validation failed.`);
        return null;
      }

      return userKey;
    } catch (error) {
      this.logService.error(`Error decrypting user key with pin: ${error}`);
      return null;
    }
  }

  private async getPinKeyEncryptedKeys(
    pinLockType: PinLockType,
  ): Promise<{ pinKeyEncryptedUserKey: EncString; oldPinKeyEncryptedMasterKey?: EncString }> {
    switch (pinLockType) {
      case "PERSISTANT": {
        const pinKeyEncryptedUserKey = await this.stateService.getPinKeyEncryptedUserKey();
        const oldEncryptedPinKey = await this.stateService.getEncryptedPinProtected();
        return {
          pinKeyEncryptedUserKey,
          oldPinKeyEncryptedMasterKey: oldEncryptedPinKey
            ? new EncString(oldEncryptedPinKey)
            : undefined,
        };
      }
      case "TRANSIENT": {
        const pinKeyEncryptedUserKey = await this.stateService.getPinKeyEncryptedUserKeyEphemeral();
        const oldPinKeyEncryptedMasterKey = await this.stateService.getDecryptedPinProtected();
        return { pinKeyEncryptedUserKey, oldPinKeyEncryptedMasterKey };
      }
      case "DISABLED":
        throw new Error("Pin is disabled");
      default: {
        // Compile-time check for exhaustive switch
        const _exhaustiveCheck: never = pinLockType;
        return _exhaustiveCheck;
      }
    }
  }

  private async validatePin(userKey: UserKey, pin: string): Promise<boolean> {
    const protectedPin = await this.stateService.getProtectedPin();
    const decryptedPin = await this.cryptoService.decryptToUtf8(
      new EncString(protectedPin),
      userKey,
    );
    return decryptedPin === pin;
  }
}
