import { Component, OnInit } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { PasswordRepromptService } from "@bitwarden/vault";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-exposed-passwords-report",
  templateUrl: "exposed-passwords-report.component.html",
})
export class ExposedPasswordsReportComponent extends CipherReportComponent implements OnInit {
  exposedPasswordMap = new Map<string, number>();
  disabled = true;
  private flexibleCollectionsEnabled: boolean;

  constructor(
    protected cipherService: CipherService,
    protected auditService: AuditService,
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
    const canManageCollections = (await this.collectionService.getAllDecrypted())?.filter(
      (c) => c.manage
    );
    const allCiphers = (await this.getAllCiphers()).filter(
      (c) =>
        c.edit ||
        c.collectionIds.some((collectionId) =>
          canManageCollections.some(
            (canManageCollection) => canManageCollection.id === collectionId
          )
        )
    );

    const exposedPasswordCiphers: CipherView[] = [];
    const promises: Promise<void>[] = [];
    allCiphers.forEach((ciph) => {
      const { type, login, isDeleted, edit, viewPassword, id } = ciph;
      if (
        type !== CipherType.Login ||
        login.password == null ||
        login.password === "" ||
        isDeleted ||
        (!this.organization && !edit) ||
        !viewPassword
      ) {
        return;
      }
      const promise = this.auditService.passwordLeaked(login.password).then((exposedCount) => {
        if (exposedCount > 0) {
          exposedPasswordCiphers.push(ciph);
          this.exposedPasswordMap.set(id, exposedCount);
        }
      });
      promises.push(promise);
    });
    await Promise.all(promises);
    this.ciphers = [...exposedPasswordCiphers];
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  protected canManageCipher(c: CipherView): boolean {
    // this will only ever be false from the org view;
    return true;
  }
}
