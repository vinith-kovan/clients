import { CommonModule } from "@angular/common";
import { Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { BroadcasterService } from "@bitwarden/common/platform/abstractions/broadcaster.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { IconModule, LayoutComponent, NavigationModule } from "@bitwarden/components";

import { AdminConsoleLogo } from "../admin-console/icons/admin-console-logo";

const BroadcasterSubscriptionId = "UserLayoutComponent";

@Component({
  selector: "app-user-layout",
  templateUrl: "user-layout.component.html",
  standalone: true,
  imports: [CommonModule, RouterModule, JslibModule, LayoutComponent, IconModule, NavigationModule],
})
export class UserLayoutComponent implements OnInit, OnDestroy {
  protected readonly logo = AdminConsoleLogo;
  hasFamilySponsorshipAvailable: boolean;
  hideSubscription: boolean;

  constructor(
    private broadcasterService: BroadcasterService,
    private ngZone: NgZone,
    private platformUtilsService: PlatformUtilsService,
    private organizationService: OrganizationService,
    private stateService: StateService,
    private apiService: ApiService
  ) {}

  ngOnInit() {
    document.body.classList.remove("layout_frontend");

    this.broadcasterService.subscribe(BroadcasterSubscriptionId, async (message: any) => {
      this.ngZone.run(async () => {
        switch (message.command) {
          case "purchasedPremium":
            await this.load();
            break;
          default:
        }
      });
    });

    this.load();
  }

  ngOnDestroy() {
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
  }

  async load() {
    const premium = await this.stateService.getHasPremiumPersonally();
    const selfHosted = await this.platformUtilsService.isSelfHost();

    this.hasFamilySponsorshipAvailable = await this.organizationService.canManageSponsorships();
    const hasPremiumFromOrg = await this.stateService.getHasPremiumFromOrganization();
    let billing = null;
    if (!selfHosted) {
      // TODO: We should remove the need to call this!
      billing = await this.apiService.getUserBillingHistory();
    }
    this.hideSubscription = !premium && hasPremiumFromOrg && (selfHosted || billing?.hasNoHistory);
  }
}
