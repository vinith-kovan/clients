import { UserKey } from "../../platform/models/domain/symmetric-crypto-key";
export abstract class PinCryptoServiceAbstraction {
  decryptUserKeyWithPin: (email: string, pin: string) => Promise<UserKey | null>;
}
