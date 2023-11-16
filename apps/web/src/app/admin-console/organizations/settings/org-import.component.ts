import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import {
  OrganizationService,
  canAccessVaultTab,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { ImportComponent } from "@bitwarden/importer/ui";

import { LooseComponentsModule, SharedModule } from "../../../shared";

@Component({
  templateUrl: "org-import.component.html",
  standalone: true,
  imports: [SharedModule, ImportComponent, LooseComponentsModule],
})
export class OrgImportComponent implements OnInit {
  protected routeOrgId: string = null;
  protected loading = false;
  protected disabled = false;

  constructor(
    private route: ActivatedRoute,
    private organizationService: OrganizationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeOrgId = this.route.snapshot.paramMap.get("organizationId");
  }

  /**
   * Callback that is called after a successful import.
   */
  protected async onSuccessfulImport(organizationId: string): Promise<void> {
    const organization = await firstValueFrom(this.organizationService.get$(organizationId));
    if (organization == null) {
      return;
    }

    if (canAccessVaultTab(organization)) {
      await this.router.navigate(["organizations", organizationId, "vault"]);
    }
  }
}
