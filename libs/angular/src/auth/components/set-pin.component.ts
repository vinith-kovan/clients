import { Directive, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { EncryptService } from "@bitwarden/common/platform/abstractions/encrypt.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";

import { ModalRef } from "../../components/modal/modal.ref";

@Directive()
export class SetPinComponent implements OnInit {
  pin = "";
  showPin = false;
  masterPassOnRestart = true;
  showMasterPassOnRestart = true;

  constructor(
    private modalRef: ModalRef,
    private cryptoService: CryptoService,
    private userVerificationService: UserVerificationService,
    private stateService: StateService,
    private accountService: AccountService,
    private encryptService: EncryptService,
  ) {}

  async ngOnInit() {
    this.showMasterPassOnRestart = this.masterPassOnRestart =
      await this.userVerificationService.hasMasterPassword();
  }

  toggleVisibility() {
    this.showPin = !this.showPin;
  }

  async submit() {
    if (Utils.isNullOrWhitespace(this.pin)) {
      this.modalRef.close(false);
      return;
    }

    const pinKey = await this.cryptoService.makePinKey(
      this.pin,
      await this.stateService.getEmail(),
      await this.stateService.getKdfType(),
      await this.stateService.getKdfConfig(),
    );
    const userId = (await firstValueFrom(this.accountService.activeAccount$))?.id;
    const [pinProtectedKey, encPin] = await this.cryptoService.deriveFromUserKey(
      userId,
      async (userKey) => {
        return [
          await this.encryptService.encrypt(userKey.key, pinKey),
          await this.encryptService.encrypt(this.pin, userKey),
        ];
      },
    );
    await this.stateService.setProtectedPin(encPin.encryptedString);
    if (this.masterPassOnRestart) {
      await this.stateService.setPinKeyEncryptedUserKeyEphemeral(pinProtectedKey);
    } else {
      await this.stateService.setPinKeyEncryptedUserKey(pinProtectedKey);
    }

    this.modalRef.close(true);
  }
}
