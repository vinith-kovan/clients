import { firstValueFrom } from "rxjs";

import {
  ActiveUserState,
  ActiveUserStateProvider,
  KeyDefinition,
  SSO_DISK,
} from "../../platform/state";

/**
 * Uses disk storage so that the code verifier can be persisted across sso redirects.
 */
const CODE_VERIFIER = new KeyDefinition<string>(SSO_DISK, "ssoCodeVerifier", {
  deserializer: (codeVerifier) => codeVerifier,
});

/**
 * Uses disk storage so that the sso state can be persisted across sso redirects.
 */
const SSO_STATE = new KeyDefinition<string>(SSO_DISK, "ssoState", {
  deserializer: (state) => state,
});

/**
 * Uses disk storage so that the organization identifier can be persisted across sso redirects.
 */
const ORGANIZATION_IDENTIFIER = new KeyDefinition<string>(SSO_DISK, "ssoOrganizationIdentifier", {
  deserializer: (organizationIdentifier) => organizationIdentifier,
});

export class SsoService {
  private codeVerifierState: ActiveUserState<string>;
  private ssoState: ActiveUserState<string>;
  private organizationIdentifierState: ActiveUserState<string>;

  constructor(private stateProvider: ActiveUserStateProvider) {
    this.codeVerifierState = this.stateProvider.get(CODE_VERIFIER);
    this.ssoState = this.stateProvider.get(SSO_STATE);
    this.organizationIdentifierState = this.stateProvider.get(ORGANIZATION_IDENTIFIER);
  }

  async getCodeVerifier(): Promise<string> {
    return await firstValueFrom(this.codeVerifierState.state$);
  }

  async setCodeVerifier(codeVerifier: string): Promise<void> {
    await this.codeVerifierState.update((_) => codeVerifier);
  }

  async getSsoState(): Promise<string> {
    return await firstValueFrom(this.ssoState.state$);
  }

  async setSsoState(ssoState: string): Promise<void> {
    await this.ssoState.update((_) => ssoState);
  }

  async getOrganizationIdentifier(): Promise<string> {
    return await firstValueFrom(this.organizationIdentifierState.state$);
  }

  async setOrganizationIdentifier(organizationIdentifier: string): Promise<void> {
    await this.organizationIdentifierState.update((_) => organizationIdentifier);
  }
}
