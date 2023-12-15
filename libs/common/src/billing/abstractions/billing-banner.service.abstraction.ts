import { Observable } from "rxjs";

export class BillingBannerServiceAbstraction {
  paymentMethodBannersVisibility$: Observable<{ organizationId: string; visible: boolean }[]>;

  setPaymentMethodBannerVisibility: (organizationId: string, visible: boolean) => Promise<void>;
}
