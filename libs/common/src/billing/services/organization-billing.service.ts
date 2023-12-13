import { OrganizationApiServiceAbstraction as OrganizationApiService } from "../../admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationBillingService as OrganizationBillingServiceAbstraction } from "../abstractions/organization-billing.service.abstraction";

export class OrganizationBillingService implements OrganizationBillingServiceAbstraction {
  constructor(private organizationApiService: OrganizationApiService) {}

  async checkForMissingPaymentMethod(organizationId: string): Promise<boolean> {
    const billingResponse = await this.organizationApiService.getBilling(organizationId);
    const subscriptionResponse = await this.organizationApiService.getSubscription(organizationId);

    return (
      (billingResponse?.paymentSource === null || billingResponse?.paymentSource === undefined) &&
      (subscriptionResponse?.subscription?.status === "trialing" ||
        subscriptionResponse?.subscription?.status === "active")
    );
  }
}
