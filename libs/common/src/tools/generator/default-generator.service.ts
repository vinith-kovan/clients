import { firstValueFrom, map } from "rxjs";

// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { PolicyService } from "../../admin-console/abstractions/policy/policy.service.abstraction";
import { ActiveUserStateProvider } from "../../platform/state";

import { GeneratorStrategy, GeneratorService } from "./abstractions";

/** {@link GeneratorServiceAbstraction} */
export class DefaultGeneratorService<Options, Policy> implements GeneratorService<Options, Policy> {
  /** Instantiates the generator service
   * @param strategy tailors the service to a specific generator type
   *            (e.g. password, passphrase)
   * @param policy provides the policy to enforce
   * @param state saves and loads password generation options to the location
   *             specified by the strategy
   */
  constructor(
    private strategy: GeneratorStrategy<Options, Policy>,
    private policy: PolicyService,
    private state: ActiveUserStateProvider,
  ) {}

  /** {@link GeneratorService.options$} */
  get options$() {
    return this.state.get(this.strategy.disk).state$;
  }

  /** {@link GeneratorService.saveOptions} */
  async saveOptions(options: Options): Promise<void> {
    await this.state.get(this.strategy.disk).update(() => options);
  }

  /** {@link GeneratorService.policy$} */
  get policy$() {
    return this.policy
      .get$(this.strategy.policy)
      .pipe(map((policy) => this.strategy.evaluator(policy)));
  }

  /** {@link GeneratorService.enforcePolicy} */
  async enforcePolicy(options: Options): Promise<Options> {
    const policy = await firstValueFrom(this.policy$);
    const evaluated = policy.applyPolicy(options);
    const sanitized = policy.sanitize(evaluated);
    return sanitized;
  }

  /** {@link GeneratorService.generate} */
  async generate(options: Options): Promise<string> {
    return await this.strategy.generate(options);
  }
}
