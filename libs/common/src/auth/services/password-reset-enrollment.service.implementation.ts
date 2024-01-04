import { OrganizationApiServiceAbstraction } from "../../admin-console/abstractions/organization/organization-api.service.abstraction";
import { OrganizationUserService } from "../../admin-console/abstractions/organization-user/organization-user.service";
import { OrganizationUserResetPasswordEnrollmentRequest } from "../../admin-console/abstractions/organization-user/requests";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { I18nService } from "../../platform/abstractions/i18n.service";
import { StateService } from "../../platform/abstractions/state.service";
import { Utils } from "../../platform/misc/utils";
import { UserId } from "../../types/guid";
import { PasswordResetEnrollmentServiceAbstraction } from "../abstractions/password-reset-enrollment.service.abstraction";

export class PasswordResetEnrollmentServiceImplementation
  implements PasswordResetEnrollmentServiceAbstraction
{
  constructor(
    protected organizationApiService: OrganizationApiServiceAbstraction,
    protected stateService: StateService,
    protected cryptoService: CryptoService,
    protected organizationUserService: OrganizationUserService,
    protected i18nService: I18nService,
  ) {}

  async enrollIfRequired(organizationSsoIdentifier: string): Promise<void> {
    const orgAutoEnrollStatusResponse =
      await this.organizationApiService.getAutoEnrollStatus(organizationSsoIdentifier);

    if (!orgAutoEnrollStatusResponse.resetPasswordEnabled) {
      await this.enroll(orgAutoEnrollStatusResponse.id);
    }
  }

  async enroll(organizationId: string): Promise<void> {
    const orgKeyResponse = await this.organizationApiService.getKeys(organizationId);
    if (orgKeyResponse == null) {
      throw new Error(this.i18nService.t("resetPasswordOrgKeysError"));
    }

    const orgPublicKey = Utils.fromB64ToArray(orgKeyResponse.publicKey);

    const userId = await this.stateService.getUserId();
    const encryptedKey = await this.cryptoService.deriveFromUserKey(
      userId as UserId,
      async (userKey) => {
        // Share the user's key with the organization, so that they can reset the user's password while maintaining encrypted data
        return await this.cryptoService.rsaEncrypt(userKey.key, orgPublicKey);
      },
    );

    const resetRequest = new OrganizationUserResetPasswordEnrollmentRequest();
    resetRequest.resetPasswordKey = encryptedKey.encryptedString;

    await this.organizationUserService.putOrganizationUserResetPasswordEnrollment(
      organizationId,
      userId,
      resetRequest,
    );
  }
}
