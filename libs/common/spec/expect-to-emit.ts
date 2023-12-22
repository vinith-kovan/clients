import { Observable, take } from "rxjs";

function emittedValuesAreEqual<T>(expected: T[], done: (reason?: Error | string) => void) {
  const acc: T[] = [];

  return (actual: T) => {
    acc.push(actual);
    if (acc.length != expected.length) {
      return;
    }

    try {
      expect(acc).toEqual(expected);
      done();
    } catch (e) {
      done(e);
    }
  };
}

/**
 * Asserts that the values emitted by an observable match an array of expected values, using Jest's toEqual matcher.
 * This is the only assertion you can have in your test because it automatically completes the test once the expected
 * number of values have emitted.
 * @param sut The observable under test
 * @param expected The array of values you expect the observable to emit, in order
 * @param done The done callback provided by Jest
 */
export function expectToEmit<T>(
  sut: Observable<T>,
  expected: T[],
  done: (reason?: Error | string) => void,
) {
  sut.pipe(take(expected.length)).subscribe(emittedValuesAreEqual(expected, done));
}
