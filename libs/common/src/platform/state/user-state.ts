import { Observable } from "rxjs";

import { UserId } from "../../types/guid";

import { StateUpdateOptions } from "./state-update-options";

export type CombinedState<T> = readonly [userId: UserId, state: T];

/**
 * A helper object for interacting with state that is scoped to a specific user.
 */
export interface UserState<T> {
  /**
   * Emits a stream of data.
   */
  readonly state$: Observable<T>;

  /**
   * Emits a stream of data alongside the user id the data corresponds to.
   */
  readonly combinedState$: Observable<CombinedState<T>>;

  /**
   * Updates backing stores for the active user.
   * @param configureState function that takes the current state and returns the new state
   * @param options Defaults to @see {module:state-update-options#DEFAULT_OPTIONS}
   * @param options.shouldUpdate A callback for determining if you want to update state. Defaults to () => true
   * @param options.combineLatestWith An observable that you want to combine with the current state for callbacks. Defaults to null
   * @param options.msTimeout A timeout for how long you are willing to wait for a `combineLatestWith` option to complete. Defaults to 1000ms. Only applies if `combineLatestWith` is set.

   * @returns The new state
   */
  readonly update: <TCombine>(
    configureState: (state: T, dependencies: TCombine) => T,
    options?: StateUpdateOptions<T, TCombine>,
  ) => Promise<T>;
}

export const activeMarker: unique symbol = Symbol("active");
export interface ActiveUserState<T> extends UserState<T> {
  readonly [activeMarker]: true;
}
export interface SingleUserState<T> extends UserState<T> {
  readonly userId: UserId;
}
