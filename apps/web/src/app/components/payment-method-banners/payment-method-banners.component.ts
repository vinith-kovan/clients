import { Component } from "@angular/core";
import { combineLatest, Observable, switchMap } from "rxjs";

import { OrganizationApiServiceAbstraction as OrganizationApiService } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import {
  OrganizationService,
  canAccessAdmin,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { BillingBannerService } from "@bitwarden/common/billing/abstractions/billing-banner.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { BannerModule } from "@bitwarden/components";

import { SharedModule } from "../../shared/shared.module";

type PaymentMethodBannerData = {
  organizationId: string;
  organizationName: string;
  visible: boolean;
};

@Component({
  standalone: true,
  selector: "app-payment-method-banners",
  templateUrl: "payment-method-banners.component.html",
  imports: [BannerModule, SharedModule],
})
export class PaymentMethodBannersComponent {
  constructor(
    private billingBannerService: BillingBannerService,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private organizationApiService: OrganizationApiService,
  ) {}

  private organizations$ = this.organizationService.memberOrganizations$.pipe(
    canAccessAdmin(this.i18nService),
  );

  protected banners$: Observable<PaymentMethodBannerData[]> = combineLatest([
    this.organizations$,
    this.billingBannerService.paymentMethodBannersVisibility$,
  ]).pipe(
    switchMap(async ([organizations, paymentMethodBannersVisibility]) => {
      return await Promise.all(
        organizations.map(async (organization) => {
          const matchingBanner = paymentMethodBannersVisibility.find(
            (banner) => banner.organizationId === organization.id,
          );
          if (matchingBanner !== null && matchingBanner !== undefined) {
            return {
              organizationId: organization.id,
              organizationName: organization.name,
              visible: matchingBanner.visible,
            };
          } else {
            const response = await this.organizationApiService.risksSubscriptionFailure(
              organization.id,
            );
            await this.billingBannerService.setPaymentMethodBannerVisibility(
              organization.id,
              response.risksSubscriptionFailure,
            );
            return {
              organizationId: organization.id,
              organizationName: organization.name,
              visible: response.risksSubscriptionFailure,
            };
          }
        }),
      );
    }),
  );

  protected async closeBanner(organizationId: string): Promise<void> {
    await this.billingBannerService.setPaymentMethodBannerVisibility(organizationId, false);
  }
}
