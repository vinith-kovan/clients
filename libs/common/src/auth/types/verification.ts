import { VerificationType } from "../enums/verification-type";

export type Verification =
  | {
      type: VerificationType.OTP | VerificationType.MasterPassword | VerificationType.PIN;
      secret: string;
    }
  | { type: VerificationType.Biometrics };

export function verificationHasSecret(
  verification: Verification,
): verification is Verification & { secret: string } {
  return verification.type !== VerificationType.Biometrics;
}

export type ServerSideVerification = Verification & {
  type: VerificationType.OTP | VerificationType.MasterPassword;
};

export type ClientSideVerification = Verification & {
  type: VerificationType.MasterPassword | VerificationType.PIN | VerificationType.Biometrics;
};

export function isServerSideVerification(
  verification: Verification,
): verification is ServerSideVerification {
  return (
    verification.type === VerificationType.OTP ||
    verification.type === VerificationType.MasterPassword
  );
}

export function isClientSideVerification(
  verification: Verification,
): verification is ClientSideVerification {
  return (
    verification.type === VerificationType.MasterPassword ||
    verification.type === VerificationType.PIN ||
    verification.type === VerificationType.Biometrics
  );
}
