import { UserKey } from "../../platform/models/domain/symmetric-crypto-key";
export abstract class PinCryptoServiceAbstraction {
  decryptUserKeyWithPin: (pin: string) => Promise<UserKey | null>;
}
