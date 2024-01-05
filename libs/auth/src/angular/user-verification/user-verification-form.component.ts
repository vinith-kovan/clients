import { animate, style, transition, trigger } from "@angular/animations";
import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import {
  ControlValueAccessor,
  FormControl,
  Validators,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from "@angular/forms";
import { Subject, takeUntil } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { VerificationType } from "@bitwarden/common/auth/enums/verification-type";
import { Verification } from "@bitwarden/common/auth/types/verification";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { AsyncActionsModule, FormFieldModule, IconButtonModule } from "@bitwarden/components";

/**
 * Used for general-purpose user verification throughout the app.
 * Collects the user's master password, or if they are not using a password, prompts for an OTP via email.
 * This is exposed to the parent component via the ControlValueAccessor interface (e.g. bind it to a FormControl).
 * Use UserVerificationService to verify the user's input.
 */
@Component({
  selector: "app-user-verification-form",
  templateUrl: "user-verification-form.component.html",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: UserVerificationFormComponent,
    },
  ],
  animations: [
    trigger("sent", [
      transition(":enter", [style({ opacity: 0 }), animate("100ms", style({ opacity: 1 }))]),
    ]),
  ],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    JslibModule,
    FormFieldModule,
    AsyncActionsModule,
    IconButtonModule,
  ],
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class UserVerificationFormComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private _invalidSecret = false;
  @Input()
  get invalidSecret() {
    return this._invalidSecret;
  }
  set invalidSecret(value: boolean) {
    this._invalidSecret = value;
    this.invalidSecretChange.emit(value);

    // ISSUE: This is pretty hacky but unfortunately there is no way of knowing if the parent
    // control has been marked as touched, see: https://github.com/angular/angular/issues/10887
    // When that functionality has been added we should also look into forwarding reactive form
    // controls errors so that we don't need a separate input/output `invalidSecret`.
    if (value) {
      this.secret.markAsTouched();
    }
    this.secret.updateValueAndValidity({ emitEvent: false });
  }
  @Output() invalidSecretChange = new EventEmitter<boolean>();

  hasMasterPassword = true;
  disableRequestOTP = false;
  sentCode = false;

  secret = new FormControl("", [
    Validators.required,
    () => {
      if (this.invalidSecret) {
        return {
          invalidSecret: {
            message: this.hasMasterPassword
              ? this.i18nService.t("incorrectPassword")
              : this.i18nService.t("incorrectCode"),
          },
        };
      }
    },
  ]);

  private onChange: (value: Verification) => void;
  private destroy$ = new Subject<void>();

  constructor(
    private userVerificationService: UserVerificationService,
    private i18nService: I18nService,
  ) {}

  async ngOnInit() {
    this.hasMasterPassword = await this.userVerificationService.hasMasterPasswordAndMasterKeyHash();
    this.processChanges(this.secret.value);

    this.secret.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((secret: string) => this.processChanges(secret));
  }

  requestOTP = async () => {
    if (!this.hasMasterPassword) {
      this.disableRequestOTP = true;
      try {
        await this.userVerificationService.requestOTP();
        this.sentCode = true;
      } finally {
        this.disableRequestOTP = false;
      }
    }
  };

  writeValue(obj: any): void {
    this.secret.setValue(obj);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    // Not implemented
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disableRequestOTP = isDisabled;
    if (isDisabled) {
      this.secret.disable();
    } else {
      this.secret.enable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected processChanges(secret: string) {
    this.invalidSecret = false;

    if (this.onChange == null) {
      return;
    }

    this.onChange({
      type: this.hasMasterPassword ? VerificationType.MasterPassword : VerificationType.OTP,
      secret: Utils.isNullOrWhitespace(secret) ? null : secret,
    });
  }
}
