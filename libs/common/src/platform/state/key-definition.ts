import { Jsonify } from "type-fest";

import { UserId } from "../../types/guid";
import { StorageKey } from "../../types/state";
import { Utils } from "../misc/utils";

import { StateDefinition } from "./state-definition";

/**
 * A set of options for customizing the behavior of a {@link KeyDefinition}
 */
type KeyDefinitionOptions<T> = {
  /**
   * A function to use to safely convert your type from json to your expected type.
   *
   * **Important:** Your data may be serialized/deserialized at any time and this
   *  callback needs to be able to faithfully re-initialize from the JSON object representation of your type.
   *
   * @param jsonValue The JSON object representation of your state.
   * @returns The fully typed version of your state.
   */
  readonly deserializer: (jsonValue: Jsonify<T>) => T;
  /**
   * The number of milliseconds to wait before cleaning up the state after the last subscriber has unsubscribed.
   * Defaults to 1000ms.
   */
  readonly cleanupDelayMs?: number;
};

/**
 * KeyDefinitions describe the precise location to store data for a given piece of state.
 * The StateDefinition is used to describe the domain of the state, and the KeyDefinition
 * sub-divides that domain into specific keys.
 */
export class KeyDefinition<T> {
  /**
   * Creates a new instance of a KeyDefinition
   * @param stateDefinition The state definition for which this key belongs to.
   * @param key The name of the key, this should be unique per domain.
   * @param options A set of options to customize the behavior of {@link KeyDefinition}. All options are required.
   * @param options.deserializer A function to use to safely convert your type from json to your expected type.
   *   Your data may be serialized/deserialized at any time and this needs callback needs to be able to faithfully re-initialize
   *   from the JSON object representation of your type.
   */
  constructor(
    readonly stateDefinition: StateDefinition,
    readonly key: string,
    private readonly options: KeyDefinitionOptions<T>,
  ) {
    if (options.deserializer == null) {
      throw new Error(`'deserializer' is a required property on key ${this.errorKeyName}`);
    }

    if (options.cleanupDelayMs <= 0) {
      throw new Error(
        `'cleanupDelayMs' must be greater than 0. Value of ${options.cleanupDelayMs} passed to key ${this.errorKeyName} `,
      );
    }
  }

  /**
   * Gets the deserializer configured for this {@link KeyDefinition}
   */
  get deserializer() {
    return this.options.deserializer;
  }

  /**
   * Gets the number of milliseconds to wait before cleaning up the state after the last subscriber has unsubscribed.
   */
  get cleanupDelayMs() {
    return this.options.cleanupDelayMs < 0 ? 0 : this.options.cleanupDelayMs ?? 1000;
  }

  /**
   * Creates a {@link KeyDefinition} for state that is an array.
   * @param stateDefinition The state definition to be added to the KeyDefinition
   * @param key The key to be added to the KeyDefinition
   * @param options The options to customize the final {@link KeyDefinition}.
   * @returns A {@link KeyDefinition} initialized for arrays, the options run
   * the deserializer on the provided options for each element of an array
   * **unless that array is null, in which case it will return an empty list.**
   *
   * @example
   * ```typescript
   * const MY_KEY = KeyDefinition.array<MyArrayElement>(MY_STATE, "key", {
   *   deserializer: (myJsonElement) => convertToElement(myJsonElement),
   * });
   * ```
   */
  static array<T>(
    stateDefinition: StateDefinition,
    key: string,
    // We have them provide options for the element of the array, depending on future options we add, this could get a little weird.
    options: KeyDefinitionOptions<T>, // The array helper forces  an initialValue of an empty array
  ) {
    return new KeyDefinition<T[]>(stateDefinition, key, {
      ...options,
      deserializer: (jsonValue) => {
        if (jsonValue == null) {
          return null;
        }
        return jsonValue.map((v) => options.deserializer(v));
      },
    });
  }

  /**
   * Creates a {@link KeyDefinition} for state that is a record.
   * @param stateDefinition The state definition to be added to the KeyDefinition
   * @param key The key to be added to the KeyDefinition
   * @param options The options to customize the final {@link KeyDefinition}.
   * @returns A {@link KeyDefinition} that contains a serializer that will run the provided deserializer for each
   * value in a record and returns every key as a string **unless that record is null, in which case it will return an record.**
   *
   * @example
   * ```typescript
   * const MY_KEY = KeyDefinition.record<MyRecordValue>(MY_STATE, "key", {
   *   deserializer: (myJsonValue) => convertToValue(myJsonValue),
   * });
   * ```
   */
  static record<T, TKey extends string = string>(
    stateDefinition: StateDefinition,
    key: string,
    // We have them provide options for the value of the record, depending on future options we add, this could get a little weird.
    options: KeyDefinitionOptions<T>, // The array helper forces an initialValue of an empty record
  ) {
    return new KeyDefinition<Record<TKey, T>>(stateDefinition, key, {
      ...options,
      deserializer: (jsonValue) => {
        if (jsonValue == null) {
          return null;
        }

        const output: Record<string, T> = {};
        for (const key in jsonValue) {
          output[key] = options.deserializer((jsonValue as Record<string, Jsonify<T>>)[key]);
        }
        return output;
      },
    });
  }

  /**
   * Create a string that should be unique across the entire application.
   * @returns A string that can be used to cache instances created via this key.
   */
  buildCacheKey(scope: "user" | "global", userId?: "active" | UserId): string {
    if (scope === "user" && userId == null) {
      throw new Error("You must provide a userId when building a user scoped cache key.");
    }
    return userId === null
      ? `${scope}_${userId}_${this.stateDefinition.name}_${this.key}`
      : `${scope}_${this.stateDefinition.name}_${this.key}`;
  }

  private get errorKeyName() {
    return `${this.stateDefinition.name} > ${this.key}`;
  }
}

/**
 * Creates a {@link StorageKey} that points to the data at the given key definition for the specified user.
 * @param userId The userId of the user you want the key to be for.
 * @param keyDefinition The key definition of which data the key should point to.
 * @returns A key that is ready to be used in a storage service to get data.
 */
export function userKeyBuilder(userId: UserId, keyDefinition: KeyDefinition<unknown>): StorageKey {
  if (!Utils.isGuid(userId)) {
    throw new Error("You cannot build a user key without a valid UserId");
  }
  return `user_${userId}_${keyDefinition.stateDefinition.name}_${keyDefinition.key}` as StorageKey;
}

/**
 * Creates a {@link StorageKey}
 * @param keyDefinition The key definition of which data the key should point to.
 * @returns A key that is ready to be used in a storage service to get data.
 */
export function globalKeyBuilder(keyDefinition: KeyDefinition<unknown>): StorageKey {
  return `global_${keyDefinition.stateDefinition.name}_${keyDefinition.key}` as StorageKey;
}
