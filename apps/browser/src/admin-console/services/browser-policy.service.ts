import { filter, map, Observable, switchMap, tap } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Policy } from "@bitwarden/common/admin-console/models/domain/policy";
import { PolicyService } from "@bitwarden/common/admin-console/services/policy/policy.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { StateProvider } from "@bitwarden/common/platform/state";

export class BrowserPolicyService extends PolicyService {
  constructor(
    stateProvider: StateProvider,
    organizationService: OrganizationService,
    private stateService: StateService,
  ) {
    super(stateProvider, organizationService);

    this.policies$.pipe(this.handleActivateAutofillPolicy.bind(this)).subscribe();
  }

  /**
   * If the ActivateAutofill policy is enabled, save a flag indicating if we need to
   * enable Autofill on page load.
   */
  private handleActivateAutofillPolicy(policies$: Observable<Policy[]>) {
    return policies$.pipe(
      map((policies) => policies.find((p) => p.type == PolicyType.ActivateAutofill && p.enabled)),
      filter((p) => p != null),
      switchMap(async (_) => [
        await this.stateService.getActivateAutoFillOnPageLoadFromPolicy(),
        await this.stateService.getEnableAutoFillOnPageLoad(),
      ]),
      tap(([activated, autofillEnabled]) => {
        if (activated === undefined) {
          this.stateService.setActivateAutoFillOnPageLoadFromPolicy(!autofillEnabled);
        }
      }),
    );
  }
}
