/**
 * @jest-environment ../shared/test.environment.ts
 */

import { mock } from "jest-mock-extended";
import { firstValueFrom } from "rxjs";

import { trackEmissions } from "../../../spec";
import {
  FakeActiveUserState,
  FakeGlobalState,
  FakeSingleUserState,
} from "../../../spec/fake-state";
import { FakeStateProvider } from "../../../spec/fake-state-provider";
import { AccountService } from "../../auth/abstractions/account.service";
import { AuthenticationStatus } from "../../auth/enums/authentication-status";
import { CsprngArray } from "../../types/csprng";
import { UserId } from "../../types/guid";
import { CryptoFunctionService } from "../abstractions/crypto-function.service";
import { EncryptService } from "../abstractions/encrypt.service";
import { LogService } from "../abstractions/log.service";
import { PlatformUtilsService } from "../abstractions/platform-utils.service";
import { StateService } from "../abstractions/state.service";
import { Utils } from "../misc/utils";
import { EncString } from "../models/domain/enc-string";
import {
  MasterKey,
  PinKey,
  SymmetricCryptoKey,
  UserKey,
} from "../models/domain/symmetric-crypto-key";
import { CryptoService, USER_EVER_HAD_USER_KEY, USER_KEYS_KEY } from "../services/crypto.service";

