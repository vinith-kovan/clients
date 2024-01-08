import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
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

import { UserVerificationFormInputComponent } from "./user-verification-form-input.component";

/**
 * Parameters for configuring the user verification dialog.
 * @param {string} [dialogTitle] - The title of the dialog. Optional. Defaults to "Verification required"
 * @param {string} [dialogBodyText] - The body text of the dialog. Optional.
 * @param {string} [confirmButtonText] - The text of the confirm button. Optional. Defaults to "Submit"
 * @param {boolean} [clientSideOnlyVerification] - Indicates whether the verification is only performed client-side. Optional.
 */
export type UserVerificationDialogParams = {
  dialogTitle?: string;
  dialogBodyText?: string;
  confirmButtonText?: string;
  clientSideOnlyVerification?: boolean;
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
    UserVerificationFormInputComponent,
  ],
})
export class UserVerificationDialogComponent {
  verificationForm = this.formBuilder.group({
    secret: this.formBuilder.control<Verification | null>(null),
  });

  get secret() {
    return this.verificationForm.controls.secret;
  }

  invalidSecret = false;

  constructor(
    @Inject(DIALOG_DATA) public dialogParams: UserVerificationDialogParams,
    private dialogRef: DialogRef<boolean>,
    private formBuilder: FormBuilder,
    private userVerificationService: UserVerificationService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
  ) {}

  static open(dialogService: DialogService, data: UserVerificationDialogParams) {
    return dialogService.open<boolean>(UserVerificationDialogComponent, {
      data,
    });
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
