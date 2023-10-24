import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { CollectionAccessDetailsResponse } from "@bitwarden/common/src/vault/models/response/collection.response";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";

import { CollectionAccessSelectionView } from "../../../admin-console/organizations/core/views/collection-access-selection.view";

export class CollectionAdminView extends CollectionView {
  groups: CollectionAccessSelectionView[] = [];
  users: CollectionAccessSelectionView[] = [];

  /**
   * Flag indicating the user has been explicitly assigned to this Collection
   */
  assigned: boolean;

  constructor(response?: CollectionAccessDetailsResponse) {
    super(response);

    if (!response) {
      return;
    }

    this.groups = response.groups
      ? response.groups.map((g) => new CollectionAccessSelectionView(g))
      : [];

    this.users = response.users
      ? response.users.map((g) => new CollectionAccessSelectionView(g))
      : [];

    this.assigned = response.assigned;
  }

  override canEdit(org: Organization): boolean {
    return org?.canEditAnyCollection || (org?.canEditAssignedCollections && this.assigned);
  }

  override async canDelete(
    org: Organization,
    configService: ConfigServiceAbstraction
  ): Promise<boolean> {
    if (await configService.getFeatureFlag(FeatureFlag.FlexibleCollections)) {
      return org?.canDeleteAnyCollection;
    } else {
      return org?.canDeleteAnyCollection || (org?.canDeleteAssignedCollections && this.assigned);
    }
  }
}
