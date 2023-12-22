import { Subject, take } from "rxjs";

import { expectEmissions } from "./expect-emissions";

describe("expectEmissions", () => {
  it("passes if values match when there is a single emission", (done) => {
    const stream = new Subject<number>();
    const expected = [8];

    stream.pipe(take(expected.length)).subscribe(expectEmissions(expected, done));

    stream.next(8);
  });

  it("passes if values match when there are multiple emissions", (done) => {
    const stream = new Subject<number>();
    const expected = [8, 1, 7, 2, 2];

    stream.pipe(take(expected.length)).subscribe(expectEmissions(expected, done));

    stream.next(8);
    stream.next(1);
    stream.next(7);
    stream.next(2);
    stream.next(2);
  });

  it("fails if values do not match", (done) => {
    const stream = new Subject<number>();
    const expected = [8, 1, 7, 2, 2];
    const fakeDone = (reason?: Error | string) => {
      expect(reason.constructor.name).toEqual("JestAssertionError");
      done();
    };

    stream.pipe(take(expected.length)).subscribe(expectEmissions(expected, fakeDone));

    stream.next(8);
    stream.next(1);
    stream.next(7);
    stream.next(2);
    stream.next(1); // wrong!
  });
});
