import { VerificationType } from "../enums/verification-type";

export type OtpVerification = { type: VerificationType.OTP; secret: string };
export type MasterPasswordVerification = { type: VerificationType.MasterPassword; secret: string };
export type PinVerification = { type: VerificationType.PIN; secret: string };
export type BiometricsVerification = { type: VerificationType.Biometrics };

export type VerificationWithSecret = OtpVerification | MasterPasswordVerification | PinVerification;
export type VerificationWithoutSecret = BiometricsVerification;

export type Verification = VerificationWithSecret | VerificationWithoutSecret;

export function verificationHasSecret(
  verification: Verification,
): verification is VerificationWithSecret {
  return verification.type !== VerificationType.Biometrics;
}

export type ServerSideVerification = OtpVerification | MasterPasswordVerification;
export type ClientSideVerification =
  | MasterPasswordVerification
  | PinVerification
  | BiometricsVerification;

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
