import { mock } from "jest-mock-extended";
import { of } from "rxjs";

import { AccountInfo, AccountService } from "../src/auth/abstractions/account.service";
import { AuthenticationStatus } from "../src/auth/enums/authentication-status";
import { UserId } from "../src/types/guid";

export function mockStaticAccountFor(userId: UserId, accountInfo?: Partial<AccountInfo>) {
  const result = mock<AccountService>();
  const info = {
    name: "mockName",
    email: "mockEmail",
    status: AuthenticationStatus.LoggedOut,
    ...accountInfo,
  };
  result.activeAccount$ = of({
    id: userId as UserId,
    ...info,
  });
  result.accounts$ = of({ [userId]: info });
  return result;
}
