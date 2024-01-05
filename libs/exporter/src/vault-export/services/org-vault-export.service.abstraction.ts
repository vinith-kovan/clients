import { ExportFormat } from "./vault-export.service.abstraction";

export abstract class OrgVaultExportServiceAbstraction {
  getPasswordProtectedExport: (password: string, organizationId?: string) => Promise<string>;
  getOrganizationExport: (organizationId: string, format?: ExportFormat) => Promise<string>;
  getFileName: (prefix?: string, extension?: string) => string;
}
