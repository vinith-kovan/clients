import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

export type VaultOnboardingTasks = {
  createAccount: boolean;
  importData: boolean;
  installExtension: boolean;
};

@Component({
  selector: "app-vault-onboarding",
  templateUrl: "vault-onboarding.component.html",
})
export class VaultOnboardingComponent implements OnInit, OnDestroy {
  @Input() onboardingTasks: VaultOnboardingTasks;
  @Output() onHideOnboarding = new EventEmitter<void>();
  @Output() onAddCipher = new EventEmitter<void>();

  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  extensionUrl: string;
  isIndividualPolicyVault: boolean;
  private destroy$ = new Subject<void>();

  constructor(
    private platformUtilsService: PlatformUtilsService,
    protected policyService: PolicyService,
    protected router: Router,
  ) {
    this.isChrome = platformUtilsService.isChrome();
    this.isFirefox = platformUtilsService.isFirefox();
    this.isSafari = platformUtilsService.isSafari();
  }

  ngOnInit() {
    this.setInstallExtLink();
    this.individualVaultPolicyCheck();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  individualVaultPolicyCheck() {
    this.policyService
      .policyAppliesToActiveUser$(PolicyType.PersonalOwnership)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.isIndividualPolicyVault = data;
      });
  }

  emitToAddCipher() {
    this.onAddCipher.emit();
  }

  emitToHideOnboarding() {
    this.onHideOnboarding.emit();
  }

  setInstallExtLink() {
    if (this.isChrome) {
      this.extensionUrl =
        "https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb";
    } else if (this.isFirefox) {
      this.extensionUrl =
        "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/";
    } else if (this.isSafari) {
      this.extensionUrl = "https://apps.apple.com/us/app/bitwarden/id1352778147?mt=12";
    }
  }

  navigateToImport() {
    if (!this.isIndividualPolicyVault && !this.onboardingTasks.importData) {
      this.router.navigate(["tools/import"]);
    }
  }

  navigateToExtension() {
    window.open(this.extensionUrl, "_blank");
  }
}
