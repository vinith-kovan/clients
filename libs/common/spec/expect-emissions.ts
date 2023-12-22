export function expectEmissions<T>(expected: T[], done: (reason?: Error | string) => void) {
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
