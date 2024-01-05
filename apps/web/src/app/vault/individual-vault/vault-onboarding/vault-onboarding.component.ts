import { CommonModule } from "@angular/common";
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject, takeUntil, BehaviorSubject, Observable } from "rxjs";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { OnboardingModule } from "../../../shared/components/onboarding/onboarding.module";

export type VaultOnboardingTasks = {
  createAccount: boolean;
  importData: boolean;
  installExtension: boolean;
};

@Component({
  standalone: true,
  imports: [OnboardingModule, CommonModule, JslibModule],
  selector: "app-vault-onboarding",
  templateUrl: "vault-onboarding.component.html",
})
export class VaultOnboardingComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ciphers: CipherView[];
  @Output() onAddCipher = new EventEmitter<void>();

  extensionUrl: string;
  isIndividualPolicyVault: boolean;
  private destroy$ = new Subject<void>();
  isNewAccount: boolean;
  private readonly onboardingReleaseDate = new Date("2023-12-22");
  showOnboardingAccess: Observable<boolean>;

  protected onboardingTasks$: BehaviorSubject<VaultOnboardingTasks> =
    new BehaviorSubject<VaultOnboardingTasks>({
      createAccount: true,
      importData: false,
      installExtension: false,
    });

  protected showOnboarding = false;

  constructor(
    protected platformUtilsService: PlatformUtilsService,
    protected policyService: PolicyService,
    private stateService: StateService,
    protected router: Router,
    private apiService: ApiService,
    private configService: ConfigServiceAbstraction,
  ) {}

  ngOnInit() {
    this.checkOnboardingFlag();
    this.onboardingTasks$.pipe(takeUntil(this.destroy$)).subscribe((tasks: any) => {
      this.showOnboarding = tasks !== null ? Object.values(tasks).includes(false) : true;
    });

    this.setOnboardingTasks();
    this.setInstallExtLink();
    this.individualVaultPolicyCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.showOnboarding && changes?.ciphers) {
      if (this.showOnboarding) {
        this.saveCompletedTasks({
          createAccount: true,
          importData: this.ciphers.length > 0,
          installExtension: false,
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async checkOnboardingFlag() {
    this.showOnboardingAccess = await this.configService.getFeatureFlag$<boolean>(
      FeatureFlag.VaultOnboarding,
      false,
    );
  }

  async checkCreationDate() {
    const userProfile = await this.apiService.getProfile();
    const profileCreationDate = new Date(userProfile.creationDate);

    this.isNewAccount = this.onboardingReleaseDate < profileCreationDate ? true : false;

    if (!this.isNewAccount) {
      this.hideOnboarding();
    }
  }

  addCipher() {
    this.onAddCipher.emit();
  }

  protected hideOnboarding() {
    this.showOnboarding = false;
    this.saveCompletedTasks({
      createAccount: true,
      importData: true,
      installExtension: true,
    });
  }

  async setOnboardingTasks() {
    const tasksInStorage: any = (await this.stateService.getVaultOnboardingTasks()) || null;
    if (tasksInStorage == null) {
      const freshStart = {
        createAccount: true,
        importData: this.ciphers?.length > 0,
        installExtension: false,
      };
      this.onboardingTasks$.next(freshStart);
      this.stateService.setVaultOnboardingTasks({
        currentStatus: freshStart,
      });
      this.showOnboarding = true;
    } else if (tasksInStorage && tasksInStorage.currentStatus) {
      this.showOnboarding = Object.values(tasksInStorage.currentStatus).includes(false);
    }

    if (this.showOnboarding) {
      this.checkCreationDate();
    }
  }

  private async saveCompletedTasks(vaultTasks: VaultOnboardingTasks) {
    this.onboardingTasks$.next(vaultTasks);
    this.stateService.setVaultOnboardingTasks({
      currentStatus: vaultTasks,
    });
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

  setInstallExtLink() {
    if (this.platformUtilsService.isChrome()) {
      this.extensionUrl =
        "https://chrome.google.com/webstore/detail/bitwarden-free-password-m/nngceckbapebfimnlniiiahkandclblb";
    } else if (this.platformUtilsService.isFirefox()) {
      this.extensionUrl =
        "https://addons.mozilla.org/en-US/firefox/addon/bitwarden-password-manager/";
    } else if (this.platformUtilsService.isSafari()) {
      this.extensionUrl = "https://apps.apple.com/us/app/bitwarden/id1352778147?mt=12";
    }
  }

  navigateToImport() {
    if (!this.isIndividualPolicyVault) {
      this.router.navigate(["tools/import"]);
    }
  }

  navigateToExtension() {
    window.open(this.extensionUrl, "_blank");
  }
}
