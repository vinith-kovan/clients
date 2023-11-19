import {
  BehaviorSubject,
  concatMap,
  filter,
  firstValueFrom,
  from,
  map,
  Observable,
  of,
} from "rxjs";

import { ListResponse } from "../../../models/response/list.response";
import { StateService } from "../../../platform/abstractions/state.service";
import { Utils } from "../../../platform/misc/utils";
import { OrganizationService } from "../../abstractions/organization/organization.service.abstraction";
import { InternalPolicyService as InternalPolicyServiceAbstraction } from "../../abstractions/policy/policy.service.abstraction";
import { OrganizationUserStatusType, PolicyType } from "../../enums";
import { PolicyData } from "../../models/data/policy.data";
import { MasterPasswordPolicyOptions } from "../../models/domain/master-password-policy-options";
import { Policy } from "../../models/domain/policy";
import { ResetPasswordPolicyOptions } from "../../models/domain/reset-password-policy-options";
import { PolicyResponse } from "../../models/response/policy.response";

const policyMapToArray = (policiesMap: { [id: string]: PolicyData }) =>
  Object.values(policiesMap || {}).map((f) => new Policy(f));

// This is used to represent and skip the BehaviorSubject default value.
// It doesn't mean anything and interferes with firstValueFrom. We can remove this when we stop using BehaviorSubjects.
const LOADING = "LOADING";

export class PolicyVNextService implements InternalPolicyServiceAbstraction {
  protected _policies: BehaviorSubject<Policy[] | typeof LOADING> = new BehaviorSubject(LOADING);

  /**
   * All policies that apply to the active user
   * TODO: make this protected, callers should use get$ because they always want to specify a type
   */
  policies$ = this._policies.pipe(
    filter((val) => val != LOADING),
    map((policies: Policy[]) => policies.filter((p) => this.enforcedPolicyFilter(p)))
  );

  constructor(
    protected stateService: StateService,
    private organizationService: OrganizationService
  ) {
    this.stateService.activeAccountUnlocked$
      .pipe(
        filter(() => Utils.global.bitwardenContainerService != null),
        concatMap(async (unlocked) =>
          unlocked ? await this.stateService.getEncryptedPolicies() : {}
        ),
        map((policyMap) => policyMapToArray(policyMap))
      )
      .subscribe((policies) => this._policies.next(policies));
  }

  /**
   * Returns the first policy found that applies to the active user
   * @param policyType Policy type to search for
   */
  get$(policyType: PolicyType, policyFilter?: (policy: Policy) => boolean) {
    return this.get_vNext$(policyType).pipe(
      map((policies) => policies?.filter((p) => policyFilter == null || policyFilter(p))),
      map((policies) => policies?.at(0))
    );
  }

  async getAll(type: PolicyType, userId?: string): Promise<Policy[]> {
    let result: Policy[] = [];
    const decryptedPolicies = await this.stateService.getDecryptedPolicies({ userId: userId });
    if (decryptedPolicies != null) {
      result = decryptedPolicies;
    } else {
      const diskPolicies = await this.stateService.getEncryptedPolicies({ userId: userId });
      result = policyMapToArray(diskPolicies);
      await this.stateService.setDecryptedPolicies(result, { userId: userId });
    }

    return result.filter((policy) => policy.type === type);
  }

  policyAppliesToActiveUser$(policyType: PolicyType, policyFilter?: (policy: Policy) => boolean) {
    return this.get_vNext$(policyType).pipe(
      map((policies) => policies.filter((p) => policyFilter == null || policyFilter(p))),
      map((policies) => policies?.length > 0)
    );
  }

  async policyAppliesToUser(
    policyType: PolicyType,
    policyFilter?: (policy: Policy) => boolean,
    userId?: string
  ) {
    return firstValueFrom(
      this.get_vNext$(policyType, userId).pipe(
        map((policies) => policies.filter((p) => policyFilter == null || policyFilter(p))),
        map((policies) => policies?.length > 0)
      )
    );
  }

  /**
   * TODO: this will replace get$ and getAll when PolicyServiceRefactor feature flag is removed.
   * The policyFilter callback parameters will also be removed in favor of callers using this method
   * to get all policies and then filtering them themselves.
   * @param policyType
   * @param userId
   * @returns
   */
  private get_vNext$(policyType: PolicyType, userId?: string): Observable<Policy[]> {
    if (userId == null) {
      return this.policies$.pipe(map((policies) => policies.filter((p) => p.type == policyType)));
    }

    return from(this.getAll(policyType, userId));
  }

