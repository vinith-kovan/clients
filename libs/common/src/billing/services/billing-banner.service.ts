import { concatMap, BehaviorSubject, map } from "rxjs";

import { StateService } from "../../platform/abstractions/state.service";
import { BillingBannerServiceAbstraction } from "../abstractions/billing-banner.service.abstraction";

export class BillingBannerService implements BillingBannerServiceAbstraction {
  protected _billingBannerStates = new BehaviorSubject<Record<string, boolean>>({});

  private paymentMethodBannerSuffix = "add-payment-method-banner";

  constructor(private stateService: StateService) {
    this.stateService.activeAccountUnlocked$
      .pipe(
        concatMap(async (unlocked) => {
          if (!unlocked) {
            return {};
          }

          return await this.stateService.getBillingBannerStates();
        }),
      )
      .subscribe(this._billingBannerStates);
  }

  private getEntityId = (bannerId: string) => bannerId.split("_")[0];

  paymentMethodBannersVisibility$ = this._billingBannerStates.asObservable().pipe(
    map((billingBannerStates) =>
      Object.entries(billingBannerStates)
        .filter(this.isPaymentMethodBanner)
        .map(([paymentMethodBannerId, visible]) => ({
          organizationId: this.getEntityId(paymentMethodBannerId),
          visible: visible,
        })),
    ),
  );

  async setPaymentMethodBannerVisibility(organizationId: string, visible: boolean): Promise<void> {
    const billingBannerStates = await this.stateService.getBillingBannerStates();
    const paymentMethodBannerId = this.getPaymentMethodBannerId(organizationId);
    billingBannerStates[paymentMethodBannerId] = visible;
    await this.stateService.setBillingBannerStates(billingBannerStates);
    this._billingBannerStates.next(billingBannerStates);
  }

  private getPaymentMethodBannerId = (organizationId: string) =>
    `${organizationId}_${this.paymentMethodBannerSuffix}`;

  private isPaymentMethodBanner = ([bannerId, _]: [string, boolean]) =>
    bannerId.split("_")[1] === this.paymentMethodBannerSuffix;
}
