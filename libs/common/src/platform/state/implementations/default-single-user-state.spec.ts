/**
 * need to update test environment so trackEmissions works appropriately
 * @jest-environment ../shared/test.environment.ts
 */

import { firstValueFrom, of } from "rxjs";
import { Jsonify } from "type-fest";

import { trackEmissions, awaitAsync } from "../../../../spec";
import { FakeStorageService } from "../../../../spec/fake-storage.service";
import { UserId } from "../../../types/guid";
import { Utils } from "../../misc/utils";
import { KeyDefinition, userKeyBuilder } from "../key-definition";
import { StateDefinition } from "../state-definition";

import { DefaultSingleUserState } from "./default-single-user-state";

class TestState {
  date: Date;

  static fromJSON(jsonState: Jsonify<TestState>) {
    if (jsonState == null) {
      return null;
    }

    return Object.assign(new TestState(), jsonState, {
      date: new Date(jsonState.date),
    });
  }
}

const testStateDefinition = new StateDefinition("fake", "disk");
const cleanupDelayMs = 10;
const testKeyDefinition = new KeyDefinition<TestState>(testStateDefinition, "fake", {
  deserializer: TestState.fromJSON,
  cleanupDelayMs,
});
const userId = Utils.newGuid() as UserId;
const userKey = userKeyBuilder(userId, testKeyDefinition);