  masterPasswordPolicyOptions$(policies?: Policy[]): Observable<MasterPasswordPolicyOptions> {
    const observable = policies ? of(policies) : this.policies$;
    return observable.pipe(
      map((obsPolicies) => {
        let enforcedOptions: MasterPasswordPolicyOptions = null;
        const filteredPolicies = obsPolicies.filter((p) => p.type === PolicyType.MasterPassword);

        if (filteredPolicies == null || filteredPolicies.length === 0) {
          return enforcedOptions;
        }

        filteredPolicies.forEach((currentPolicy) => {
          if (!currentPolicy.enabled || currentPolicy.data == null) {
            return;
          }

          if (enforcedOptions == null) {
            enforcedOptions = new MasterPasswordPolicyOptions();
          }

          if (
            currentPolicy.data.minComplexity != null &&
            currentPolicy.data.minComplexity > enforcedOptions.minComplexity
          ) {
            enforcedOptions.minComplexity = currentPolicy.data.minComplexity;
          }

          if (
            currentPolicy.data.minLength != null &&
            currentPolicy.data.minLength > enforcedOptions.minLength
          ) {
            enforcedOptions.minLength = currentPolicy.data.minLength;
          }

          if (currentPolicy.data.requireUpper) {
            enforcedOptions.requireUpper = true;
          }

          if (currentPolicy.data.requireLower) {
            enforcedOptions.requireLower = true;
          }

          if (currentPolicy.data.requireNumbers) {
            enforcedOptions.requireNumbers = true;
          }

          if (currentPolicy.data.requireSpecial) {
            enforcedOptions.requireSpecial = true;
          }

          if (currentPolicy.data.enforceOnLogin) {
            enforcedOptions.enforceOnLogin = true;
          }
        });

        return enforcedOptions;
      })
    );
  }

  evaluateMasterPassword(
    passwordStrength: number,
    newPassword: string,
    enforcedPolicyOptions: MasterPasswordPolicyOptions
  ): boolean {
    if (enforcedPolicyOptions == null) {
      return true;
    }

    if (
      enforcedPolicyOptions.minComplexity > 0 &&
      enforcedPolicyOptions.minComplexity > passwordStrength
    ) {
      return false;
    }

    if (
      enforcedPolicyOptions.minLength > 0 &&
      enforcedPolicyOptions.minLength > newPassword.length
    ) {
      return false;
    }

    if (enforcedPolicyOptions.requireUpper && newPassword.toLocaleLowerCase() === newPassword) {
      return false;
    }

    if (enforcedPolicyOptions.requireLower && newPassword.toLocaleUpperCase() === newPassword) {
      return false;
    }

    if (enforcedPolicyOptions.requireNumbers && !/[0-9]/.test(newPassword)) {
      return false;
    }

    // eslint-disable-next-line
    if (enforcedPolicyOptions.requireSpecial && !/[!@#$%\^&*]/g.test(newPassword)) {
      return false;
    }

    return true;
  }

  getResetPasswordPolicyOptions(
    policies: Policy[],
    orgId: string
  ): [ResetPasswordPolicyOptions, boolean] {
    const resetPasswordPolicyOptions = new ResetPasswordPolicyOptions();

    if (policies == null || orgId == null) {
      return [resetPasswordPolicyOptions, false];
    }

    const policy = policies.find(
      (p) => p.organizationId === orgId && p.type === PolicyType.ResetPassword && p.enabled
    );
    resetPasswordPolicyOptions.autoEnrollEnabled = policy?.data?.autoEnrollEnabled ?? false;

    return [resetPasswordPolicyOptions, policy?.enabled ?? false];
  }

  mapPolicyFromResponse(policyResponse: PolicyResponse): Policy {
    const policyData = new PolicyData(policyResponse);
    return new Policy(policyData);
  }

  mapPoliciesFromToken(policiesResponse: ListResponse<PolicyResponse>): Policy[] {
    if (policiesResponse?.data == null) {
      return null;
    }

    return policiesResponse.data.map((response) => this.mapPolicyFromResponse(response));
  }

  async upsert(policy: PolicyData): Promise<any> {
    let policies = await this.stateService.getEncryptedPolicies();
    if (policies == null) {
      policies = {};
    }

    policies[policy.id] = policy;

    this._policies.next(policyMapToArray(policies));
    await this.stateService.setDecryptedPolicies(null);
    await this.stateService.setEncryptedPolicies(policies);
  }

  async replace(policies: { [id: string]: PolicyData }): Promise<void> {
    this._policies.next(policyMapToArray(policies));
    await this.stateService.setDecryptedPolicies(null);
    await this.stateService.setEncryptedPolicies(policies);
  }

  async clear(userId?: string): Promise<void> {
    if (userId == null || userId == (await this.stateService.getUserId())) {
      this._policies.next([]);
    }
    await this.stateService.setDecryptedPolicies(null, { userId: userId });
    await this.stateService.setEncryptedPolicies(null, { userId: userId });
  }

  private enforcedPolicyFilter(policy: Policy) {
    const org = this.organizationService.get(policy.organizationId);

    return (
      org.status >= OrganizationUserStatusType.Accepted &&
      org.usePolicies &&
      !this.isExemptFromPolicy(policy)
    );
  }

  /**
   * Determines whether an orgUser is exempt from a specific policy because of their role
   * Generally orgUsers who can manage policies are exempt from them, but some policies are stricter
   * @returns
   */
  private isExemptFromPolicy(policy: Policy) {
    const org = this.organizationService.get(policy.organizationId);

    switch (policy.type) {
      case PolicyType.MaximumVaultTimeout:
        // Max Vault Timeout applies to everyone except owners
        return org.isOwner;
      default:
        return org.canManagePolicies;
    }
  }
}
