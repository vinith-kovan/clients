import { DialogConfig, DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, OnInit, Inject } from "@angular/core";
import { FormBuilder } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { DialogService } from "@bitwarden/components";

export enum EmergencyAccessConfirmResultType {
  Confirmed = "confirmed",
}
type EmergencyAccessConfirmParams = {
  name: string;
  userId: string;
  emergencyAccessId: string;
};
@Component({
  selector: "emergency-access-confirm",
  templateUrl: "emergency-access-confirm.component.html",
})
export class EmergencyAccessConfirmComponent implements OnInit {
  loading = true;
  fingerprint: string;
  confirmForm = this.formBuilder.group({
    dontAskAgain: [false as boolean],
  });

  constructor(
    @Inject(DIALOG_DATA) protected params: any,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private stateService: StateService,
    private logService: LogService,
    private dialogRef: DialogRef<EmergencyAccessConfirmResultType>,
  ) {}

  async ngOnInit() {
    try {
      const publicKeyResponse = await this.apiService.getUserPublicKey(this.params.userId);
      if (publicKeyResponse != null) {
        const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
        const fingerprint = await this.cryptoService.getFingerprint(this.params.userId, publicKey);
        if (fingerprint != null) {
          this.fingerprint = fingerprint.join("-");
        }
      }
    } catch (e) {
      this.logService.error(e);
    }
    this.loading = false;
  }

  submit = async () => {
    if (this.loading) {
      return;
    }

    if (this.confirmForm.get("dontAskAgain").value) {
      await this.stateService.setAutoConfirmFingerprints(true);
    }

    try {
      this.dialogRef.close(EmergencyAccessConfirmResultType.Confirmed);
    } catch (e) {
      this.logService.error(e);
    }
  };
  static open(dialogService: DialogService, config: DialogConfig<EmergencyAccessConfirmParams>) {
    return dialogService.open<EmergencyAccessConfirmResultType, EmergencyAccessConfirmParams>(
      EmergencyAccessConfirmComponent,
      config,
    );
  }
}
