export const EXPORT_FORMATS = ["csv", "json", "encrypted_json"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export abstract class VaultExportServiceAbstraction {
  getExport: (format?: ExportFormat) => Promise<string>;
  getPasswordProtectedExport: (password: string) => Promise<string>;
  getOrganizationExport: (organizationId: string, format: ExportFormat) => Promise<string>;
  getOrgnizationPasswordProtectedExport: (
    organizationId: string,
    password: string,
  ) => Promise<string>;
  getFileName: (prefix?: string, extension?: string) => string;
}
