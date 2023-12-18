import { MockProxy, mock } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";

import {
  MovePoliciesToStateProviderMigration,
  policiesMigrationKeyDefinition,
} from "./10-move-policies-to-state-provider";

function exampleAccounts() {
  return [
    {
      userId: "userId1",
      account: {
        data: {
          policies: {
            encrypted: {
              policyId1: "policyData1",
              policyId2: "policyData2",
              policyId3: "policyData3",
              policyId4: "policyData4",
            },
          },
          otherDataKeys1: "otherData1",
        },
        otherAccountKeys1: "otherAccount1",
      },
    },
    {
      userId: "userId2",
      account: {
        data: {
          policies: {
            encrypted: {
              policyId10: "policyData10",
              policyId20: "policyData20",
              policyId30: "policyData30",
              policyId40: "policyData40",
            },
          },
          otherDataKeys10: "otherData10",
        },
        otherAccountKeys10: "otherAccount10",
      },
    },
    {
      userId: "userId3",
      account: {
        data: {
          otherDataKeys1: "otherData1",
        },
        otherAccountKeys1: "otherAccount1",
      },
    },
  ];
}

describe("MovePoliciesToStateProvider", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: MovePoliciesToStateProviderMigration;

  beforeEach(() => {
    helper = mock();
    helper.getAccounts.mockResolvedValue(exampleAccounts());
    sut = new MovePoliciesToStateProviderMigration(9, 10);
  });

  it("saves policy data under the new key", async () => {
    await sut.migrate(helper);

    expect(helper.setToUser).toHaveBeenCalledWith("userId1", policiesMigrationKeyDefinition, {
      policyId1: "policyData1",
      policyId2: "policyData2",
      policyId3: "policyData3",
      policyId4: "policyData4",
    });

    expect(helper.setToUser).toHaveBeenCalledWith("userId2", policiesMigrationKeyDefinition, {
      policyId10: "policyData10",
      policyId20: "policyData20",
      policyId30: "policyData30",
      policyId40: "policyData40",
    });
  });

  it("deletes policy data from the old account object", async () => {
    await sut.migrate(helper);

    expect(helper.set).toHaveBeenCalledWith("userId1", {
      data: {
        otherDataKeys1: "otherData1",
      },
      otherAccountKeys1: "otherAccount1",
    });

    expect(helper.set).toHaveBeenCalledWith("userId2", {
      data: {
        otherDataKeys10: "otherData10",
      },
      otherAccountKeys10: "otherAccount10",
    });
  });

  it("does not migrate null policy data", async () => {
    await sut.migrate(helper);

    expect(helper.setToUser).not.toHaveBeenCalledWith(
      "userId3",
      expect.anything(),
      expect.anything(),
    );
    expect(helper.set).not.toHaveBeenCalledWith("userId3", expect.anything(), expect.anything());
  });
});
