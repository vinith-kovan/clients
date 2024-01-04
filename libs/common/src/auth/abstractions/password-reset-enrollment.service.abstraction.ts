export abstract class PasswordResetEnrollmentServiceAbstraction {
  /*
   * Checks the user's enrollment status and enrolls them if required
   */
  abstract enrollIfRequired(organizationSsoIdentifier: string): Promise<void>;

  /**
   * Enroll current active user in password reset
   * @param organizationId - Organization in which to enroll the user
   * @returns Promise that resolves when the user is enrolled
   * @throws Error if the action fails
   */
  abstract enroll(organizationId: string): Promise<void>;
}
