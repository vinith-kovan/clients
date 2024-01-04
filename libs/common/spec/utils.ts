import { mock, MockProxy } from "jest-mock-extended";
import { Observable } from "rxjs";

import { EncString } from "@bitwarden/common/platform/models/domain/enc-string";

function newGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function GetUniqueString(prefix = "") {
  return prefix + "_" + newGuid();
}

export function BuildTestObject<T, K extends keyof T = keyof T>(
  def: Partial<Pick<T, K>> | T,
  constructor?: new () => T,
): T {
  return Object.assign(constructor === null ? {} : new constructor(), def) as T;
}

export function mockEnc(s: string): MockProxy<EncString> {
  const mocked = mock<EncString>();
  mocked.decrypt.mockResolvedValue(s);

  return mocked;
}

export function makeStaticByteArray(length: number, start = 0) {
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = start + i;
  }
  return arr;
}

/**
 * Use to mock a return value of a static fromJSON method.
 */
export const mockFromJson = (stub: any) => (stub + "_fromJSON") as any;

/**
 * Tracks the emissions of the given observable.
 *
 * Call this function before you expect any emissions and then use code that will cause the observable to emit values,
 * then assert after all expected emissions have occurred.
 * @param observable
 * @returns An array that will be populated with all emissions of the observable.
 */
export function trackEmissions<T>(observable: Observable<T>): T[] {
  const emissions: T[] = [];
  observable.subscribe((value) => {
    switch (value) {
      case undefined:
      case null:
        emissions.push(value);
        return;
      default:
        // process by type
        break;
    }

    switch (typeof value) {
      case "string":
      case "number":
      case "boolean":
        emissions.push(value);
        break;
      default: {
        emissions.push(clone(value));
      }
    }
  });
  return emissions;
}

function clone(value: any): any {
  if (global.structuredClone != undefined) {
    const clone = structuredClone(value);
    return setPrototypes(value, clone);
  } else {
    return JSON.parse(JSON.stringify(value));
  }
}

/**
 * Recursively copies prototypes from one object to another.
 * @param original the value to copy the prototype from
 * @param clone the value to recursively set prototypes on
 * @returns
 */
function setPrototypes<T>(original: T, clone: T): T {
  if (typeof original !== "object" || original == null) {
    return clone;
  }

  // return if prototype is already set
  if (Object.getPrototypeOf(clone) === Object.getPrototypeOf(original)) {
    return clone;
  }

  Object.setPrototypeOf(clone, Object.getPrototypeOf(original));
  // recurse into properties to set prototypes
  for (const prop in original) {
    if (Object.prototype.hasOwnProperty.call(original, prop)) {
      clone[prop] = setPrototypes(original[prop], clone[prop]);
    }
  }
  return clone;
}

export async function awaitAsync(ms = 0) {
  if (ms < 1) {
    await Promise.resolve();
  } else {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
