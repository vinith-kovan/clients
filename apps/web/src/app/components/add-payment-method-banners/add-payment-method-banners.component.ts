import { Component, OnDestroy, OnInit } from "@angular/core";
import { combineLatest, switchMap, takeUntil, Subject } from "rxjs";

import { OrganizationApiServiceAbstraction as OrganizationApiService } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import {
  OrganizationService,
  canAccessAdmin,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingBannerService } from "@bitwarden/common/billing/abstractions/billing-banner.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { SharedModule } from "../../shared/shared.module";

type OrganizationBannerState = {
  organizationId: string;
  organizationName: string;
  showBanner: boolean;
};

@Component({
  standalone: true,
  selector: "app-add-payment-method-banners",
  templateUrl: "add-payment-method-banners.component.html",
  imports: [SharedModule],
})
export class AddPaymentMethodBannersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected organizationBannerStates: OrganizationBannerState[];

  constructor(
    private billingBannerService: BillingBannerService,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private organizationApiService: OrganizationApiService,
  ) {}

  async ngOnInit() {
    const organizations$ = this.organizationService.memberOrganizations$.pipe(
      canAccessAdmin(this.i18nService),
    );

    combineLatest([organizations$, this.billingBannerService.billingBannerStates$])
      .pipe(
        switchMap(async ([organizations, billingBannerStates]) => {
          return await Promise.all(
            organizations.map(async (organization) => {
              const bannerState = await this.getBannerState(organization, billingBannerStates);
              return {
                organizationId: organization.id,
                organizationName: organization.name,
                showBanner: bannerState,
              };
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((organizationBannerStates) => {
        this.organizationBannerStates = organizationBannerStates;
      });
  }

  protected async closeBanner(organizationId: string): Promise<void> {
    await this.billingBannerService.setPaymentMethodBannerState(organizationId, false);
  }

  private async getBannerState(
    organization: Organization,
    billingBannerStates: Record<string, boolean>,
  ) {
    const bannerId = this.billingBannerService.getPaymentMethodBannerId(organization.id);
    let bannerState = billingBannerStates[bannerId];
    if (bannerState === undefined) {
      bannerState = await this.organizationApiService.checkForMissingPaymentMethod(organization.id);
      await this.billingBannerService.setPaymentMethodBannerState(organization.id, bannerState);
    }
    return bannerState;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
