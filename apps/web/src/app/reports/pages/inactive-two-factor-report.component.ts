import { Component, OnInit } from "@angular/core";

import { ModalService } from "@bitwarden/angular/services/modal.service";
import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";
import { PasswordRepromptService } from "@bitwarden/vault";

import { CipherReportComponent } from "./cipher-report.component";

@Component({
  selector: "app-inactive-two-factor-report",
  templateUrl: "inactive-two-factor-report.component.html",
})
export class InactiveTwoFactorReportComponent extends CipherReportComponent implements OnInit {
  services = new Map<string, string>();
  cipherDocs = new Map<string, string>();
  disabled = true;
  private flexibleCollectionsEnabled: boolean;

  constructor(
    protected cipherService: CipherService,
    protected organizationService: OrganizationService,
    modalService: ModalService,
    private logService: LogService,
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
    try {
      await this.load2fa();
    } catch (e) {
      this.logService.error(e);
    }

    if (this.services.size > 0) {
      const allCiphers = await this.getAllCiphers();
      let canManageCollections: CollectionView[];
      if (this.flexibleCollectionsEnabled && this.collectionService) {
        canManageCollections = (await this.collectionService.getAllDecrypted())?.filter(
          (c) => c.manage
        );
      }

      const inactive2faCiphers: CipherView[] = [];
      const docs = new Map<string, string>();

      allCiphers.forEach((ciph) => {
        const { type, login, isDeleted, edit, id } = ciph;
        if (
          type !== CipherType.Login ||
          (login.totp != null && login.totp !== "") ||
          !login.hasUris ||
          isDeleted ||
          (!this.organization && !edit) ||
          (!this.manageCipher(ciph, canManageCollections) && !edit)
        ) {
          return;
        }
        for (let i = 0; i < login.uris.length; i++) {
          const u = login.uris[i];
          if (u.uri != null && u.uri !== "") {
            const uri = u.uri.replace("www.", "");
            const domain = Utils.getDomain(uri);
            if (domain != null && this.services.has(domain)) {
              if (this.services.get(domain) != null) {
                docs.set(id, this.services.get(domain));
              }
              inactive2faCiphers.push(ciph);
            }
          }
        }
      });
      this.ciphers = [...inactive2faCiphers];
      this.cipherDocs = docs;
    }
  }

  protected getAllCiphers(): Promise<CipherView[]> {
    return this.cipherService.getAllDecrypted();
  }

  private async load2fa() {
    if (this.services.size > 0) {
      return;
    }
    const response = await fetch(new Request("https://api.2fa.directory/v3/totp.json"));
    if (response.status !== 200) {
      throw new Error();
    }
    const responseJson = await response.json();
    for (const service of responseJson) {
      const serviceData = service[1];
      if (serviceData.domain == null) {
        continue;
      }
      if (serviceData.documentation == null) {
        continue;
      }
      if (serviceData["additional-domains"] != null) {
        for (const additionalDomain of serviceData["additional-domains"]) {
          this.services.set(additionalDomain, serviceData.documentation);
        }
      }
      this.services.set(serviceData.domain, serviceData.documentation);
    }
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
