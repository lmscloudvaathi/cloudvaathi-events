import { ZodError } from "zod";
import { SIGNUP_PASSWORD_MIN_MESSAGE } from "./validation";

/** Map API / client errors to a clear signup or login message. */
export function formatUserFacingError(err: unknown): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? "Please check your details and try again.";
  }

  if (err instanceof Error) {
    const msg = err.message;

    if (
      msg.includes("String must contain at least 8 character") ||
      (msg.includes("too_small") && msg.includes("password"))
    ) {
      return SIGNUP_PASSWORD_MIN_MESSAGE;
    }

    try {
      const parsed = JSON.parse(msg) as unknown;
      if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === "object" && "message" in parsed[0]) {
        return String((parsed[0] as { message: string }).message);
      }
    } catch {
      /* not JSON */
    }

    return msg;
  }

  return "Something went wrong. Please try again.";
}
