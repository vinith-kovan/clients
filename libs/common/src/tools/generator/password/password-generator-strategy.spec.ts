/**
 * include structuredClone in test environment.
 * @jest-environment ../../../../shared/test.environment.ts
 */

import { mock } from "jest-mock-extended";

// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "../../../admin-console/models/domain/policy";

import {
  PasswordGenerationServiceAbstraction,
  PasswordGeneratorOptionsEvaluator,
  PasswordGeneratorStrategy,
} from ".";

describe("Password generation strategy", () => {
  describe("evaluator()", () => {
    it("should load the policy evaluator from policy$", async () => {
      const strategy = new PasswordGeneratorStrategy(null);
      const policy = mock<Policy>({
        data: {
          minLength: 10,
          useUpper: true,
          useLower: true,
          useNumbers: true,
          minNumbers: 1,
          useSpecial: true,
          minSpecial: 1,
        },
      });

      const evaluator = strategy.evaluator(policy);

      expect(evaluator).toBeInstanceOf(PasswordGeneratorOptionsEvaluator);
      expect(evaluator.policy).toMatchObject({
        minLength: 10,
        useUppercase: true,
        useLowercase: true,
        useNumbers: true,
        numberCount: 1,
        useSpecial: true,
        specialCount: 1,
      });
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
