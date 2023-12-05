import { mock } from "jest-mock-extended";

import { CryptoService } from "../../platform/abstractions/crypto.service";
import { LogService } from "../../platform/abstractions/log.service";
import { StateService } from "../../platform/abstractions/state.service";
import { VaultTimeoutSettingsService } from "../../services/vault-timeout/vault-timeout-settings.service";

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
});