describe("cryptoService", () => {
  let cryptoService: CryptoService;

  const cryptoFunctionService = mock<CryptoFunctionService>();
  const encryptService = mock<EncryptService>();
  const platformUtilService = mock<PlatformUtilsService>();
  const logService = mock<LogService>();
  const stateService = mock<StateService>();
  const accountService = mock<AccountService>();
  let stateProvider: FakeStateProvider;
  let userKeysState: FakeGlobalState<Record<UserId, UserKey>>;

  const mockUserId = Utils.newGuid() as UserId;

  beforeEach(() => {
    stateProvider = new FakeStateProvider();
    userKeysState = stateProvider.global.mockFor(USER_KEYS_KEY);

    // initialize state
    userKeysState.stateSubject.next({});

    cryptoService = new CryptoService(
      cryptoFunctionService,
      encryptService,
      platformUtilService,
      logService,
      stateService,
      accountService,
      stateProvider,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("instantiates", () => {
    expect(cryptoService).not.toBeFalsy();
  });

  describe("getUserKey", () => {
    let mockUserKey: UserKey;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64) as CsprngArray;
      mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
    });

    it("returns the User Key if available", async () => {
      userKeysState.stateSubject.next({ [mockUserId]: mockUserKey });

      const userKey = await cryptoService.getUserKey(mockUserId);

      expect(userKey).toEqual(mockUserKey);
    });

    it("sets the Auto key if the User Key if not set", async () => {
      const autoKeyB64 =
        "IT5cA1i5Hncd953pb00E58D2FqJX+fWTj4AvoI67qkGHSQPgulAqKv+LaKRAo9Bg0xzP9Nw00wk4TqjMmGSM+g==";
      const autoKey = new SymmetricCryptoKey(Utils.fromB64ToArray(autoKeyB64)) as UserKey;
      stateService.getUserKeyAutoUnlock.mockResolvedValue(autoKeyB64);
      const emissions = trackEmissions(cryptoService.keyForUser$(mockUserId));

      const userKey = await cryptoService.getUserKey(mockUserId);

      expect(emissions).toEqual([undefined, autoKey]);
      expect(userKey.keyB64).toEqual(autoKeyB64);
    });
  });

  describe("getUserKeyWithLegacySupport", () => {
    let mockUserKey: UserKey;
    let mockMasterKey: MasterKey;
    let stateSvcGetMasterKey: jest.SpyInstance;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64) as CsprngArray;
      mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
      mockMasterKey = new SymmetricCryptoKey(new Uint8Array(64) as CsprngArray) as MasterKey;

      stateSvcGetMasterKey = jest.spyOn(stateService, "getMasterKey");
    });

    it("returns the User Key if available", async () => {
      userKeysState.stateSubject.next({ [mockUserId]: mockUserKey });
      const userKey = await cryptoService.getUserKeyWithLegacySupport(mockUserId);

      expect(stateSvcGetMasterKey).not.toHaveBeenCalled();

      expect(userKey).toEqual(mockUserKey);
    });

    it("returns the user's master key when User Key is not available", async () => {
      userKeysState.stateSubject.next({ [mockUserId]: null });
      stateSvcGetMasterKey.mockResolvedValue(mockMasterKey);

      const userKey = await cryptoService.getUserKeyWithLegacySupport(mockUserId);

      expect(stateSvcGetMasterKey).toHaveBeenCalledWith({ userId: mockUserId });
      expect(userKey).toEqual(mockMasterKey);
    });
  });

  describe("everHadUserKey$", () => {
    let everHadUserKeyState: FakeActiveUserState<boolean>;

    beforeEach(() => {
      everHadUserKeyState = stateProvider.activeUser.getFake(USER_EVER_HAD_USER_KEY);
    });

    it("should return true when stored value is true", async () => {
      everHadUserKeyState.stateSubject.next(true);

      expect(await firstValueFrom(cryptoService.everHadUserKey$)).toBe(true);
    });

    it("should return false when stored value is false", async () => {
      everHadUserKeyState.stateSubject.next(false);

      expect(await firstValueFrom(cryptoService.everHadUserKey$)).toBe(false);
    });

    it("should return false when stored value is null", async () => {
      everHadUserKeyState.stateSubject.next(null);

      expect(await firstValueFrom(cryptoService.everHadUserKey$)).toBe(false);
    });
  });

  describe("setUserKey", () => {
    let mockUserKey: UserKey;
    let everHadUserKeyState: FakeSingleUserState<boolean>;

    beforeEach(() => {
      const mockRandomBytes = new Uint8Array(64) as CsprngArray;
      mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
      everHadUserKeyState = stateProvider.singleUser.getFake(mockUserId, USER_EVER_HAD_USER_KEY);

      // Initialize storage
      everHadUserKeyState.stateSubject.next(null);
    });

    it("should throw if key is null", async () => {
      await expect(cryptoService.setUserKey(null, mockUserId)).rejects.toThrow();
    });

    it("should set everHadUserKey if key is not null to true", async () => {
      await cryptoService.setUserKey(mockUserKey, mockUserId);

      expect(await firstValueFrom(everHadUserKeyState.state$)).toBe(true);
    });

    it("should emit the new key", async () => {
      const emissions = trackEmissions(cryptoService.keyForUser$(mockUserId));
      await cryptoService.setUserKey(mockUserKey, mockUserId);

      expect(emissions).toEqual([undefined, mockUserKey]);
    });

    it("should update account status", async () => {
      await cryptoService.setUserKey(mockUserKey, mockUserId);

      expect(accountService.setAccountStatus).toHaveBeenCalledWith(
        mockUserId,
        AuthenticationStatus.Unlocked,
      );
      expect(accountService.setAccountStatus).toHaveBeenCalledTimes(1);
    });

    describe("Auto Key refresh", () => {
      it("sets an Auto key if vault timeout is set to null", async () => {
        stateService.getVaultTimeout.mockResolvedValue(null);

        await cryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setUserKeyAutoUnlock).toHaveBeenCalledWith(mockUserKey.keyB64, {
          userId: mockUserId,
        });
      });

      it("clears the Auto key if vault timeout is set to anything other than null", async () => {
        stateService.getVaultTimeout.mockResolvedValue(10);

        await cryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setUserKeyAutoUnlock).toHaveBeenCalledWith(null, {
          userId: mockUserId,
        });
      });

      it("clears the old deprecated Auto key whenever a User Key is set", async () => {
        await cryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setCryptoMasterKeyAuto).toHaveBeenCalledWith(null, {
          userId: mockUserId,
        });
      });
    });

    describe("Pin Key refresh", () => {
      let cryptoSvcMakePinKey: jest.SpyInstance;
      const protectedPin =
        "2.jcow2vTUePO+CCyokcIfVw==|DTBNlJ5yVsV2Bsk3UU3H6Q==|YvFBff5gxWqM+UsFB6BKimKxhC32AtjF3IStpU1Ijwg=";
      let encPin: EncString;

      beforeEach(() => {
        cryptoSvcMakePinKey = jest.spyOn(cryptoService, "makePinKey");
        cryptoSvcMakePinKey.mockResolvedValue(new SymmetricCryptoKey(new Uint8Array(64)) as PinKey);
        encPin = new EncString(
          "2.jcow2vTUePO+CCyokcIfVw==|DTBNlJ5yVsV2Bsk3UU3H6Q==|YvFBff5gxWqM+UsFB6BKimKxhC32AtjF3IStpU1Ijwg=",
        );
        encryptService.encrypt.mockResolvedValue(encPin);
      });

      it("sets a UserKeyPin if a ProtectedPin and UserKeyPin is set", async () => {
        stateService.getProtectedPin.mockResolvedValue(protectedPin);
        stateService.getPinKeyEncryptedUserKey.mockResolvedValue(
          new EncString(
            "2.OdGNE3L23GaDZGvu9h2Brw==|/OAcNnrYwu0rjiv8+RUr3Tc+Ef8fV035Tm1rbTxfEuC+2LZtiCAoIvHIZCrM/V1PWnb/pHO2gh9+Koks04YhX8K29ED4FzjeYP8+YQD/dWo=|+12xTcIK/UVRsOyawYudPMHb6+lCHeR2Peq1pQhPm0A=",
          ),
        );

        await cryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setPinKeyEncryptedUserKey).toHaveBeenCalledWith(expect.any(EncString), {
          userId: mockUserId,
        });
      });

      it("sets a PinKeyEphemeral if a ProtectedPin is set, but a UserKeyPin is not set", async () => {
        stateService.getProtectedPin.mockResolvedValue(protectedPin);
        stateService.getPinKeyEncryptedUserKey.mockResolvedValue(null);

        await cryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setPinKeyEncryptedUserKeyEphemeral).toHaveBeenCalledWith(
          expect.any(EncString),
          {
            userId: mockUserId,
          },
        );
      });

      it("clears the UserKeyPin and UserKeyPinEphemeral if the ProtectedPin is not set", async () => {
        stateService.getProtectedPin.mockResolvedValue(null);

        await cryptoService.setUserKey(mockUserKey, mockUserId);

        expect(stateService.setPinKeyEncryptedUserKey).toHaveBeenCalledWith(null, {
          userId: mockUserId,
        });
        expect(stateService.setPinKeyEncryptedUserKeyEphemeral).toHaveBeenCalledWith(null, {
          userId: mockUserId,
        });
      });
    });
  });

  describe("deriveFromUserKey", () => {
    const mockUserKey = new SymmetricCryptoKey(new Uint8Array(64)) as UserKey;
    const otherUserId = Utils.newGuid() as UserId;
    const otherUserKey = new SymmetricCryptoKey(new Uint8Array(64)) as UserKey;

    beforeEach(() => {
      userKeysState.stateSubject.next({ [mockUserId]: mockUserKey, [otherUserId]: otherUserKey });
    });

    it("should provide the correct users key", async () => {
      const actualKey = await cryptoService.deriveFromUserKey(mockUserId, (key) => key);

      expect(actualKey).toEqual(mockUserKey);
    });

    it("should await derive if it is a promise", async () => {
      const actualKey = await cryptoService.deriveFromUserKey(mockUserId, async (key) => key);

      expect(actualKey).not.toBeInstanceOf(Promise);
      expect(actualKey).toEqual(mockUserKey);
    });
  });
});