describe("DefaultSingleUserState", () => {
  let diskStorageService: FakeStorageService;
  let userState: DefaultSingleUserState<TestState>;
  const newData = { date: new Date() };

  beforeEach(() => {
    diskStorageService = new FakeStorageService();
    userState = new DefaultSingleUserState(userId, testKeyDefinition, diskStorageService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("state$", () => {
    it("should emit when storage updates", async () => {
      const emissions = trackEmissions(userState.state$);
      await diskStorageService.save(userKey, newData);
      await awaitAsync();

      expect(emissions).toEqual([
        null, // Initial value
        newData,
      ]);
    });

    it("should not emit when update key does not match", async () => {
      const emissions = trackEmissions(userState.state$);
      await diskStorageService.save("wrong_key", newData);

      // Give userState a chance to emit it's initial value
      // as well as wrongly emit the different key.
      await awaitAsync();

      // Just the initial value
      expect(emissions).toEqual([null]);
    });

    it("should emit initial storage value on first subscribe", async () => {
      const initialStorage: Record<string, TestState> = {};
      initialStorage[userKey] = TestState.fromJSON({
        date: "2022-09-21T13:14:17.648Z",
      });
      diskStorageService.internalUpdateStore(initialStorage);

      const state = await firstValueFrom(userState.state$);
      expect(diskStorageService.mock.get).toHaveBeenCalledTimes(1);
      expect(diskStorageService.mock.get).toHaveBeenCalledWith(
        `user_${userId}_fake_fake`,
        undefined,
      );
      expect(state).toBeTruthy();
    });
  });

  describe("combinedState$", () => {
    it("should emit when storage updates", async () => {
      const emissions = trackEmissions(userState.combinedState$);
      await diskStorageService.save(userKey, newData);
      await awaitAsync();

      expect(emissions).toEqual([
        [userId, null], // Initial value
        [userId, newData],
      ]);
    });

    it("should not emit when update key does not match", async () => {
      const emissions = trackEmissions(userState.combinedState$);
      await diskStorageService.save("wrong_key", newData);

      // Give userState a chance to emit it's initial value
      // as well as wrongly emit the different key.
      await awaitAsync();

      // Just the initial value
      expect(emissions).toHaveLength(1);
    });

    it("should emit initial storage value on first subscribe", async () => {
      const initialStorage: Record<string, TestState> = {};
      initialStorage[userKey] = TestState.fromJSON({
        date: "2022-09-21T13:14:17.648Z",
      });
      diskStorageService.internalUpdateStore(initialStorage);

      const combinedState = await firstValueFrom(userState.combinedState$);
      expect(diskStorageService.mock.get).toHaveBeenCalledTimes(1);
      expect(diskStorageService.mock.get).toHaveBeenCalledWith(
        `user_${userId}_fake_fake`,
        undefined,
      );
      expect(combinedState).toBeTruthy();
      const [stateUserId, state] = combinedState;
      expect(stateUserId).toBe(userId);
      expect(state).toBe(initialStorage[userKey]);
    });
  });

  describe("update", () => {
    it("should save on update", async () => {
      const result = await userState.update((state) => {
        return newData;
      });

      expect(diskStorageService.mock.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newData);
    });

    it("should emit once per update", async () => {
      const emissions = trackEmissions(userState.state$);
      await awaitAsync(); // storage updates are behind a promise

      await userState.update((state) => {
        return newData;
      });

      await awaitAsync();

      expect(emissions).toEqual([
        null, // Initial value
        newData,
      ]);
    });

    it("should provided combined dependencies", async () => {
      const emissions = trackEmissions(userState.state$);
      await awaitAsync(); // storage updates are behind a promise

      const combinedDependencies = { date: new Date() };

      await userState.update(
        (state, dependencies) => {
          expect(dependencies).toEqual(combinedDependencies);
          return newData;
        },
        {
          combineLatestWith: of(combinedDependencies),
        },
      );

      await awaitAsync();

      expect(emissions).toEqual([
        null, // Initial value
        newData,
      ]);
    });

    it("should not update if shouldUpdate returns false", async () => {
      const emissions = trackEmissions(userState.state$);
      await awaitAsync(); // storage updates are behind a promise

      const result = await userState.update(
        (state) => {
          return newData;
        },
        {
          shouldUpdate: () => false,
        },
      );

      expect(diskStorageService.mock.save).not.toHaveBeenCalled();
      expect(emissions).toEqual([null]); // Initial value
      expect(result).toBeNull();
    });

    it("should provide the update callback with the current State", async () => {
      const emissions = trackEmissions(userState.state$);
      await awaitAsync(); // storage updates are behind a promise

      // Seed with interesting data
      const initialData = { date: new Date(2020, 1, 1) };
      await userState.update((state, dependencies) => {
        return initialData;
      });

      await awaitAsync();

      await userState.update((state) => {
        expect(state).toEqual(initialData);
        return newData;
      });

      await awaitAsync();

      expect(emissions).toEqual([
        null, // Initial value
        initialData,
        newData,
      ]);
    });

    it("should give initial state for update call", async () => {
      const initialStorage: Record<string, TestState> = {};
      const initialState = TestState.fromJSON({
        date: "2022-09-21T13:14:17.648Z",
      });
      initialStorage[userKey] = initialState;
      diskStorageService.internalUpdateStore(initialStorage);

      const emissions = trackEmissions(userState.state$);
      await awaitAsync(); // storage updates are behind a promise

      const newState = {
        ...initialState,
        date: new Date(initialState.date.getFullYear(), initialState.date.getMonth() + 1),
      };
      const actual = await userState.update((existingState) => newState);

      await awaitAsync();

      expect(actual).toEqual(newState);
      expect(emissions).toHaveLength(2);
      expect(emissions).toEqual(expect.arrayContaining([initialState, newState]));
    });
  });

  describe("update races", () => {
    test("subscriptions during an update should receive the current and latest data", async () => {
      const oldData = { date: new Date(2019, 1, 1) };
      await userState.update(() => {
        return oldData;
      });
      const initialData = { date: new Date(2020, 1, 1) };
      await userState.update(() => {
        return initialData;
      });

      await awaitAsync();

      const emissions = trackEmissions(userState.state$);
      await awaitAsync();
      expect(emissions).toEqual([initialData]);

      let emissions2: TestState[];
      const originalSave = diskStorageService.save.bind(diskStorageService);
      diskStorageService.save = jest.fn().mockImplementation(async (key: string, obj: any) => {
        emissions2 = trackEmissions(userState.state$);
        await originalSave(key, obj);
      });

      const val = await userState.update(() => {
        return newData;
      });

      await awaitAsync(10);

      expect(val).toEqual(newData);
      expect(emissions).toEqual([initialData, newData]);
      expect(emissions2).toEqual([initialData, newData]);
    });

    test("subscription during an aborted update should receive the last value", async () => {
      // Seed with interesting data
      const initialData = { date: new Date(2020, 1, 1) };
      await userState.update(() => {
        return initialData;
      });

      await awaitAsync();

      const emissions = trackEmissions(userState.state$);
      await awaitAsync();
      expect(emissions).toEqual([initialData]);

      let emissions2: TestState[];
      const val = await userState.update(
        (state) => {
          return newData;
        },
        {
          shouldUpdate: () => {
            emissions2 = trackEmissions(userState.state$);
            return false;
          },
        },
      );

      await awaitAsync();

      expect(val).toEqual(initialData);
      expect(emissions).toEqual([initialData]);

      expect(emissions2).toEqual([initialData]);
    });

    test("updates should wait until previous update is complete", async () => {
      trackEmissions(userState.state$);
      await awaitAsync(); // storage updates are behind a promise

      const originalSave = diskStorageService.save.bind(diskStorageService);
      diskStorageService.save = jest
        .fn()
        .mockImplementationOnce(async () => {
          let resolved = false;
          await Promise.race([
            userState.update(() => {
              // deadlocks
              resolved = true;
              return newData;
            }),
            awaitAsync(100), // limit test to 100ms
          ]);
          expect(resolved).toBe(false);
        })
        .mockImplementation(originalSave);

      await userState.update((state) => {
        return newData;
      });
    });

    test("updates with FAKE_DEFAULT initial value should resolve correctly", async () => {
      const val = await userState.update((state) => {
        return newData;
      });

      expect(val).toEqual(newData);
      const call = diskStorageService.mock.save.mock.calls[0];
      expect(call[0]).toEqual(`user_${userId}_fake_fake`);
      expect(call[1]).toEqual(newData);
    });
  });

  describe("cleanup", () => {
    function assertClean() {
      expect(diskStorageService["updatesSubject"]["observers"]).toHaveLength(0);
    }

    it("should cleanup after last subscriber", async () => {
      const subscription = userState.state$.subscribe();
      await awaitAsync(); // storage updates are behind a promise

      subscription.unsubscribe();
      // Wait for cleanup
      await awaitAsync(cleanupDelayMs * 2);
      assertClean();
    });

    it("should not cleanup if there are still subscribers", async () => {
      const subscription1 = userState.state$.subscribe();
      const sub2Emissions: TestState[] = [];
      const subscription2 = userState.state$.subscribe((v) => sub2Emissions.push(v));
      await awaitAsync(); // storage updates are behind a promise

      subscription1.unsubscribe();

      // Wait for cleanup
      await awaitAsync(cleanupDelayMs * 2);

      expect(diskStorageService["updatesSubject"]["observers"]).toHaveLength(1);

      // Still be listening to storage updates
      diskStorageService.save(userKey, newData);
      await awaitAsync(); // storage updates are behind a promise
      expect(sub2Emissions).toEqual([null, newData]);

      subscription2.unsubscribe();
      // Wait for cleanup
      await awaitAsync(cleanupDelayMs * 2);

      assertClean();
    });

    it("can re-initialize after cleanup", async () => {
      const subscription = userState.state$.subscribe();
      await awaitAsync();

      subscription.unsubscribe();
      // Wait for cleanup
      await awaitAsync(cleanupDelayMs * 2);

      const emissions = trackEmissions(userState.state$);
      await awaitAsync();

      diskStorageService.save(userKey, newData);
      await awaitAsync();

      expect(emissions).toEqual([null, newData]);
    });

    it("should not cleanup if a subscriber joins during the cleanup delay", async () => {
      const subscription = userState.state$.subscribe();
      await awaitAsync();

      await diskStorageService.save(userKey, newData);
      await awaitAsync();

      subscription.unsubscribe();
      // Do not wait long enough for cleanup
      await awaitAsync(cleanupDelayMs / 2);

      const value = await firstValueFrom(userState.state$);
      expect(value).toEqual(newData);

      // Should be called once for the initial subscription and a second time during the save
      // but should not be called for a second subscription if the cleanup hasn't happened yet.
      expect(diskStorageService.mock.get).toHaveBeenCalledTimes(2);
    });

    it("state$ observables are durable to cleanup", async () => {
      const observable = userState.state$;
      let subscription = observable.subscribe();

      await diskStorageService.save(userKey, newData);
      await awaitAsync();

      subscription.unsubscribe();
      // Wait for cleanup
      await awaitAsync(cleanupDelayMs * 2);

      subscription = observable.subscribe();
      await diskStorageService.save(userKey, newData);
      await awaitAsync();

      expect(await firstValueFrom(observable)).toEqual(newData);
    });
  });
});
