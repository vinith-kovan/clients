import { firstValueFrom } from "rxjs";

import {
  ActiveUserState,
  GlobalState,
  KeyDefinition,
  SSO_DISK,
  StateProvider,
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

export class SsoLoginService {
  private codeVerifierState: GlobalState<string>;
  private ssoState: GlobalState<string>;
  private orgIdentifierState: GlobalState<string>;
  private activeUserOrgIdentifierState: ActiveUserState<string>;

  constructor(private stateProvider: StateProvider) {
    this.codeVerifierState = this.stateProvider.getGlobal(CODE_VERIFIER);
    this.ssoState = this.stateProvider.getGlobal(SSO_STATE);
    this.orgIdentifierState = this.stateProvider.getGlobal(ORGANIZATION_IDENTIFIER);
    this.activeUserOrgIdentifierState = this.stateProvider.getActive(ORGANIZATION_IDENTIFIER);
  }

  getCodeVerifier(): Promise<string> {
    return firstValueFrom(this.codeVerifierState.state$);
  }

  async setCodeVerifier(codeVerifier: string): Promise<void> {
    await this.codeVerifierState.update((_) => codeVerifier);
  }

  getSsoState(): Promise<string> {
    return firstValueFrom(this.ssoState.state$);
  }

  async setSsoState(ssoState: string): Promise<void> {
    await this.ssoState.update((_) => ssoState);
  }

  getOrganizationIdentifier(): Promise<string> {
    return firstValueFrom(this.orgIdentifierState.state$);
  }

  async setOrganizationIdentifier(organizationIdentifier: string): Promise<void> {
    await this.orgIdentifierState.update((_) => organizationIdentifier);
  }

  getActiveUserOrganizationIdentifier(): Promise<string> {
    return firstValueFrom(this.activeUserOrgIdentifierState.state$);
  }

  async setActiveUserOrganizationIdentifier(organizationIdentifier: string): Promise<void> {
    await this.activeUserOrgIdentifierState.update((_) => organizationIdentifier);
  }
}
