import { Observable } from "rxjs";

export class BillingBannerService {
  addPaymentMethodBannersVisibility$: Observable<{ organizationId: string; visible: boolean }[]>;

  setPaymentMethodBannerVisibility: (organizationId: string, visible: boolean) => Promise<void>;
}
