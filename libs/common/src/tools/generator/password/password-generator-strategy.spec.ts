/**
 * include structuredClone in test environment.
 * @jest-environment ../../../../shared/test.environment.ts
 */

import { mock } from "jest-mock-extended";

import { PasswordGeneratorPolicyOptions } from "../../../admin-console/models/domain/password-generator-policy-options";
import { Policy } from "../../../admin-console/models/domain/policy";

import { PasswordGenerationServiceAbstraction } from "./password-generation.service.abstraction";
import { PasswordGeneratorOptionsEvaluator } from "./password-generator-options-evaluator";
import { PasswordGeneratorStrategy } from "./password-generator-strategy";

describe("Password generation strategy", () => {
  describe("toGeneratorPolicy()", () => {
    it("should map the policy to PasswordGeneratorPolicyOptions", async () => {
      const policyInput = mock<Policy>({
        data: {
          minLength: 1,
          useUpper: true,
          useLower: true,
          useNumbers: true,
          minNumbers: 1,
          useSpecial: true,
          minSpecial: 1,
        },
      });
      const strategy = new PasswordGeneratorStrategy(null);

      const policy = strategy.toGeneratorPolicy(policyInput);

      expect(policy).toMatchObject({
        minLength: 1,
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        numberCount: 1,
        useSpecial: true,
        specialCount: 1,
      });
    });
  });

  describe("evaluator()", () => {
    it("should load the policy from policy$", async () => {
      const strategy = new PasswordGeneratorStrategy(null);

      const evaluator = strategy.evaluator(new PasswordGeneratorPolicyOptions());

      expect(evaluator).toBeInstanceOf(PasswordGeneratorOptionsEvaluator);
    });
  });

  describe("generate()", () => {
    it("should call the legacy service with the given options", async () => {
      const legacy = mock<PasswordGenerationServiceAbstraction>();
      const strategy = new PasswordGeneratorStrategy(legacy);
      const options = {
        type: "password",
        minLength: 1,
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        numberCount: 1,
        useSpecial: true,
        specialCount: 1,
      };

      await strategy.generate(options);

      expect(legacy.generatePassword).toHaveBeenCalledWith(options);
    });

    it("should set the generation type to password", async () => {
      const legacy = mock<PasswordGenerationServiceAbstraction>();
      const strategy = new PasswordGeneratorStrategy(legacy);

      await strategy.generate({ type: "foo" } as any);

      expect(legacy.generatePassword).toHaveBeenCalledWith({ type: "password" });
    });
  });
});
