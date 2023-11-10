import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

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
  providers: [],
})
export class VaultOnboardingComponent implements OnInit {
  @Input() onboardingTasks: VaultOnboardingTasks;
  @Output() onHideOnboarding = new EventEmitter<void>();
  @Output() onAddCipher = new EventEmitter<void>();

  protected isChrome: boolean;
  protected isFirefox: boolean;
  protected isSafari: boolean;
  protected extensionUrl: string;
  protected isIndividualPolicyVault: boolean;

  constructor(
    private platformUtilsService: PlatformUtilsService,
    private policyService: PolicyService,
    private router: Router
  ) {
    this.isChrome = platformUtilsService.isChrome();
    this.isFirefox = platformUtilsService.isFirefox();
    this.isSafari = platformUtilsService.isSafari();
  }

  ngOnInit() {
    this.setInstallExtLink();
    this.individualVaultPolicyCheck();
  }

  async individualVaultPolicyCheck() {
    this.isIndividualPolicyVault = await firstValueFrom(
      this.policyService.policyAppliesToActiveUser$(PolicyType.PersonalOwnership)
    );
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
