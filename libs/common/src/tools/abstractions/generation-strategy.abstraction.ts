import { PolicyType } from "../../admin-console/enums";
import { Policy } from "../../admin-console/models/domain/policy";
import { KeyDefinition } from "../../platform/state";

import { PolicyEvaluator } from "./policy-evaluator.abstraction";

/** Tailors the generator service to generate a specific kind of credentials */
export abstract class GeneratorStrategy<Options, GeneratorPolicy> {
  /** The key used when storing credentials on disk. */
  disk: KeyDefinition<Options>;

  /** Identifies the policy enforced by the generator. */
  policy: PolicyType;

  /** Converts a policy to a generator policy.
   * @param policy The policy to convert.
   * @remarks this method is separate from `evaluator` because the
   *          policy can be referenced without the evaluator.
   */
  toGeneratorPolicy: (options: Policy) => GeneratorPolicy;

  /** Creates an evaluator from a generator policy.
   * @param policy The policy being evaluated.
   */
  evaluator: (policy: GeneratorPolicy) => PolicyEvaluator<Options>;

  /** Generates credentials from the given options.
   * @param options The options used to generate the credentials.
   * @returns a promise that resolves to the generated credentials.
   */
  generate: (options: Options) => Promise<string>;
}
