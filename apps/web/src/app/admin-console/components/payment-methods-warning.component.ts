import { Component, OnDestroy, OnInit } from "@angular/core";
import { Observable, Subject, takeUntil } from "rxjs";

import { OrganizationApiServiceAbstraction } from "@bitwarden/common/admin-console/abstractions/organization/organization-api.service.abstraction";
import {
  OrganizationService,
  canAccessAdmin,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { BannerService } from "../../core";

@Component({
  selector: "app-payment-methods-warning",
  templateUrl: "payment-methods-warning.component.html",
})
export class PaymentMethodsWarningComponent implements OnInit, OnDestroy {
  organizations$: Observable<Organization[]>;
  organizations: Organization[];

  private destroy$ = new Subject<void>();

  constructor(
    private bannerService: BannerService,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private organizationApiService: OrganizationApiServiceAbstraction
  ) {}

  async ngOnInit() {
    this.organizations$ = this.organizationService.memberOrganizations$.pipe(
      canAccessAdmin(this.i18nService)
    );

    this.organizations$.pipe(takeUntil(this.destroy$)).subscribe((organizations) => {
      this.organizations = organizations;
      organizations.forEach(async (organization) => {
        const bannerId = this.getBannerId(organization);
        const bannerState = this.bannerService.get(bannerId);
        if (bannerState === null || bannerState === undefined) {
          const bannerValue = await this.missingRequiredPaymentMethod(organization);
          await this.bannerService.set(bannerId, bannerValue);
        }
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getBannerId(organization: Organization) {
    return `${organization.id}_missing-payment-method`;
  }

  async missingRequiredPaymentMethod(organization: Organization) {
    const billingResponse = await this.organizationApiService.getBilling(organization.id);
    const subscriptionResponse = await this.organizationApiService.getSubscription(organization.id);

    return (
      billingResponse?.paymentSource === null ||
      (billingResponse?.paymentSource === undefined &&
        subscriptionResponse?.subscription.status === "trialing") ||
      subscriptionResponse?.subscription.status === "active"
    );
  }

  showBanner(organization: Organization) {
    return this.bannerService.get(this.getBannerId(organization));
  }

  async handleClose(organization: Organization) {
    await this.bannerService.set(this.getBannerId(organization), false);
  }
}
