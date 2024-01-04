import { firstValueFrom, map } from "rxjs";

import { PolicyService } from "../../admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "../../admin-console/enums";
import { ActiveUserStateProvider } from "../../platform/state";
import { GeneratorStrategy } from "../abstractions/generation-strategy.abstraction";
import { GeneratorService as GeneratorServiceAbstraction } from "../abstractions/generator.service.abstraction";

/** {@link GeneratorServiceAbstraction} */
export class GeneratorService<GeneratorOptions, PolicyOptions>
  implements GeneratorServiceAbstraction<GeneratorOptions, PolicyOptions>
{
  /** Instantiates the generator service
   * @param strategy tailors the service to a specific generator type
   *            (e.g. password, passphrase)
   * @param policy provides the policy to enforce
   * @param state saves and loads password generation options to the location
   *             specified by the strategy
   */
  constructor(
    private strategy: GeneratorStrategy<GeneratorOptions, PolicyOptions>,
    private policy: PolicyService,
    private state: ActiveUserStateProvider,
  ) {}

  /** {@link GeneratorServiceAbstraction.options$} */
  get options$() {
    return this.state.get(this.strategy.disk).state$;
  }

  /** {@link GeneratorServiceAbstraction.saveOptions} */
  async saveOptions(options: GeneratorOptions): Promise<void> {
    await this.state.get(this.strategy.disk).update(() => options);
  }

  /** {@link GeneratorServiceAbstraction.policy$} */
  get policy$() {
    return this.policy
      .get$(PolicyType.PasswordGenerator)
      .pipe(map((policy) => this.strategy.toGeneratorPolicy(policy)));
  }

  /** {@link GeneratorServiceAbstraction.policyInEffect} */
  get policyInEffect$() {
    return this.policy$.pipe(
      map((policy) => this.strategy.evaluator(policy)),
      map((evaluator) => evaluator.policyInEffect),
    );
  }

  /** {@link GeneratorServiceAbstraction.enforcePolicy} */
  async enforcePolicy(options: GeneratorOptions): Promise<GeneratorOptions> {
    const policy = await firstValueFrom(this.policy$);
    const evaluator = this.strategy.evaluator(policy);
    const evaluated = evaluator.applyPolicy(options);
    const sanitized = evaluator.sanitize(evaluated);
    return sanitized;
  }

  /** {@link GeneratorServiceAbstraction.generate} */
  async generate(options: GeneratorOptions): Promise<string> {
    return await this.strategy.generate(options);
  }
}
