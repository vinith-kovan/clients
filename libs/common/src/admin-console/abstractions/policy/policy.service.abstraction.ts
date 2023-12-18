import { Observable } from "rxjs";

import { ListResponse } from "../../../models/response/list.response";
import { UserId } from "../../../types/guid";
import { PolicyType } from "../../enums";
import { PolicyData } from "../../models/data/policy.data";
import { MasterPasswordPolicyOptions } from "../../models/domain/master-password-policy-options";
import { Policy } from "../../models/domain/policy";
import { ResetPasswordPolicyOptions } from "../../models/domain/reset-password-policy-options";
import { PolicyResponse } from "../../models/response/policy.response";

export abstract class PolicyService {
  /**
   * All {@link Policy} objects for the active user (from sync data).
   * May include policies that are disabled or otherwise do not apply to the user. You probably don't want this!
   * @see {@link get$} or {@link applies$} if you want to know when a policy applies to a user.
   */
  policies$: Observable<Policy[]>;

  /**
   * @returns all policies of a given type that apply to the active user.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * @param policyType the {@link PolicyType} to search for
   */
  get$: (policyType: PolicyType) => Observable<Policy[]>;

  /**
   * @returns all policies of a given type that apply to the specified user.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * If you just want the active user, use {@link get$} instead.
   * @param policyType the {@link PolicyType} to search for
   */
  getForUser$: (userId: UserId, policyType: PolicyType) => Observable<Policy[]>;

  /**
   * @returns true if the PolicyType applies to the active user, otherwise false.
   * A policy "applies" if it is enabled and the user is not exempt (e.g. because they are an Owner).
   * This does not take into account the policy's configuration - if that is important, use {@link get$} to get the
   * {@link Policy} object instad and then look at Policy.data.
   */
  applies$: (policyType: PolicyType) => Observable<boolean>;

  // Policy specific interfaces

  /**
   * Combines all Master Password policies that apply to the user.
   * @returns a set of options which represent the minimum Master Password settings that the user must
   * comply with in order to comply with **all** Master Password policies.
   */
  masterPasswordPolicyOptions$: (policies?: Policy[]) => Observable<MasterPasswordPolicyOptions>;

  /**
   * Evaluates whether a proposed Master Password complies with all Master Password policies that apply to the user.
   */
  evaluateMasterPassword: (
    passwordStrength: number,
    newPassword: string,
    enforcedPolicyOptions?: MasterPasswordPolicyOptions,
  ) => boolean;

  /**
   * @returns Reset Password policy options for the specified organization and a boolean indicating whether the policy
   * is enabled
   */
  getResetPasswordPolicyOptions: (
    policies: Policy[],
    orgId: string,
  ) => [ResetPasswordPolicyOptions, boolean];

  // Helpers

  /**
   * Instantiates {@link Policy} objects from {@link PolicyResponse} objects.
   */
  mapPolicyFromResponse: (policyResponse: PolicyResponse) => Policy;

  /**
   * Instantiates {@link Policy} objects from {@link ListResponse<PolicyResponse>} objects.
   */
  mapPoliciesFromToken: (policiesResponse: ListResponse<PolicyResponse>) => Policy[];
}

export abstract class InternalPolicyService extends PolicyService {
  upsert: (policy: PolicyData) => Promise<any>;
  replace: (policies: { [id: string]: PolicyData }) => Promise<void>;
  clear: (userId?: string) => Promise<any>;
}
