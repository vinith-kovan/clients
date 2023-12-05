import { Component, OnDestroy, OnInit } from "@angular/core";
import { takeUntil, tap, Subject } from "rxjs";

import { OrganizationApiServiceAbstraction as OrganizationApiService } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import {
  OrganizationService,
  canAccessAdmin,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingBannerService } from "@bitwarden/common/billing/abstractions/billing-banner.service.abstraction";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

type OrganizationBannerState = {
  organizationId: string;
  organizationName: string;
  showBanner: boolean;
};

@Component({
  selector: "app-add-payment-method-banners",
  templateUrl: "add-payment-method-banners.component.html",
})
export class AddPaymentMethodBannersComponent implements OnInit, OnDestroy {
  protected bannerStates: OrganizationBannerState[];
  private organizations: Organization[];
  private destroy$ = new Subject<void>();

  constructor(
    private billingBannerService: BillingBannerService,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private organizationApiService: OrganizationApiService,
  ) {}

  async ngOnInit() {
    this.organizationService.memberOrganizations$
      .pipe(
        canAccessAdmin(this.i18nService),
        tap(async (organizations) => {
          await Promise.all(
            organizations.map(async (organization) => {
              const showBanner = await this.saveBannerStateFor(organization);
              this.updateBannerState(organization, showBanner);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((organizations) => {
        this.organizations = organizations;
      });

    this.billingBannerService.billingBannerStates$
      .pipe(takeUntil(this.destroy$))
      .subscribe((billingBannerStates) => this.setBannerStates(billingBannerStates));
  }

  private async checkForMissingPaymentMethod(organization: Organization): Promise<boolean> {
    const billingResponse = await this.organizationApiService.getBilling(organization.id);
    const subscriptionResponse = await this.organizationApiService.getSubscription(organization.id);

    return (
      billingResponse?.paymentSource === null ||
      (billingResponse?.paymentSource === undefined &&
        (subscriptionResponse?.subscription.status === "trialing" ||
          subscriptionResponse?.subscription.status === "active"))
    );
  }

  protected async closeBanner(organizationId: string): Promise<void> {
    await this.billingBannerService.setPaymentMethodBannerState(organizationId, false);
  }

  protected getAddPaymentMethodUrl = (organizationId: string) =>
    `/organizations/${organizationId}/billing/payment-method`;

  private async saveBannerStateFor(organization: Organization): Promise<boolean> {
    let bannerState = await this.billingBannerService.getPaymentMethodBannerState(organization.id);
    if (bannerState === undefined) {
      bannerState = await this.checkForMissingPaymentMethod(organization);
      await this.billingBannerService.setPaymentMethodBannerState(organization.id, bannerState);
    }
    return bannerState;
  }

  private setBannerStates(billingBannerStates: Record<string, boolean>): void {
    this.bannerStates = Object.entries(billingBannerStates).map(([bannerId, showBanner]) => {
      const organizationId = bannerId.split("_")[0];
      const organization = this.organizations.find(
        (organization) => organization.id === organizationId,
      );
      return {
        organizationId: organization.id,
        organizationName: organization.name,
        showBanner: showBanner,
      };
    });
  }

  protected translateMaintainYourSubscription(organizationName: string) {
    return this.i18nService.translate("maintainYourSubscription", organizationName);
  }

  private updateBannerState(organization: Organization, showBanner: boolean) {
    const bannerState = this.bannerStates.find((obs) => obs.organizationId === organization.id);

    if (bannerState) {
      const index = this.bannerStates.indexOf(bannerState);
      this.bannerStates[index] = {
        organizationId: bannerState.organizationId,
        organizationName: organization.name,
        showBanner: showBanner,
      };
    } else {
      this.bannerStates.push({
        organizationId: organization.id,
        organizationName: organization.name,
        showBanner: showBanner,
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
