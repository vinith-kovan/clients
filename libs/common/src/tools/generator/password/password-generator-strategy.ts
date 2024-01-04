import { PolicyType } from "../../../admin-console/enums";
import { PasswordGeneratorPolicyOptions } from "../../../admin-console/models/domain/password-generator-policy-options";
import { Policy } from "../../../admin-console/models/domain/policy";
import { GeneratorStrategy } from "../../abstractions/generation-strategy.abstraction";
import { PASSWORD_SETTINGS } from "../key-definitions";

import { PasswordGenerationOptions } from "./password-generation-options";
import { PasswordGenerationServiceAbstraction } from "./password-generation.service.abstraction";
import { PasswordGeneratorOptionsEvaluator } from "./password-generator-options-evaluator";

/** {@link GeneratorStrategy} */
export class PasswordGeneratorStrategy
  implements GeneratorStrategy<PasswordGenerationOptions, PasswordGeneratorPolicyOptions>
{
  constructor(private legacy: PasswordGenerationServiceAbstraction) {}

  /** {@link GeneratorStrategy.disk} */
  get disk() {
    return PASSWORD_SETTINGS;
  }

  /** {@link GeneratorStrategy.policy} */
  get policy() {
    return PolicyType.PasswordGenerator;
  }

  /** {@link GeneratorStrategy.toGeneratorPolicy} */
  toGeneratorPolicy(policy: Policy): PasswordGeneratorPolicyOptions {
    const policyOptions = new PasswordGeneratorPolicyOptions();
    policyOptions.minLength = policy.data.minLength;
    policyOptions.useUppercase = policy.data.useUpper;
    policyOptions.useLowercase = policy.data.useLower;
    policyOptions.useNumbers = policy.data.useNumbers;
    policyOptions.numberCount = policy.data.minNumbers;
    policyOptions.useSpecial = policy.data.useSpecial;
    policyOptions.specialCount = policy.data.minSpecial;
    return policyOptions;
  }

  /** {@link GeneratorStrategy.evaluator} */
  evaluator(policy: PasswordGeneratorPolicyOptions): PasswordGeneratorOptionsEvaluator {
    return new PasswordGeneratorOptionsEvaluator(policy);
  }

  /** {@link GeneratorStrategy.generate} */
  generate(options: PasswordGenerationOptions): Promise<string> {
    return this.legacy.generatePassword({ ...options, type: "password" });
  }
}
