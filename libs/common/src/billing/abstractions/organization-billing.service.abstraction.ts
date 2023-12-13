export class OrganizationBillingService {
  checkForMissingPaymentMethod: (organizationId: string) => Promise<boolean>;
}
