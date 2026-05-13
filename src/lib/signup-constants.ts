/** User-facing copy when signup uses an email that already exists (must match server throw). */
export const SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE =
  "This email is already registered with Cloud Vaathi. Please sign in to your existing account, or use a different email address if you need a separate profile.";

export function isSignupDuplicateEmailError(message: string): boolean {
  return (
    message === SIGNUP_EMAIL_ALREADY_EXISTS_MESSAGE ||
    /already registered with Cloud Vaathi/i.test(message)
  );
}
