import { KeyDefinitionLike, MigrationHelper, StateDefinitionLike } from "../migration-helper";
import { IRREVERSIBLE, Migrator } from "../migrator";

// Policies are stored in a Record<string, PolicyData> where the string is the PolicyId
type ExpectedAccountType = { data?: { policies?: { encrypted?: Record<string, unknown> } } };

const stateDefinition: StateDefinitionLike = {
  name: "policies_disk",
};

export const policiesMigrationKeyDefinition: KeyDefinitionLike = {
  stateDefinition: stateDefinition,
  key: "policies",
};

export class MovePoliciesToStateProviderMigration extends Migrator<9, 10> {
  async migrate(helper: MigrationHelper) {
    const accounts = await helper.getAccounts();

    const updateAccount = async (userId: string, account: ExpectedAccountType) => {
      const policies = account?.data?.policies?.encrypted;

      if (policies == null) {
        return;
      }

      // Save policies in new StateProvider framework
      await helper.setToUser(userId, policiesMigrationKeyDefinition, policies);

      // Remove policies from old account object
      delete account.data.policies;
      await helper.set(userId, account);
    };

    await Promise.all([...accounts.map(({ userId, account }) => updateAccount(userId, account))]);
  }

  async rollback(helper: MigrationHelper) {
    throw IRREVERSIBLE;
  }
}
