import { Observable } from "rxjs";

import { DeriveDefinition, DerivedState } from "@bitwarden/common/platform/state";
// eslint-disable-next-line import/no-restricted-paths -- extending this class for this client
import { DefaultDerivedStateProvider } from "@bitwarden/common/platform/state/implementations/default-derived-state.provider";
import { DerivedStateDependencies } from "@bitwarden/common/src/types/state";

import { BackgroundDerivedState } from "./background-derived-state";

export class BackgroundDerivedStateProvider extends DefaultDerivedStateProvider {
  override buildDerivedState<TFrom, TTo, TDeps extends DerivedStateDependencies>(
    parentState$: Observable<TFrom>,
    deriveDefinition: DeriveDefinition<TFrom, TTo, TDeps>,
    dependencies: TDeps,
  ): DerivedState<TTo> {
    return new BackgroundDerivedState(
      parentState$,
      deriveDefinition,
      this.memoryStorage,
      dependencies,
    );
  }
}
