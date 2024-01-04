import { any, MockProxy } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { UserDecryptionOptionsMigrator } from "./10-move-user-decryption-options-to-state-provider";

function exampleJSON() {
  return {
    global: {
      otherStuff: "otherStuff1",
    },
    authenticatedAccounts: [
      "ddc1b996-3f4d-43ac-b273-aef301345c42",
      "c6bf38fb-82b4-4d7a-a9ba-b06f012822b5",
      "457539b9-7e61-4f68-be6a-b0cb00f3a87e",
    ],
    "ddc1b996-3f4d-43ac-b273-aef301345c42": {
      decryptionOptions: {
        hasMasterPassword: true,
        trustedDeviceOption: {
          hasAdminApproval: false,
          hasLoginApprovingDevice: false,
          hasManageResetPasswordPermission: true,
        },
        keyConnectorOption: {
          keyConnectorUrl: "https://keyconnector.bitwarden.com",
        },
      },
      profile: {
        otherStuff: "overStuff2",
      },
      otherStuff: "otherStuff3",
    },
    "c6bf38fb-82b4-4d7a-a9ba-b06f012822b5": {
      decryptionOptions: {
        hasMasterPassword: false,
        trustedDeviceOption: {
          hasAdminApproval: true,
          hasLoginApprovingDevice: true,
          hasManageResetPasswordPermission: true,
        },
        keyConnectorOption: {
          keyConnectorUrl: "https://selfhosted.bitwarden.com",
        },
      },
      profile: {
        otherStuff: "otherStuff4",
      },
      otherStuff: "otherStuff5",
    },
  };
}

function rollbackJSON() {
  return {
    "user_ddc1b996-3f4d-43ac-b273-aef301345c42_decryptionOptions_userDecryptionOptions": {
      hasMasterPassword: true,
      trustedDeviceOption: {
        hasAdminApproval: false,
        hasLoginApprovingDevice: false,
        hasManageResetPasswordPermission: true,
      },
      keyConnectorOption: {
        keyConnectorUrl: "https://keyconnector.bitwarden.com",
      },
    },
    "user_c6bf38fb-82b4-4d7a-a9ba-b06f012822b5_decryptionOptions_userDecryptionOptions": {
      hasMasterPassword: false,
      trustedDeviceOption: {
        hasAdminApproval: true,
        hasLoginApprovingDevice: true,
        hasManageResetPasswordPermission: true,
      },
      keyConnectorOption: {
        keyConnectorUrl: "https://selfhosted.bitwarden.com",
      },
    },
    "user_457539b9-7e61-4f68-be6a-b0cb00f3a87e_decryptionOptions_userDecryptionOptions": {},
    global: {
      otherStuff: "otherStuff1",
    },
    authenticatedAccounts: [
      "ddc1b996-3f4d-43ac-b273-aef301345c42",
      "c6bf38fb-82b4-4d7a-a9ba-b06f012822b5",
      "457539b9-7e61-4f68-be6a-b0cb00f3a87e",
    ],
    "ddc1b996-3f4d-43ac-b273-aef301345c42": {
      decryptionOptions: {
        hasMasterPassword: true,
        trustedDeviceOption: {
          hasAdminApproval: false,
          hasLoginApprovingDevice: false,
          hasManageResetPasswordPermission: true,
        },
        keyConnectorOption: {
          keyConnectorUrl: "https://keyconnector.bitwarden.com",
        },
      },
      profile: {
        otherStuff: "overStuff2",
      },
      otherStuff: "otherStuff3",
    },
    "c6bf38fb-82b4-4d7a-a9ba-b06f012822b5": {
      decryptionOptions: {
        hasMasterPassword: false,
        trustedDeviceOption: {
          hasAdminApproval: true,
          hasLoginApprovingDevice: true,
          hasManageResetPasswordPermission: true,
        },
        keyConnectorOption: {
          keyConnectorUrl: "https://selfhosted.bitwarden.com",
        },
      },
      profile: {
        otherStuff: "otherStuff4",
      },
      otherStuff: "otherStuff5",
    },
  };
}

