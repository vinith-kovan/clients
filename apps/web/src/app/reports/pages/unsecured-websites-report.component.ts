import { Component, OnInit } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";
import { PasswordRepromptService } from "@bitwarden/vault";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-unsecured-websites-report",
  templateUrl: "unsecured-websites-report.component.html",
})
export class UnsecuredWebsitesReportComponent extends CipherReportComponent implements OnInit {
  disabled = true;
  private flexibleCollectionsEnabled: boolean;

  constructor(
    protected cipherService: CipherService,
    protected organizationService: OrganizationService,
    modalService: ModalService,
    passwordRepromptService: PasswordRepromptService,
    protected collectionService?: CollectionService,
    private configService?: ConfigServiceAbstraction
  ) {
    super(modalService, passwordRepromptService, organizationService);
  }

  async ngOnInit() {
    await super.load();
    this.flexibleCollectionsEnabled = await this.configService.getFeatureFlag(
      FeatureFlag.FlexibleCollections
    );
  }

  async setCiphers() {
    const allCiphers = await this.getAllCiphers();
    let canManageCollections: CollectionView[];
    if (this.flexibleCollectionsEnabled && this.collectionService) {
      canManageCollections = (await this.collectionService.getAllDecrypted())?.filter(
        (c) => c.manage
      );
    }
    const unsecuredCiphers = allCiphers.filter((c) => {
      if (c.type !== CipherType.Login || !c.login.hasUris || c.isDeleted) {
        return false;
      }
      return c.login.uris.some((u) => u.uri != null && u.uri.indexOf("http://") === 0);
    });
    this.ciphers = unsecuredCiphers.filter(
      (c) =>
        (!this.organization && c.edit) ||
        (this.organization && !c.edit) ||
        (!this.manageCipher(c, canManageCollections) && !c.edit)
    );
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  private manageCipher(cipher: CipherView, canManageCollections: CollectionView[]): boolean {
    if (this.flexibleCollectionsEnabled && this.collectionService) {
      return cipher.collectionIds.some((collectionId) =>
        canManageCollections.some((canManageCollection) => canManageCollection.id === collectionId)
      );
    }
    return true;
  }
}
