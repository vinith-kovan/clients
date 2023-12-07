import { mock } from "jest-mock-extended";

import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { StateService } from "../../platform/abstractions/state.service";
import { EncString } from "../../platform/models/domain/enc-string";
import { SymmetricCryptoKey, UserKey } from "../../platform/models/domain/symmetric-crypto-key";
import {
  PinLockType,
  VaultTimeoutSettingsService,
} from "../../services/vault-timeout/vault-timeout-settings.service";
import { KdfConfig } from "../models/domain/kdf-config";

import { PinCryptoService } from "./pin-crypto.service.implementation";
describe("PinCryptoService", () => {
  let pinCryptoService: PinCryptoService;

  const stateService = mock<StateService>();
  const cryptoService = mock<CryptoService>();
  const vaultTimeoutSettingsService = mock<VaultTimeoutSettingsService>();
  const logService = mock<LogService>();

  beforeEach(() => {
    jest.clearAllMocks();

    pinCryptoService = new PinCryptoService(
      stateService,
      cryptoService,
      vaultTimeoutSettingsService,
      logService,
    );
  });

  it("instantiates", () => {
    expect(pinCryptoService).not.toBeFalsy();
  });

  describe("decryptUserKeyWithPin(...)", () => {
    const mockPin = "1234";
    const mockProtectedPin = "protectedPin";
    const DEFAULT_PBKDF2_ITERATIONS = 600000;
    const mockUserEmail = "user@example.com";
    const mockUserKey = new SymmetricCryptoKey(randomBytes(32)) as UserKey;

    function setupCommonDecryptUserKeyWithPinMocks(migrationStatus: "PRE" | "POST" = "POST") {
      stateService.getKdfConfig.mockResolvedValue(new KdfConfig(DEFAULT_PBKDF2_ITERATIONS));
      stateService.getEmail.mockResolvedValue(mockUserEmail);

      if (migrationStatus === "PRE") {
        cryptoService.decryptAndMigrateOldPinKey.mockResolvedValue(mockUserKey);
      } else {
        cryptoService.decryptUserKeyWithPin.mockResolvedValue(mockUserKey);
      }

      stateService.getProtectedPin.mockResolvedValue(mockProtectedPin);
      cryptoService.decryptToUtf8.mockResolvedValue(mockPin);
    }

    // Note: both pinKeyEncryptedUserKeys use encryptionType: 2 (AesCbc256_HmacSha256_B64)
    const pinKeyEncryptedUserKeyEphemeral = new EncString(
      "2.gbauOANURUHqvhLTDnva1A==|nSW+fPumiuTaDB/s12+JO88uemV6rhwRSR+YR1ZzGr5j6Ei3/h+XEli2Unpz652NlZ9NTuRpHxeOqkYYJtp7J+lPMoclgteXuAzUu9kqlRc=|DeUFkhIwgkGdZA08bDnDqMMNmZk21D+H5g8IostPKAY=",
    );

    const pinKeyEncryptedUserKeyPersistant = new EncString(
      "2.fb5kOEZvh9zPABbP8WRmSQ==|Yi6ZAJY+UtqCKMUSqp1ahY9Kf8QuneKXs6BMkpNsakLVOzTYkHHlilyGABMF7GzUO8QHyZi7V/Ovjjg+Naf3Sm8qNhxtDhibITv4k8rDnM0=|TFkq3h2VNTT1z5BFbebm37WYuxyEHXuRo0DZJI7TQnw=",
    );

    const oldPinKeyEncryptedMasterKeyPostMigration: any = null;
    const oldPinKeyEncryptedMasterKeyPreMigrationPersistent =
      "2.fb5kOEZvh9zPABbP8WRmSQ==|Yi6ZAJY+UtqCKMUSqp1ahY9Kf8QuneKXs6BMkpNsakLVOzTYkHHlilyGABMF7GzUO8QHyZi7V/Ovjjg+Naf3Sm8qNhxtDhibITv4k8rDnM0=|TFkq3h2VNTT1z5BFbebm37WYuxyEHXuRo0DZJI7TQnw=";
    const oldPinKeyEncryptedMasterKeyPreMigrationEphemeral = new EncString(
      "2.fb5kOEZvh9zPABbP8WRmSQ==|Yi6ZAJY+UtqCKMUSqp1ahY9Kf8QuneKXs6BMkpNsakLVOzTYkHHlilyGABMF7GzUO8QHyZi7V/Ovjjg+Naf3Sm8qNhxtDhibITv4k8rDnM0=|TFkq3h2VNTT1z5BFbebm37WYuxyEHXuRo0DZJI7TQnw=",
    );

    function mockPinEncryptedKeyDataByPinLockType(
      pinLockType: PinLockType,
      migrationStatus: "PRE" | "POST" = "POST",
    ) {
      switch (pinLockType) {
        case "PERSISTANT":
          stateService.getPinKeyEncryptedUserKey.mockResolvedValue(
            pinKeyEncryptedUserKeyPersistant,
          );
          if (migrationStatus === "PRE") {
            stateService.getEncryptedPinProtected.mockResolvedValue(
              oldPinKeyEncryptedMasterKeyPreMigrationPersistent,
            );
          } else {
            stateService.getEncryptedPinProtected.mockResolvedValue(
              oldPinKeyEncryptedMasterKeyPostMigration,
            );
          }
          break;
        case "TRANSIENT":
          stateService.getPinKeyEncryptedUserKeyEphemeral.mockResolvedValue(
            pinKeyEncryptedUserKeyEphemeral,
          );

          if (migrationStatus === "PRE") {
            stateService.getDecryptedPinProtected.mockResolvedValue(
              oldPinKeyEncryptedMasterKeyPreMigrationEphemeral,
            );
          } else {
            stateService.getDecryptedPinProtected.mockResolvedValue(
              oldPinKeyEncryptedMasterKeyPostMigration,
            );
          }

          break;
        default:
          throw new Error(`Unexpected pin lock type: ${pinLockType}`);
      }
    }

    const testCases: { pinLockType: PinLockType; migrationStatus: "PRE" | "POST" }[] = [
      { pinLockType: "PERSISTANT", migrationStatus: "PRE" },
      { pinLockType: "PERSISTANT", migrationStatus: "POST" },
      { pinLockType: "TRANSIENT", migrationStatus: "PRE" },
      { pinLockType: "TRANSIENT", migrationStatus: "POST" },
    ];

    testCases.forEach(({ pinLockType, migrationStatus }) => {
      it(`should successfully decrypt and return user key with valid, ${pinLockType} PIN (${migrationStatus} migration)`, async () => {
        // Arrange
        setupCommonDecryptUserKeyWithPinMocks(migrationStatus);

        vaultTimeoutSettingsService.isPinLockSet.mockResolvedValue(pinLockType);
        mockPinEncryptedKeyDataByPinLockType(pinLockType, migrationStatus);

        // Act
        const result = await pinCryptoService.decryptUserKeyWithPin(mockPin);

        // Assert
        expect(result).toEqual(mockUserKey);
      });
    });
  });
});

// Test helpers
function randomBytes(length: number): Uint8Array {
  return new Uint8Array(Array.from({ length }, (_, k) => k % 255));
}