describe("UserDecryptionOptionsMigrator", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: UserDecryptionOptionsMigrator;
  const keyDefinitionLike = {
    key: "decryptionOptions",
    stateDefinition: {
      name: "userDecryptionOptions",
    },
  };

  describe("migrate", () => {
    beforeEach(() => {
      // TODO Are these numbers right?
      helper = mockMigrationHelper(exampleJSON(), 9);
      sut = new UserDecryptionOptionsMigrator(9, 10);
    });

    it("should remove decryptionOptions from all accounts", async () => {
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith("ddc1b996-3f4d-43ac-b273-aef301345c42", {
        profile: {
          otherStuff: "overStuff2",
        },
        otherStuff: "otherStuff3",
      });
      expect(helper.set).toHaveBeenCalledWith("c6bf38fb-82b4-4d7a-a9ba-b06f012822b5", {
        profile: {
          otherStuff: "otherStuff4",
        },
        otherStuff: "otherStuff5",
      });
    });

    it("should set decryptionOptions provider value for each account", async () => {
      await sut.migrate(helper);

      expect(helper.setToUser).toHaveBeenCalledWith(
        "ddc1b996-3f4d-43ac-b273-aef301345c42",
        keyDefinitionLike,
        {
          hasMasterPassword: true,
          trustedDeviceOption: {
            hasAdminApproval: false,
            hasLoginApprovingDevice: false,
            hasManageResetPasswordPermission: true,
          },
          keyConnectorOption: {
            keyConnectorUrl: "https://keyconnector.bitwarden.com",
          },
        },
      );

      expect(helper.setToUser).toHaveBeenCalledWith(
        "c6bf38fb-82b4-4d7a-a9ba-b06f012822b5",
        keyDefinitionLike,
        {
          hasMasterPassword: false,
          trustedDeviceOption: {
            hasAdminApproval: true,
            hasLoginApprovingDevice: true,
            hasManageResetPasswordPermission: true,
          },
          keyConnectorOption: {
            keyConnectorUrl: "https://selfhosted.bitwarden.com",
          },
        },
      );

      expect(helper.setToUser).toHaveBeenCalledWith(
        "457539b9-7e61-4f68-be6a-b0cb00f3a87e",
        keyDefinitionLike,
        {},
      );
    });
  });

  describe("rollback", () => {
    beforeEach(() => {
      // TODO Are these numbers right?
      helper = mockMigrationHelper(rollbackJSON(), 9);
      sut = new UserDecryptionOptionsMigrator(9, 10);
    });

    it.each([
      "ddc1b996-3f4d-43ac-b273-aef301345c42",
      "c6bf38fb-82b4-4d7a-a9ba-b06f012822b5",
      "457539b9-7e61-4f68-be6a-b0cb00f3a87e",
    ])("should null out new values", async (userId) => {
      await sut.rollback(helper);

      expect(helper.setToUser).toHaveBeenCalledWith(userId, keyDefinitionLike, null);
    });

    it("should add explicit value back to accounts", async () => {
      await sut.rollback(helper);

      expect(helper.set).toHaveBeenCalledWith("ddc1b996-3f4d-43ac-b273-aef301345c42", {
        decryptionOptions: {
          hasMasterPassword: true,
          trustedDeviceOption: {
            hasAdminApproval: false,
            hasLoginApprovingDevice: false,
            hasManageResetPasswordPermission: true,
          },
          keyConnectorOption: {
            keyConnectorUrl: "https://keyconnector.bitwarden.com",
          },
        },
        profile: {
          otherStuff: "overStuff2",
        },
        otherStuff: "otherStuff3",
      });
      expect(helper.set).toHaveBeenCalledWith("c6bf38fb-82b4-4d7a-a9ba-b06f012822b5", {
        decryptionOptions: {
          hasMasterPassword: false,
          trustedDeviceOption: {
            hasAdminApproval: true,
            hasLoginApprovingDevice: true,
            hasManageResetPasswordPermission: true,
          },
          keyConnectorOption: {
            keyConnectorUrl: "https://selfhosted.bitwarden.com",
          },
        },
        profile: {
          otherStuff: "otherStuff4",
        },
        otherStuff: "otherStuff5",
      });
    });

    it("should not try to restore values to missing accounts", async () => {
      await sut.rollback(helper);

      expect(helper.set).not.toHaveBeenCalledWith("457539b9-7e61-4f68-be6a-b0cb00f3a87e", any());
    });
  });
});
