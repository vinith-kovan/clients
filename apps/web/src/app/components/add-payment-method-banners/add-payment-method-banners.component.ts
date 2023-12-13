import { Component } from "@angular/core";
import { combineLatest, Observable, switchMap } from "rxjs";

import {
  OrganizationService,
  canAccessAdmin,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { BillingBannerService } from "@bitwarden/common/billing/abstractions/billing-banner.service.abstraction";
import { OrganizationBillingService } from "@bitwarden/common/billing/abstractions/organization-billing.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { SharedModule } from "../../shared/shared.module";

type AddPaymentMethodBannerData = {
  organizationId: string;
  organizationName: string;
  visible: boolean;
};

@Component({
  standalone: true,
  selector: "app-add-payment-method-banners",
  templateUrl: "add-payment-method-banners.component.html",
  imports: [SharedModule],
})
export class AddPaymentMethodBannersComponent {
  constructor(
    private billingBannerService: BillingBannerService,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private organizationBillingService: OrganizationBillingService,
  ) {}

  private organizations$ = this.organizationService.memberOrganizations$.pipe(
    canAccessAdmin(this.i18nService),
  );

  protected banners$: Observable<AddPaymentMethodBannerData[]> = combineLatest([
    this.organizations$,
    this.billingBannerService.addPaymentMethodBannersVisibility$,
  ]).pipe(
    switchMap(async ([organizations, addPaymentMethodBannersVisibility]) => {
      return await Promise.all(
        organizations.map(async (organization) => {
          const matchingBanner = addPaymentMethodBannersVisibility.find(
            (banner) => banner.organizationId === organization.id,
          );
          if (matchingBanner !== null && matchingBanner !== undefined) {
            return {
              organizationId: organization.id,
              organizationName: organization.name,
              visible: matchingBanner.visible,
            };
          } else {
            const missingPaymentMethod =
              await this.organizationBillingService.checkForMissingPaymentMethod(organization.id);
            await this.billingBannerService.setPaymentMethodBannerVisibility(
              organization.id,
              missingPaymentMethod,
            );
            return {
              organizationId: organization.id,
              organizationName: organization.name,
              visible: missingPaymentMethod,
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
