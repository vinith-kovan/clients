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
  selector: "app-reused-passwords-report",
  templateUrl: "reused-passwords-report.component.html",
})
export class ReusedPasswordsReportComponent extends CipherReportComponent implements OnInit {
  passwordUseMap: Map<string, number>;
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
    const ciphersWithPasswords: CipherView[] = [];
    this.passwordUseMap = new Map<string, number>();
    allCiphers.forEach((ciph) => {
      const { type, login, isDeleted, edit, viewPassword } = ciph;
      if (
        type !== CipherType.Login ||
        login.password == null ||
        login.password === "" ||
        isDeleted ||
        (!this.organization && !edit) ||
        !viewPassword ||
        (!this.manageCipher(ciph, canManageCollections) && !edit)
      ) {
        return;
      }
      ciphersWithPasswords.push(ciph);
      if (this.passwordUseMap.has(login.password)) {
        this.passwordUseMap.set(login.password, this.passwordUseMap.get(login.password) + 1);
      } else {
        this.passwordUseMap.set(login.password, 1);
      }
    });
    const reusedPasswordCiphers = ciphersWithPasswords.filter(
      (c) =>
        this.passwordUseMap.has(c.login.password) && this.passwordUseMap.get(c.login.password) > 1
    );
    this.ciphers = reusedPasswordCiphers;
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  protected canManageCipher(c: CipherView): boolean {
    // this will only ever be false from an organization view
    return true;
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
