import { Observable } from "rxjs";

/** Generates credentials used for user authentication */
export abstract class GeneratorService<GeneratorOptions, PolicyOptions> {
  /** An observable monitoring the options saved to disk.
   *  The observable updates when the options are saved.
   */
  options$: Observable<GeneratorOptions>;

  /** An observable monitoring the options used to enforce policy.
   *  The observable updates when the policy changes.
   */
  policy$: Observable<PolicyOptions>;

  /** An observable whose value is true when a policy is being
   *  enforced and false otherwise. The observable updates when
   *  the policy changes.
   */
  policyInEffect$: Observable<boolean>;

  /** Enforces the policy on the given options
   * @param options the options to enforce the policy on
   * @returns a new instance of the options with the policy enforced
   */
  enforcePolicy: (options: GeneratorOptions) => Promise<GeneratorOptions>;

  /** Generates credentials
   * @param options the options to generate credentials with
   * @returns a promise that resolves with the generated credentials
   */
  generate: (options: GeneratorOptions) => Promise<string>;

  /** Saves the given options to disk.
   * @param options the options to save
   * @returns a promise that resolves when the options are saved
   */
  saveOptions: (options: GeneratorOptions) => Promise<void>;
}
