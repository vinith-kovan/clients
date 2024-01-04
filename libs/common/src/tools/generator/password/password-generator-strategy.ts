import { GeneratorStrategy } from "..";
import { PolicyType } from "../../../admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "../../../admin-console/models/domain/policy";
import { PASSWORD_SETTINGS } from "../key-definitions";

import { PasswordGenerationOptions } from "./password-generation-options";
import { PasswordGenerationServiceAbstraction } from "./password-generation.service.abstraction";
import { PasswordGeneratorOptionsEvaluator } from "./password-generator-options-evaluator";
import { PasswordGeneratorPolicy } from "./password-generator-policy";

/** {@link GeneratorStrategy} */
export class PasswordGeneratorStrategy
  implements GeneratorStrategy<PasswordGenerationOptions, PasswordGeneratorPolicy>
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

  /** {@link GeneratorStrategy.evaluator} */
  evaluator(policy: Policy): PasswordGeneratorOptionsEvaluator {
    return new PasswordGeneratorOptionsEvaluator({
      minLength: policy.data.minLength,
      useUppercase: policy.data.useUpper,
      useLowercase: policy.data.useLower,
      useNumbers: policy.data.useNumbers,
      numberCount: policy.data.minNumbers,
      useSpecial: policy.data.useSpecial,
      specialCount: policy.data.minSpecial,
    });
  }

  /** {@link GeneratorStrategy.generate} */
  generate(options: PasswordGenerationOptions): Promise<string> {
    return this.legacy.generatePassword({ ...options, type: "password" });
  }
}
