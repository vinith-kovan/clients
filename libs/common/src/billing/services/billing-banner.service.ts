import { concatMap, BehaviorSubject } from "rxjs";

import { StateService } from "../../platform/abstractions/state.service";
import { BillingBannerService as BillingBannerServiceAbstraction } from "../abstractions/billing-banner.service.abstraction";

export class BillingBannerService implements BillingBannerServiceAbstraction {
  protected _billingBannerStates = new BehaviorSubject<Record<string, boolean>>({});

  billingBannerStates$ = this._billingBannerStates.asObservable();

  constructor(private stateService: StateService) {
    this.stateService.activeAccountUnlocked$
      .pipe(
        concatMap(async (unlocked) => {
          if (!unlocked) {
            this._billingBannerStates.next({});
            return;
          }

          const data = await this.stateService.getBillingBannerStates();
          this._billingBannerStates.next(data);
        }),
      )
      .subscribe();
  }

  getPaymentMethodBannerId(organizationId: string) {
    return `${organizationId}_add-payment-method-banner`;
  }

  async setPaymentMethodBannerState(organizationId: string, state: boolean): Promise<void> {
    const billingBannerStates = await this.stateService.getBillingBannerStates();
    const paymentMethodBannerId = this.getPaymentMethodBannerId(organizationId);
    billingBannerStates[paymentMethodBannerId] = state;
    await this.stateService.setBillingBannerStates(billingBannerStates);
    this._billingBannerStates.next(billingBannerStates);
  }
}
