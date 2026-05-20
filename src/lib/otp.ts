import { randomInt } from "crypto";

/** 8-digit one-time password for first sign-in. */
export function generateOneTimePassword(): string {
  return String(randomInt(10000000, 100000000));
}
