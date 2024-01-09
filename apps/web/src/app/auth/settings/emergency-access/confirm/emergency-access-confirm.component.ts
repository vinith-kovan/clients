import { DialogConfig, DIALOG_DATA } from "@angular/cdk/dialog";
import { Component, EventEmitter, Input, OnInit, Output, Inject } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { DialogService } from "@bitwarden/components";

@Component({
  selector: "emergency-access-confirm",
  templateUrl: "emergency-access-confirm.component.html",
})
export class EmergencyAccessConfirmComponent implements OnInit {
  @Input() name: string;
  @Input() userId: string;
  @Input() emergencyAccessId: string;
  @Input() formPromise: Promise<any>;
  @Output() onConfirmed = new EventEmitter();

  loading = true;
  fingerprint: string;
  confirmForm = this.formBuilder.group({
    dontAskAgain: [null as boolean, [Validators.required]],
  });

  constructor(
    @Inject(DIALOG_DATA) protected params: any,
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private cryptoService: CryptoService,
    private stateService: StateService,
    private logService: LogService,
  ) {
    this.name = params.name;
    this.userId = params.userId;
    this.emergencyAccessId = params.emergencyAccessId;
  }

  async ngOnInit() {
    try {
      const publicKeyResponse = await this.apiService.getUserPublicKey(this.userId);
      if (publicKeyResponse != null) {
        const publicKey = Utils.fromB64ToArray(publicKeyResponse.publicKey);
        const fingerprint = await this.cryptoService.getFingerprint(this.userId, publicKey);
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
      this.params.onConfirmed(this.formPromise);
    } catch (e) {
      this.logService.error(e);
    }
  };
}

export function openEmergencyAccessConfirmDialog(
  dialogService: DialogService,
  config: DialogConfig<any>,
) {
  return dialogService.open<any, any>(EmergencyAccessConfirmComponent, config);
}
