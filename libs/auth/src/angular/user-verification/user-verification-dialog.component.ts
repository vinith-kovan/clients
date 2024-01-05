import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { Verification } from "@bitwarden/common/auth/types/verification";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  AsyncActionsModule,
  ButtonModule,
  DialogModule,
  DialogService,
} from "@bitwarden/components";

import { UserVerificationFormComponent } from "./user-verification-form.component";

/*
 * @param dialogTitle - the title of the dialog
 * @param dialogBodyText - the body text of the dialog
 * @param confirmButtonText - the text of the confirm button
 * @param verificationTypes - the allowed verification types.
 * If you don't specify this, the user will be able to use any available verification type.
 */
export type UserVerificationDialogParams = {
  dialogTitle?: string;
  dialogBodyText?: string;
  confirmButtonText?: string;
  verificationTypes: "server" | "client" | "serverAndClient";
};

type UserVerificationOptions = {
  server: {
    otp: boolean;
    masterPassword: boolean;
  };
  client: {
    masterPassword: boolean;
    pin: boolean;
    biometrics: boolean;
  };
};

@Component({
  templateUrl: "user-verification-dialog.component.html",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    JslibModule,
    ButtonModule,
    DialogModule,
    AsyncActionsModule,
    UserVerificationFormComponent,
  ],
})
export class UserVerificationDialogComponent implements OnInit {
  verificationForm = this.formBuilder.group({
    secret: this.formBuilder.control<Verification | null>(null),
  });

  get secret() {
    return this.verificationForm.controls.secret;
  }

  invalidSecret = false;

  userVerificationOptions: UserVerificationOptions = {
    server: {
      otp: false,
      masterPassword: false,
    },
    client: {
      masterPassword: false,
      pin: false,
      biometrics: true,
    },
  };

  constructor(
    @Inject(DIALOG_DATA) public dialogParams: UserVerificationDialogParams,
    private dialogRef: DialogRef<boolean>,
    private formBuilder: FormBuilder,
    private userVerificationService: UserVerificationService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
  ) {}

  static open(dialogService: DialogService, data: UserVerificationDialogParams) {
    return dialogService.open(UserVerificationDialogComponent, {
      data,
    });
  }

  async ngOnInit() {
    // determine verification types based on if dialogParams.verificationTypes value

    // TOOD: will need some loading state while we determine user verification options
    // TODO: move this into own function most likely.
    // TODO: should this even be determined here or in the form component?

    const userHasMasterPassword =
      await this.userVerificationService.hasMasterPasswordAndMasterKeyHash();

    switch (this.dialogParams.verificationTypes) {
      case "server":
        // only server-side verification
        this.userVerificationOptions.server.masterPassword = userHasMasterPassword;
        this.userVerificationOptions.server.otp = !userHasMasterPassword;
        break;
      case "client":
        // only client-side verification
        this.userVerificationOptions.client.masterPassword = userHasMasterPassword;

        // if clients must determine if the user has a MP or not.

        break;
      case "serverAndClient":
        // both server-side and client-side verification

        break;
    }
  }

  submit = async () => {
    this.verificationForm.markAllAsTouched();

    if (this.verificationForm.invalid) {
      return;
    }

    try {
      //Incorrect secret will throw an invalid password error.
      await this.userVerificationService.verifyUser(this.secret.value);
      this.invalidSecret = false;
    } catch (e) {
      this.invalidSecret = true;
      this.platformUtilsService.showToast("error", this.i18nService.t("error"), e.message);
      return;
    }

    this.close(true);
  };

  close(success: boolean) {
    this.dialogRef.close(success);
  }
}
