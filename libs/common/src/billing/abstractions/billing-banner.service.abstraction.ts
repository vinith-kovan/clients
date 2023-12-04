import { Observable } from "rxjs";

export class BillingBannerService {
  billingBannerStates$: Observable<Record<string, boolean>>;

  getPaymentMethodBannerState: (organizationId: string) => Promise<boolean | undefined>;
  setPaymentMethodBannerState: (organizationId: string, state: boolean) => Promise<void>;
}
