import { Observable } from "rxjs";

export class BillingBannerService {
  billingBannerStates$: Observable<Record<string, boolean>>;

  getPaymentMethodBannerId: (organizationId: string) => string;
  setPaymentMethodBannerState: (organizationId: string, state: boolean) => Promise<void>;
}
